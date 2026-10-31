ARG NODE_VERSION=24

# ===== BUILD STAGE =====
FROM node:${NODE_VERSION}-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY build.js /app/build.js
COPY public/ /app/public
RUN npm run build

# ===== PRODUCTION STAGE =====
FROM node:${NODE_VERSION}-alpine AS production

RUN apk upgrade --no-cache && apk add --no-cache sqlite

WORKDIR /app
COPY package*.json ./
ENV NODE_ENV=production
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY server.js /app/server.js
COPY src/ /app/src

RUN rm -rf /usr/local/lib/node_modules \
           /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack \
           /opt/yarn* /usr/local/bin/yarn*

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD node -e "fetch('http://localhost:'+process.env.SERVER_PORT+'/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

USER node

CMD [ "node", "server.js" ]
