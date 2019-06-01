
'use strict'

const { EventEmitter } = require("events")
const { setImmediate } = require("timers")

const { isArray } = Array


class AsyncEmitter extends EventEmitter {
	/**
	 * Asynchonously invoke the listeners
	 *
	 * @param {string | symbol} event The event name
	 * @param {any[]} args The event argumnets
	 * @public
	 */
	emit (event, ...args) {
		let listeners = this._rawListerners(event)

		if (listeners.length === 0) {
			if (event !== 'error') return false

			throw (args[0] || new Error('Unhandled error.'))
		}

		listeners.forEach((fn) => setImmediate(fn, ...args))

		return true
  }

  /**
   * Remove the event listener
   * 
   * @param {String} event 
   * @param {Function} listener 
   * @public
   */
  off (event, listener) {
    return this.removeListener(event, listener)
  }

	/**
	 * 
	 * @param {string} event 
	 * @returns {Function[]}
	 * @private
	 */
	_rawListerners (event) {
    let fns = this._events && this._events[event]

    if (fns) return isArray(fns) ? fns : [fns]

		return []
	}
}

// export
module.exports = {
	AsyncEmitter
}
