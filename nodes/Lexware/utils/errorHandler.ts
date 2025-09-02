import { IExecuteFunctions } from "n8n-core";
import { NodeApiError, NodeOperationError } from "n8n-workflow";

/**
 * Enhanced error handler for Lexware API responses
 */
export class LexwareErrorHandler {
  private context: IExecuteFunctions;

  constructor(context: IExecuteFunctions) {
    this.context = context;
  }

  /**
   * Handles and formats Lexware API errors for better developer experience
   */
  handleApiError(error: any, operation: string, resourceType: string): never {
    // Extract error information
    let statusCode = error.response?.status || error.status || 500;
    let errorData = error.response?.data || error.data || {};
    let errorMessage = error.message || "Unknown error occurred";

    // Handle different types of Lexware API errors
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      statusCode = error.response.status;
      errorData = error.response.data || {};

      switch (statusCode) {
        case 400:
          return this.handleValidationError(errorData, operation, resourceType);
        case 401:
          return this.handleAuthenticationError(errorData);
        case 403:
          return this.handleAuthorizationError(errorData, resourceType);
        case 404:
          return this.handleNotFoundError(errorData, resourceType);
        case 409:
          return this.handleConflictError(errorData, operation, resourceType);
        case 422:
          return this.handleUnprocessableEntityError(
            errorData,
            operation,
            resourceType
          );
        case 429:
          return this.handleRateLimitError(errorData);
        case 500:
        case 502:
        case 503:
        case 504:
          return this.handleServerError(errorData, statusCode);
        default:
          return this.handleGenericError(
            errorData,
            statusCode,
            operation,
            resourceType
          );
      }
    } else if (error.request) {
      // The request was made but no response was received
      return this.handleNetworkError(error);
    } else {
      // Something happened in setting up the request that triggered an Error
      return this.handleRequestSetupError(error, operation);
    }
  }

  /**
   * Handles validation errors (400 Bad Request)
   */
  private handleValidationError(
    errorData: any,
    operation: string,
    resourceType: string
  ): never {
    let message = `Validation failed for ${operation} operation on ${resourceType}`;
    let details: string[] = [];

    if (errorData.message) {
      message = errorData.message;
    }

    // Extract specific validation errors
    if (errorData.errors && Array.isArray(errorData.errors)) {
      details = errorData.errors.map((err: any) => {
        if (typeof err === "string") return err;
        if (err.field && err.message) return `${err.field}: ${err.message}`;
        if (err.path && err.message) return `${err.path}: ${err.message}`;
        return JSON.stringify(err);
      });
    } else if (errorData.details) {
      details = Array.isArray(errorData.details)
        ? errorData.details.map((detail: any) => String(detail))
        : [String(errorData.details)];
    }

    const errorMessage =
      details.length > 0
        ? `${message}\n\nValidation errors:\n• ${details.join("\n• ")}`
        : message;

    throw new NodeOperationError(this.context.getNode(), errorMessage, {
      description:
        "Please check your input data and ensure all required fields are correctly formatted.",
      

    });
  }

  /**
   * Handles authentication errors (401 Unauthorized)
   */
  private handleAuthenticationError(errorData: any): never {
    const message =
      errorData.message ||
      "Authentication failed. Please check your API credentials.";

    throw new NodeApiError(this.context.getNode(), {
      status: 401,
      message,
      description:
        "Verify that your API token is correct and has not expired. You can generate a new token at https://app.lexware.de/addons/public-api",
    });
  }

  /**
   * Handles authorization errors (403 Forbidden)
   */
  private handleAuthorizationError(
    errorData: any,
    resourceType: string
  ): never {
    const message =
      errorData.message || `Access denied for ${resourceType} resource.`;

    throw new NodeApiError(this.context.getNode(), {
      status: 403,
      message,
      description:
        "Your API token does not have sufficient permissions for this operation. Please check your API token scope settings.",
    });
  }

  /**
   * Handles not found errors (404 Not Found)
   */
  private handleNotFoundError(errorData: any, resourceType: string): never {
    const message = errorData.message || `${resourceType} not found.`;

    throw new NodeOperationError(this.context.getNode(), message, {
      description:
        "The requested resource does not exist. Please verify the ID is correct.",
      
    });
  }

  /**
   * Handles conflict errors (409 Conflict)
   */
  private handleConflictError(
    errorData: any,
    operation: string,
    resourceType: string
  ): never {
    const message =
      errorData.message ||
      `Conflict occurred during ${operation} operation on ${resourceType}.`;

    throw new NodeOperationError(this.context.getNode(), message, {
      description:
        "The operation conflicts with the current state of the resource. This might be due to concurrent modifications or business rule violations.",
      

    });
  }

  /**
   * Handles unprocessable entity errors (422)
   */
  private handleUnprocessableEntityError(
    errorData: any,
    operation: string,
    resourceType: string
  ): never {
    let message = `Unable to process ${operation} operation on ${resourceType}`;
    let details: string[] = [];

    if (errorData.message) {
      message = errorData.message;
    }

    // Extract business logic errors
    if (errorData.errors && Array.isArray(errorData.errors)) {
      details = errorData.errors.map((err: any) => {
        if (typeof err === "string") return err;
        if (err.field && err.message) return `${err.field}: ${err.message}`;
        if (err.code && err.message) return `${err.code}: ${err.message}`;
        return JSON.stringify(err);
      });
    }

    const errorMessage =
      details.length > 0
        ? `${message}\n\nBusiness logic errors:\n• ${details.join("\n• ")}`
        : message;

    throw new NodeOperationError(this.context.getNode(), errorMessage, {
      description:
        "The request data is valid but violates business rules or constraints.",
      

    });
  }

  /**
   * Handles rate limit errors (429 Too Many Requests)
   */
  private handleRateLimitError(errorData: any): never {
    const message =
      errorData.message ||
      "Rate limit exceeded. Too many requests sent in a given amount of time.";
    const retryAfter =
      errorData.retryAfter || errorData["retry-after"] || "60 seconds";

    throw new NodeApiError(this.context.getNode(), {
      status: 429,
      message: `${message} Please retry after ${retryAfter}.`,
      description:
        "The Lexware API has rate limits. Please wait before making additional requests. Consider implementing exponential backoff for retries.",
    });
  }

  /**
   * Handles server errors (5xx)
   */
  private handleServerError(errorData: any, statusCode: number): never {
    const message =
      errorData.message || "Internal server error occurred on Lexware API.";

    throw new NodeApiError(this.context.getNode(), {
      status: statusCode,
      message,
      description:
        "This is a temporary server-side issue. Please try again later. If the problem persists, contact Lexware support.",
    });
  }

  /**
   * Handles network errors (no response received)
   */
  private handleNetworkError(error: any): never {
    const message = "Network error: Unable to reach Lexware API.";

    throw new NodeApiError(this.context.getNode(), {
      status: 0,
      message,
      description:
        "Please check your internet connection and verify that the Lexware API is accessible. The issue might be temporary.",
      
    });
  }

  /**
   * Handles request setup errors
   */
  private handleRequestSetupError(error: any, operation: string): never {
    const message = `Request setup error during ${operation} operation: ${error.message}`;

    throw new NodeOperationError(this.context.getNode(), message, {
      description:
        "There was an error setting up the request. This might be due to invalid configuration or malformed parameters.",
      
    });
  }

  /**
   * Handles generic errors
   */
  private handleGenericError(
    errorData: any,
    statusCode: number,
    operation: string,
    resourceType: string
  ): never {
    const message =
      errorData.message ||
      `Unexpected error during ${operation} operation on ${resourceType}.`;

    throw new NodeApiError(this.context.getNode(), {
      status: statusCode,
      message,
      description: `HTTP ${statusCode}: ${message}`,

    });
  }

  /**
   * Wraps API calls with proper error handling
   */
  async wrapApiCall<T>(
    apiCall: () => Promise<T>,
    operation: string,
    resourceType: string
  ): Promise<T> {
    try {
      return await apiCall();
    } catch (error) {
      return this.handleApiError(error, operation, resourceType);
    }
  }

  /**
   * Formats validation errors from the validator
   */
  static formatValidationError(
    fieldName: string,
    value: any,
    requirement: string
  ): string {
    const valueStr =
      value === undefined || value === null
        ? "undefined"
        : typeof value === "string" && value.length > 50
        ? `"${value.substring(0, 50)}..."`
        : JSON.stringify(value);

    return `Field '${fieldName}' (value: ${valueStr}) ${requirement}`;
  }

  /**
   * Creates a detailed error context for debugging
   */
  static createErrorContext(
    operation: string,
    resourceType: string,
    parameters: any
  ): any {
    return {
      operation,
      resourceType,
      timestamp: new Date().toISOString(),
      parameters: this.sanitizeParameters(parameters),
    };
  }

  /**
   * Sanitizes parameters for logging (removes sensitive data)
   */
  private static sanitizeParameters(params: any): any {
    if (!params || typeof params !== "object") return params;

    const sensitiveKeys = ["password", "token", "secret", "key", "accessToken"];
    const sanitized = { ...params };

    const sanitizeValue = (value: any): any => {
      if (typeof value === "string" && value.length > 10) {
        return (
          value.substring(0, 3) + "***" + value.substring(value.length - 3)
        );
      }
      return "***";
    };

    const sanitizeObject = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      }

      if (obj && typeof obj === "object") {
        const result: any = {};
        for (const [key, value] of Object.entries(obj)) {
          if (
            sensitiveKeys.some((sensitiveKey) =>
              key.toLowerCase().includes(sensitiveKey.toLowerCase())
            )
          ) {
            result[key] = sanitizeValue(value);
          } else if (typeof value === "object") {
            result[key] = sanitizeObject(value);
          } else {
            result[key] = value;
          }
        }
        return result;
      }

      return obj;
    };

    return sanitizeObject(sanitized);
  }
}
