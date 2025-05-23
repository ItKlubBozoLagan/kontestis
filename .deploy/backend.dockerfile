FROM node:hydrogen-alpine AS workspace

WORKDIR /app

RUN npm install --global pnpm

# can't really cache this without making the dockerfile unusable outside of github actions
COPY . .

RUN pnpm --filter=@kontestis/backend... install --frozen-lockfile

RUN pnpm --filter=@kontestis/backend deploy pruned

FROM node:hydrogen-alpine

WORKDIR /app

COPY --from=workspace /app/pruned/ .

CMD [ "npm", "start" ]
