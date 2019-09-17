const yargs = require('yargs')
const del = require('del')

const logger = {
  info: console.log,
  succeed: () => console.log('SUCCESS')
}

// returns all args as an yargs object
const getArgs = (argv = process.argv) => yargs(argv).argv

const objToEnvStr = (obj) => Object.entries(obj).reduce((acc, [key, val]) => acc + `${key}=${val} `, '').trimRight()

const clearBuildFolder = (path) => {
  logger.info('clearing build folder')
  return del(path, { force: true })
}

module.exports = {
  objToEnvStr,
  clearBuildFolder,
  logger,
  getArgs
}
