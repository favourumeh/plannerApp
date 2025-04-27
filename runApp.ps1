#Purpose: This script allows you test the flask app in the dev and in the prod environments.  
    #it takes 2 params: env and rdbms. 
        # env: the environment in which the app is run. 
                # env = dev: backend flask app runs WSGI dev server and frontend flask app runs the dev env (npm run dev)
                # env = prod-local: a docker imamge is build and run where the backend flask app runs gunicorn server and the frontend flask app is built (npm run build) and served by nginx.
                #note: the point of the prod env is to test the app in a prod-like env. 
        # rdbms: determines what database is used to store the apps user data: sqlite, mysql or az_mysql. 
                #note: by default the if the env is dev the local my_sql db is used. If the env = prod then the test az_msql db is used. 
param (
    [string]$env,
    [string]$rdbms
)

Import-Module ".\runAndDeployDependencies\runModule.psm1" -Force
Update-Environment

#allowed param inputs
$allowed_env = "dev prod-local prod"
$allowed_rdbms = "sqlite mysql az_mysql"

#Determine backend url 
$devBackendBaseURL = $env:local_host_backend_base_url + $env:backend_host_port
$prodBackendBaseURL = $env:VITE_PROD_BACKEND_API_URL

function Update-FrontendDirEnv{
    #Changes the VITE_PROD_BACKEND_API_URL, VITE_DEV_BACKEND_API_URL in f/.env to allign with /.env file
    #Also changes VITE_APP_ENV to allign with env param of Script. this variable determines the backendBaseURL used in f/project_config.js 
    #funciton params 
    param (
        [string]$appEnv
    )  
    #get the content of  project_config.js
    $frontendEnvFilePath = $PWD.path + "\f\.env"
    $content = Get-Content -Path $frontendEnvFilePath -Raw

    #Update frontend/.env (so it is consistent with project_config)
    $content = $content -replace "(VITE_PROD_BACKEND_API_URL=).*", "`$1$($prodBackendBaseURL)"
    $content = $content -replace "(VITE_DEV_BACKEND_API_URL=).*", "`$1$($devBackendBaseURL)"

    #Change VITE_APP_ENV environment variable in frontend/.env depending on appEnv param
    $content = $content -replace "(VITE_APP_ENV=).*", "`$1$($appEnv)"

    # Write the updated content back to the file
    Set-Content -Path $frontendEnvFilePath -Value $content
    Write-Host "Updated backendBaseURL variable in f/project_config.js to $backendBaseURL"
}
function test-dockerImageTag{
    #checks if the docker image is valid (i.e., is it empty, does it already exist )
    param (
        [string]$repositoryName,
        [string]$userInputTag
    )
    # Extract a list of docker tags for the specific repo
    $dockerTags = (docker images --filter "reference=$repositoryName" --format "{{.Tag}}") -join ", "
    $tagArr = $dockerTags.split(", ")
    if ($tagArr.Length -eq 0) {
        Write-Host "No tags found for the repository $repositoryName. So using 'test' as tag"
        return "test"
    }

    #get the latest tag
    $latestTag = $tagArr[$tagArr.Length -1]

    $justTesting = read-host "Are you testing the repo $repositoryName ? (y/n)" 
    if ($justTesting -eq "y") {
        write-host "Stoping and removing any running docker containers"
        docker-compose down
        docker rmi $repositoryName":test"
        return "test"}

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

# Function to display usage instructions
function Show-Usage {
    # Write-Host "Usage: .\runApp.ps1 [-var1 <value> -var2 <value> ...]"
    Write-Host "Usage Example: .\runApp.ps1 -b_env dev -f_env dev -rdbms my_sql"
}

#vars for the key script params (R: avoids changing the value of the script param)
$userEnv = $env 
$userRDBMS = $rdbms
function test-spelling{
    #checks the spelling of the user-inputeed param value
    param (
        [string]$userInput,
        [string]$allowedInputs,
        [string]$promptMessage
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

$allowed_env_prompt_format = ($allowed_env.split(" ")) -join "|"
$allowed_rdbms_prompt_format = ($allowed_rdbms.split(" ")) -join "/"

$userEnv = test-spelling -userInput $userEnv -allowedInputs $allowed_env -promptMessage "[Param env] Please enter one of - $allowed_env_prompt_format"
#Automatically set rdbms if the user did not specify one.
if ($rdbms -eq "") {
    $userRDBMS = ($userEnv -eq "dev") ? "mysql" : "az_mysql"
} else {
    $userRDBMS = test-spelling -userInput $userRDBMS -allowedInputs $allowed_rdbms -promptMessage "[param: rdbms] Please enter one of - $allowed_rdbms_prompt_format"
}

#check if the docker image tag is already in use. If it is, prompt the user to enter a new tag.
#Note: this is only done for the prod env.
if ($userEnv -eq "prod-local") {
    $backend_image_tag =  test-dockerImageTag -repositoryName "flask-backend-planner-app" -userInputTag $backend_image_tag
    $frontend_image_tag = test-dockerImageTag -repositoryName "react-frontend-planner-app" -userInputTag $frontend_image_tag
    write-host frontend_image_tag: $frontend_image_tag
}
write-host backend_image_tag : $backend_image_tag

function Update-RootEnv{
    # Updated the VITE_APP_ENV variable in .env file root directory to allign with the env param of this script. 
    # This variable controls the docker image build
    param (
        [string] $appEnv
    )
    $rootEnvFilePath = $PWD.path + "\.env"
    $content = Get-Content -Path $rootEnvFilePath -Raw

    #update VITE_APP_ENV var
    $content = $content -replace "(VITE_APP_ENV=).*", "`$1$($appEnv)"

    #update the docker image repo and repo tag
    if ($appEnv -eq "prod-local"){
        $content = $content -replace "(backend_repo_and_image_tag=).*", "`$1flask-backend-planner-app:$($backend_image_tag)"
        $content = $content -replace "(frontend_repo_and_image_tag=).*", "`$1react-frontend-planner-app:$($backend_image_tag)"
    }  elseif ($appEnv -eq "prod"){
        $content = $content -replace "(backend_repo_and_image_tag=).*", "`$1flask-backend-planner-app:latest"
        $content = $content -replace "(frontend_repo_and_image_tag=).*", "`$1react-frontend-planner-app:latest"
    } else {
        $content = $content -replace "(backend_repo_and_image_tag=).*", "`$1"
        $content = $content -replace "(frontend_repo_and_image_tag=).*", "`$1"
    }
    # Write the updated content back to the file
    Set-Content -Path $rootEnvFilePath -Value $content
    Write-Host "Updated VITE_APP_ENV variable in /.env to '$appEnv'"
}

Write-Host ("PWD: " + $PWD.path)

#update f/.env and /.env 
Update-FrontendDirEnv -appEnv $userEnv
Update-RootEnv -appEnv $userEnv


#--------------------------------------------------------------------Execution----------------------------------------------------------------------------
# Execute the Python script with the user-defined variable as an argument
# Define the path to the backend and frontend folders
$frontendFolder =  $PWD.path.Replace("\", "/") + "/f"
$backendFolder =  $PWD.path.Replace("\", "/") + "/b"

$backendCommands = @"
    .venv/Scripts/activate
    python main.py --env $userEnv --rdbms $userRDBMS
"@

$prodLocalDockerCommands = @"
    docker-compose build --no-cache
    docker-compose up
"@ #6 #7

$prodDockerCommands = @"
    docker-compose build --no-cache
"@ #6 #7

if ($userEnv -eq "dev") {
    Start-Process wt -ArgumentList @"
    new-tab -d "$backendFolder" powershell -NoExit -Command $backendCommands
    ; split-pane -V -d "$frontendFolder" powershell -NoExit -Command "npm run dev"
"@ #**
}

elseif ($userEnv -eq "prod-local") {
    write-host "Building docker images and running container for prod-local env"
    write-host frontend-url: "http://localhost:$env:frontend_host_port"
    write-host backend-url: $devBackendBaseURL
    Start-Process wt -ArgumentList @"
        new-tab --profile "Ubuntu" wsl bash -c $prodLocalDockerCommands
"@
}

elseif ($userEnv -eq "prod") {
    write-host "Building docker images for prod env"
    write-host frontend-url: "http://localhost:$env:frontend_host_port"
    write-host backend-url: $devBackendBaseURL
    Start-Process wt -ArgumentList @"
        new-tab --profile "Ubuntu" wsl bash -c $prodDockerCommands
"@
    write-host "App images are built and ready for deployment to container registry. Run deployApp.ps1"
    
}

#NOTEs: -----------------------------------------------------------------------------------------


# docker images --filter "reference=react-frontend-planner-app" --format "Table {{.Repository}}\t{{.Tag}}"
# docker images --filter "reference=flask-backend-planner-app" --format "{{.Repository}}:{{.Tag}}"
# $A=$(docker images --filter "reference=react-frontend-planner-app" --format "{{.Repository}}:{{.Tag}}")
# $A -like "*v1*"  