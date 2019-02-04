
'use strict'

// let { Socket, connect } = require('net')

// let socket = new Socket()
// let socket = connect(80)

// socket.on('connect', () => console.log('connect'))
// socket.on('finish', () => console.log('finish'))
// socket.on('close', () => console.log('close'))
// socket.on('error', () => console.log('error'))
// socket.on('end', () => console.log('end'))

// // socket.connect(80)

// setTimeout(() => {
//   socket.end()
//   // socket.destroy()
// }, 300)

// -----------------------------------------------------------------------------

// console.log(Buffer.from('CX').toString('utf-8'))

// -----------------------------------------------------------------------------

let { Client } = require('pg')

async function connect () {
  let client = new Client({
    database: 'postgres',
    host: 'localhost',
    user: 'postgres',
    port: 5432,
  })

  // client.connection.on('message', console.log)

  try {
    await client.connect()
    // console.log('ok')

    console.log(await client.query(`
      SELECT typname
        FROM pg_type
       LIMIT $1
    `, ['5']))
  }
  catch (err) {
    console.log(err)
  }
}

connect()

// -----------------------------------------------------------------------------

// let { Client } = require('./lib')

// let client = new Client({
//   user: 'postgres',
//   database: 'postgres',
//   client_encoding: 'utf8',
// })

// let connection = client.connect({
//   host: 'localhost',
//   port: 5432,
// })

// connection.on('close', () => console.log('closed'))
// // connection.on('message', console.log)
// connection.on('error', console.error)
// connection.once('ready', function onReady () {
//   console.log('ok')

//   let stmt = connection.execute('SELECT typname from pg_type limit 5;')

//   stmt.on('error', console.error)
//   // stmt.on('fields', console.log)
//   stmt.on('row', (row) => console.log(row[0].toString()))
//   stmt.on('end', console.log)
// })

// // connection.once('ready', () => {
// //   let stmt = connection.prepare('SELECT * FROM pg_type LIMIT $1')

// //   stmt.on('error', console.error)
// //   stmt.on('fields', console.log)
// //   stmt.on('row', console.log)
// //   stmt.on('end', console.log)

// //   stmt.execute(['5'])
// // })

// setTimeout(() => {
//   // console.log('closing')
//   connection.close()
// }, 2500)

// -----------------------------------------------------------------------------

// const Writer = require('buffer-writer')
// const buf = Buffer.alloc(6)

// buf.writeInt32BE(1)
// buf.writeUInt16BE(2, 4)
// buf[6] = 0

// console.log(new Writer().addInt32(1).addInt16(2).addString('').flush())
// console.log(buf)

// console.log('D', Buffer.from('D'))
