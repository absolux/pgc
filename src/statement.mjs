
import { toError } from './_util/helpers'
import { AsyncEmitter } from './_util/async-emitter'


export class Statement extends AsyncEmitter {
  constructor (stream) {
    super()
    this._watch(this._stream = stream)
  }

  cancel () {
    this._stream.cancel()
  }

  _watch (protocol) {
    const onComplete = ({ command, rowCount }) => {
      this.emit('complete', { command, rowCount })
    }

    const onError = (response) => {
      this.emit('error', toError(response))
    }

    const onEmptyQuery = () => {
      this.emit('error', new StatementError('The query was empty !'))
    }

    const onNotice = (msg) => this.emit('notice', msg)
    const onRow = ({ values }) => this.emit('row', values)
    const onFields = ({ fields }) => this.emit('fields', fields)
    const onConnectionError = (error) => this.emit('error', error)
    const onConnectionEnd = () => {
      let msg = 'Connection terminated unexpectedly.'

      this.emit('error', new Error(msg))
    }

    protocol.on('PG:Error', onError)
    protocol.on('PG:DataRow', onRow)
    protocol.on('PG:Notice', onNotice)
    protocol.on('end', onConnectionEnd)
    protocol.on('error', onConnectionError)
    protocol.on('PG:EmptyQuery', onEmptyQuery)
    protocol.on('PG:RowDescription', onFields)
    protocol.on('PG:CommandComplete', onComplete)

    protocol.once('PG:ReadyForQuery', () => {
      protocol.off('PG:CommandComplete', onComplete)
      protocol.off('PG:RowDescription', onFields)
      protocol.off('PG:EmptyQuery', onEmptyQuery)
      protocol.off('error', onConnectionError)
      protocol.off('end', onConnectionEnd)
      protocol.off('PG:Notice', onNotice)
      protocol.off('PG:DataRow', onRow)
      protocol.off('PG:Error', onError)

      // finish
      this.emit('end')
      this.removeAllListeners()
    }) 
  }
}
