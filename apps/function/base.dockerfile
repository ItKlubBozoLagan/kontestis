# Used in docker-compose while creating development environment
# node:hydrogen image seems to include everything we actually need but this is the closest to the actual production environment

FROM node:hydrogen-alpine

RUN apk add git make cmake python3 gcc g++ go rust openjdk17 gcompat

RUN git clone https://github.com/Andre-404/ESL /tmp/ESL

WORKDIR /tmp/ESL

RUN cmake . && make

RUN cp ./ESL /usr/bin/esl