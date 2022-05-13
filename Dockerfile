FROM node:14-alpine

RUN mkdir /app
WORKDIR /app

RUN apk add python3

COPY package.json package-lock.json /app/
RUN npm install


COPY src /app/src
COPY tsconfig.json /app/
RUN npm run build

CMD npm start
