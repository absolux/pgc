
const assert = require('assert')
const { AsyncEmitter } = require('../../lib/utils/async-emitter')

// describe('Test the async emitter', () => {
//   it('should emit invoke listeners in correct order', () => {
    let i = 1
    let ee = new AsyncEmitter()

    ee.on('foo', () => console.log(i++))
    ee.on('foo', () => console.log(i++))
    ee.on('foo', () => console.log(i++))

    ee.emit('foo')
//   })
// })
