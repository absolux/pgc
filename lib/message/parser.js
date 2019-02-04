
'use strict'

const { BufferReader } = require('../utils/buffer-reader')


/**
 * Parse the incoming packet to a message object.
 * 
 * @param {{ head: number, size: number, body: Buffer }} packet 
 * @returns {{ type: string, [key: string]: any }}
 * @public
 */
function parse ({ head, body }) {
  let _parseFn = MESSAGE_PARSERS[head]

  if (_parseFn) return _parseFn(body)
}

const MESSAGE_PARSERS = {
  [0x6e]: _parseNoData,
  [0x44]: _parseDataRow,
  [0x32]: _parseBindComplete,
  [0x31]: _parseParseComplete,
  [0x33]: _parseCloseComplete,
  [0x5a]: _parseReadyForQuery,
  [0x45]: _parseErrorResponse,
  [0x52]: _parseAuthentication,
  [0x4b]: _parseBackendKeyData,
  [0x4e]: _parseNoticeResponse,
  [0x54]: _parseRowDescription,
  [0x53]: _parseParameterStatus,
  [0x43]: _parseCommandComplete,
  [0x73]: _parsePortalSuspended,
  [0x49]: _parseEmptyQueryResponse,
}

const ERROR_FIELDS = {
  'p': 'internalPosition',
  'q': 'internalQuery',
  'n': 'constraint',
  'S': 'severity',
  'P': 'position',
  'd': 'dataType',
  'M': 'message',
  'R': 'routine',
  'D': 'detail',
  's': 'schema',
  'c': 'column',
  'W': 'where',
  't': 'table',
  'F': 'file',
  'L': 'line',
  'C': 'code',
  'H': 'hint',
}

function _parseNoData () {
  return { type: 'PG:NoData' }
}

function _parsePortalSuspended () {
  return { type: 'PG:PortalSuspended' }
}

function _parseParseComplete () {
  return { type: 'PG:ParseComplete' }
}

function _parseBindComplete () {
  return { type: 'PG:BindComplete' }
}

function _parseCloseComplete () {
  return { type: 'PG:CloseComplete' }
}

function _parseErrorResponse (buffer) {
  return _parseErrorOrNotice(buffer, 'PG:Error')
}

function _parseNoticeResponse (buffer) {
  return _parseErrorOrNotice(buffer, 'PG:Notice')
}

function _parseErrorOrNotice (buffer, type) {
  let reader = new BufferReader(buffer)
  let message = { type }
  let key

  while ((key = reader.readString(1)) !== '\0') {
    message[ERROR_FIELDS[key]] = reader.readCString()
  }

  return message
}

function _parseRowDescription (buffer) {
  let reader = new BufferReader(buffer)
  let fields = new Array(reader.readInt16())

  for (let i = 0; i < fields.length; i++) {
    fields[i] = {
      'name': reader.readCString(),
      'tableID': reader.readInt32(),
      'columnID': reader.readInt16(),
      'oid': reader.readInt32(),
      'length': reader.readInt16(),
      'modifier': reader.readInt32(),
      'isBinary': reader.readInt16() === 1,
      // 'format': reader.readInt16() === 0 ? 'text' : 'binary',
    }
  }

  return { type: 'PG:RowDescription', fields }
}

function _parseDataRow (buffer) {
  let reader = new BufferReader(buffer)
  let values = new Array(reader.readInt16())

  for (let i = 0; i < values.length; i++) {
    let length = reader.readInt32()
    
    values[i] = length === -1 ? null : reader.slice(length)
  }

  return { type: 'PG:DataRow', values }
}

function _parseParameterStatus (buffer) {
  let reader = new BufferReader(buffer)

  return {
    type: 'PG:ParameterStatus',
    parameterName: reader.readCString(),
    parameterValue: reader.readCString()
  }
}

function _parseBackendKeyData (buffer) {
  let reader = new BufferReader(buffer)

  return {
    type: 'PG:BackendKeyData',
    processID: reader.readInt32(),
    secretKey: reader.readInt32(),
  }
}

function _parseEmptyQueryResponse (buffer) {
  return {
    type: 'PG:EmptyQuery',
    command: 'None',
    rowCount: 0
  }
}

function _parseCommandComplete (buffer) {
  let reader = new BufferReader(buffer)
  let [command, oid, count] = reader.readCString().split(' ')

  if (count === undefined) count = oid

  return {
    type: 'PG:CommandComplete',
    rowCount: Number(count),
    command
  }
}

function _parseReadyForQuery (buffer) {
  let reader = new BufferReader(buffer)

  return {
    type: 'PG:ReadyForQuery',
    status: reader.readString(1),
  }
}

function _parseAuthentication (buffer) {
  let reader = new BufferReader(buffer)

  switch (reader.readInt32()) {
    case 0: return {
      type: 'PG:AuthenticationOk'
    }

    case 3: return {
      type: 'PG:AuthenticationCleartextPassword'
    }

    case 5: return {
      type: 'PG:AuthenticationMD5Password',
      salt: reader.slice(4)
    }
  }
}

// export
module.exports = {
  parse
}
