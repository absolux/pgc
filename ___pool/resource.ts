
import { Queue } from './queue'

export class Manager<T> {
  private max: number
  private resources = []
  private available = new Queue()

  constructor (private factory: Factory<T>, { size = 10 }) {
    this.max = size
  }

  shift (): T | undefined {
    return this.available.shift() || this.create()
  }

  push (resource: T): void {
    this.available.push(resource)
  }

  drop (resource): void {
    let index = this.resources.indexOf(resource)

    if (~index) this.resources.splice(index, 1)
  }

  private create (): T | undefined {
    if (this.available.length >= this.max) return

    let resource = this.factory.create()

    this.resources.push(resource)
    
    return resource
  }
}

export interface Factory<T> {
  create (): T
}
