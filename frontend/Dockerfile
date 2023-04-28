FROM node:alpine

WORKDIR /node-app

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

COPY . .

RUN npm install

RUN npm run build

CMD [ "npm", "start" ]