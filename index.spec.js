/* eslint-env jest */

const help = jest.fn()
const newDeploy = jest.fn()

jest.doMock('./commands', () => ({
  help,
  newDeploy
}))

it('help', () => {
  jest.doMock('./helpers', () => ({
    args: { h: true }
  }))

  require('./index')

  expect(help).toHaveBeenCalled()
})

it('main', async () => {
  jest.resetModules()
  jest.doMock('./helpers', () => ({
    args: {}
  }))

  require('./index')

  expect(newDeploy).toHaveBeenCalled()
})
