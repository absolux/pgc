
import { Duplex } from 'stream'
import { EventEmitter } from 'events'

export interface Client {
  constructor (options: ClientOptions): Client

  connect (options: ConnectionOptions): Connection
}

export interface ClientOptions {
  user: string
  database?: string
  client_encoding?: string
}

export interface ConnectionOptions {
  port: number
  host: string
  keepAlive?: boolean
}

export interface Connection extends EventEmitter {
  once (event: 'error', fn: (error: ConnectionError) => any): this
  on (event: 'error', fn: (error: ConnectionError) => any): this
  emit (event: 'error', error: ConnectionError): boolean

  once (event: 'close', fn: (hadError: boolean) => any): this
  on (event: 'close', fn: (hadError: boolean) => any): this
  emit (event: 'close', hadError: boolean): boolean

  emit (event: 'ready'): boolean
  once (event: 'ready'): this
  on (event:  'ready'): this

  emit (event: 'connect'): boolean
  once (event: 'connect'): this
  on (event:  'connect'): this

  prepare (query: string, options?: PrepareOptions): ExtendedStatement
  execute (query: string): SimpleStatement
  close (): void
}

export interface PrepareOptions {
  portal?: string
  name: string
}

export interface ConnectionError extends Error {
  previous?: Error | ErrorResponse
}

export interface ErrorResponse {
  internalPosition?: string
  internalQuery?: string
  constraint?: string
  severity?: string
  position?: string
  dataType?: string
  routine?: string
  detail?: string
  schema?: string
  column?: string
  where?: string
  table?: string
  file?: string
  line?: string
  code?: string
  hint?: string
  message: string
}

export interface Statement extends EventEmitter {
  once (event: 'error', fn: (error: ConnectionError | StatementError) => any): this
  on (event: 'error', fn: (error: ConnectionError | StatementError) => any): this
  emit (event: 'error', error: ConnectionError | StatementError): boolean

  once (event: 'fields', fn: (fields: Field[]) => any): this
  on (event: 'fields', fn: (fields: Field[]) => any): this
  emit (event: 'fields', fields: Field[]): boolean

  once (event = 'row', fn: (row: Value[]) => any): this
  on (event = 'row', fn: (row: Value[]) => any): this
  emit (event: 'row', row: Value[]): boolean

  once (event = 'end', fn: (obj: Info) => any): this
  on (event = 'end', fn: (obj: Info) => any): this
  emit (event: 'end', obj: Info): boolean
}

export interface SimpleStatement extends Statement {
  // execute (query: string): this
}

export interface ExtendedStatement extends Statement {
  execute (values: Value[]): this
  destroy (): void
}

export interface StatementError extends Error {
  previous?: Error | ErrorResponse
}

export type Param = null | string | Buffer

export type Value = null | Buffer

export interface Field {
  // format: 'text' | 'binary'
  isBinary?: boolean
  modifier: number
  columnID: number
  tableID: number
  length: number
  name: string
  oid: number
}

export interface Info {
  rowCount: number
  command: string
}
