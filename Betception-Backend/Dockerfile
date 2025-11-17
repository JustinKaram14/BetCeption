FROM node:20-bookworm-slim

ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG NO_PROXY
ARG http_proxy
ARG https_proxy
ARG no_proxy

ENV HTTP_PROXY=${HTTP_PROXY}
ENV HTTPS_PROXY=${HTTPS_PROXY}
ENV NO_PROXY=${NO_PROXY}
ENV http_proxy=${http_proxy}
ENV https_proxy=${https_proxy}
ENV no_proxy=${no_proxy}

WORKDIR /app
COPY package*.json ./
ENV NODE_ENV=development
ENV NPM_CONFIG_PRODUCTION=false
ENV npm_config_production=false
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN npm run build
RUN npm prune --omit=dev
RUN chmod +x docker-entrypoint.sh
ENV NPM_CONFIG_PRODUCTION=true
ENV npm_config_production=true
ENV NODE_ENV=production
EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]
