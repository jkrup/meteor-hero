const dockerFile = `
FROM node:8.15.1

COPY programs/server/package.json /usr/src/app/programs/server/package.json
WORKDIR /usr/src/app/programs/server
RUN npm install

WORKDIR ../..
COPY . .

CMD ["node", "main.js"]
`

module.exports = dockerFile
