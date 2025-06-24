# Purpose: Creates the image for running the QSeek API.
#podman build -t qseek_api:latest -f Dockerfile
FROM alpine:latest

RUN apk update &&\
    apk add --update nodejs npm &&\
    apk add git

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
WORKDIR /home/appuser

RUN cd /home/appuser &&\
    git clone https://github.com/uofuseismo/uussWebsiteMaps &&\
    cd uussWebsiteMaps/forgeEventsAPI &&\
    npm install &&\
    npm build
    
#node 
