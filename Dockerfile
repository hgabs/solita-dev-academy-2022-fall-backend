FROM node:current-alpine

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
USER node
WORKDIR /home/node/app
COPY package*.json ./
COPY --chown=node:node . .
RUN npm install
EXPOSE 8000
CMD [ "node", "index.js" ]
