# Used in docker-compose while creating development environment
# node:26 image seems to include everything we actually need but this is the closest to the actual production environment

FROM node:26-alpine

RUN apk add python3 gcc g++ go rust openjdk17 gcompat boost-dev

