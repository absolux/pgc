
'use strict'

export class Queue {
  constructor () {
    this.head = this.tail = null
  }

  isEmpty () {
    return this.head == null
  }

  push (value) {
    this.tail = createNode(value, this.tail)

    if (! this.head) this.head = this.tail
  }

  shift () {
    if (! this.head) return

    let node = this.head

    this.head = node.next

    return node.value
  }

  each (fn) {
    let node = this.head

    do fn.call(null, node)
    while (node = node.next)
  }
}

function createNode (value, previous) {
  if (! previous) return { value }

  return previous.next = { value }
}
