const fs = require('fs')
const tar = require('tar')
const { execSync } = require('child_process')
const { explain, meteorBuildDir, logger, objToEnvStr, clearBuildFolder, getMeteorSettingsAsString } = require('../helpers')
const { herokuCreate } = require('../commandHelpers')
const dockerFile = require('../dockerfile')
const dotenv = require('dotenv')

const encoding = 'utf8'
const readFile = path => fs.readFileSync(path, encoding)
const getVersion = () =>
  readFile('.meteor/release').match(/METEOR@(.*)\r?\n/)[1]
const getMicroVersion = () => parseInt(getVersion().split('.')[1], 10)
const shouldBeServerOnly = () => getMicroVersion() >= 3 // TODO: if 2.0.0 ever comes out this could break

// Get tar {
const isWin = /^win/.test(process.platform)

const getFolderName = (path, isWinOverride = isWin) => {
  const pathDelimiter = isWinOverride ? '\\' : '/'
  const pathParts = path.split(pathDelimiter)
  return pathParts[pathParts.length - 1]
}

const projectName = getFolderName(process.cwd())
const tarFileName = `${projectName}.tar.gz`
// }

const cwd = `${meteorBuildDir}/bundle`
const execInBundleDir = cmd => execSync(cmd, { cwd })

function buildMeteorApp () {
  logger.info('Building meteor app...')
  try {
    logger.info('Building meteor app (this can take several minutes)')
    const serverOnly = shouldBeServerOnly()
    execSync(
      `meteor build ${meteorBuildDir} ${
        serverOnly ? '--server-only' : ''
      } --architecture=os.linux.x86_64`
    )
    logger.success('Built')
  } catch (e) {
    // eslint-disable-next-line
    logger.error(e)
  }
}

function unzipMeteorBundle () {
  const bundlePath = `${meteorBuildDir}/${tarFileName}`
  logger.info('Unzipping meteor bundle...')
  try {
    tar.x({
      file: bundlePath,
      cwd: meteorBuildDir,
      sync: true
    })
  } catch (err) {
    console.log(err)
  }
}

function getCustomEnv (args) {
  // Pre running work

  const envArgsEnv = {}
  if (args && args['e']) {
    for (let envArg of args['e']) {
      const [key, val] = envArg.split('=')
      envArgsEnv[key] = val
    }
  }

  // envfile
  const envFileEnv = args['E']
    ? fs.existsSync(args['E'])
      ? dotenv.parse(fs.readFileSync(args['E']).toString())
      : explain(
        '-E must be set to a env file that exists and consists of ENV=value lines only'
      )
    : {}

  // Meteor settings
  const meteorSettings = args['s']
    ? { METEOR_SETTINGS: getMeteorSettingsAsString(args['s']) }
    : {};

  return {
    ...envFileEnv,
    ...envArgsEnv,
    ...meteorSettings
  }
}

function writeDockerFile () {
  logger.info('Writing Dockerfile...')
  return fs.writeFileSync(`${meteorBuildDir}/bundle/Dockerfile`, dockerFile)
}

function writeAppName (appName) {
  fs.writeFileSync('.heroku_app_name', appName)
}

function herokuLogin () {
  execSync(`heroku container:login`)
}

function getMongoUrl (appName) {
  const stdout = execSync(`heroku config:get MONGODB_URI --app ${appName}`)
  return stdout.toString()
}

function getFinalEnvVars (appName, customEnv) {
  const defaultEnv = {
    ROOT_URL: `https://${appName}.herokuapp.com`
  }
  if (!customEnv['MONGO_URL']) {
    logger.info('No MONGO_URL set so creating one on Heroku...')
    execSync(`heroku addons:create mongolab --app ${appName}`)
    const mongoUrl = getMongoUrl(appName)
    defaultEnv['MONGO_URL'] = mongoUrl
  }

  return {
    ...defaultEnv,
    ...customEnv
  }
}

function herokuSetAppEnvVars (appName, envVars) {
  execInBundleDir(
    `heroku config:set --app ${appName} ${objToEnvStr(envVars)}`
  )
}

function pushContainer (appName) {
  execInBundleDir(`heroku container:push web -a ${appName}`)
}

function releaseApp (appName) {
  logger.info('Releasing app...')
  return execInBundleDir(`heroku container:release web -a ${appName}`)
}

function setEnvVars (appName, customEnv) {
  if (Object.keys(customEnv).length > 0) {
    execInBundleDir(
      `heroku config:set --app ${appName} ${objToEnvStr(customEnv)}`
    )
  }
}

const getAppName = () => fs.readFileSync('.heroku_app_name').toString()

function newDeploy (args) {
  const customEnv = getCustomEnv(args)

  // Runner
  clearBuildFolder(meteorBuildDir)
  buildMeteorApp()
  unzipMeteorBundle()
  writeDockerFile()

  // do an update
  if (args['u']) {
    logger.info('Update...')
    const appName = getAppName()
    herokuLogin()
    pushContainer(appName)
    setEnvVars(appName, customEnv)
    releaseApp(appName)
    logger.success(`App should be updated at: https://${appName}.herokuapp.com.`)
  } else {
    // do new deploy

    logger.info('Creating heroku container...')
    const appName = herokuCreate()
    writeAppName(appName)
    herokuLogin()
    const finalEnvVars = getFinalEnvVars(appName, customEnv)
    herokuSetAppEnvVars(appName, finalEnvVars)
    pushContainer(appName)

    const stdout = releaseApp(appName)
    console.log(stdout.toString())

    logger.success(`App should be available at: https://${appName}.herokuapp.com.`)
  }
}

module.exports = newDeploy
