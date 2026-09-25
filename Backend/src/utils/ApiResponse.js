export default class ApiResponse {
  constructor(data = null, message = 'Operation successful', extra = {}) {
    this.success = true
    this.message = message
    this.data = data
    Object.assign(this, extra)
  }
}
