FROM node:hydrogen-alpine as workspace

WORKDIR /app

RUN npm install --global pnpm

COPY . .

RUN pnpm --filter=@kontestis/backend... install

RUN pnpm --filter=@kontestis/backend deploy pruned

FROM node:hydrogen-alpine

WORKDIR /app

COPY --from=workspace /app/pruned/ .

CMD [ "npm", "start" ]
