FROM node:hydrogen-alpine as workspace

WORKDIR /app

RUN npm install --global pnpm

COPY . .

RUN pnpm --filter=@kontestis/function... install

RUN pnpm --filter=@kontestis/function deploy pruned

FROM node:hydrogen-alpine

RUN apk add git make cmake python3 gcc g++ go rust openjdk17 gcompat boost-dev

RUN git clone https://github.com/Andre-404/ESL /tmp/ESL

WORKDIR /tmp/ESL

RUN cmake . && make

RUN mv ./ESL /usr/bin/esl

WORKDIR /app

COPY --from=workspace /app/pruned .

CMD ["npm", "start"]
