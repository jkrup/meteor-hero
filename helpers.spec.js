/* eslint-env jest */

const delMock = jest.fn()
jest.doMock('del', () => delMock)
jest.doMock('os', () => ({ homedir: () => '$HOMEDIR' }))

process.argv = [ 'node', 'meteor-hero', '-e', 'something', '-e', 'anotherarg' ]

const mockLog = jest.spyOn(console, 'log').mockImplementation(() => {})
const {
  args,
  logger,
  objToEnvStr,
  meteorBuildDir,
  clearBuildFolder
} = require('./helpers')

it('args', () => {
  expect(args).toMatchObject({ e: ['something', 'anotherarg'] })
})

it('clearBuildFolder', () => {
  clearBuildFolder('somepath')
  expect(delMock).toHaveBeenCalledWith('somepath', { force: true })
})

it('explain', () => {
  const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {})
  const mockLog = jest.spyOn(console, 'log').mockImplementation(() => {})
  const { explain } = require('./helpers')
  explain()
  expect(mockLog).toHaveBeenCalled()
  expect(mockExit).toHaveBeenCalledWith(1)
})

it('logger', () => {
  const mockLog = jest.spyOn(console, 'log').mockImplementation(() => {})
  logger.success('Worked!')
  expect(mockLog).toHaveBeenCalled()
})

it('objToEnvStr', () => {
  const obj = { ROOT_URL: 'https://example.com' }
  expect(objToEnvStr(obj)).toBe('ROOT_URL=https://example.com')
})

describe('meteorBuildDir', () => {
  it('defaults to $HOMEDIR', () => {
    expect(meteorBuildDir).toBe('$HOMEDIR/.meteor-hero/builds')
  })
  it('accepts -b param', () => {
    jest.resetModules() // this is important - it clears the cache

    process.argv = [
      'node',
      'meteor-hero',
      '-b',
      '/something/custom'
    ]
    const { meteorBuildDir } = require('./helpers')

    expect(meteorBuildDir).toBe('/something/custom')
  })
})

