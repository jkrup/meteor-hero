const { execSync } = require('child_process')
const os = require('os')
const yargs = require('yargs')
const del = require('del')
const { yellow, bold, green, grey } = require('chalk')

const logger = {
  info: console.log,
  success: msg => console.log(green(msg))
}

// returns all args as an yargs object
const args = yargs(process.argv).argv

const objToEnvStr = obj =>
  Object.entries(obj)
    .reduce((acc, [key, val]) => acc + `${key}=${val} `, '')
    .trimRight()

const clearBuildFolder = path => {
  logger.info('clearing build folder')
  return del(path, { force: true })
}

const defaultMeteorBuildDir = `${os.homedir()}/.meteor-hero/builds`
const meteorBuildDir = args['b'] || defaultMeteorBuildDir

function explain (explanation) {
  console.log(`
  ${yellow(`🚨 Something happened that probably shouldn't have.`)}

  ${grey(`Details:`)}
    ${explanation}

  ${`Run ${bold(
    `meteor-hero -h`
  )} to see the full help menu and list of options`}

  ${grey(
    `If all else fails go to https://github.com/jkrup/meteor-hero/issues and post an issue there.`
  )}

`)
  process.exit(1)
}

function getMeteorSettingsAsString(fileName) {
  // Remove all line breaks
  const json = execSync(`cat ${fileName}`).toString().trim().replace(/\t|\r?\n|\r/g, "");
  // Wrap in quotes so JSON string can work with heroku config:set
  return `'${json}'`;
}

module.exports = {
  args,
  clearBuildFolder,
  explain,
  getMeteorSettingsAsString,
  logger,
  meteorBuildDir,
  objToEnvStr
}
