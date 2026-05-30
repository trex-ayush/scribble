export class ApiResponse {
  constructor(statusCode, data, message = 'Success') {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }

  static success(res, data, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json(new ApiResponse(statusCode, data, message));
  }

  static created(res, data, message = 'Created') {
    return ApiResponse.success(res, data, message, 201);
  }

  static noContent(res) {
    return res.status(204).send();
  }
}
