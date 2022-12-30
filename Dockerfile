FROM node:16

WORKDIR /usr/src/app

RUN apt install gcc
RUN apt install python


COPY tsconfig.json .
COPY package.json .
COPY src .

RUN yarn install

CMD ["yarn", "start"]