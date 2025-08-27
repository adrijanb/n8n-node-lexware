import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { IExecuteFunctions } from "n8n-core";
import { IDataObject, NodeOperationError } from "n8n-workflow";
import { executeInvoices } from "../../nodes/Lexware/actions/Invoices.execute";

// Mock der GenericFunctions und Utils
jest.mock("../../nodes/Lexware/GenericFunctions", () => ({
  lexwareApiRequest: jest.fn(),
}));

jest.mock("../../nodes/Lexware/utils/LineItems", () => ({
  parseLineItemsFromJson: jest.fn(),
}));

jest.mock("../../nodes/Lexware/utils/date", () => ({
  formatToLexwareDate: jest.fn(),
}));

describe("Invoices.execute - Umfassende Tests", () => {
  let mockExecuteFunctions: jest.Mocked<IExecuteFunctions>;
  const { lexwareApiRequest } = jest.requireMock("../../nodes/Lexware/GenericFunctions");
  const { parseLineItemsFromJson } = jest.requireMock("../../nodes/Lexware/utils/LineItems");
  const { formatToLexwareDate } = jest.requireMock("../../nodes/Lexware/utils/date");

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockExecuteFunctions = {
      getNodeParameter: jest.fn(),
      getNode: jest.fn(() => ({ name: "Lexware Invoices" })),
    } as any;

    // Standard-Mock für formatToLexwareDate
    formatToLexwareDate.mockImplementation((date: string) => 
      date ? `${date}T00:00:00.000+01:00` : undefined
    );
  });

  describe("CREATE Operation", () => {
    it("sollte eine Rechnung mit vollständigen Daten erstellen", async () => {
      // Arrange
      const invoiceData = {
        title: "Rechnung R-2024-001",
        introduction: "Vielen Dank für Ihren Auftrag",
        remark: "Zahlung innerhalb 14 Tagen",
        voucherDate: "2024-01-15",
        contactId: "contact-123",
        finalize: false,
      };

      const lineItems = [
        {
          type: "custom",
          name: "Beratung",
          description: "IT-Beratung Stunden",
          quantity: 10,
          unitName: "Stunden",
          unitPrice: {
            value: {
              currency: "EUR",
              netAmount: 100,
              grossAmount: 119,
              taxRatePercentage: 19,
            },
          },
          discountPercentage: 0,
          lineItemAmount: 1000,
        },
        {
          type: "custom",
          name: "Software",
          description: "Lizenzen",
          quantity: 1,
          unitName: "Stück",
          unitPrice: {
            value: {
              currency: "EUR",
              netAmount: 500,
              grossAmount: 595,
              taxRatePercentage: 19,
            },
          },
          discountPercentage: 10,
          lineItemAmount: 500,
        },
      ];

      mockExecuteFunctions.getNodeParameter.mockImplementation((param) => {
        switch (param) {
          case "title": return invoiceData.title;
          case "introduction": return invoiceData.introduction;
          case "remark": return invoiceData.remark;
          case "voucherDate": return invoiceData.voucherDate;
          case "contactId": return invoiceData.contactId;
          case "finalize": return invoiceData.finalize;
          case "lineItems.item": return lineItems;
          case "totalPrice.value": return {};
          case "taxConditions.value": return {};
          case "shippingConditions.value": return {};
          case "paymentConditions.value": return {};
          case "xRechnung": return undefined;
          default: return "";
        }
      });

      formatToLexwareDate.mockReturnValue("2024-01-15T00:00:00.000+01:00");

      const mockResponse = { id: "invoice-123", title: invoiceData.title };
      lexwareApiRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await executeInvoices.call(mockExecuteFunctions, 0, "create");

      // Assert
      expect(formatToLexwareDate).toHaveBeenCalledWith(invoiceData.voucherDate);
      expect(lexwareApiRequest).toHaveBeenCalledWith(
        "POST",
        "/v1/invoices",
        expect.objectContaining({
          title: invoiceData.title,
          introduction: invoiceData.introduction,
          remark: invoiceData.remark,
          voucherDate: "2024-01-15T00:00:00.000+01:00",
          address: { contactId: invoiceData.contactId },
          lineItems: expect.arrayContaining([
            expect.objectContaining({
              type: "custom",
              name: "Beratung",
              quantity: 10,
              unitPrice: {
                currency: "EUR",
                netAmount: 100,
                grossAmount: 119,
                taxRatePercentage: 19,
              },
            }),
          ]),
          totalPrice: expect.objectContaining({
            currency: "EUR",
          }),
          taxConditions: { taxType: "net", taxTypeNote: "" },
          shippingConditions: expect.objectContaining({
            shippingType: "delivery",
          }),
        })
      );
      expect(result).toEqual([{ json: mockResponse }]);
    });

    it("sollte mit finalize=true eine finalisierte Rechnung erstellen", async () => {
      // Arrange
      mockExecuteFunctions.getNodeParameter.mockImplementation((param) => {
        switch (param) {
          case "finalize": return true;
          case "lineItems.item": return [];
          default: return param.includes(".") ? {} : "";
        }
      });

      lexwareApiRequest.mockResolvedValue({ id: "finalized-invoice" });

      // Act
      await executeInvoices.call(mockExecuteFunctions, 0, "create");

      // Assert
      expect(lexwareApiRequest).toHaveBeenCalledWith(
        "POST",
        "/v1/invoices?finalize=true",
        expect.any(Object)
      );
    });

    it("sollte automatisch totalPrice aus LineItems berechnen", async () => {
      // Arrange
      const lineItems = [
        {
          type: "custom",
          name: "Item 1",
          quantity: 2,
          unitPrice: {
            value: {
              currency: "EUR",
              netAmount: 50,
              grossAmount: 59.5,
              taxRatePercentage: 19,
            },
          },
        },
        {
          type: "custom", 
          name: "Item 2",
          quantity: 1,
          unitPrice: {
            value: {
              currency: "EUR",
              netAmount: 100,
              grossAmount: 119,
              taxRatePercentage: 19,
            },
          },
        },
      ];

      mockExecuteFunctions.getNodeParameter.mockImplementation((param) => {
        if (param === "lineItems.item") return lineItems;
        if (param.includes(".value")) return {};
        return param.includes(".") ? {} : "";
      });

      lexwareApiRequest.mockResolvedValue({ id: "calculated-invoice" });

      // Act
      await executeInvoices.call(mockExecuteFunctions, 0, "create");

      // Assert
      expect(lexwareApiRequest).toHaveBeenCalledWith(
        "POST",
        "/v1/invoices",
        expect.objectContaining({
          totalPrice: {
            currency: "EUR",
            totalNetAmount: 200, // 2*50 + 1*100
            totalGrossAmount: 238, // 2*59.5 + 1*119
            totalTaxAmount: 38, // 238 - 200
          },
        })
      );
    });

    it("sollte manuelle totalPrice-Angaben verwenden", async () => {
      // Arrange
      const manualTotalPrice = {
        currency: "EUR",
        totalNetAmount: 1500,
        totalGrossAmount: 1785,
        totalTaxAmount: 285,
      };

      mockExecuteFunctions.getNodeParameter.mockImplementation((param) => {
        if (param === "totalPrice.value") return manualTotalPrice;
        if (param === "lineItems.item") return [];
        return param.includes(".") ? {} : "";
      });

      lexwareApiRequest.mockResolvedValue({ id: "manual-total-invoice" });

      // Act
      await executeInvoices.call(mockExecuteFunctions, 0, "create");

      // Assert
      expect(lexwareApiRequest).toHaveBeenCalledWith(
        "POST",
        "/v1/invoices",
        expect.objectContaining({
          totalPrice: manualTotalPrice,
        })
      );
    });

    it("sollte verschiedene xRechnung-Formate handhaben", async () => {
      const testCases = [
        { input: "BUYER-REF-123", expected: "BUYER-REF-123" },
        { input: { buyerReference: "REF-456" }, expected: { buyerReference: "REF-456" } },
        { input: "", expected: undefined },
        { input: "null", expected: undefined },
        { input: null, expected: undefined },
      ];

      for (const testCase of testCases) {
        jest.clearAllMocks();

        mockExecuteFunctions.getNodeParameter.mockImplementation((param) => {
          if (param === "xRechnung") return testCase.input;
          if (param === "lineItems.item") return [];
          return param.includes(".") ? {} : "";
        });

        lexwareApiRequest.mockResolvedValue({ id: "xrechnung-test" });

        await executeInvoices.call(mockExecuteFunctions, 0, "create");

        if (testCase.expected) {
          expect(lexwareApiRequest).toHaveBeenCalledWith(
            "POST",
            "/v1/invoices",
            expect.objectContaining({
              xRechnung: testCase.expected,
            })
          );
        } else {
          expect(lexwareApiRequest).toHaveBeenCalledWith(
            "POST",
            "/v1/invoices",
            expect.not.objectContaining({
              xRechnung: expect.anything(),
            })
          );
        }
      }
    });

    it("sollte paymentConditions korrekt verarbeiten", async () => {
      // Arrange
      const paymentConditions = {
        paymentTermLabel: "14 Tage netto",
        paymentTermDuration: 14,
        paymentDiscountConditions: {
          value: {
            discountPercentage: 2,
            discountRange: 7,
          },
        },
      };

      mockExecuteFunctions.getNodeParameter.mockImplementation((param) => {
        if (param === "paymentConditions.value") return paymentConditions;
        if (param === "lineItems.item") return [];
        return param.includes(".") ? {} : "";
      });

      lexwareApiRequest.mockResolvedValue({ id: "payment-conditions-invoice" });

      // Act
      await executeInvoices.call(mockExecuteFunctions, 0, "create");

      // Assert
      expect(lexwareApiRequest).toHaveBeenCalledWith(
        "POST",
        "/v1/invoices",
        expect.objectContaining({
          paymentConditions: {
            paymentTermLabel: "14 Tage netto",
            paymentTermDuration: 14,
            paymentDiscountConditions: {
              discountPercentage: 2,
              discountRange: 7,
            },
          },
        })
      );
    });

    it("sollte lineItemAmount korrekt handhaben", async () => {
      // Arrange
      const lineItems = [
        {
          name: "Item with amount",
          lineItemAmount: 150.50,
        },
        {
          name: "Item without amount",
          lineItemAmount: null,
        },
        {
          name: "Item with zero amount",
          lineItemAmount: 0,
        },
      ];

      mockExecuteFunctions.getNodeParameter.mockImplementation((param) => {
        if (param === "lineItems.item") return lineItems;
        return param.includes(".") ? {} : "";
      });

      lexwareApiRequest.mockResolvedValue({ id: "line-amount-invoice" });

      // Act
      await executeInvoices.call(mockExecuteFunctions, 0, "create");

      // Assert
      const calledWith = lexwareApiRequest.mock.calls[0][2];
      expect(calledWith.lineItems[0]).toHaveProperty("lineItemAmount", 150.50);
      expect(calledWith.lineItems[1]).not.toHaveProperty("lineItemAmount");
      expect(calledWith.lineItems[2]).toHaveProperty("lineItemAmount", 0);
    });
  });

  describe("CREATE_BY_JSON Operation", () => {
    it("sollte Rechnung mit JSON LineItems erstellen", async () => {
      // Arrange
      const standardData = {
        title: "JSON Invoice",
        contactId: "contact-456",
      };

      const jsonLineItems = [
        { name: "JSON Item 1", price: 100 },
        { name: "JSON Item 2", price: 200 },
      ];

      const lineItemsJsonString = JSON.stringify(jsonLineItems);

      mockExecuteFunctions.getNodeParameter.mockImplementation((param) => {
        switch (param) {
          case "title": return standardData.title;
          case "contactId": return standardData.contactId;
          case "lineItemsJson": return lineItemsJsonString;
          default: return param.includes(".") ? {} : "";
        }
      });

      parseLineItemsFromJson.mockReturnValue(jsonLineItems);
      lexwareApiRequest.mockResolvedValue({ id: "json-invoice" });

      // Act
      await executeInvoices.call(mockExecuteFunctions, 0, "createByJson");

      // Assert
      expect(parseLineItemsFromJson).toHaveBeenCalledWith(lineItemsJsonString);
      expect(lexwareApiRequest).toHaveBeenCalledWith(
        "POST",
        "/v1/invoices",
        expect.objectContaining({
          title: standardData.title,
          lineItems: jsonLineItems,
        })
      );
    });

    it("sollte mit leeren JSON LineItems umgehen", async () => {
      // Arrange
      mockExecuteFunctions.getNodeParameter.mockImplementation((param) => {
        if (param === "lineItemsJson") return "[]";
        return param.includes(".") ? {} : "";
      });

      parseLineItemsFromJson.mockReturnValue([]);
      lexwareApiRequest.mockResolvedValue({ id: "empty-json-invoice" });

      // Act
      await executeInvoices.call(mockExecuteFunctions, 0, "createByJson");

      // Assert
      expect(parseLineItemsFromJson).toHaveBeenCalledWith("[]");
      expect(lexwareApiRequest).toHaveBeenCalledWith(
        "POST",
        "/v1/invoices",
        expect.objectContaining({
          lineItems: [],
        })
      );
    });
  });

  describe("GET Operation", () => {
    it("sollte eine spezifische Rechnung abrufen", async () => {
      // Arrange
      const invoiceId = "invoice-789";
      mockExecuteFunctions.getNodeParameter.mockReturnValue(invoiceId);

      const mockInvoice = {
        id: invoiceId,
        title: "Abgerufene Rechnung",
        status: "draft",
      };
      lexwareApiRequest.mockResolvedValue(mockInvoice);

      // Act
      const result = await executeInvoices.call(mockExecuteFunctions, 0, "get");

      // Assert
      expect(lexwareApiRequest).toHaveBeenCalledWith(
        "GET",
        `/v1/invoices/${invoiceId}`
      );
      expect(result).toEqual([{ json: mockInvoice }]);
    });

    it("sollte mit nicht existierender Rechnung umgehen", async () => {
      // Arrange
      mockExecuteFunctions.getNodeParameter.mockReturnValue("non-existent");
      lexwareApiRequest.mockResolvedValue(null);

      // Act
      const result = await executeInvoices.call(mockExecuteFunctions, 0, "get");

      // Assert
      expect(result).toEqual([{ json: null }]);
    });
  });

  describe("GET_ALL Operation", () => {
    it("sollte alle Rechnungen ohne Filter abrufen", async () => {
      // Arrange
      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce(0) // page
        .mockReturnValueOnce(""); // status

      const mockInvoices = {
        content: [
          { id: "inv-1", title: "Rechnung 1" },
          { id: "inv-2", title: "Rechnung 2" },
        ],
      };
      lexwareApiRequest.mockResolvedValue(mockInvoices);

      // Act
      const result = await executeInvoices.call(mockExecuteFunctions, 0, "getAll");

      // Assert
      expect(lexwareApiRequest).toHaveBeenCalledWith(
        "GET",
        "/v1/invoices",
        {},
        { page: 0 }
      );
      expect(result).toEqual([{ json: mockInvoices }]);
    });

    it("sollte Rechnungen mit Status-Filter abrufen", async () => {
      // Arrange
      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce(1) // page
        .mockReturnValueOnce("finalized"); // status

      lexwareApiRequest.mockResolvedValue({ content: [] });

      // Act
      await executeInvoices.call(mockExecuteFunctions, 0, "getAll");

      // Assert
      expect(lexwareApiRequest).toHaveBeenCalledWith(
        "GET",
        "/v1/invoices",
        {},
        { page: 1, status: "finalized" }
      );
    });

    it("sollte undefined page korrekt handhaben", async () => {
      // Arrange
      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce(undefined) // page
        .mockReturnValueOnce(""); // status

      lexwareApiRequest.mockResolvedValue({ content: [] });

      // Act
      await executeInvoices.call(mockExecuteFunctions, 0, "getAll");

      // Assert
      expect(lexwareApiRequest).toHaveBeenCalledWith(
        "GET",
        "/v1/invoices",
        {},
        { page: undefined }
      );
    });
  });

  describe("UPDATE Operation", () => {
    it("sollte eine Rechnung aktualisieren", async () => {
      // Arrange
      const invoiceId = "invoice-update";
      const updateData = {
        title: "Aktualisierte Rechnung",
        introduction: "Neue Einleitung",
      };

      mockExecuteFunctions.getNodeParameter.mockImplementation((param) => {
        if (param === "invoiceId") return invoiceId;
        if (param === "title") return updateData.title;
        if (param === "introduction") return updateData.introduction;
        if (param === "lineItems.item") return [];
        return param.includes(".") ? {} : "";
      });

      lexwareApiRequest.mockResolvedValue({ id: invoiceId });

      // Act
      const result = await executeInvoices.call(mockExecuteFunctions, 0, "update");

      // Assert
      expect(lexwareApiRequest).toHaveBeenCalledWith(
        "PUT",
        `/v1/invoice/${invoiceId}`,
        expect.objectContaining({
          title: updateData.title,
          introduction: updateData.introduction,
        })
      );
    });
  });

  describe("DELETE Operation", () => {
    it("sollte eine Rechnung löschen", async () => {
      // Arrange
      const invoiceId = "invoice-delete";
      mockExecuteFunctions.getNodeParameter.mockReturnValue(invoiceId);
      lexwareApiRequest.mockResolvedValue({ success: true });

      // Act
      const result = await executeInvoices.call(mockExecuteFunctions, 0, "delete");

      // Assert
      expect(lexwareApiRequest).toHaveBeenCalledWith(
        "DELETE",
        `/v1/invoices/${invoiceId}`
      );
      expect(result).toEqual([{ json: { success: true } }]);
    });
  });

  describe("Error Handling", () => {
    it("sollte bei ungültiger Operation einen Fehler werfen", async () => {
      await expect(
        executeInvoices.call(mockExecuteFunctions, 0, "invalidOperation")
      ).rejects.toThrow(NodeOperationError);
    });

    it("sollte API-Fehler weiterleiten", async () => {
      mockExecuteFunctions.getNodeParameter.mockReturnValue("invoice-123");
      lexwareApiRequest.mockRejectedValue(new Error("API Error"));

      await expect(
        executeInvoices.call(mockExecuteFunctions, 0, "get")
      ).rejects.toThrow("API Error");
    });

    it("sollte JSON-Parse-Fehler bei createByJson handhaben", async () => {
      mockExecuteFunctions.getNodeParameter.mockImplementation((param) => {
        if (param === "lineItemsJson") return "invalid json";
        return param.includes(".") ? {} : "";
      });

      parseLineItemsFromJson.mockImplementation(() => {
        throw new Error("Invalid JSON provided for line items");
      });

      await expect(
        executeInvoices.call(mockExecuteFunctions, 0, "createByJson")
      ).rejects.toThrow("Invalid JSON provided for line items");
    });
  });

  describe("Complex Scenarios", () => {
    it("sollte komplexe Rechnung mit allen Features erstellen", async () => {
      // Arrange
      const complexInvoiceData = {
        title: "Komplexe Rechnung",
        introduction: "Einleitung",
        remark: "Bemerkung",
        voucherDate: "2024-02-15",
        contactId: "contact-complex",
        lineItems: [
          {
            type: "article",
            name: "Premium Service",
            description: "Vollservice",
            quantity: 5,
            unitName: "Stunden",
            unitPrice: {
              value: {
                currency: "EUR",
                netAmount: 150,
                grossAmount: 178.5,
                taxRatePercentage: 19,
              },
            },
            discountPercentage: 5,
            lineItemAmount: 712.5,
          },
        ],
        totalPrice: {
          currency: "EUR",
          totalNetAmount: 712.5,
          totalGrossAmount: 847.875,
          totalTaxAmount: 135.375,
        },
        taxConditions: {
          taxType: "gross",
          taxTypeNote: "Inkl. MwSt.",
        },
        shippingConditions: {
          shippingType: "pickup",
          shippingDate: "2024-02-20",
        },
        paymentConditions: {
          paymentTermLabel: "30 Tage",
          paymentTermDuration: 30,
          paymentDiscountConditions: {
            value: {
              discountPercentage: 3,
              discountRange: 10,
            },
          },
        },
        xRechnung: {
          buyerReference: "PO-2024-001",
          invoiceNote: "Bestellung vom 01.02.2024",
        },
      };

      mockExecuteFunctions.getNodeParameter.mockImplementation((param) => {
        const keys = param.split(".");
        let value = complexInvoiceData as any;
        for (const key of keys) {
          value = value?.[key];
        }
        return value ?? (param.includes(".") ? {} : "");
      });

      formatToLexwareDate.mockReturnValue("2024-02-15T00:00:00.000+01:00");
      lexwareApiRequest.mockResolvedValue({ id: "complex-invoice" });

      // Act
      await executeInvoices.call(mockExecuteFunctions, 0, "create");

      // Assert
      expect(lexwareApiRequest).toHaveBeenCalledWith(
        "POST",
        "/v1/invoices",
        expect.objectContaining({
          title: complexInvoiceData.title,
          introduction: complexInvoiceData.introduction,
          remark: complexInvoiceData.remark,
          voucherDate: "2024-02-15T00:00:00.000+01:00",
          address: { contactId: complexInvoiceData.contactId },
          lineItems: expect.arrayContaining([
            expect.objectContaining({
              type: "article",
              name: "Premium Service",
              lineItemAmount: 712.5,
            }),
          ]),
          totalPrice: complexInvoiceData.totalPrice,
          taxConditions: complexInvoiceData.taxConditions,
          shippingConditions: complexInvoiceData.shippingConditions,
          paymentConditions: expect.objectContaining({
            paymentTermLabel: "30 Tage",
            paymentTermDuration: 30,
          }),
          xRechnung: complexInvoiceData.xRechnung,
        })
      );
    });

    it("sollte mit negativen Beträgen umgehen (Gutschriften)", async () => {
      // Arrange
      const creditNoteItems = [
        {
          type: "custom",
          name: "Rückerstattung",
          quantity: 1,
          unitPrice: {
            value: {
              currency: "EUR",
              netAmount: -100,
              grossAmount: -119,
              taxRatePercentage: 19,
            },
          },
          lineItemAmount: -100,
        },
      ];

      mockExecuteFunctions.getNodeParameter.mockImplementation((param) => {
        if (param === "lineItems.item") return creditNoteItems;
        return param.includes(".") ? {} : "";
      });

      lexwareApiRequest.mockResolvedValue({ id: "credit-note" });

      // Act
      await executeInvoices.call(mockExecuteFunctions, 0, "create");

      // Assert
      expect(lexwareApiRequest).toHaveBeenCalledWith(
        "POST",
        "/v1/invoices",
        expect.objectContaining({
          lineItems: expect.arrayContaining([
            expect.objectContaining({
              unitPrice: expect.objectContaining({
                netAmount: -100,
                grossAmount: -119,
              }),
              lineItemAmount: -100,
            }),
          ]),
          totalPrice: expect.objectContaining({
            totalNetAmount: -100,
            totalGrossAmount: -119,
          }),
        })
      );
    });
  });

  describe("Performance Tests", () => {
    it("sollte große LineItem-Listen effizient verarbeiten", async () => {
      // Arrange
      const largeLineItems = Array.from({ length: 100 }, (_, i) => ({
        type: "custom",
        name: `Item ${i}`,
        quantity: 1,
        unitPrice: {
          value: {
            currency: "EUR",
            netAmount: 10,
            grossAmount: 11.9,
            taxRatePercentage: 19,
          },
        },
      }));

      mockExecuteFunctions.getNodeParameter.mockImplementation((param) => {
        if (param === "lineItems.item") return largeLineItems;
        return param.includes(".") ? {} : "";
      });

      lexwareApiRequest.mockResolvedValue({ id: "large-invoice" });

      const startTime = Date.now();

      // Act
      await executeInvoices.call(mockExecuteFunctions, 0, "create");

      // Assert
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(500); // Sollte unter 500ms dauern
      expect(lexwareApiRequest).toHaveBeenCalledWith(
        "POST",
        "/v1/invoices",
        expect.objectContaining({
          lineItems: expect.arrayContaining([
            expect.objectContaining({ name: "Item 0" }),
            expect.objectContaining({ name: "Item 99" }),
          ]),
        })
      );
    });
  });
});