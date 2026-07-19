export class ApiError extends Error {
  statusCode: number;
  code: string;
  details?: Record<string, string[]>;

  constructor(statusCode: number, code: string, message: string, details?: Record<string, string[]>) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  static badRequest(message: string, details?: Record<string, string[]>) {
    return new ApiError(400, "BAD_REQUEST", message, details);
  }

  static unauthorized(message = "Authentification requise") {
    return new ApiError(401, "UNAUTHORIZED", message);
  }

  static forbidden(message = "Accès refusé") {
    return new ApiError(403, "FORBIDDEN", message);
  }

  static notFound(message = "Ressource introuvable") {
    return new ApiError(404, "NOT_FOUND", message);
  }

  static conflict(message: string) {
    return new ApiError(409, "CONFLICT", message);
  }

  static tooMany(message = "Trop de requêtes, réessayez plus tard") {
    return new ApiError(429, "TOO_MANY_REQUESTS", message);
  }
}
