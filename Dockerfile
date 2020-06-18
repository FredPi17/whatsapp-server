FROM node:10

WORKDIR /usr/src/app

COPY . . 

EXPOSE 666

CMD ["node", "server.js"]
