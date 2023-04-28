FROM node:alpine

WORKDIR /node-app

ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

ENV PORT=3000
EXPOSE 3000

COPY . .

RUN npm install

RUN npm run build

CMD [ "npm", "start" ]