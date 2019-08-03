
import { MessageWriter } from './message-writer'


const SYNC_MESSAGE = Buffer.from([
  0x53, 0x00, 0x00, 0x00, 0x04
])

/**
 * Execute the query command.
 * 
 * @param {Object} stream 
 * @param {String} command 
 * @param {Array} [params] 
 */
export function query (stream, command, params = []) {
  let writer = new MessageWriter()

  function sync () {
    stream.write(SYNC_MESSAGE)
  }

  if (params.length === 0) {
    // simple query
    writer.writeQueryMessage(command)
  }
  else {
    // extended query
    writer.writeParseMessage(command)
    writer.writeBindMessage(params)
    writer.writeDescribeMessage('P')
    writer.writeExecuteMessage()
    writer.writeFlushMessage()

    // watch
    stream.on('PG:Error', sync)
    stream.on('PG:EmptyQuery', sync)
    stream.on('PG:CommandComplete', sync)

    stream.once('PG:ReadyForQuery', () => {
      stream.off('PG:Error', sync)
      stream.off('PG:EmptyQuery', sync)
      stream.off('PG:CommandComplete', sync)
    })
  }

  stream.write(writer.flush())
}
