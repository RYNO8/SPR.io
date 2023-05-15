FROM node:14-alpine

RUN mkdir /app
WORKDIR /app

RUN apk add python3

COPY package.json package-lock.json /app/
RUN npm install


COPY src /app/src
COPY tsconfig.json /app/
RUN npm run build
RUN npm install pm2 -g
RUN pm2 link 55iw5a42cu93a94 iak1filz7pc14k3
CMD pm2-runtime dist/server/server.js --raw -e PM2_PUBLIC_KEY $PM2_PUBLIC_KEY -e PM2_SECRET_KEY $PM2_SECRET_KEY