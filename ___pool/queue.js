
'use strict'

export class Queue {
  constructor () {
    this._head = null
  }

  isEmpty () {
    return this._head == null
  }

  push (value) {
    let node = _createNode(value, this._head)

    if (! this._head) this._head = node
  }

  shift () {
    if (! this._head) return

    let node = this._head

    this._head = node.next

    return node.value
  }

  each (fn) {
    let node = this._head

    while (node) {
      fn.call(null, node)
      node = node.next
    }
  }
}

function _createNode (value, previous) {
  if (! previous) return { value }

  return previous.next = { value }
}
