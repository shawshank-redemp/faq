FROM node:20.18.0-alpine3.20 AS deps
LABEL stage=deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production --ignore-scripts

FROM node:20.18.0-alpine3.20 AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN mkdir -p /app/uploads

FROM node:20.18.0-alpine3.20 AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000
ENV NODE_OPTIONS="--enable-source-maps"
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 backend
COPY --from=builder --chown=backend:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=backend:nodejs /app ./
RUN mkdir -p /app/uploads && chown backend:nodejs /app/uploads
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
USER backend
EXPOSE 5000
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server.js"]
