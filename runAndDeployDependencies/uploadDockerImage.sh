#login to ACR resource
az acr login --name $AZURE_CONTAINER_RESOURCE_NAME

#Tag local image 
docker tag $LOCAL_IMAGE $ACR_LOGIN_SERVER/$AZURE_IMAGE

#push local image to ACR
docker push $ACR_LOGIN_SERVER/$AZURE_IMAGE

