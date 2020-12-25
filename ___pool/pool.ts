
import { Queue } from './queue'
import { Request } from './request'
import { Manager } from './resources'

export class Pool<T> {
  private requests = new Queue<T>()

  constructor (private resources: Manager<T>) {
  }

  acquire (): Promise<T> {
    setImmediate(() => this.dequeue())

    return this.enqueue().promise()
  }

  release (resource: T): void {
    setImmediate(() => this.dequeue())

    this.resources.push(resource)
  }

  private enqueue (): Request<T> {
    let request = new Request()

    this.requests.push(request)

    return request
  }

  private dequeue (): void {
    if (this.requests.isEmpty()) return

    let resource = this.resources.shift()

    if (resource) {
      let request = this.requests.shift()

      request.resolve(resource)
    }
  }
}
