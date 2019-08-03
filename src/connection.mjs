
import { query } from './_protocol'
import { Statement } from './statement'
import { AsyncEmitter } from './_util/async-emitter'


const STATE_CONNECTING  = 1
const STATE_IDLE        = 3
const STATE_BUSY        = 6
const STATE_CLOSED      = 0


export class Connection extends AsyncEmitter {
  constructor (stream) {
    super()
    this._state = STATE_CONNECTING
    this._watch(this._stream = stream)
  }

  /**
   * Terminate the connection.
   * 
   * @public
   */
  close () {
    if (this._state === STATE_CLOSED) return

    this._state = STATE_CLOSED
    this._stream.terminate()
    this.emit('close', this)
  }

  /**
   * Execute the query command(s).
   * 
   * @param {String} command 
   * @param {(null | string | Buffer)[]} [params] 
   * @returns {Statement}
   * @public
   */
  execute (command, params) {
    if (this._state !== STATE_IDLE) {
      throw new Error('The connection is not yet ready for queries.')
    }

    this._state = STATE_BUSY // lock

    query(this._stream, command, params)

    return new Statement(this._stream)
  }

  /**
   * Start listening to secket events
   * 
   * @private
   */
  _watch (stream) {
    stream.on('PG:ReadyForQuery', () => {
      this._state = STATE_IDLE // unlock
      this.emit('ready', this)
    })

    stream.on('end', () => {
      if (this._state !== STATE_CLOSED) {
        let msg = 'Connection terminated unexpectedly.'

        this.emit('error', new Error(msg))
        this._state = STATE_CLOSED
        this.emit('close', this)
      }
    })

    stream.on('error', (err) => this.emit('error', err))

    stream.once('connect', () => this.emit('connect'))
  }
}

function _isEmpty (params) {
  return params && params.length === 0
}
