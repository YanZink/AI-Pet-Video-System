FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production && npm cache clean --force

RUN addgroup -g 1001 -S nodejs && \\
    adduser -S telegram-bot -u 1001

COPY --chown=telegram-bot:nodejs . .

USER telegram-bot

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD node -e "process.exit(0)"

CMD ["npm", "start"]