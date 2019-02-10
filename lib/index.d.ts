
import { Duplex } from 'stream'
import { EventEmitter } from 'events'

export function createClient (options: ClientOptions): Client

/**
 * @see https://www.postgresql.org/docs/9.6/runtime-config-client.html
 */
export interface ClientOptions {
  user: string
  database?: string
  TimeZone?: string
  DateStyle?: string
  IntervalStyle?: string
  client_encoding?: string
  application_name?: string
  statement_timeout?: number
  integer_datetimes?: boolean
  standard_conforming_strings?: boolean

  [key: string]: any
}

export interface Client {
  connect (options: ConnectionOptions): Connection
}

export interface ConnectionOptions {
  port: number
  host: string
  keepAlive?: boolean
  // ssl?: any
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

  execute (query: string, params?: Param[]): Statement
  close (): void
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

  once (event = 'warning', fn: (msg: ErrorResponse) => any): this
  on (event = 'warning', fn: (msg: ErrorResponse) => any): this
  emit (event: 'warning', msg: ErrorResponse): boolean

  once (event: 'fields', fn: (fields: Field[]) => any): this
  on (event: 'fields', fn: (fields: Field[]) => any): this
  emit (event: 'fields', fields: Field[]): boolean

  once (event = 'complete', fn: (obj: Info) => any): this
  on (event = 'complete', fn: (obj: Info) => any): this
  emit (event: 'complete', obj: Info): boolean

  once (event = 'row', fn: (row: Value[]) => any): this
  on (event = 'row', fn: (row: Value[]) => any): this
  emit (event: 'row', row: Value[]): boolean

  once (event = 'end'): this
  on (event = 'end'): this
  emit (event: 'end'): boolean
}

export interface StatementError extends Error {
  previous?: Error | ErrorResponse
}

export type Param = null | string | Buffer

export type Value = null | Buffer

export interface Field {
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
