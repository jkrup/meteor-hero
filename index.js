#!/usr/bin/env node
const chalk = require('chalk')
const dotenv = require('dotenv')
const fs = require('fs')
const os = require('os')
const tar = require('tar')
const { execSync } = require('child_process')
const { logger, getArgs, objToEnvStr, clearBuildFolder } = require('./helpers')

const encoding = 'utf8'

const args = getArgs()
const defaultMeteorBuildDir = `${os.homedir()}/.meteor-hero/builds`
const meteorBuildDir = args['b'] || defaultMeteorBuildDir
const readFile = path => fs.readFileSync(path, encoding)
const getVersion = () =>
  readFile('.meteor/release').match(/METEOR@(.*)\r?\n/)[1]
const getMicroVersion = () => parseInt(getVersion().split('.')[1], 10)
const shouldBeServerOnly = () => getMicroVersion() >= 3 // TODO: if 2.0.0 ever comes out this could break
const cwd = `${meteorBuildDir}/bundle`
const execInBundleDir = cmd => execSync(cmd, { cwd })
const dockerFile = `
FROM node:8.15.1

COPY programs/server/package.json /usr/src/app/programs/server/package.json
WORKDIR /usr/src/app/programs/server
RUN npm install

WORKDIR ../..
COPY . .

CMD ["node", "main.js"]
`
const writeDockerFile = () =>
  fs.writeFileSync(`${meteorBuildDir}/bundle/Dockerfile`, dockerFile)

// Get tar {
const isWin = /^win/.test(process.platform)

const getFolderName = (path, isWinOverride = isWin) => {
  const pathDelimiter = isWinOverride ? '\\' : '/'
  const pathParts = path.split(pathDelimiter)
  return pathParts[pathParts.length - 1]
}

const projectName = (() => getFolderName(process.cwd()))()
const tarFileName = `${projectName}.tar.gz`
// }

async function herokuCreate () {
  const stdout = execSync('heroku create')
  const appName = stdout
    .toString()
    .split('|')[0]
    .split('.')[0]
    .split('://')[1] // TODO: SAFER

  return appName
}

async function getMongoUrl (appName) {
  const stdout = execSync(`heroku config:get MONGODB_URI --app ${appName}`)
  return stdout.toString()
}

async function buildMeteorApp () {
  try {
    logger.info('Building meteor app (this can take several minutes)')
    const serverOnly = await shouldBeServerOnly()
    execSync(
      `meteor build ${meteorBuildDir} ${
        serverOnly ? '--server-only' : ''
      } --architecture=os.linux.x86_64`
    )
    logger.succeed()
  } catch (e) {
    // eslint-disable-next-line
    logger.error(e)
  }
}

async function main () {
  const envArgsEnv = {}

  // envfile
  const envFileEnv = args['E']
    ? fs.existsSync(args['E'])
      ? dotenv.parse(fs.readFileSync(args['E']).toString())
      : explain(
        '-E must be set to a env file that exists and consists of ENV=value lines only'
      )
    : {}

  const customEnv = {
    ...envFileEnv,
    ...envArgsEnv
  }

  await clearBuildFolder(meteorBuildDir) // TODO: clear bundlePath
  logger.info('Building meteor app...')
  await buildMeteorApp()

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

  logger.info('Writing Dockerfile...')
  await writeDockerFile()

  let appName
  if (args['u']) {
    logger.info('Update...')
    appName = fs.readFileSync('.heroku_app_name', appName).toString()
    execSync(`heroku container:login`)

    execInBundleDir(`heroku container:push web -a ${appName}`)
    if (Object.keys(customEnv).length > 0) {
      execInBundleDir(
        `heroku config:set --app ${appName} ${objToEnvStr(customEnv)}`
      )
    }
    execInBundleDir(`heroku container:release web -a ${appName}`)
    logger.info(chalk.green(`App should be updated at: https://${appName}.herokuapp.com.`))
    process.exit(0)
  }
  logger.info('Creating heroku container...')
  appName = await herokuCreate()
  fs.writeFileSync('.heroku_app_name', appName)

  execSync(`heroku container:login`)

  const defaultEnv = {
    ROOT_URL: `https://${appName}.herokuapp.com`
  }
  if (!customEnv['MONGO_URL']) {
    logger.info('No MONGO_URL set so creating one on Heroku...')
    execSync(`heroku addons:create mongolab --app ${appName}`)
    const mongoUrl = await getMongoUrl(appName)
    defaultEnv['MONGO_URL'] = mongoUrl
  }

  const finalEnvVars = {
    ...defaultEnv,
    ...customEnv
  }

  execInBundleDir(
    `heroku config:set --app ${appName} ${objToEnvStr(finalEnvVars)}`
  )
  execInBundleDir(`heroku container:push web -a ${appName}`)

  logger.info('Releasing app...')
  const stdout = execInBundleDir(`heroku container:release web -a ${appName}`)
  console.log(stdout.toString())

  logger.info(chalk.green(`App should be available at: https://${appName}.herokuapp.com.`))
}

const { yellow, cyan, bold, underline, grey } = chalk

function help () {
  console.log(`
    ${bold(`meteor-hero`)} [options] <command>

  ${grey(`Description:`)}
    This program is designed to be run inside of a MeteorJS project and will do the following:
      1) Build the meteor application to BUILD_DIR ${grey(
    `(Default: ${meteorBuildDir})`
  )}
      2) Unzip the contents of the built meteor application
      3) Write a Dockerfile in the BUILD_DIR
      4) Create a new heroku instance with a MongoDB addon and set the appropriate env variables
      5) Release the heroku container and print the URL where it is accessible

    ${bold(
    `Note:`
  )} if run outside of a meteor application, may crash due to ${bold(
  `meteor build`
)} failing

  ${grey(`Options:`)}
    -h                   Displays help message
    -b ${bold.underline(
    `DIR`
  )}               Overwrite BUILD_DIR (Default: ${meteorBuildDir})
    -e ${underline(
    `${bold(`VAR`)}=value`
  )}         Environment variables to set on the deployed heroku instance.
    -E ${bold.underline(
    `FILE`
  )}              Env file to be read for environment variables to be set.

  ${grey(`Commands:`)}
    []  By default deploys a MeteorJS application to heroku.
    -u  Update instead of creating a new url, update the previous deploy. The file .heroku_app_name must exist and contain the previous app name.

  ${grey(`Examples:`)}

  ${grey(`–`)} Deploy with environment variables

    ${cyan(
    `$ meteor-hero -e MONGO_URL="mongodb://user:pass@example.mongo.com" -e ROOT_URL="example.net"`
  )}

  ${grey(`–`)} Deploy using env file

    ${cyan(`$ meteor-hero -E prod.env`)}

`)
  // .slice(1, -1)
}

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

// what runs

if (args['h']) {
  help()
} else {
  main().catch(err => {
    explain(err.stack)
  })
}
