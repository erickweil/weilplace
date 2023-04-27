# https://blog.tericcabrel.com/create-docker-image-nextjs-application/
# Install dependencies only when needed
FROM node:alpine AS deps

WORKDIR /app-node

COPY package.json package-lock.json ./
RUN npm install

# Rebuild the source code only when needed
FROM node:alpine AS builder

WORKDIR /app-node

COPY --from=deps /app-node/node_modules ./node_modules

COPY . .

RUN npm run build

# Production image, copy all the files and run next
FROM node:alpine AS runner

WORKDIR /app-node

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nextgroup
RUN adduser --system --uid 1001 nextuser

COPY --from=builder /app-node/public ./public
COPY --from=builder /app-node/package.json ./package.json

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextuser:nextgroup /app-node/.next/standalone ./
COPY --from=builder --chown=nextuser:nextgroup /app-node/.next/static ./.next/static

USER nextuser

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]