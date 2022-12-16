const errorMessages = {
  operation: 'Operation failed',
  input: 'Invalid input',
};

export class AppError extends Error {
  constructor(message) {
    super(message);
    this.type = 'appError';
  }
}

export class OperationError extends AppError {
  constructor(message) {
    super(message);
    this.message = errorMessages.operation;
  }
}

export class InputError extends AppError {
  constructor(message) {
    super(message);
    this.message = errorMessages.input;
  }
}
