FROM node:18-alpine

WORKDIR /app

RUN apk add python3 gcc g++ gcompat
RUN npm install --global pnpm

COPY package.json .
COPY tsconfig.json .

RUN pnpm install

COPY src ./src

CMD ["pnpm", "start"]
