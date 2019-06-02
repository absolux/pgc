
[WIP] A low level PostgreSQL client.

## Client

```js
let options = {
  user: 'username'
  database: 'dbname'
  password: 'topsecret'
}

let client = new Client(options)
```

## Connection

```js
let options = {
  host: 'localhost',
  port: 5432
}

let connection = client.connect(options)

connection.on('error', console.error)

connection.on('connect', () => {
  console.log('connected')

  connection.close()
})

connection.on('close', () => console.log('closed'))
```

## Simple Statement

```js
connection.on('ready', () => {
  let statement = connection.execute('SELECT 1 AS one')

  statement.on('error', console.error)
  statement.on('row', (row) => console.log(row))
  statement.on('fields', (fields) => console.log(fields))
  statement.on('complete', ({ rowCount }) => console.log(rowCount))
})
```

## Parametrized Statement

```js
connection.on('ready', () => {
  let statement = connection.execute('SELECT $1 one, $2 two', [ 1, 2 ])

  statement.on('error', console.error)
  statement.on('row', (row) => console.log(row))
  statement.on('fields', (fields) => console.log(fields))
  statement.on('complete', ({ rowCount }) => console.log(rowCount))
})
```

During the statement execution, the connection is locked, and will reject new statements be executed, until it's ready.
