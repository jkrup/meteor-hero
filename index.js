#!/usr/bin/env node

const { explain, args } = require('./helpers')
const { help, newDeploy } = require('./commands')

if (args['h']) {
  help()
} else {
  try {
    // if (args['u']) {
    // update()
    // } else {
    newDeploy(args)
    // }
  } catch (err) {
    explain(err.stack)
  }
}
