FROM node:18-alpine

WORKDIR /app

RUN apk add python3 gcc

COPY package.json .
COPY tsconfig.json .

RUN yarn install

COPY src ./src

CMD ["yarn", "start"]
