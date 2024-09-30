FROM node:18 AS builder
WORKDIR /spooty
COPY . .
RUN npm ci
RUN npm run build

FROM node:18
WORKDIR /spooty
COPY --from=builder /spooty/dist .
COPY --from=builder /spooty/src ./src
COPY --from=builder /spooty/package.json ./package.json
COPY --from=builder /spooty/package-lock.json ./package-lock.json
COPY --from=builder /spooty/src/backend/.env.default ./.env
RUN rm -rf node_modules
RUN npm ci --omit=dev
RUN apt-get -y update && apt-get -y upgrade && apt-get install -y --no-install-recommends ffmpeg
RUN rm -rf src package.json package-lock.json
EXPOSE 3000
CMD ["node", "backend/main.js"]