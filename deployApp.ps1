#This script pushes a local image into an repository in an azure container registry (ACR) resource. 

param (
    [string]$Rg="DevACR", #resource group containing the ACR resource
    [string]$acrName="devnotesappcontainerreg", #ACR resource name
    [string]$localRepo, #local repository (collection of images): flask-backend-planner-app | react-frontend-planner-app
    [string]$localImageTag="latest" #the image tag  for image within local repo that is to be uploaded. 
)

#dependency
$dependencyDir = "runAndDeployDependencies" 
$dependencyShellScript = "uploadDockerImage.sh"

#login to azure if not already logged in
if ($null -eq (az account show)) { #if not logged in output of PS command is null 
    az login --tenant $env:azureTenantId
}

#check if the ACR resource exists in 
$acrsInRg = (az resource list --resource-group $Rg --resource-type Microsoft.ContainerRegistry/registries | ConvertFrom-Json).name
$acrsInRg_str =  $acrsInRg -join "|"
while ($acrName -notin $acrsInRg ) { #case insensitive check
    $acrName = Read-Host "The acr resource used is not in the rg. Choose one of the following ACRs: [$acrsInRg_str]"  
}

#check if local repo exist 
$local_repos_list = docker images --format "{{.Repository}}" | Sort-Object -Unique
$local_repos_str = $local_repos_list -join "|"
while ($localRepo -notin $local_repos_list) {
    $localRepo = Read-Host "The local repo used was not found in docker . Choose one of the following local repos: [$local_repos_str]"
}

#check if local image exist
$local_image_list = docker images --format "{{.Tag}}" | Sort-Object -Unique
$local_image_str = $local_image_list -join "|"
while ($localImageTag -notin $local_image_list) {
    $localImageTag = Read-Host "The local image tag used is not found in docker. Choose one of the following local images: [$local_image_str]"
}

$acrLoginServer = "$acrName.azurecr.io"
$localImage = "$localRepo`:$localImageTag"
$azureImage = "azure-$localRepo`:$localImageTag" 

#Create key env vars that used by the shell script 
$env:AZURE_CONTAINER_RESOURCE_NAME = $acrName
$env:ACR_LOGIN_SERVER = $acrLoginServer
$env:LOCAL_IMAGE = $localImage
$env:AZURE_IMAGE = $azureImage

$uploadConfirmation = Read-Host "Are you sure you want push the local docker image `"$localImage`" to the repo `"azure-$localRepo`" in the ACR resource: `"$acrName`"? 'y/n' "

if ($uploadConfirmation -eq "y") {
    write-host "pushing local image to the repo `"azure-$localRepo`" in the ACR resource: `"$acrName"
    bash "./$dependencyDir/$dependencyShellScript"
}
elseif ($uploadConfirmation -eq "n") {
}
else {
    write-host invalid entry
}
