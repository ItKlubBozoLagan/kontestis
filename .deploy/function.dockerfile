FROM node:hydrogen-alpine as workspace

WORKDIR /app

RUN npm install --global pnpm

COPY . .

RUN pnpm --filter=@kontestis/function... install

RUN pnpm --filter=@kontestis/function deploy pruned

FROM node:hydrogen-alpine

WORKDIR /app

RUN apk add python3 gcc g++ go rust openjdk17-jre-headless gcompat

COPY --from=workspace /app/pruned .

CMD ["npm", "start"]
