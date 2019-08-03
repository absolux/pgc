
import net from 'net'
import tls from 'tls'
import { Stream } from './stream'


const REQUEST_SSL_MESSAGE = Buffer.from([
  0x00, 0x00, 0x00, 0x04, 0x04, 0xD2, 0x16, 0x2F
])


/**
 * Attempt to connect to PostgreSQL server
 * 
 * @param {Object} options 
 */
export function connect ({ keepAlive = false, secure = false, ...options }) {
  let stream = new Stream(options)

  function emitError (object) {
    stream.emit('error', object)
    stream.terminate()
  }

  let socket = net.connect(options, () => {
    if (keepAlive) socket.setKeepAlive(true)

    // use plain connection
    if (! secure) return stream.use(socket)

    // send SSL request
    stream.write(REQUEST_SSL_MESSAGE)

    socket.once('data', (buffer) => {
      let response = buffer.toString()

      if (response === 'N') {
        let msg = `The server does not support SSL connections`

        return emitError(new Error(msg))
      }

      if (response !== 'S') {
        let msg = `There was an error establishing a SSL connection`

        return emitError(new Error(msg))
      }

      // continue with a secure connection
      socket = tls.connect({ socket, ...options }, () => stream.use(socket))

      socket.on('error', emitError)
    })
  })

  socket.on('error', emitError)

  return stream
}
