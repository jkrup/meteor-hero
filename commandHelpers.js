const { execSync } = require('child_process')

function herokuCreate () {
  const stdout = execSync('heroku create')
  const appName = stdout
    .toString()
    .split('|')[0]
    .split('.')[0]
    .split('://')[1] // TODO: SAFER

  return appName
}

module.exports = {
  herokuCreate
}
