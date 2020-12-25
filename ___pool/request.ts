
const NOOP = () => {}

export class Request<T> {
  private _resolve: (value: T) => void
  private _reject: (reason: any) => void

  constructor () {
    // TODO: add timeout option

    this._resolve = this._reject = NOOP
  }

  promise (): Promise<T> {
    return new Promise((resolve, reject) => {
      this._resolve = resolve
      this._reject = reject
    })
  }

  resolve (data: T): void {
    // TODO: should throw if _resolve is not defined

    this._resolve.call(null, data)
  }

  reject (reason: any): void {
    // TODO: should throw if _reject is not defined

    this._reject.call(null, reason)
  }
}
