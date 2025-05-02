function Update-Environment {
    <#
    .SYNOPSIS
        Reloads environment variables from a .env file.
    .DESCRIPTION
        Updates the current PowerShell session with the latest values from the .env file.
    .EXAMPLE
        Update-Environment
    #>
    # Path to your .env file (customize if needed)
    $envFile = ".\.env"
    
    if (Test-Path $envFile) {
        Get-Content $envFile | ForEach-Object {
            if ($_ -match '^\s*([^#=]+)\s*=\s*(.*)\s*$') {
                $key = $matches[1].Trim()
                $value = $matches[2].Trim()
                # Update the environment variable in the current session
                [System.Environment]::SetEnvironmentVariable($key, $value, "Process")
            }
        }
    }
}

function Update-FrontendDirEnv{
    #Updated either f/.env.production/.development to reflect the app's env
    param (
        [string] $cwd,
        [string] $appEnv,
        [string] $localBackendBaseURL,
        [string] $prodBackendBaseURL,
        [string] $prodDockerBackendBaseURL
    )  
    #get the content of  project_config.js
    $frontendProdEnvFilePath = $cwd + "\f\.env.production"
    $frontendDevEnvFilePath = $cwd + "\f\.env.development"

    $content_dev = Get-Content -Path $frontendDevEnvFilePath -Raw
    $content_prod = Get-Content -Path $frontendProdEnvFilePath -Raw

    #Update f/.env.production/devevlopment based on the appEnv
    if ( $appEnv -eq "dev" ) {
        $content_dev = $content_dev -replace "(VITE_BACKEND_API_URL=).*", "`$1$($localBackendBaseURL)"
        Set-Content -Path $frontendDevEnvFilePath -Value $content_dev
        write-host "Updated VITE_BACKEND_API_URL in f/.env.development to $localBackendBaseURL"
    } elseif ( $appEnv -in @("prod-local", "prod-local-docker") ) {
        $content_prod = $content_prod -replace "(VITE_BACKEND_API_URL=).*", "`$1$($localBackendBaseURL)"
        $content_prod = $content_prod -replace "(VITE_APP_ENV=).*", "`$1prod-local"
        Set-Content -Path $frontendProdEnvFilePath -Value $content_prod
        write-host "Updated VITE_BACKEND_API_URL in f/.env.production to $localBackendBaseURL"
    } elseif ( $appEnv-eq "prod" ) {
        $content_prod = $content_prod -replace "(VITE_BACKEND_API_URL=).*", "`$1$($prodBackendBaseURL)"
        $content_prod = $content_prod -replace "(VITE_APP_ENV=).*", "`$1prod"
        Set-Content -Path $frontendProdEnvFilePath -Value $content_prod
        write-host "Updated VITE_BACKEND_API_URL in f/.env.production to $prodBackendBaseURL"
    } elseif ( $appEnv -eq "prod-docker") {
        $content_prod = $content_prod -replace "(VITE_BACKEND_API_URL=).*", "`$1$($prodDockerBackendBaseURL)"
        $content_prod = $content_prod -replace "(VITE_APP_ENV=).*", "`$1prod-docker"
        Set-Content -Path $frontendProdEnvFilePath -Value $content_prod
        write-host "Updated VITE_BACKEND_API_URL in f/.env.production to $prodDockerBackendBaseURL"

    }
}

function test-dockerImageTag{
    #checks if the docker image is valid (i.e., is it empty, does it already exist )
    param (
        [string] $appEnv,
        [string] $repositoryName,
        [string] $userInputTag,
        [string] $justTesting = "n"
    )

    if ($appEnv -eq "prod-docker"){
        return "latest" 
    }

    if ($justTesting -eq "y") {
        return "test"
    }

    # Extract a list of docker tags for the specific repo
    $dockerTags = (docker images --filter "reference=$repositoryName" --format "{{.Tag}}") -join ", "
    $tagArr = $dockerTags.split(", ")
    if ($tagArr.Length -eq 0) {
        Write-Host "No tags found for the repository $repositoryName. So using 'test' as tag"
        return "test"
    }
    #get the latest tag
    $latestTag = $tagArr[$tagArr.Length - 1]

    $tagIsEmpty = $userInputTag -eq ""
    $tagAlreadyExist = $dockerTags -like "*$userInputTag"
    $tagIsBeingUpdated = $userInputTag -ne $latestTag
    while ($tagIsEmpty -and $tagAlreadyExist -and $tagIsBeingUpdated ) {
        Write-Host "Docker image $repositoryName : $imageTag already exists. Choose a different tag"
        Write-host "See existing tags: $dockerTags"
        $userInputTag = Read-Host "Enter a new tag for the docker image $repositoryName"
        $tagAlreadyExist = ($dockerTags -like "*$userInputTag")
        $tagIsEmpty = $userInputTag -eq ""
        $tagIsBeingUpdated = $userInputTag -ne $latestTag
    } 
    return $userInputTag
}

function Show-Usage {
    # Write-Host "Usage: .\runApp.ps1 [-var1 <value> -var2 <value> ...]"
    Write-Host "Usage Example: .\runApp.ps1 -b_env dev -f_env dev -rdbms my_sql"
}

function test-spelling{
    #checks the spelling of the user-inputeed param value
    param (
        [string] $userInput,
        [string] $allowedInputs,
        [string] $promptMessage
    )
    if ($userInput -notin  $allowedInputs.split(" ")){
        Show-Usage
        $userInput = Read-Host "$promptMessage"
    }
    while ($userInput -notin $allowedInputs.split(" ")) { #prompt a user to imput the correct spelling of the param value options
        Show-Usage
        $userInput = Read-Host "Check Spelling! $promptMessage"
    }
    return $userInput
}

function Update-RootEnv{
    # This function controls the docker image build
    param (
        [string] $cwd,
        [string] $appEnv,
        [string] $backendHostPort,
        [string] $backend_image_tag,
        [string] $frontend_image_tag
    )

    $rootEnvFilePath = $cwd + "\.env"
    $content = Get-Content -Path $rootEnvFilePath -Raw

    #update VITE_APP_ENV var
    $content = $content -replace "(VITE_APP_ENV=).*", "`$1$($appEnv)"

    #update backend port 
    $content = $content -replace "(backend_host_port=).*", "backend_host_port=$backendHostPort"

    #empty the tag values
    $content = $content -replace "(backend_repo_and_image_tag=).*", "`$1"
    $content = $content -replace "(frontend_repo_and_image_tag=).*", "`$1"

    #update the docker image repo and repo tag
    if ( $appEnv -in @("prod-local-docker", "prod-docker") ){
        $content = $content -replace "(backend_repo_and_image_tag=).*", "`$1flask-backend-planner-app:$($backend_image_tag)"
        $content = $content -replace "(frontend_repo_and_image_tag=).*", "`$1react-frontend-planner-app:$($frontend_image_tag)"
    } 
    # Write the updated content back to the file
    Set-Content -Path $rootEnvFilePath -Value $content
    Write-Host "Updated VITE_APP_ENV variable in /.env to '$appEnv' and backend_host_port to '$backendHostPort'"
}

# Export the function to make it available when the module is imported
Export-ModuleMember -Function Update-Environment, Update-FrontendDirEnv, test-dockerImageTag, test-spelling, Update-RootEnv
