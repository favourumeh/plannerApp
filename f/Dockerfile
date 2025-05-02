
#Build stage
FROM node:20.18.0-alpine AS build
WORKDIR /app
COPY package*.json .
RUN npm ci 
COPY . .
RUN npm run build

#Production Stage
FROM nginx:stable-alpine AS production
COPY --from=build app/dist usr/share/nginx/html

#Import env var
ARG frontend_container_port
ENV PORT=$frontend_container_port
ARG VITE_APP_ENV
ENV APP_ENV=$VITE_APP_ENV
ARG frontend_container_app_service_domain
ENV FRONTEND_CONTAINER_APP_SERVICE_DOMAIN=$frontend_container_app_service_domain

#sets the listening (container) port  where the nginx web server is hosted to $PORT
RUN sed -i "s/listen\s.*/listen $PORT;/" /etc/nginx/conf.d/default.conf 

#Toggles the server_name in the site config file (/etc/nginx/conf.d/default.conf) from "localhost" to the domain of Azure Frontend App Service resource
RUN if [[ $APP_ENV = "dev" ]] || [[ $APP_ENV = "prod-local-docker" ]]; then \
        server_name="localhost"; \
    elif [[ $APP_ENV = "prod-docker" ]]; then \
        server_name=$FRONTEND_CONTAINER_APP_SERVICE_DOMAIN; \
    else \
        echo "APP_ENV is not 'dev', 'prod-local-docker' or 'prod-docker'"; \
    fi; \
    sed -i "s/server_name\s.*/server_name $server_name;/" /etc/nginx/conf.d/default.conf;

EXPOSE $PORT
CMD ["nginx", "-g", "daemon off;"]

