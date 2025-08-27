import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { IExecuteFunctions } from "n8n-core";
import { IDataObject } from "n8n-workflow";
import { executeDunnings } from "../../nodes/Lexware/actions/Dunnings.execute";

// Mock der GenericFunctions und Utils
jest.mock("../../nodes/Lexware/GenericFunctions", () => ({
  lexwareApiRequest: jest.fn(),
}));

jest.mock("../../nodes/Lexware/utils/LineItems", () => ({
  parseLineItemsFromCollection: jest.fn(),
}));

jest.mock("../../nodes/Lexware/utils/date", () => ({
  formatToLexwareDate: jest.fn(),
}));

describe("Dunnings.execute - Umfassende Tests", () => {
  let mockExecuteFunctions: jest.Mocked<IExecuteFunctions>;
  const { lexwareApiRequest } = jest.requireMock("../../nodes/Lexware/GenericFunctions");
  const { parseLineItemsFromCollection } = jest.requireMock("../../nodes/Lexware/utils/LineItems");
  const { formatToLexwareDate } = jest.requireMock("../../nodes/Lexware/utils/date");

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockExecuteFunctions = {
      getNodeParameter: jest.fn(),
      getNode: jest.fn(() => ({ name: "Lexware Dunnings" })),
    } as any;

    // Standard-Mocks
    formatToLexwareDate.mockImplementation((date: string) => 
      date ? `${date}T00:00:00.000+01:00` : undefined
    );
    parseLineItemsFromCollection.mockImplementation((items: any[]) => items || []);
  });

  describe("CREATE Operation", () => {
    it("sollte eine Mahnung basierend auf einer bestehenden Rechnung erstellen", async () => {
      // Arrange
      const dunningData = {
        precedingSalesVoucherId: "invoice-123",
        finalize: false,
        voucherDate: "2024-03-20",
        title: "1. Mahnung",
        extraLineItems: [
          {
            type: "custom",
            name: "Mahngebühr",
            description: "Gebühr für erste Mahnung",
            quantity: 1,
            unitName: "Stück",
            unitPrice: {
              value: {
                currency: "EUR",
                netAmount: 5,
                grossAmount: 5.95,
                taxRatePercentage: 19,
              },
            },
            lineItemAmount: 5,
          },
        ],
      };

      const baseInvoice = {
        id: "invoice-123",
        lineItems: [
          {
            type: "service",
            name: "Beratung",
            description: "IT-Beratung",
            quantity: 10,
            unitName: "Stunden",
            unitPrice: {
              currency: "EUR",
              netAmount: 100,
              grossAmount: 119,
              taxRatePercentage: 19,
            },
            lineItemAmount: 1000,
          },
        ],
        address: {
          contactId: "contact-456",
          street: "Teststraße 123",
          city: "Teststadt",
        },
        shippingConditions: {
          shippingType: "delivery",
          shippingDate: "2024-03-15",
        },
        taxConditions: {
          taxType: "net",
        },
        totalPrice: {
          currency: "EUR",
          totalNetAmount: 1000,
          totalGrossAmount: 1190,
        },
      };

      mockExecuteFunctions.getNodeParameter.mockImplementation((param) => {
        switch (param) {
          case "precedingSalesVoucherId": return dunningData.precedingSalesVoucherId;
          case "finalize": return dunningData.finalize;
          case "voucherDate": return dunningData.voucherDate;
          case "title": return dunningData.title;
          case "lineItems.item": return dunningData.extraLineItems;
          default: return "";
        }
      });

      formatToLexwareDate.mockReturnValue("2024-03-20T00:00:00.000+01:00");
      parseLineItemsFromCollection.mockReturnValue(dunningData.extraLineItems);

      lexwareApiRequest
        .mockResolvedValueOnce(baseInvoice) // GET base invoice
        .mockResolvedValueOnce({ // POST dunning
          headers: { location: "/v1/dunnings/dunning-789" },
          statusCode: 201,
          body: {},
        });

      // Act
      const result = await executeDunnings.call(mockExecuteFunctions, 0, "create");

      // Assert
      // Überprüfe GET-Aufruf für base invoice
      expect(lexwareApiRequest).toHaveBeenNthCalledWith(1,
        "GET",
        "/v1/invoices/invoice-123"
      );

      // Überprüfe POST-Aufruf für Mahnung
      expect(lexwareApiRequest).toHaveBeenNthCalledWith(2,
        "POST",
        "/v1/dunnings",
        expect.objectContaining({
          title: "1. Mahnung",
          voucherDate: "2024-03-20T00:00:00.000+01:00",
          address: baseInvoice.address,
          lineItems: expect.arrayContaining([
            ...baseInvoice.lineItems,
            ...dunningData.extraLineItems,
          ]),
          totalPrice: expect.objectContaining({
            currency: "EUR",
            totalNetAmount: 1005, // 1000 + 5 (Mahngebühr)
          }),
          taxConditions: baseInvoice.taxConditions,
          shippingConditions: baseInvoice.shippingConditions,
        }),
        { precedingSalesVoucherId: "invoice-123" },
        { returnFullResponse: true }
      );

      expect(result).toEqual([{
        json: {
          id: "dunning-789",
          resourceUrl: "/v1/dunnings/dunning-789",
          statusCode: 201,
        },
      }]);
    });

    it("sollte Mahnung mit finalize=true erstellen", async () => {
      // Arrange
      mockExecuteFunctions.getNodeParameter.mockImplementation((param) => {
        switch (param) {
          case "precedingSalesVoucherId": return "invoice-456";
          case "finalize": return true;
          case "lineItems.item": return [];
          default: return "";
        }
      });

      const baseInvoice = {
        lineItems: [],
        address: {},
        shippingConditions: {},
        taxConditions: {},
        totalPrice: { currency: "EUR" },
      };

      lexwareApiRequest
        .mockResolvedValueOnce(baseInvoice)
        .mockResolvedValueOnce({ id: "finalized-dunning" });

      // Act
      await executeDunnings.call(mockExecuteFunctions, 0, "create");

      // Assert
      expect(lexwareApiRequest).toHaveBeenNthCalledWith(2,
        "POST",
        "/v1/dunnings",
        expect.any(Object),
        { precedingSalesVoucherId: "invoice-456", finalize: true },
        { returnFullResponse: true }
      );
    });

    it("sollte ohne zusätzliche LineItems funktionieren", async () => {
      // Arrange
      mockExecuteFunctions.getNodeParameter.mockImplementation((param) => {
        switch (param) {
          case "precedingSalesVoucherId": return "invoice-789";
          case "finalize": return false;
          case "lineItems.item": return [];
          default: return "";
        }
      });

      const baseInvoice = {
        lineItems: [
          {
            type: "product",
            name: "Existing Item",
            lineItemAmount: 500,
          },
        ],
        address: { contactId: "contact-123" },
        shippingConditions: {},
        taxConditions: {},
        totalPrice: { currency: "EUR" },
      };

      parseLineItemsFromCollection.mockReturnValue([]);

      lexwareApiRequest
        .mockResolvedValueOnce(baseInvoice)
        .mockResolvedValueOnce({ id: "simple-dunning" });

      // Act
      await executeDunnings.call(mockExecuteFunctions, 0, "create");

      // Assert
      expect(lexwareApiRequest).toHaveBeenNthCalledWith(2,
        "POST",
        "/v1/dunnings",
        expect.objectContaining({
          lineItems: baseInvoice.lineItems, // Nur base items, keine zusätzlichen
          totalPrice: expect.objectContaining({
            totalNetAmount: 500, // Nur der Basis-Betrag
          }),
        }),
        expect.any(Object),
        expect.any(Object)
      );
    });

    it("sollte Standard-TaxConditions setzen wenn Base Invoice keine hat", async () => {
      // Arrange
      mockExecuteFunctions.getNodeParameter.mockImplementation((param) => {
        switch (param) {
          case "precedingSalesVoucherId": return "invoice-no-tax";
          case "lineItems.item": return [];
          default: return "";
        }
      });

      const baseInvoiceWithoutTax = {
        lineItems: [],
        address: {},
        shippingConditions: {},
        taxConditions: {}, // Leeres Objekt
        totalPrice: { currency: "EUR" },
      };

      lexwareApiRequest
        .mockResolvedValueOnce(baseInvoiceWithoutTax)
        .mockResolvedValueOnce({ id: "default-tax-dunning" });

      // Act
      await executeDunnings.call(mockExecuteFunctions, 0, "create");

      // Assert
      expect(lexwareApiRequest).toHaveBeenNthCalledWith(2,
        "POST",
        "/v1/dunnings",
        expect.objectContaining({
          taxConditions: { taxType: "net" }, // Standard-Wert
        }),
        expect.any(Object),
        expect.any(Object)
      );
    });

    it("sollte shippingConditions nur setzen wenn vorhanden", async () => {
      // Arrange
      mockExecuteFunctions.getNodeParameter.mockImplementation((param) => {
        switch (param) {
          case "precedingSalesVoucherId": return "invoice-no-shipping";
          case "lineItems.item": return [];
          default: return "";
        }
      });

      const baseInvoiceWithoutShipping = {
        lineItems: [],
        address: {},
        shippingConditions: {}, // Leeres Objekt
        taxConditions: { taxType: "gross" },
        totalPrice: { currency: "EUR" },
      };

      lexwareApiRequest
        .mockResolvedValueOnce(baseInvoiceWithoutShipping)
        .mockResolvedValueOnce({ id: "no-shipping-dunning" });

      // Act
      await executeDunnings.call(mockExecuteFunctions, 0, "create");

      // Assert
      const calledData = lexwareApiRequest.mock.calls[1][2];
      expect(calledData).not.toHaveProperty("shippingConditions");
    });

    it("sollte komplexe LineItem-Berechnungen korrekt durchführen", async () => {
      // Arrange
      const baseLineItems = [
        { lineItemAmount: 1000 },
        { lineItemAmount: 500 },
        { lineItemAmount: "300" }, // String-Wert
      ];

      const extraLineItems = [
        { lineItemAmount: 50 },
        { lineItemAmount: -25 }, // Negativer Wert (Rabatt)
        { lineItemAmount: null }, // Null-Wert
        { lineItemAmount: undefined }, // Undefined
      ];

      mockExecuteFunctions.getNodeParameter.mockImplementation((param) => {
        switch (param) {
          case "precedingSalesVoucherId": return "invoice-complex";
          case "lineItems.item": return extraLineItems;
          default: return "";
        }
      });

      const baseInvoice = {
        lineItems: baseLineItems,
        address: {},
        shippingConditions: {},
        taxConditions: { taxType: "net" },
        totalPrice: { currency: "EUR" },
      };

      parseLineItemsFromCollection.mockReturnValue(extraLineItems);

      lexwareApiRequest
        .mockResolvedValueOnce(baseInvoice)
        .mockResolvedValueOnce({ id: "complex-calc-dunning" });

      // Act
      await executeDunnings.call(mockExecuteFunctions, 0, "create");

      // Assert
      expect(lexwareApiRequest).toHaveBeenNthCalledWith(2,
        "POST",
        "/v1/dunnings",
        expect.objectContaining({
          totalPrice: expect.objectContaining({
            totalNetAmount: 1825, // 1000+500+300+50-25+0+0
          }),
        }),
        expect.any(Object),
        expect.any(Object)
      );
    });

    it("sollte mit fehlender voucherDate umgehen", async () => {
      // Arrange
      mockExecuteFunctions.getNodeParameter.mockImplementation((param) => {
        switch (param) {
          case "precedingSalesVoucherId": return "invoice-no-date";
          case "voucherDate": return "";
          case "lineItems.item": return [];
          default: return "";
        }
      });

      formatToLexwareDate.mockReturnValue(undefined);

      const baseInvoice = {
        lineItems: [],
        address: {},
        shippingConditions: {},
        taxConditions: { taxType: "net" },
        totalPrice: { currency: "EUR" },
      };

      lexwareApiRequest
        .mockResolvedValueOnce(baseInvoice)
        .mockResolvedValueOnce({ id: "no-date-dunning" });

      // Act
      await executeDunnings.call(mockExecuteFunctions, 0, "create");

      // Assert
      const calledData = lexwareApiRequest.mock.calls[1][2];
      expect(calledData.voucherDate).toBeUndefined();
    });

    it("sollte Location-Header korrekt parsen", async () => {
      // Arrange
      mockExecuteFunctions.getNodeParameter.mockImplementation((param) => {
        switch (param) {
          case "precedingSalesVoucherId": return "invoice-location";
          case "lineItems.item": return [];
          default: return "";
        }
      });

      const baseInvoice = {
        lineItems: [],
        address: {},
        shippingConditions: {},
        taxConditions: { taxType: "net" },
        totalPrice: { currency: "EUR" },
      };

      lexwareApiRequest
        .mockResolvedValueOnce(baseInvoice)
        .mockResolvedValueOnce({
          headers: { location: "/v1/dunnings/parsed-id-123" },
          statusCode: 201,
          body: {},
        });

      // Act
      const result = await executeDunnings.call(mockExecuteFunctions, 0, "create");

      // Assert
      expect(result[0].json).toEqual({
        id: "parsed-id-123",
        resourceUrl: "/v1/dunnings/parsed-id-123",
        statusCode: 201,
      });
    });

    it("sollte mit API-Response Body umgehen wenn Location fehlt", async () => {
      // Arrange
      mockExecuteFunctions.getNodeParameter.mockImplementation((param) => {
        switch (param) {
          case "precedingSalesVoucherId": return "invoice-body";
          case "lineItems.item": return [];
          default: return "";
        }
      });

      const baseInvoice = {
        lineItems: [],
        address: {},
        shippingConditions: {},
        taxConditions: { taxType: "net" },
        totalPrice: { currency: "EUR" },
      };

      const responseBody = {
        id: "body-response-dunning",
        title: "Created Dunning",
        status: "draft",
      };

      lexwareApiRequest
        .mockResolvedValueOnce(baseInvoice)
        .mockResolvedValueOnce({
          headers: {},
          statusCode: 200,
          body: responseBody,
        });

      // Act
      const result = await executeDunnings.call(mockExecuteFunctions, 0, "create");

      // Assert
      expect(result[0].json).toEqual(responseBody);
    });
  });

  describe("GET Operation", () => {
    it("sollte eine spezifische Mahnung abrufen", async () => {
      // Arrange
      const dunningId = "dunning-456";
      mockExecuteFunctions.getNodeParameter.mockReturnValue(dunningId);

      const mockDunning = {
        id: dunningId,
        title: "2. Mahnung",
        status: "finalized",
        totalPrice: {
          currency: "EUR",
          totalNetAmount: 1050,
        },
      };

      lexwareApiRequest.mockResolvedValue(mockDunning);

      // Act
      const result = await executeDunnings.call(mockExecuteFunctions, 0, "get");

      // Assert
      expect(lexwareApiRequest).toHaveBeenCalledWith(
        "GET",
        `/v1/dunnings/${dunningId}`
      );
      expect(result).toEqual([{ json: mockDunning }]);
    });

    it("sollte mit nicht existierender Mahnung umgehen", async () => {
      // Arrange
      mockExecuteFunctions.getNodeParameter.mockReturnValue("non-existent");
      lexwareApiRequest.mockResolvedValue(null);

      // Act
      const result = await executeDunnings.call(mockExecuteFunctions, 0, "get");

      // Assert
      expect(result).toEqual([{ json: null }]);
    });
  });

  describe("Error Handling", () => {
    it("sollte bei ungültiger Operation einen Fehler werfen", async () => {
      await expect(
        executeDunnings.call(mockExecuteFunctions, 0, "invalidOperation")
      ).rejects.toThrow("Unsupported operation: invalidOperation");
    });

    it("sollte API-Fehler beim Abrufen der Base Invoice handhaben", async () => {
      // Arrange
      mockExecuteFunctions.getNodeParameter.mockImplementation((param) => {
        if (param === "precedingSalesVoucherId") return "non-existent-invoice";
        return "";
      });

      lexwareApiRequest.mockRejectedValue(new Error("Invoice not found"));

      // Act & Assert
      await expect(
        executeDunnings.call(mockExecuteFunctions, 0, "create")
      ).rejects.toThrow("Invoice not found");
    });

    it("sollte API-Fehler beim Erstellen der Mahnung handhaben", async () => {
      // Arrange
      mockExecuteFunctions.getNodeParameter.mockImplementation((param) => {
        switch (param) {
          case "precedingSalesVoucherId": return "valid-invoice";
          case "lineItems.item": return [];
          default: return "";
        }
      });

      const baseInvoice = {
        lineItems: [],
        address: {},
        shippingConditions: {},
        taxConditions: { taxType: "net" },
        totalPrice: { currency: "EUR" },
      };

      lexwareApiRequest
        .mockResolvedValueOnce(baseInvoice)
        .mockRejectedValueOnce(new Error("Dunning creation failed"));

      // Act & Assert
      await expect(
        executeDunnings.call(mockExecuteFunctions, 0, "create")
      ).rejects.toThrow("Dunning creation failed");
    });

    it("sollte mit fehlerhaften LineItems umgehen", async () => {
      // Arrange
      mockExecuteFunctions.getNodeParameter.mockImplementation((param) => {
        switch (param) {
          case "precedingSalesVoucherId": return "valid-invoice";
          case "lineItems.item": return "invalid-data";
          default: return "";
        }
      });

      parseLineItemsFromCollection.mockImplementation(() => {
        throw new Error("Invalid line items format");
      });

      // Act & Assert
      await expect(
        executeDunnings.call(mockExecuteFunctions, 0, "create")
      ).rejects.toThrow("Invalid line items format");
    });
  });

  describe("Edge Cases", () => {
    it("sollte mit Base Invoice ohne LineItems umgehen", async () => {
      // Arrange
      mockExecuteFunctions.getNodeParameter.mockImplementation((param) => {
        switch (param) {
          case "precedingSalesVoucherId": return "empty-invoice";
          case "lineItems.item": return [{ lineItemAmount: 10 }];
          default: return "";
        }
      });

      const emptyBaseInvoice = {
        lineItems: undefined, // Keine LineItems
        address: {},
        shippingConditions: {},
        taxConditions: { taxType: "net" },
        totalPrice: { currency: "EUR" },
      };

      parseLineItemsFromCollection.mockReturnValue([{ lineItemAmount: 10 }]);

      lexwareApiRequest
        .mockResolvedValueOnce(emptyBaseInvoice)
        .mockResolvedValueOnce({ id: "empty-base-dunning" });

      // Act
      await executeDunnings.call(mockExecuteFunctions, 0, "create");

      // Assert
      const calledData = lexwareApiRequest.mock.calls[1][2];
      expect(calledData.lineItems).toEqual([{ lineItemAmount: 10 }]);
      expect(calledData.totalPrice.totalNetAmount).toBe(10);
    });

    it("sollte mit fehlendem totalPrice.currency umgehen", async () => {
      // Arrange
      mockExecuteFunctions.getNodeParameter.mockImplementation((param) => {
        switch (param) {
          case "precedingSalesVoucherId": return "no-currency-invoice";
          case "lineItems.item": return [];
          default: return "";
        }
      });

      const noCurrencyInvoice = {
        lineItems: [],
        address: {},
        shippingConditions: {},
        taxConditions: { taxType: "net" },
        totalPrice: {}, // Keine Currency
      };

      lexwareApiRequest
        .mockResolvedValueOnce(noCurrencyInvoice)
        .mockResolvedValueOnce({ id: "no-currency-dunning" });

      // Act
      await executeDunnings.call(mockExecuteFunctions, 0, "create");

      // Assert
      const calledData = lexwareApiRequest.mock.calls[1][2];
      expect(calledData.totalPrice.currency).toBe("EUR"); // Standard-Wert
    });

    it("sollte mit sehr großen LineItem-Listen umgehen", async () => {
      // Arrange
      const largeBaseItems = Array.from({ length: 1000 }, (_, i) => ({
        lineItemAmount: i + 1,
      }));
      
      const largeExtraItems = Array.from({ length: 500 }, (_, i) => ({
        lineItemAmount: i * 0.1,
      }));

      mockExecuteFunctions.getNodeParameter.mockImplementation((param) => {
        switch (param) {
          case "precedingSalesVoucherId": return "large-invoice";
          case "lineItems.item": return largeExtraItems;
          default: return "";
        }
      });

      const largeInvoice = {
        lineItems: largeBaseItems,
        address: {},
        shippingConditions: {},
        taxConditions: { taxType: "net" },
        totalPrice: { currency: "EUR" },
      };

      parseLineItemsFromCollection.mockReturnValue(largeExtraItems);

      lexwareApiRequest
        .mockResolvedValueOnce(largeInvoice)
        .mockResolvedValueOnce({ id: "large-dunning" });

      const startTime = Date.now();

      // Act
      await executeDunnings.call(mockExecuteFunctions, 0, "create");

      // Assert
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(5000); // Sollte unter 5 Sekunden dauern

      const calledData = lexwareApiRequest.mock.calls[1][2];
      expect(calledData.lineItems).toHaveLength(1500); // 1000 + 500
    });
  });

  describe("Integration Scenarios", () => {
    it("sollte realistische Mahnungs-Pipeline simulieren", async () => {
      // Simulate: Rechnung → 1. Mahnung → 2. Mahnung → 3. Mahnung
      
      const originalInvoice = {
        id: "invoice-001",
        lineItems: [
          { type: "service", name: "Beratung", lineItemAmount: 1000 },
        ],
        address: { contactId: "customer-123" },
        shippingConditions: { shippingType: "delivery" },
        taxConditions: { taxType: "net" },
        totalPrice: { currency: "EUR" },
      };

      // 1. Mahnung
      mockExecuteFunctions.getNodeParameter.mockImplementation((param) => {
        switch (param) {
          case "precedingSalesVoucherId": return "invoice-001";
          case "title": return "1. Mahnung";
          case "lineItems.item": return [{ lineItemAmount: 5 }]; // Mahngebühr
          default: return "";
        }
      });

      parseLineItemsFromCollection.mockReturnValue([{ lineItemAmount: 5 }]);

      lexwareApiRequest
        .mockResolvedValueOnce(originalInvoice)
        .mockResolvedValueOnce({
          headers: { location: "/v1/dunnings/dunning-001-1" },
          statusCode: 201,
          body: {},
        });

      const result1 = await executeDunnings.call(mockExecuteFunctions, 0, "create");

      // Assertions für 1. Mahnung
      expect(result1[0].json.id).toBe("dunning-001-1");
      
      const firstDunningData = lexwareApiRequest.mock.calls[1][2];
      expect(firstDunningData.title).toBe("1. Mahnung");
      expect(firstDunningData.totalPrice.totalNetAmount).toBe(1005); // 1000 + 5
      expect(firstDunningData.lineItems).toHaveLength(2); // Original + Mahngebühr
    });
  });
});