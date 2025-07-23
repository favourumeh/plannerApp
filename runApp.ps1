#Purpose: This script allows you test the flask app in the dev and in the prod environments.  
    #it takes 2 params: env and rdbms. 
        # env: the environment in which the app is run. 
                # env = dev: backend flask app runs WSGI dev server and frontend flask app runs the dev env (npm run dev)
                # env = prod-local-docker: a docker imamge is build and run where the backend flask app runs gunicorn server and the frontend flask app is built (npm run build) and served by nginx.
                # env = prod-local: a gunicorn backend and a built react app running locally 
                # env = prod: same as prod-local but with backend url matching Azure App Service (source = code) Resource
                # env = prod-docker: same as prod-local but with backend url matching Azure App Service (source=container) resouce
                #note: the point of the prod env is to test the app in a prod-like env. 
        # rdbms (optional): determines what database is used to store the apps user data: sqlite, mysql or az_mysql. 
                #note: by default the if the env is dev the local my_sql db is used. If the env = prod then the test az_msql db is used. 
param (
    [string]$env,
    [string]$rdbms
)

Import-Module ".\runAndDeployDependencies\runModule.psm1" -Force
Update-Environment

#allowed param inputs
$allowed_env = "dev prod-local-docker prod-local prod prod-docker"
$allowed_rdbms = "sqlite mysql az_mysql"

#vars for the key script params (R: avoids changing the value of the script param)
$userEnv = $env 
$userRDBMS = $rdbms

$allowed_env_prompt_format = ($allowed_env.split(" ")) -join "|"
$allowed_rdbms_prompt_format = ($allowed_rdbms.split(" ")) -join "/"

$userEnv = test-spelling -userInput $userEnv -allowedInputs $allowed_env -promptMessage "[Param env] Please enter one of - $allowed_env_prompt_format"

#Automatically set rdbms if the user did not specify one.
if ($rdbms -eq "") {
    $userRDBMS = ($userEnv -eq "dev") ? "mysql" : "az_mysql"
} else {
    $userRDBMS = test-spelling -userInput $userRDBMS -allowedInputs $allowed_rdbms -promptMessage "[param: rdbms] Please enter one of - $allowed_rdbms_prompt_format"
}

#Determine backend port 
$backendPort = ($userEnv -in @("dev", "prod", "prod-docker") ) ? $env:backend_host_port : ($userEnv -eq "prod-local") ?  5001 : 5002

#Determine backend url 
$localBackendBaseURL = $env:local_host_backend_base_url + $backendPort + "/api"
$prodBackendBaseURL = $env:VITE_PROD_NC_BACKEND_API_URL + "/api"
$prodDockerBackendBaseURL = $env:VITE_PROD_C_BACKEND_API_URL + "/api"

#check if the docker image tag is already in use. If it is, prompt the user to enter a new tag or use the newest tag. If in prod-docker use the tag "latest".
if ( $userEnv -in @("prod-local-docker", "prod-docker") ) {
    if ($userEnv -eq "prod-local-docker") {
        $justTesting = read-host "Are you testing the repo ? (y/n)" }

    $backend_image_tag =  test-dockerImageTag -appEnv $userEnv -repositoryName "flask-backend-planner-app" -userInputTag $backend_image_tag -justTesting $justTesting 
    $frontend_image_tag = test-dockerImageTag -appEnv $userEnv -repositoryName "react-frontend-planner-app" -userInputTag $frontend_image_tag -justTesting $justTesting
    write-host backend_image_tag : $backend_image_tag
    write-host frontend_image_tag: $frontend_image_tag
}

#update f/.env and /.env 
Update-FrontendDirEnv -cwd $PWD.path -appEnv $userEnv -localBackendBaseURL $localBackendBaseURL -prodBackendBaseURL $prodBackendBaseURL -prodDockerBackendBaseURL $prodDockerBackendBaseURL
Update-RootEnv -cwd $PWD.path -appEnv $userEnv -backendHostPort $backendPort -backend_image_tag $backend_image_tag -frontend_image_tag $frontend_image_tag

# --------------------------------------------------------------------Execution----------------------------------------------------------------------------
# Execute the Python script with the user-defined variable as an argument
# Define the path to the backend and frontend folders
$frontendFolder =  $PWD.path.Replace("\", "/") + "/f"
$backendFolder =  $PWD.path.Replace("\", "/") + "/b"

$backendDevCommands = @"
    .venv/Scripts/activate
    python main.py --env $userEnv --rdbms $userRDBMS
"@

$backendProdLocalCommands = @"
    cd b && source .venv_wsl/bin/activate && pip install -r requirements.txt && gunicorn --bind 0.0.0.0:$backendPort --timeout 300 main:app 
"@

$frontendProdLocalCommands = @"
    bash -c rm "dist"\; npm run build\; npm run start
"@

$prodLocalDockerCommands = @"
    docker-compose down
    docker rmi $backend_image_tag $frontend_image_tag
    docker-compose build --no-cache && docker-compose up
"@

$prodDockerCommands = @"
    echo building prod-docker containers
    docker-compose build --no-cache react-frontend | tee compose-build.log
"@ 

if ($userEnv -eq "dev") {
    Start-Process wt -ArgumentList @"
    new-tab -d "$backendFolder" powershell -NoExit -Command $backendDevCommands
    ; split-pane -V -d "$frontendFolder" powershell -NoExit -Command "npm run dev"
"@
}

elseif ( $userEnv -eq "prod-local") {
    write-host frontend-url: "http://localhost:3000"
    write-host backend-url: $localBackendBaseURL
    Start-Process wt -ArgumentList @"
    new-tab -d "$backendFolder" --profile "Ubuntu" wsl bash -c $backendProdLocalCommands
    ; split-pane -V -d "$frontendFolder" powershell -NoExit -Command $frontendProdLocalCommands
"@
}

elseif ($userEnv -eq "prod-local-docker") {
    write-host "Building docker images and running container for prod-local env"
    write-host frontend-url: "http://localhost:$env:frontend_host_port"
    write-host backend-url: $localBackendBaseURL
    Start-Process wt -ArgumentList @"
        new-tab --profile "Ubuntu" wsl bash -c $prodLocalDockerCommands
"@
}

elseif ($userEnv -eq "prod-docker") {
    write-host "Building docker images for prod-docker env"
    write-host frontend-url: "$env:FRONTEND_CONTAINER_APP_SERVICE_DOMAIN"
    write-host backend-url: "$env:VITE_PROD_BACKEND_API_URL"
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