# Used in docker-compose while creating development environment
# node:hydrogen image seems to include everything we actually need but this is the closest to the actual production environment

FROM node:dind

RUN apk add python3 gcc g++ gcompat nodejs npm
