#!/bin/bash
echo "***** This script must be run in a wsl environment for tmux to work *****"

if [[ ! -v env && ! -v rdbms ]]; then
    echo "Error: You have failed to provide either an 'env' var or 'rdbms' var"
    echo "Example: env=dev rdbms=sqlite ./run.sh"
    echo "Possible values of env: dev, prod"
    echo "Possible values of rdbms: sqlite, mysql, az_mysql"
    echo "Possible combinations (env,rdbms): (dev), (dev,mysql), (prod)"
    exit 1
fi

if [[ "$env" == "dev" && ! -v rdbms ]]; then
    session_name="pa-dev"
    #Run dev environment
    tmux new -d -s "$session_name" -c 'b' 'source .venv_wsl/bin/activate && python3 main.py --env dev --rdbms sqlite'
    tmux split-window -h -t "$session_name":0 'cd f; npm run dev'
    tmux attach -t "$session_name"
    tmux kill-session -t "$session_name"
    exit 1
fi

if [[ "$env" == "dev" && "$rdbms" == "mysql" ]]; then
    session_name="pa-dev-mysql"
    echo "No terminal env for dev-mysql (docker container for mysql db). Not congiured yet"
    exit 1
fi

if [[ "$env" == "prod" ]]; then
    session_name="pa-prod"
    echo "No terminal env for prod  (docker containers for backend,frontend and db). Not congiured yet"
    exit 1
fi


#Valid configuration not entered
echo "Error: env=$env and rdbms=$rdbms is not a valid configuration"
echo "Possible combinations (env,rdbms): (dev), (dev,mysql), (prod)"
