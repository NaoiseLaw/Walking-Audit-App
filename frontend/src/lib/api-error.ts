export class ApiError extends Error {
  status: number
  statusCode: number
  code?: string

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = statusCode
    this.statusCode = statusCode
    this.code = code
    Object.setPrototypeOf(this, ApiError.prototype)
  }
}
