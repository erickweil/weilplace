FROM node:alpine

WORKDIR /node-app

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

ENV LOG_ROUTES="false"
ENV PORT=3001
ENV API_URL="http://localhost:3001"
EXPOSE 3001

COPY . .

RUN npm install



ENTRYPOINT [ "node" ]

# especificar o cmd service_pixelsaver quando for executar o outro.
# docker run image service_pixelsaver.js
CMD [ "server.js" ]