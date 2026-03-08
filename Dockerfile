FROM node:20-slim AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./

RUN npm ci

COPY frontend/ ./

ARG VITE_API_URL=/api
ARG VITE_AUTH_MODE=local
ARG VITE_AUTH0_DOMAIN
ARG VITE_AUTH0_CLIENT_ID

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_AUTH_MODE=$VITE_AUTH_MODE
ENV VITE_AUTH0_DOMAIN=$VITE_AUTH0_DOMAIN
ENV VITE_AUTH0_CLIENT_ID=$VITE_AUTH0_CLIENT_ID

RUN npm run build

FROM python:3.14-slim

WORKDIR /app

RUN pip install uv

COPY backend/pyproject.toml ./

RUN uv sync

COPY backend/app ./app

COPY --from=frontend-builder /app/frontend/dist ./static

ENV PATH="/app/.venv/bin:$PATH"

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
