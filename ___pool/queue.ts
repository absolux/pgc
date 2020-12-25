
export class Queue<T> {
  private head?: Node<T>
  private tail?: Node<T>

  isEmpty (): boolean {
    return this.head == null
  }

  push (value: T): void {
    this.tail = createNode(value, this.tail)

    if (! this.head) this.head = this.tail
  }

  shift (): T | undefined {
    if (this.isEmpty()) return

    let node = this.head

    this.head = node.next

    return node.value
  }

  each (fn: (n: Node<T>) => any): void {
    if (this.isEmpty()) return

    let node = this.head

    do fn.call(null, node)
    while (node = node.next)
  }
}

function createNode<T> (value: T, previous?: Node<T>): Node<T> {
  if (! previous) return { value }

  return previous.next = { value }
}

interface Node<T> {
  next?: Node
  value: T
}
