FROM node:hydrogen-alpine as workspace

WORKDIR /app

RUN npm install --global pnpm

COPY . .

RUN pnpm --filter=@kontestis/function... install

RUN pnpm --filter=@kontestis/function deploy pruned

FROM docker:dind

WORKDIR /app

RUN apk add python3 gcc g++ gcompat nodejs npm

COPY --from=workspace /app/pruned .

CMD ["sh", "-c", "dockerd --log-level error & npm start"]
