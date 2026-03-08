FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

ARG VITE_API_URL=http://localhost:8000
ARG VITE_AUTH_MODE=local
ARG VITE_AUTH0_DOMAIN
ARG VITE_AUTH0_CLIENT_ID

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_AUTH_MODE=$VITE_AUTH_MODE
ENV VITE_AUTH0_DOMAIN=$VITE_AUTH0_DOMAIN
ENV VITE_AUTH0_CLIENT_ID=$VITE_AUTH0_CLIENT_ID

RUN npm run build

FROM node:20-slim

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]
