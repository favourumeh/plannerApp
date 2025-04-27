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

# Export the function to make it available when the module is imported
Export-ModuleMember -Function Update-Environment