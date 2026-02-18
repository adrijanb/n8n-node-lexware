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
    let statusCode =
      error.response?.status ||
      error.response?.statusCode ||
      error.status ||
      error.statusCode ||
      500;
    let errorData =
      error.response?.data ||
      error.response?.body ||
      error.data ||
      error.body ||
      {};

    // Handle different types of Lexware API errors
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      statusCode =
        error.response.status ||
        error.response.statusCode ||
        statusCode;
      errorData = error.response.data || error.response.body || errorData;

      switch (statusCode) {
        case 400:
        case 406:
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
   * Handles validation errors (400 Bad Request) according to Lexware API specification
   * Reference: https://developers.lexware.io/docs/#error-codes-regular-error-response
   */
  private handleValidationError(
    errorData: any,
    operation: string,
    resourceType: string
  ): never {
    let message = `Validation failed for ${operation} operation on ${resourceType}`;
    let details: string[] = [];
    let isLegacyFormat = false;

    const normalizeDetail = (detail: any): string => {
      if (typeof detail === "string") return detail;
      if (detail?.field && detail?.message)
        return `${detail.field}: ${detail.message}`;
      if (detail?.path && detail?.message)
        return `${detail.path}: ${detail.message}`;
      if (detail?.code && detail?.message)
        return `Code ${detail.code}: ${detail.message}`;
      if (detail?.violationDescription) return detail.violationDescription;
      return JSON.stringify(detail);
    };

    if (typeof errorData === "string") {
      message = `Lexware API Error: ${errorData}`;
    } else if (Array.isArray(errorData)) {
      details = errorData.map(normalizeDetail);
    }

    // Handle Lexware API Regular Error Response Format
    if (errorData.message && errorData.details) {
      message = `Lexware API Error: ${errorData.message}`;

      // Extract structured validation details
      if (Array.isArray(errorData.details)) {
        details = errorData.details.map(normalizeDetail);
      } else {
        details.push(String(errorData.details));
      }
    }
    // Handle Legacy Error Response Format
    else if (errorData.errors && Array.isArray(errorData.errors)) {
      isLegacyFormat = true;
      message = errorData.message || message;

      details = errorData.errors.map(normalizeDetail);
    }
    // Handle legacy errors as key-value map
    else if (
      errorData.errors &&
      typeof errorData.errors === "object" &&
      !Array.isArray(errorData.errors)
    ) {
      isLegacyFormat = true;
      message = errorData.message || message;
      details = Object.entries(errorData.errors).map(
        ([key, value]) => `${key}: ${normalizeDetail(value)}`
      );
    }
    // Handle simple message format
    else if (errorData.message) {
      message = `Lexware API Error: ${errorData.message}`;
    }
    // Handle alternative validation list formats
    else if (
      Array.isArray(errorData.violations) ||
      Array.isArray(errorData.validationErrors) ||
      Array.isArray(errorData.invalidParams)
    ) {
      const list =
        errorData.violations ||
        errorData.validationErrors ||
        errorData.invalidParams;
      details = list.map(normalizeDetail);
    }


    // Build comprehensive error message
    let errorMessage = message;

    if (details.length > 0) {
      errorMessage += `\n\n🔍 Specific Issues:`;
      details.forEach((detail, index) => {
        errorMessage += `\n  ${index + 1}. ${detail}`;
      });
    }

    // Add error format information for developers
    const formatInfo = isLegacyFormat ? "Legacy Format" : "Regular Format";
    errorMessage += `\n\n📝 Error Format: ${formatInfo}`;

    // Always include the complete API response for debugging
    errorMessage += `\n\n📋 Complete Lexware API Response:\n${JSON.stringify(
      errorData,
      null,
      2
    )}`;

    // Add reference to Lexware documentation
    errorMessage += `\n\n📚 Reference: https://developers.lexware.io/docs/#error-codes-regular-error-response`;

    // Add specific hints for common misleading Lexware errors
    if (errorMessage.includes("postingCategoryId") && errorMessage.includes("Legen Sie den Kontakt zunächst an")) {
      errorMessage += "\n\n💡 Tipp: Dies ist ein bekannter, irreführender Fehler der Lexware API bei der Verwendung von manuellen Adressen. Er bedeutet meist, dass Informationen fehlen, die normalerweise im Kontakt hinterlegt sind (z.B. Steuer-Einstellungen oder eine gültige Umsatzsteuer-ID bei EU-Ausland). Prüfen Sie, ob Name, Land und PLZ in der 'Manual Address' korrekt für Ihren Account-Typ sind.";
    }

    throw new NodeOperationError(this.context.getNode(), errorMessage, {
      description:
        "Please check your input data according to the Lexware API validation rules. See the complete API response and documentation reference above for detailed information.",
    });
  }

  /**
   * Handles authentication errors (401 Unauthorized) according to Lexware API specification
   * Reference: https://developers.lexware.io/docs/#error-codes-authorization-and-connection-error-responses
   */
  private handleAuthenticationError(errorData: any): never {
    let message = "Authentication failed. Please check your API credentials.";
    let errorDetails = "";

    // Handle Lexware API Authorization Error Response Format
    if (errorData.error) {
      errorDetails += `\n🔑 Error Type: ${errorData.error}`;

      if (errorData.error_description) {
        message = errorData.error_description;
        errorDetails += `\n📝 Description: ${errorData.error_description}`;
      }

      // Handle specific OAuth 2.0 error types
      switch (errorData.error) {
        case "invalid_token":
          message = "Invalid API token provided";
          errorDetails += `\n💡 Solution: Generate a new API token at https://app.lexware.de/addons/public-api`;
          break;
        case "expired_token":
          message = "API token has expired";
          errorDetails += `\n💡 Solution: Refresh or regenerate your API token`;
          break;
        case "insufficient_scope":
          message = "API token does not have sufficient permissions";
          errorDetails += `\n💡 Solution: Check your API token scope settings`;
          break;
        case "invalid_request":
          message = "Invalid authentication request format";
          errorDetails += `\n💡 Solution: Check your Authorization header format`;
          break;
        default:
          errorDetails += `\n💡 Solution: Verify your API token and permissions`;
      }
    } else if (errorData.message) {
      message = errorData.message;
    }

    // Build comprehensive error message
    let errorMessage = `🚫 Lexware API Authentication Error: ${message}`;
    errorMessage += errorDetails;

    // Always include the complete API response for debugging
    errorMessage += `\n\n📋 Complete Lexware API Response:\n${JSON.stringify(
      errorData,
      null,
      2
    )}`;

    // Add reference to Lexware documentation
    errorMessage += `\n\n📚 Reference: https://developers.lexware.io/docs/#error-codes-authorization-and-connection-error-responses`;
    errorMessage += `\n🔗 Generate API Key: https://app.lexware.de/addons/public-api`;

    throw new NodeApiError(this.context.getNode(), {
      status: 401,
      message: errorMessage,
      description:
        "Authentication with Lexware API failed. Please check your API token configuration.",
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

    let errorMessage = message;

    if (details.length > 0) {
      errorMessage += `\n\nBusiness logic errors:\n• ${details.join("\n• ")}`;
    }

    // Always include the complete API response for debugging
    errorMessage += `\n\n📋 Complete Lexware API Response:\n${JSON.stringify(
      errorData,
      null,
      2
    )}`;

    throw new NodeOperationError(this.context.getNode(), errorMessage, {
      description:
        "The request data is valid but violates business rules or constraints. See the complete API response above for detailed information.",
    });
  }

  /**
   * Handles rate limit errors (429 Too Many Requests)
   */
  private handleRateLimitError(errorData: any): never {
    let message =
      "Rate limit exceeded. Too many requests sent in a given amount of time.";
    const retryAfter =
      errorData.retryAfter || errorData["retry-after"] || "1 second";

    if (errorData.message) {
      message = errorData.message;
    }

    // Build comprehensive error message with Lexware-specific rate limit info
    let errorMessage = `🚦 Lexware API Rate Limit Exceeded: ${message}`;
    errorMessage += `\n\n⏱️ Rate Limit Details:`;
    errorMessage += `\n• Lexware API allows up to 2 requests per second`;
    errorMessage += `\n• Please wait ${retryAfter} before retrying`;
    errorMessage += `\n• Consider implementing token bucket algorithm for rate limiting`;

    // Add helpful suggestions
    errorMessage += `\n\n💡 Solutions:`;
    errorMessage += `\n• Implement exponential backoff with jitter`;
    errorMessage += `\n• Use token bucket algorithm on client side`;
    errorMessage += `\n• Add delays between consecutive API calls`;
    errorMessage += `\n• Batch operations where possible`;

    // Always include the complete API response for debugging
    errorMessage += `\n\n📋 Complete Lexware API Response:\n${JSON.stringify(
      errorData,
      null,
      2
    )}`;

    // Add reference to Lexware documentation
    errorMessage += `\n\n📚 Reference: https://developers.lexware.io/docs/#api-rate-limits`;

    throw new NodeApiError(this.context.getNode(), {
      status: 429,
      message: errorMessage,
      description: `Rate limit exceeded. Please retry after ${retryAfter}. The Lexware API allows up to 2 requests per second.`,
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
  private handleNetworkError(_error: any): never {
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
  private handleRequestSetupError(error: any, _operation: string): never {
    const message = `Request setup error during ${_operation} operation: ${error.message}`;

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
