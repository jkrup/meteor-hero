const { execSync } = require('child_process')

const nodeVersion = execSync('meteor node -v').slice(1);

const dockerFile = `
FROM node:${nodeVersion}

COPY programs/server/package.json /usr/src/app/programs/server/package.json
WORKDIR /usr/src/app/programs/server
RUN npm install

WORKDIR ../..
COPY . .

CMD ["node", "main.js"]
`

module.exports = dockerFile
