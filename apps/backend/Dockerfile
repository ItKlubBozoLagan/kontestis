FROM node:hydrogen-alpine

WORKDIR /app

RUN npm install --global pnpm

COPY package.json .
COPY tsconfig.json .
COPY tsconfig.base.json .

RUN pnpm install

COPY ./src ./src

CMD [ "pnpm", "start" ]
