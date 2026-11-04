const assert = require('assert')
const fs = require('fs')
const path = require('path')
const vm = require('vm')

const source = fs.readFileSync(path.join(__dirname, '../../src/public/js/singleton/settingsSingleton.js'), 'utf8')

function loadService (window, get) {
  const context = {
    window,
    module: { exports: {} },
    console: { error: () => {} },
    require: name => name === 'lodash' ? { isUndefined: value => value === undefined } : { default: { get } }
  }
  vm.runInNewContext(source, context)
  return context.module.exports
}

function flush () {
  return new Promise(resolve => setImmediate(resolve))
}

describe('Settings startup initialization', function () {
  const response = { data: { settings: { data: { settings: { timezone: 'Australia/Sydney' } } } } }

  it('completes repeated initialization without fetching settings again', async function () {
    let requests = 0
    let callbacks = 0
    const service = loadService({}, () => {
      requests++
      return Promise.resolve(response)
    })
    service.init(err => { assert.ifError(err); callbacks++ })
    await flush()
    service.init(err => { assert.ifError(err); callbacks++ })
    await flush()
    assert.strictEqual(callbacks, 2)
    assert.strictEqual(requests, 1)
    assert.strictEqual(service.getLoaded(), true)
  })

  it('reuses the settings singleton when another bundle loads it', async function () {
    const window = {}
    const first = loadService(window, () => Promise.resolve(response))
    first.init()
    await flush()
    const second = loadService(window, () => { throw new Error('Unexpected duplicate request') })
    assert.strictEqual(second, first)
    let completed = false
    second.init(() => { completed = true })
    assert.strictEqual(completed, true)
    assert.strictEqual(second.getSettings().timezone, 'Australia/Sydney')
  })

  it('passes a request failure to startup and allows a subsequent retry', async function () {
    const failure = new Error('Settings unavailable')
    let requests = 0
    const service = loadService({}, () => ++requests === 1 ? Promise.reject(failure) : Promise.resolve(response))
    let received
    service.init(err => { received = err })
    await flush()
    assert.strictEqual(received, failure)
    assert.strictEqual(service.getLoaded(), false)
    let completed = false
    service.init(err => { assert.ifError(err); completed = true })
    await flush()
    assert.strictEqual(completed, true)
    assert.strictEqual(service.getLoaded(), true)
  })

  it('completes initialization after settings were refreshed first', async function () {
    const service = loadService({}, () => Promise.resolve(response))
    service.refresh()
    await flush()
    let completed = false
    service.init(() => { completed = true })
    assert.strictEqual(completed, true)
    assert.strictEqual(service.getLoaded(), true)
  })
})
