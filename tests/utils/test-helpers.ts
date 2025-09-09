import { IExecuteFunctions } from "n8n-core";
import { IDataObject } from "n8n-workflow";

export interface TestParameterConfig {
  paymentConditions?: IDataObject;
  quotationId?: string;
  lineItems?: IDataObject[];
  lineItemsJson?: string;
  totalPrice?: IDataObject;
  taxConditions?: IDataObject;
  [key: string]: any;
}

export interface ExpectedApiCall {
  method: string;
  endpoint: string;
  expectedBody?: IDataObject;
  notExpectedFields?: string[];
}

export class QuotationsTestHelper {
  private static readonly DEFAULT_PAYMENT_CONDITIONS = {
    paymentTermLabel: "10 Tage - 3 %, 30 Tage netto",
    paymentTermDuration: 30,
    paymentDiscountConditions: {
      value: {
        discountPercentage: 3,
        discountRange: 10,
      },
    },
  };

  private static readonly DEFAULT_PARAMETERS = {
    lineItems: [],
    lineItemsJson: "[]",
    totalPrice: { currency: "EUR" },
    taxConditions: { taxType: "net" },
  };

  /**
   * Creates a mock ExecuteFunctions with configured parameters
   */
  static createMockExecuteFunctions(
    config: TestParameterConfig = {}
  ): jest.Mocked<IExecuteFunctions> {
    const mockExecuteFunctions = {
      getNodeParameter: jest.fn(),
      getNode: jest.fn().mockReturnValue({ name: "Test Node" }),
      getCredentials: jest.fn().mockResolvedValue({
        apiUrl: "https://api.lexware.de",
        accessToken: "test-token",
      }),
      helpers: {
        httpRequest: jest.fn(),
      },
    } as any;

    // Merge with defaults
    const parameters: TestParameterConfig = {
      ...this.DEFAULT_PARAMETERS,
      ...config,
    };

    mockExecuteFunctions.getNodeParameter.mockImplementation(
      (param: string) => {
        // Handle nested parameter access (e.g., "paymentConditions.value")
        const paramKey = param
          .replace(/\.value$/, "")
          .replace(/\.item$/, "")
          .replace(/\.address$/, "");

        if (param === "paymentConditions.value") {
          return parameters.paymentConditions;
        }
        if (param === "lineItems.item") {
          return parameters.lineItems;
        }
        if (param === "totalPrice.value") {
          return parameters.totalPrice;
        }
        if (param === "taxConditions.value") {
          return parameters.taxConditions;
        }
        if (param === "lineItemsJson") {
          return parameters.lineItemsJson;
        }
        if (param === "quotationId") {
          return parameters.quotationId;
        }

        // Handle any other parameters from config
        if ((parameters as any)[paramKey] !== undefined) {
          return (parameters as any)[paramKey];
        }

        // Default fallback
        return param.includes(".") ? {} : "";
      }
    );

    return mockExecuteFunctions;
  }

  /**
   * Sets up the API request mock with a default response
   */
  static setupApiMock(
    lexwareApiRequest: jest.MockedFunction<any>,
    response: IDataObject = { id: "test-quotation-id" }
  ): void {
    lexwareApiRequest.mockResolvedValue(response);
  }

  /**
   * Creates default payment conditions for testing
   */
  static createPaymentConditions(
    overrides: Partial<IDataObject> = {}
  ): IDataObject {
    return {
      ...this.DEFAULT_PAYMENT_CONDITIONS,
      ...overrides,
    };
  }

  /**
   * Asserts that the API was called with expected parameters
   */
  static expectApiCall(
    lexwareApiRequest: jest.MockedFunction<any>,
    expectedCall: ExpectedApiCall
  ): void {
    if (expectedCall.expectedBody) {
      expect(lexwareApiRequest).toHaveBeenCalledWith(
        expectedCall.method,
        expectedCall.endpoint,
        expect.objectContaining(expectedCall.expectedBody)
      );
    } else if (expectedCall.notExpectedFields) {
      const notExpectedObject = expectedCall.notExpectedFields.reduce(
        (acc, field) => {
          acc[field] = expect.anything();
          return acc;
        },
        {} as IDataObject
      );

      expect(lexwareApiRequest).toHaveBeenCalledWith(
        expectedCall.method,
        expectedCall.endpoint,
        expect.not.objectContaining(notExpectedObject)
      );
    } else {
      expect(lexwareApiRequest).toHaveBeenCalledWith(
        expectedCall.method,
        expectedCall.endpoint,
        expect.any(Object)
      );
    }
  }

  /**
   * Generates a valid test UUID
   */
  static generateTestUuid(): string {
    return "12345678-1234-5234-8234-123456789012";
  }

  /**
   * Resets all mocks - should be called in beforeEach
   */
  static resetMocks(): void {
    jest.clearAllMocks();
  }

  /**
   * Creates expected payment conditions for assertions
   */
  static expectedPaymentConditions(
    overrides: Partial<IDataObject> = {}
  ): IDataObject {
    const defaults = {
      paymentTermLabel: "10 Tage - 3 %, 30 Tage netto",
      paymentTermDuration: 30,
      paymentDiscountConditions: {
        discountPercentage: 3,
        discountRange: 10,
      },
    };

    return { ...defaults, ...overrides };
  }
}

/**
 * Test data factory for common test scenarios
 */
export class TestDataFactory {
  static readonly OPERATIONS = {
    CREATE: "create",
    CREATE_BY_JSON: "createByJson",
    UPDATE: "update",
    GET: "get",
    GET_ALL: "getAll",
    DELETE: "delete",
  } as const;

  static readonly ENDPOINTS = {
    QUOTATIONS: "/v1/quotations",
    QUOTATIONS_BY_ID: (id: string) => `/v1/quotations/${id}`,
  } as const;

  static readonly HTTP_METHODS = {
    GET: "GET",
    POST: "POST",
    PUT: "PUT",
    DELETE: "DELETE",
  } as const;
}
