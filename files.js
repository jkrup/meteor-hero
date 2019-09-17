const del = require('del')

const deletePath = path => del(path, { force: true })
const meteorBuildDir = `${os.homedir()}/.meteor-hero/builds`

const clearBuildFolder = () => {
  console.log('clearing build folder')
  return deletePath(meteorNowBuildPath)
}

module.exports = clearBuildFolder
