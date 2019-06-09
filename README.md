
[WIP] A low level PostgreSQL client that handles only the communication with the server.

## Client

```js
let database_options = {
  user: 'username'
  database: 'dbname'
  password: 'topsecret'
}

let client = new Client(database_options)
```

## Connection

```js
let connection_options = {
  host: 'localhost',
  port: 5432
}

let connection = client.connect(connection_options)

connection.on('error', console.error)

connection.on('connect', () => {
  console.log('connected')

  connection.close()
})

connection.on('close', () => console.log('closed'))
```

## Simple statement

During the statement execution, the connection is locked, and will reject any other execution until it's `ready`.

```js
connection.on('ready', () => {
  let statement = connection.execute('SELECT 1 one')

  statement.on('error', console.error) // triggered only when errors occur
  statement.on('fields', console.log) // prints: [{ name: 'one', ... }]
  statement.on('row', console.log) // prints: [Buffer]
  statement.on('complete', console.log) // prints: { rowCount: 1, command: 'SELECT' }
  statement.on('end', () => console.log('statement finished and connection unlocked'))
})
```

## Parametrized statement

```js
connection.on('ready', () => {
  let statement = connection.execute('SELECT $1 one, $2 two', [ 1, 2 ])

  statement.on('error', console.error)
  statement.on('fields', console.log) // prints: [{ name: 'one', ... }, { name: 'two', ... }]
  statement.on('row', console.log) // prints: [Buffer, Buffer]
  statement.on('complete', console.log) // prints: { rowCount: 1, command: 'SELECT' }
  statement.on('end', () => console.log('statement finished and connection unlocked'))
})
```

## Multiple statements

```js
connection.on('ready', () => {
  let statement = connection.execute('SELECT 1 one; SELECT 2 two;')

  statement.on('error', console.error)

  // first query
  statement.on('fields', console.log) // prints: [{ name: 'one', ... }]
  statement.on('row', console.log) // prints: [Buffer]
  statement.on('complete', console.log) // prints: { rowCount: 1, command: 'SELECT' }

  // second query
  statement.on('fields', console.log) // prints: [{ name: 'two', ... }]
  statement.on('row', console.log) // prints: [Buffer]
  statement.on('complete', console.log) // prints: { rowCount: 1, command: 'SELECT' }

  statement.on('end', () => console.log('statement finished and connection unlocked'))
})
```
