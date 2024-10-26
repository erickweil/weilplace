FROM node:alpine

WORKDIR /node-app

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

ENV LOG_ROUTES="false"
ENV PORT=3001
ENV PUBLIC_API_URL="http://localhost:3001"
EXPOSE 3001

# Primeiro instala as dependências
COPY package.json package-lock.json ./

# Utilizar 'npm ci' em vez de 'npm install'
# https://stackoverflow.com/questions/52499617/what-is-the-difference-between-npm-install-and-npm-ci
RUN npm ci

# Depois copia o projeto (Isto torna mais rápido o build devido ao cache)
COPY . .

ENTRYPOINT [ "node" ]

# especificar o cmd service_pixelsaver quando for executar o outro.
# docker run image service_pixelsaver.js
CMD [ "server.js" ]