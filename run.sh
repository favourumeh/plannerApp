#!/bin/bash

if [[ ! -v env ]]; then
    echo "Error: You have failed to provide 'env' var"
    echo "Example: env=dev ./run.sh"
    echo "Possible values of env: dev, dev-mysql, sandbox, sandbox-nb, prod"
    echo "dev is sqlite; dev-mysql is mysql; sandbox is container build image and run for b,f and db(mysql), sandbox-nb uses existing image build; prod is container build but with detached terminal"
    echo "Note: Do not run env=dev/dev-mysql in rasp pi"
    exit 1
fi


if [[ "$env" == "dev" ]]; then
    session_name="pa-dev"
    read -p "This code uses tmux. Are you in wsl?[y/n]:" in_wsl
    if [[ "$in_wsl" == *"n"* ]]; then
        echo "Please enter wsl then re-run the script"
        exit 1
    fi
    #Run dev environment
    tmux new -d -s "$session_name" -c 'b' 'source .venv_wsl/bin/activate && python3 main.py --env dev --rdbms sqlite'
    tmux split-window -h -t "$session_name":0 'cd f; npm run dev'
    tmux attach -t "$session_name"
    tmux kill-session -t "$session_name"
    exit 0
fi

if [[ "$env" == "dev-mysql" ]]; then
    echo "This dev app tries to connect to a database in the host's mysql service called planner_app_db."
    read -p "This code uses tmux. Are you in wsl?[y/n]:" in_wsl
    if [[ "$in_wsl" == *"n"* ]]; then
        echo "Please enter wsl then re-run the script"
        exit 1
    fi
    session_name="pa-dev-mysql"
    #import vars from ./.env
    source ./.env

    #change the environment variables of the b/.env file to match the dev environments
    sed -i "s/mySQLHost=.*/mySQLHost=$mySQLHost_dev/" ./b/.env
    sed -i "s/mySQLPassword=.*/mySQLPassword=$mySQLPassword_dev/" ./b/.env
    sed -i "s/mySQLUser=.*/mySQLUser=$mySQLUser_dev/" ./b/.env
        #note: must use double quotes for string in sed for referenced variables ($) to be recognised

    #Run dev environment
    tmux new -d -s "$session_name" -c 'b' 'source .venv_wsl/bin/activate && python3 main.py --env dev --rdbms mysql'
    tmux split-window -h -t "$session_name":0 'cd f; npm run dev'
    tmux attach -t "$session_name"
    tmux kill-session -t "$session_name"
    exit 0
fi

if [[ "$env" == *"sandbox"* ]]; then
    echo "This code creates the full app: backend, frontend and database via the docker compose file"
    echo "Note: the container database data is stored in the parent directory of the plannerapp dir"

    if [[ "$skip_prompt" != "y" || ! -v skip_prompt  ]]; then
        read -p "This code requires write permission in database data folder. Are you in wsl?[y/n]:" in_wsl
        if [[ "$in_wsl" == *"y"* ]]; then
            echo "Please exit wsl then re-run the script on normal terminal."
            exit 1
        fi
    fi

    #import vars from ./.env
    source ./.env

    #Edit the b/.env to match the environment variables in ./.env
    sed -i "s/mySQLHost=.*/mySQLHost=$mySQLHost_sandbox/" ./b/.env
    sed -i "s/mySQLPassword=.*/mySQLPassword=$mySQLPassword_sandbox/" ./b/.env
    sed -i "s/mySQLUser=.*/mySQLUser=$mySQLUser_sandbox/" ./b/.env

    if [[ "$env" == "sandbox-nb" ]]; then
        docker compose up
    else
        docker compose up --build
    fi

    exit 0
fi

if [[ "$env" == "db" ]]; then
    echo "This creates a standalone containerised mysql db running on port 3307"
    echo "Use this if you want to go into the container evironment and backup the "
    #import vars from ./.env
    source ./.env
    #Edit the b/.env to match the environment variables
    sed -i 's/mySQLHost=.*/mySQLHost=mysql/' ./b/.env
    sed -i "s/mySQLPassword=.*/mySQLPassword=$mySQLPassword_sandbox/" ./b/.env
    sed -i 's/mySQLUser=.*/mySQLUser=root/' ./b/.env
    docker compose up mysql
    exit 0
fi

if [[ "$env" == "prod" ]]; then
    echo "This code creates the full app: backend, frontend and database via the docker compose file"
    echo "Note: the container database data is stored in the parent directory of the plannerapp dir"
    #import vars from ./.env
    source ./.env

    #Edit the b/.env to match the environment variables in ./.env (uses same values as sandbox)
    sed -i "s/mySQLHost=.*/mySQLHost=$mySQLHost_prod/" ./b/.env
    sed -i "s/mySQLPassword=.*/mySQLPassword=$mySQLPassword_prod/" ./b/.env
    sed -i "s/mySQLUser=.*/mySQLUser=$mySQLUser_prod/" ./b/.env
    docker compose up --build -d
    exit 0
fi

#Valid configuration not entered
echo "Error: env=$env is not a valid configuration"
echo "Possible env values: dev, dev-mysql, sandbox, sandbox-nb, prod"
echo "dev is sqlite; dev-mysql is mysql; sandbox is container build image and run for b,f and db, sandbox-nb uses existing image build; prod is container build but with detached terminal"
