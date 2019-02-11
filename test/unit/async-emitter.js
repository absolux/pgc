
const assert = require('assert')
const { AsyncEmitter } = require('../../lib/util/async-emitter')

describe('Test the async emitter', () => {
  it('should emit invoke listeners in correct order', () => {
    let i = 1
    let ee = new AsyncEmitter()

    ee.on('foo', () => i++)
    ee.on('foo', () => i++)
    ee.on('foo', () => assert.equal(i, 3))

    ee.emit('foo')
  })
})
