import { IExecuteFunctions } from "n8n-core";
import { executeQuotations } from "../../nodes/Lexware/actions/Quotations.execute";
import { lexwareApiRequest } from "../../nodes/Lexware/GenericFunctions";
import { QuotationsTestHelper, TestDataFactory } from "../utils/test-helpers";

// Mock the lexwareApiRequest function
jest.mock("../../nodes/Lexware/GenericFunctions", () => ({
  lexwareApiRequest: jest.fn(),
}));

describe("Quotations.execute - Payment Conditions Tests", () => {
  let mockExecuteFunctions: jest.Mocked<IExecuteFunctions>;

  beforeEach(() => {
    QuotationsTestHelper.resetMocks();
  });

  describe("CREATE Operation with Payment Conditions", () => {
    it("sollte paymentConditions korrekt verarbeiten", async () => {
      // Arrange
      const paymentConditions = QuotationsTestHelper.createPaymentConditions();
      mockExecuteFunctions = QuotationsTestHelper.createMockExecuteFunctions({
        paymentConditions,
      });
      QuotationsTestHelper.setupApiMock(
        lexwareApiRequest as jest.MockedFunction<typeof lexwareApiRequest>
      );

      // Act
      await executeQuotations.call(
        mockExecuteFunctions,
        0,
        TestDataFactory.OPERATIONS.CREATE
      );

      // Assert
      QuotationsTestHelper.expectApiCall(
        lexwareApiRequest as jest.MockedFunction<typeof lexwareApiRequest>,
        {
          method: TestDataFactory.HTTP_METHODS.POST,
          endpoint: TestDataFactory.ENDPOINTS.QUOTATIONS,
          expectedBody: {
            paymentConditions: QuotationsTestHelper.expectedPaymentConditions(),
          },
        }
      );
    });

    it("sollte ohne paymentConditions funktionieren", async () => {
      // Arrange
      mockExecuteFunctions = QuotationsTestHelper.createMockExecuteFunctions();
      QuotationsTestHelper.setupApiMock(
        lexwareApiRequest as jest.MockedFunction<typeof lexwareApiRequest>
      );

      // Act
      await executeQuotations.call(
        mockExecuteFunctions,
        0,
        TestDataFactory.OPERATIONS.CREATE
      );

      // Assert
      QuotationsTestHelper.expectApiCall(
        lexwareApiRequest as jest.MockedFunction<typeof lexwareApiRequest>,
        {
          method: TestDataFactory.HTTP_METHODS.POST,
          endpoint: TestDataFactory.ENDPOINTS.QUOTATIONS,
          notExpectedFields: ["paymentConditions"],
        }
      );
    });
  });

  describe("CREATE BY JSON Operation with Payment Conditions", () => {
    it("sollte paymentConditions bei createByJson korrekt verarbeiten", async () => {
      // Arrange
      const paymentConditions = QuotationsTestHelper.createPaymentConditions();
      mockExecuteFunctions = QuotationsTestHelper.createMockExecuteFunctions({
        paymentConditions,
      });
      QuotationsTestHelper.setupApiMock(
        lexwareApiRequest as jest.MockedFunction<typeof lexwareApiRequest>
      );

      // Act
      await executeQuotations.call(
        mockExecuteFunctions,
        0,
        TestDataFactory.OPERATIONS.CREATE_BY_JSON
      );

      // Assert
      QuotationsTestHelper.expectApiCall(
        lexwareApiRequest as jest.MockedFunction<typeof lexwareApiRequest>,
        {
          method: TestDataFactory.HTTP_METHODS.POST,
          endpoint: TestDataFactory.ENDPOINTS.QUOTATIONS,
          expectedBody: {
            paymentConditions: QuotationsTestHelper.expectedPaymentConditions(),
          },
        }
      );
    });
  });

  describe("UPDATE Operation with Payment Conditions", () => {
    it("sollte paymentConditions bei update korrekt verarbeiten", async () => {
      // Arrange
      const testUuid = QuotationsTestHelper.generateTestUuid();
      const paymentConditions = QuotationsTestHelper.createPaymentConditions();
      mockExecuteFunctions = QuotationsTestHelper.createMockExecuteFunctions({
        quotationId: testUuid,
        paymentConditions,
      });
      QuotationsTestHelper.setupApiMock(
        lexwareApiRequest as jest.MockedFunction<typeof lexwareApiRequest>
      );

      // Act
      await executeQuotations.call(
        mockExecuteFunctions,
        0,
        TestDataFactory.OPERATIONS.UPDATE
      );

      // Assert
      QuotationsTestHelper.expectApiCall(
        lexwareApiRequest as jest.MockedFunction<typeof lexwareApiRequest>,
        {
          method: TestDataFactory.HTTP_METHODS.PUT,
          endpoint: TestDataFactory.ENDPOINTS.QUOTATIONS_BY_ID(testUuid),
          expectedBody: {
            paymentConditions: QuotationsTestHelper.expectedPaymentConditions(),
          },
        }
      );
    });
  });
});
