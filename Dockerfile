FROM node:16

WORKDIR /usr/src/app

RUN apt install gcc
RUN apt install python3


COPY . .

RUN yarn install
CMD ["yarn", "start"]