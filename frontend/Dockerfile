# https://github.com/vercel/next.js/blob/canary/examples/with-docker/Dockerfile
# https://www.youtube.com/watch?v=dtLpWR98HfE
ARG NODE_ENV=production

# ===============================================================
# Primeiro estágio: Instalação das dependências
# ===============================================================
FROM node:20-alpine as estagio_deps

WORKDIR /app

# Configura para que seja feito a instalação apenas 
# das dependências de produção
ARG NODE_ENV
ENV NODE_ENV=$NODE_ENV

# Copiando apenas as definições das dependências
COPY package.json package-lock.json ./
# npm ci em vez de install, pois é o comando indicado para uma instalação do zero
RUN npm ci

# ===============================================================
# Segundo estágio: Fazer build
# ===============================================================
FROM node:20-alpine as estagio_build

WORKDIR /app

ARG NODE_ENV
ENV NODE_ENV=$NODE_ENV
# ARG SERVERSIDE_API_URL
# ENV SERVERSIDE_API_URL=$SERVERSIDE_API_URL
# ARG NEXT_PUBLIC_API_URL
# ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
# ARG NEXT_PUBLIC_WEBSOCKET_ENABLED
# ENV NEXT_PUBLIC_WEBSOCKET_ENABLED=$NEXT_PUBLIC_WEBSOCKET_ENABLED
# ARG NEXT_PUBLIC_WEBSOCKET_URL
# ENV NEXT_PUBLIC_WEBSOCKET_URL=$NEXT_PUBLIC_WEBSOCKET_URL

# Copia as dependências no outro estágio
COPY --from=estagio_deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# ===============================================================
# Production image, copy all the files and run next
# ===============================================================
FROM node:20-alpine AS estagio_final
WORKDIR /app

ARG NODE_ENV
ENV NODE_ENV=$NODE_ENV
# ARG SERVERSIDE_API_URL
# ENV SERVERSIDE_API_URL=$SERVERSIDE_API_URL

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=estagio_build /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=estagio_build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=estagio_build --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
# set hostname to localhost
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]

# ===============================================================
# Para buildar e rodar o container
# ===============================================================
# docker build -f Dockerfile -t blog .
# docker run -d -p 3000:3000 blog
