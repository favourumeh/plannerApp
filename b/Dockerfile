# Official Python runtime base image
FROM python:3.12.5-slim

# Setup component working dir (contents of b/ dir are copied into /app/)
WORKDIR /app

# Copy the requirements file into /app/
COPY requirements.txt .

# Install the dependencies to global python env
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of b/ into /app/ excluding file/dir in .dockerignore. 
COPY . .

#set-up env var for the backend container port. This is used in the docker-compose.yml file to set the port mapping between the host and the container.
ARG backend_container_port
ENV PORT=$backend_container_port

# Expose port 5000 (default Flask port)
EXPOSE $PORT


# Run the Flask application
CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:$PORT main:app"] 


