const fs = require('fs')

const events = require('./../build/contracts/Events')

const networkId = Object.keys(events.networks)[0]
const address = events.networks[networkId].address
const abi = JSON.stringify(events.abi)

const appFilePath = 'ui/app.js'
let ui = fs.readFileSync(appFilePath).toString()
const configuredApp = ui.replace('__ADDRESS__', address).replace('__ABI__', abi)
fs.writeFileSync(appFilePath, configuredApp);