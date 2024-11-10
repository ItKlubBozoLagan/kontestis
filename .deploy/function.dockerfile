FROM node:hydrogen-alpine AS workspace

WORKDIR /app

RUN npm install --global pnpm

COPY . .

RUN pnpm --filter=@kontestis/function... install

RUN pnpm --filter=@kontestis/function deploy pruned

FROM node:hydrogen-alpine

RUN apk add python3 gcc g++ go rust openjdk17 gcompat boost-dev

WORKDIR /app

COPY --from=workspace /app/pruned .

CMD ["npm", "start"]
