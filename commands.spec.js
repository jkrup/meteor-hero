/* eslint-env jest */

it('help', () => {
  const mockLog = jest.spyOn(console, 'log').mockImplementation(() => {})
  const { help } = require('./commands')
  help()
  expect(mockLog).toHaveBeenCalled()
})

it('newDeploy', () => {
  jest.resetModules() // this is important - it clears the cache
  jest.doMock('os', () => ({
    homedir: () => '$HOME'
  }))

  const execSync = jest.fn((cmd, opt) => {
    if (cmd.match(/heroku config:get MONGODB_URI/)) {
      return 'mongodb://user:pass@mongo.com/db'
    }
    if (cmd.match(/heroku container:release/)) {
      return 'been released'
    }
    if (cmd.match(/heroku create/)) {
      return 'https://tomato-sauce-54.herokuapps.com'
    }
    return 'stdout'
  })
  jest.doMock('child_process', () => ({
    execSync
  }))

  const writeFileSync = jest.fn()
  jest.doMock('fs', () => ({
    readFileSync: (path) => {
      if (path === '.meteor/release') {
        return 'METEOR@1.5.0\r\n'
      }
    },
    writeFileSync
  }))

  const tarXMock = jest.fn()
  jest.doMock('tar', () => ({
    x: tarXMock
  }))

  const clearBuildFolder = jest.fn()
  jest.doMock('./helpers', () => ({
    clearBuildFolder,
    meteorBuildDir: '$HOME/.meteor-hero/builds',
    explain: e => console.log(e),
    logger: {
      info: () => {},
      error: (e) => console.log(e),
      success: () => {}
    },
    objToEnvStr: () => 'E=t'
  }))

  const spy = jest.spyOn(process, 'cwd')
  spy.mockReturnValue('cwd')

  const dockerFile = require('./dockerfile')

  const herokuCreate = jest.fn(() => '$APPNAME')
  jest.doMock('./commandHelpers', () => ({
    herokuCreate
  }))
  const { newDeploy } = require('./commands')
  newDeploy({})

  expect(clearBuildFolder).toHaveBeenCalledWith('$HOME/.meteor-hero/builds')
  // buildMeteorApp
  expect(execSync).toHaveBeenCalledWith('meteor build $HOME/.meteor-hero/builds --server-only --architecture=os.linux.x86_64')

  // unzipMeteorBundle
  expect(tarXMock)
    .toHaveBeenCalledWith({
      file: '$HOME/.meteor-hero/builds/cwd.tar.gz',
      cwd: '$HOME/.meteor-hero/builds',
      sync: true
    })

  // writeDockerFile
  expect(writeFileSync).toHaveBeenCalledWith('$HOME/.meteor-hero/builds/bundle/Dockerfile', dockerFile)

  // herokuCreate
  expect(herokuCreate).toHaveBeenCalled()

  // writeAppName
  expect(writeFileSync).toHaveBeenCalledWith('.heroku_app_name', '$APPNAME')

  // herokuLogin
  expect(execSync).toHaveBeenCalledWith('heroku container:login')
  // getFinalEnvVars (also looks for MONGO_URL)
  expect(execSync).toHaveBeenCalledWith('heroku addons:create mongolab --app $APPNAME')

  const execOpts = { cwd: '$HOME/.meteor-hero/builds/bundle' }
  expect(execSync).toHaveBeenCalledWith(`heroku config:set --app $APPNAME E=t`, execOpts)
  expect(execSync).toHaveBeenCalledWith('heroku container:push web -a $APPNAME', execOpts)
  expect(execSync).toHaveBeenCalledWith('heroku container:release web -a $APPNAME', execOpts)
})

it('update', () => {
  jest.resetModules() // this is important - it clears the cache
  jest.doMock('os', () => ({
    homedir: () => '$HOME'
  }))

  const execSync = jest.fn((cmd, opt) => {
    if (cmd.match(/heroku config:get MONGODB_URI/)) {
      return 'mongodb://user:pass@mongo.com/db'
    }
    if (cmd.match(/heroku container:release/)) {
      return 'been released'
    }
    if (cmd.match(/heroku create/)) {
      return 'https://tomato-sauce-54.herokuapps.com'
    }
    return 'stdout'
  })
  jest.doMock('child_process', () => ({
    execSync
  }))

  const writeFileSync = jest.fn()
  jest.doMock('fs', () => ({
    readFileSync: (path) => {
      if (path === '.meteor/release') {
        return 'METEOR@1.5.0\r\n'
      }
      if (path === '.heroku_app_name') {
        return 'UPDATE_APP_NAME'
      }
    },
    writeFileSync
  }))

  const tarXMock = jest.fn()
  jest.doMock('tar', () => ({
    x: tarXMock
  }))

  const clearBuildFolder = jest.fn()
  jest.doMock('./helpers', () => ({
    clearBuildFolder,
    meteorBuildDir: '$HOME/.meteor-hero/builds',
    explain: e => console.log(e),
    logger: {
      info: () => {},
      error: (e) => console.log(e),
      success: () => {}
    },
    objToEnvStr: () => 'nv=smthn'
  }))

  const spy = jest.spyOn(process, 'cwd')
  spy.mockReturnValue('cwd')

  const dockerFile = require('./dockerfile')

  const herokuCreate = jest.fn(() => '$APPNAME')
  jest.doMock('./commandHelpers', () => ({
    herokuCreate
  }))
  const { newDeploy } = require('./commands')
  newDeploy({ 'u': true, 'e': ['nv=smthn'] })

  expect(clearBuildFolder).toHaveBeenCalledWith('$HOME/.meteor-hero/builds')
  // buildMeteorApp
  expect(execSync).toHaveBeenCalledWith('meteor build $HOME/.meteor-hero/builds --server-only --architecture=os.linux.x86_64')

  // unzipMeteorBundle
  expect(tarXMock)
    .toHaveBeenCalledWith({
      file: '$HOME/.meteor-hero/builds/cwd.tar.gz',
      cwd: '$HOME/.meteor-hero/builds',
      sync: true
    })

  // writeDockerFile
  expect(writeFileSync).toHaveBeenCalledWith('$HOME/.meteor-hero/builds/bundle/Dockerfile', dockerFile)

  // herokuLogin
  expect(execSync).toHaveBeenCalledWith('heroku container:login')

  const execOpts = { cwd: '$HOME/.meteor-hero/builds/bundle' }
  expect(execSync).toHaveBeenCalledWith('heroku config:set --app UPDATE_APP_NAME nv=smthn', execOpts)
  expect(execSync).toHaveBeenCalledWith('heroku container:push web -a UPDATE_APP_NAME', execOpts)
  expect(execSync).toHaveBeenCalledWith('heroku container:release web -a UPDATE_APP_NAME', execOpts)
})
