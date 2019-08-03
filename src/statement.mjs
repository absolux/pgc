
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

  _watch (stream) {
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

    stream.on('PG:Error', onError)
    stream.on('PG:DataRow', onRow)
    stream.on('PG:Notice', onNotice)
    stream.on('end', onConnectionEnd)
    stream.on('error', onConnectionError)
    stream.on('PG:EmptyQuery', onEmptyQuery)
    stream.on('PG:RowDescription', onFields)
    stream.on('PG:CommandComplete', onComplete)

    stream.once('PG:ReadyForQuery', () => {
      stream.off('PG:CommandComplete', onComplete)
      stream.off('PG:RowDescription', onFields)
      stream.off('PG:EmptyQuery', onEmptyQuery)
      stream.off('error', onConnectionError)
      stream.off('end', onConnectionEnd)
      stream.off('PG:Notice', onNotice)
      stream.off('PG:DataRow', onRow)
      stream.off('PG:Error', onError)

      // finish
      this.emit('end')
      this.removeAllListeners()
    }) 
  }
}
