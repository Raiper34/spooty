FROM node:20.20.0-alpine AS builder
WORKDIR /spooty
COPY . .
RUN npm ci
RUN npm run build

FROM node:20.20.0-alpine
WORKDIR /spooty
COPY --from=builder /spooty/dist .
COPY --from=builder /spooty/src ./src
COPY --from=builder /spooty/package.json ./package.json
COPY --from=builder /spooty/package-lock.json ./package-lock.json
COPY --from=builder /spooty/src/backend/.env.docker ./.env
RUN npm prune --production
RUN rm -rf src package.json package-lock.json
RUN apk add --no-cache ffmpeg
RUN apk add --no-cache redis
RUN apk add --no-cache python3 py3-pip
EXPOSE 3000
CMD ["node", "backend/main.js"]