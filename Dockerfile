# syntax=docker/dockerfile:1

FROM node:20.20.0-alpine AS builder
WORKDIR /spooty
COPY package.json package-lock.json ./
COPY src/backend/package.json src/backend/
COPY src/frontend/package.json src/frontend/
RUN --mount=type=cache,target=/root/.npm \
    npm ci
COPY . .
RUN npm run build

FROM node:20.20.0-alpine
WORKDIR /spooty
RUN apk add --no-cache ffmpeg python3 py3-pip
COPY package.json package-lock.json ./
COPY src/backend/package.json src/backend/
COPY src/frontend/package.json src/frontend/
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev -w backend
COPY --from=builder /spooty/dist .
COPY --from=builder /spooty/src/backend/.env.docker ./.env
EXPOSE 3000
CMD ["node", "backend/main.js"]
