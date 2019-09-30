const { cyan, bold, underline, grey } = require('chalk')
const { meteorBuildDir } = require('../helpers')

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

module.exports = help
