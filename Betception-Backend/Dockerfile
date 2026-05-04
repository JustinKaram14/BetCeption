FROM node:20-bookworm-slim AS builder

ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG NO_PROXY
ARG http_proxy
ARG https_proxy
ARG no_proxy

ENV HTTP_PROXY=${HTTP_PROXY} \
    HTTPS_PROXY=${HTTPS_PROXY} \
    NO_PROXY=${NO_PROXY} \
    http_proxy=${http_proxy} \
    https_proxy=${https_proxy} \
    no_proxy=${no_proxy}

WORKDIR /app
# --- BOSCH PROXY: uncomment the next two lines if behind the Bosch corporate proxy ---
# RUN npm config set proxy http://host.docker.internal:3128/ && \
#     npm config set https-proxy http://host.docker.internal:3128/
COPY package*.json ./
ARG CACHEBUST=1
ENV NPM_CONFIG_PRODUCTION=false NODE_ENV=development
RUN npm ci --include=dev \
 && test -x node_modules/.bin/tsc || (echo "tsc missing after npm ci — devDependencies were skipped" && ls node_modules/.bin | head -40 && exit 1)
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-bookworm-slim

ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG NO_PROXY
ARG http_proxy
ARG https_proxy
ARG no_proxy

ENV HTTP_PROXY=${HTTP_PROXY} \
    HTTPS_PROXY=${HTTPS_PROXY} \
    NO_PROXY=${NO_PROXY} \
    http_proxy=${http_proxy} \
    https_proxy=${https_proxy} \
    no_proxy=${no_proxy} \
    NODE_ENV=production

WORKDIR /app
# --- BOSCH PROXY: uncomment the next two lines if behind the Bosch corporate proxy ---
# RUN npm config set proxy http://host.docker.internal:3128/ && \
#     npm config set https-proxy http://host.docker.internal:3128/
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN sed -i 's/\r$//' docker-entrypoint.sh && chmod +x docker-entrypoint.sh
EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]
