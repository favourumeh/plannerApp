
#Build stage
FROM node:20.18.0-alpine AS build
WORKDIR /app
COPY package*.json .
RUN npm ci 
ARG VITE_BACKEND_ENV
ENV VITE_BACKEND_ENV=$VITE_BACKEND_ENV
ARG VITE_DEV_BACKEND_API_URL
ENV VITE_DEV_BACKEND_API_URL=$VITE_DEV_BACKEND_API_URL
ARG VITE_PROD_BACKEND_API_URL
ENV VITE_PROD_BACKEND_API_URL=$VITE_PROD_BACKEND_API_URL
COPY . .
RUN npm run build

#Production Stage
FROM nginx:stable-alpine AS production
COPY --from=build app/dist usr/share/nginx/html

#Import env var
ARG frontend_container_port
ENV PORT=$frontend_container_port
ARG frontend_domain_option
ENV DOMAIN_OPTION=$frontend_domain_option
ARG frontend_container_app_service_domain
ENV FRONTEND_CONTAINER_APP_SERVICE_DOMAIN=$frontend_container_app_service_domain

#sets the listening (container) port  where the nginx web server is hosted to $PORT
RUN sed -i "s/listen\s.*/listen $PORT;/" /etc/nginx/conf.d/default.conf 

#Toggles the server_name in the site config file (/etc/nginx/conf.d/default.conf) from "localhost" to the domain of Azure Frontend App Service resource
RUN if [[ $DOMAIN_OPTION = "dev" ]]; then \
        server_name="localhost"; \
    elif [[ $DOMAIN_OPTION = "prod-docker" ]]; then \
        server_name="$FRONTEND_CONTAINER_APP_SERVICE_DOMAIN"; \
    else \
        echo "DOMAIN_OPTION is not 'dev' or 'prod-docker'"; \
    fi; \
    sed -i "s/server_name\s.*/server_name $server_name;/" /etc/nginx/conf.d/default.conf;

EXPOSE $PORT
CMD ["nginx", "-g", "daemon off;"]

