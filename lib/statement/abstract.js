
'use strict'

const { AsyncEmitter } = require('../utils/async-emitter')


class AbstractStatement extends AsyncEmitter {
  /**
   * Initialize a statement instance
   * 
   * @param {Object} connection 
   * @constructor
   * @public
   */
  constructor (connection) {
    super()

    this._connection = connection
  }
}

// export
module.exports = {
  AbstractStatement
}
