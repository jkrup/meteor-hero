/* eslint-env jest */

it('herokuCreate', () => {
  jest.resetModules()
  jest.resetAllMocks()
  const execSync = jest.fn(() => {
    return 'https://tomato-sauce-54.herokuapps.com'
  })

  jest.doMock('child_process', () => ({
    execSync
  }))
  const { herokuCreate } = require('./commandHelpers')
  const appName = herokuCreate()
  // expect(execSync).toHaveBeenCalledWith('heroku create')
  expect(appName).toBe('tomato-sauce-54')
})
