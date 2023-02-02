FROM node:hydrogen-alpine

WORKDIR /app

RUN npm install --global pnpm

COPY package.json .
COPY tsconfig.json .

COPY ../../tsconfig.base.json ./tsconfig.base.json

RUN sed -i tsconfig.json -E 's|(\.\.\/)+(tsconfig.base.json)|\2|g'

RUN pnpm install

COPY ./src ./src

CMD [ "sh", "-c", "pnpm start" ]
