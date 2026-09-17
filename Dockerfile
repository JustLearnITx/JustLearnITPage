ARG NODE_VERSION=24.21.0

# ===== BUILD STAGE =====
FROM node:${NODE_VERSION}-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY build.js /app/build.js
COPY public/ /app/public
RUN node build.js

# ===== PRODUCTION STAGE =====
FROM node:${NODE_VERSION}-alpine AS production

RUN apk add --no-cache sqlite curl

WORKDIR /app
COPY package*.json ./
ENV NODE_ENV=production
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY public/fonts /app/dist/fonts
COPY public/img /app/dist/img
COPY server.js /app/server.js
COPY src/ /app/src

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD curl -f `http://localhost:${SERVER_PORT}`/ || exit 1

EXPOSE ${SERVER_PORT}
USER node

CMD [ "node", "server.js" ]
