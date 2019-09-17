/* eslint-env jest */

const { objToEnvStr } = require('./helpers')

const obj = { ROOT_URL: 'https://example.com' }
it('objToEnvStr', () => {
  expect(objToEnvStr(obj)).toBe('ROOT_URL=https://example.com')
})
