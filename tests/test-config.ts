/**
 * Gemeinsame Test-Konfiguration und Utilities für alle Lexware Tests
 * 
 * Diese Datei enthält:
 * - Mock-Factories für häufig verwendete Objekte
 * - Test-Utilities und Helper-Funktionen
 * - Gemeinsame Assertion-Helper
 * - Standard-Mock-Daten
 */

import { IExecuteFunctions } from "n8n-core";
import { IDataObject } from "n8n-workflow";

// Standard Mock-Daten für Tests
export const mockCredentials = {
  accessToken: "test-access-token-123",
  baseUrl: "https://api.lexware.test",
};

export const mockNode = {
  name: "Lexware Test Node",
  type: "n8n-nodes-lexware.lexware",
  typeVersion: 1,
};

// Factory für IExecuteFunctions Mock
export function createMockExecuteFunctions(
  parameterOverrides: Record<string, any> = {}
): jest.Mocked<IExecuteFunctions> {
  const mockFunc = {
    getCredentials: jest.fn().mockResolvedValue(mockCredentials),
    getNode: jest.fn().mockReturnValue(mockNode),
    getNodeParameter: jest.fn().mockImplementation((param: string, index?: number, defaultValue?: any) => {
      return parameterOverrides[param] ?? defaultValue ?? "";
    }),
    getInputData: jest.fn().mockReturnValue([]),
    helpers: {
      httpRequest: jest.fn(),
      getBinaryDataBuffer: jest.fn(),
      prepareBinaryData: jest.fn(),
    },
  } as any;

  return mockFunc;
}

// Standard Test-Daten für verschiedene Entities
export const testData = {
  // Artikel Test-Daten
  article: {
    minimal: {
      title: "Test Artikel",
      type: "PRODUCT",
      price: {
        netPrice: 100,
        grossPrice: 119,
        leadingPrice: "NET",
        taxRate: 19,
      },
    },
    complete: {
      title: "Vollständiger Test Artikel",
      description: "Detaillierte Artikelbeschreibung",
      type: "SERVICE",
      articleNumber: "ART-2024-001",
      gtin: "1234567890123",
      note: "Wichtige Notizen zum Artikel",
      unitName: "Stück",
      price: {
        netPrice: 150.50,
        grossPrice: 179.095,
        leadingPrice: "GROSS",
        taxRate: 19,
      },
    },
  },

  // Kontakt Test-Daten
  contact: {
    company: {
      minimal: {
        companyName: "Test GmbH",
        createAsCustomer: true,
        createAsVendor: false,
      },
      complete: {
        companyName: "Vollständige Test GmbH",
        taxNumber: "123/456/78901",
        vatRegistrationId: "DE123456789",
        allowTaxFreeInvoices: true,
        createAsCustomer: true,
        createAsVendor: true,
        contactPersons: [
          {
            salutation: "Herr",
            firstName: "Max",
            lastName: "Mustermann",
            primary: true,
            emailAddress: "max.mustermann@test.de",
            phoneNumber: "+49 123 456789",
          },
        ],
        billingAddress: [
          {
            supplement: "Gebäude A",
            street: "Teststraße 123",
            zip: "12345",
            city: "Teststadt",
            countryCode: "DE",
          },
        ],
        emailAddresses: {
          business: [{ email: "info@test.de" }],
          office: [{ email: "office@test.de" }],
        },
        phoneNumbers: {
          business: [{ number: "+49 123 456789" }],
          fax: [{ number: "+49 123 456790" }],
        },
        note: "Wichtiger Geschäftskunde",
        archived: false,
      },
    },
    person: {
      minimal: {
        person: {
          firstName: "Maria",
          lastName: "Musterfrau",
        },
        createAsCustomer: true,
      },
      complete: {
        person: {
          salutation: "Frau",
          firstName: "Maria",
          lastName: "Musterfrau",
        },
        createAsCustomer: true,
        createAsVendor: false,
        billingAddress: [
          {
            street: "Privatstraße 456",
            zip: "54321",
            city: "Privatstadt",
            countryCode: "DE",
          },
        ],
        emailAddresses: {
          private: [{ email: "maria@private.de" }],
        },
        note: "Privatkunde",
      },
    },
  },

  // Rechnung Test-Daten
  invoice: {
    minimal: {
      title: "Test Rechnung",
      contactId: "contact-123",
      lineItems: [
        {
          type: "custom",
          name: "Test Service",
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
      ],
    },
    complete: {
      title: "Vollständige Test Rechnung R-2024-001",
      introduction: "Vielen Dank für Ihren Auftrag",
      remark: "Zahlung innerhalb 14 Tagen",
      voucherDate: "2024-03-15",
      contactId: "contact-456",
      lineItems: [
        {
          type: "service",
          name: "IT-Beratung",
          description: "Professionelle IT-Beratung",
          quantity: 10,
          unitName: "Stunden",
          unitPrice: {
            value: {
              currency: "EUR",
              netAmount: 120,
              grossAmount: 142.8,
              taxRatePercentage: 19,
            },
          },
          discountPercentage: 5,
          lineItemAmount: 1140, // 10 * 120 * 0.95
        },
        {
          type: "product",
          name: "Software-Lizenz",
          description: "Jahreslizenz für Spezialsoftware",
          quantity: 1,
          unitName: "Lizenz",
          unitPrice: {
            value: {
              currency: "EUR",
              netAmount: 500,
              grossAmount: 595,
              taxRatePercentage: 19,
            },
          },
          discountPercentage: 0,
          lineItemAmount: 500,
        },
      ],
      totalPrice: {
        currency: "EUR",
        totalNetAmount: 1640,
        totalGrossAmount: 1951.6,
        totalTaxAmount: 311.6,
      },
      taxConditions: {
        taxType: "net",
        taxTypeNote: "Alle Preise zzgl. MwSt.",
      },
      shippingConditions: {
        shippingType: "delivery",
        shippingDate: "2024-03-20",
        shippingEndDate: "2024-03-25",
      },
      paymentConditions: {
        paymentTermLabel: "14 Tage netto",
        paymentTermDuration: 14,
        paymentDiscountConditions: {
          value: {
            discountPercentage: 2,
            discountRange: 7,
          },
        },
      },
      xRechnung: {
        buyerReference: "PO-2024-001",
        invoiceNote: "Bestellung vom 01.03.2024",
      },
    },
  },

  // Datei Test-Daten
  file: {
    upload: {
      binaryPropertyName: "attachment",
      type: "invoice",
      metadata: {
        fileName: "test-document.pdf",
        mimeType: "application/pdf",
      },
      content: Buffer.from("Test PDF content"),
    },
    download: {
      fileId: "file-123",
      downloadPropertyName: "downloadedFile",
      response: {
        body: Buffer.from("Downloaded content"),
        headers: {
          "content-type": "application/pdf",
          "content-disposition": 'attachment; filename="downloaded.pdf"',
        },
      },
    },
  },

  // LineItems Test-Daten
  lineItems: {
    simple: [
      {
        type: "custom",
        name: "Simple Item",
        quantity: 1,
        unitPrice: {
          value: {
            currency: "EUR",
            netAmount: 50,
            grossAmount: 59.5,
            taxRatePercentage: 19,
          },
        },
      },
    ],
    complex: [
      {
        type: "service",
        name: "Premium Service",
        description: "Hochwertige Dienstleistung",
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
        discountPercentage: 10,
        lineItemAmount: 675, // 5 * 150 * 0.9
      },
      {
        type: "product",
        name: "Hardware Component",
        description: "Spezielle Hardware-Komponente",
        quantity: 2,
        unitName: "Stück",
        unitPrice: {
          value: {
            currency: "EUR",
            netAmount: 200,
            grossAmount: 238,
            taxRatePercentage: 19,
          },
        },
        discountPercentage: 0,
        lineItemAmount: 400,
      },
    ],
  },
};

// Test-Utilities
export const testUtils = {
  // Helper um Parameter-Mocks zu erstellen
  createParameterMock(params: Record<string, any>) {
    return jest.fn().mockImplementation((param: string, index?: number, defaultValue?: any) => {
      const keys = param.split(".");
      let value = params;
      for (const key of keys) {
        value = value?.[key];
      }
      return value ?? defaultValue;
    });
  },

  // Helper um API-Response-Mocks zu erstellen
  createApiResponseMock(data: any, statusCode = 200, headers = {}) {
    return {
      statusCode,
      headers,
      body: data,
      ...data, // Für direkte Zugriffe auf Response-Daten
    };
  },

  // Helper um Binary-Data-Mocks zu erstellen
  createBinaryDataMock(fileName: string, mimeType: string, content: Buffer) {
    return {
      fileName,
      mimeType,
      data: content.toString("base64"),
    };
  },

  // Helper um Datums-Tests zu vereinfachen
  expectValidLexwareDate(dateString: string | undefined) {
    if (!dateString) {
      expect(dateString).toBeUndefined();
      return;
    }
    
    // Format: YYYY-MM-DDTHH:mm:ss.sss±HH:MM
    const lexwareDatePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}[+-]\d{2}:\d{2}$/;
    expect(dateString).toMatch(lexwareDatePattern);
  },

  // Helper um LineItems zu validieren
  expectValidLineItems(items: IDataObject[]) {
    expect(Array.isArray(items)).toBe(true);
    
    items.forEach((item, index) => {
      expect(item).toHaveProperty("type");
      expect(item).toHaveProperty("name");
      
      // Optional: Weitere Validierungen
      if (item.unitPrice) {
        expect(item.unitPrice).toHaveProperty("currency");
        expect(typeof item.unitPrice.netAmount).toBe("number");
      }
    });
  },

  // Helper um API-Aufrufe zu validieren
  expectApiCall(
    mockFn: jest.Mock,
    method: string,
    endpoint: string,
    body?: any,
    queryParams?: any
  ) {
    const calls = mockFn.mock.calls;
    const matchingCall = calls.find(call => 
      call[0] === method && call[1] === endpoint
    );
    
    expect(matchingCall).toBeDefined();
    
    if (body !== undefined) {
      expect(matchingCall[2]).toEqual(body);
    }
    
    if (queryParams !== undefined) {
      expect(matchingCall[3]).toEqual(queryParams);
    }
  },

  // Performance Test Helper
  async measurePerformance<T>(
    operation: () => Promise<T>,
    maxDurationMs: number = 1000
  ): Promise<{ result: T; duration: number }> {
    const startTime = Date.now();
    const result = await operation();
    const duration = Date.now() - startTime;
    
    expect(duration).toBeLessThan(maxDurationMs);
    
    return { result, duration };
  },

  // Memory Test Helper
  measureMemoryUsage<T>(operation: () => T): { result: T; memoryDelta: number } {
    const startMemory = process.memoryUsage().heapUsed;
    const result = operation();
    const endMemory = process.memoryUsage().heapUsed;
    
    return {
      result,
      memoryDelta: endMemory - startMemory,
    };
  },
};

// Assertion Helpers
export const assertions = {
  // Validiert Standard-Response-Format
  expectStandardResponse(result: any[], expectedData: any) {
    expect(result).toBeInstanceOf(Array);
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty("json");
    expect(result[0].json).toEqual(expectedData);
  },

  // Validiert Array-Response-Format
  expectArrayResponse(result: any[], expectedDataArray: any[]) {
    expect(result).toBeInstanceOf(Array);
    expect(result).toHaveLength(expectedDataArray.length);
    
    result.forEach((item, index) => {
      expect(item).toHaveProperty("json");
      expect(item.json).toEqual(expectedDataArray[index]);
    });
  },

  // Validiert Error-Responses
  expectErrorResponse(error: any, expectedMessage?: string, expectedType?: any) {
    expect(error).toBeInstanceOf(Error);
    
    if (expectedMessage) {
      expect(error.message).toContain(expectedMessage);
    }
    
    if (expectedType) {
      expect(error).toBeInstanceOf(expectedType);
    }
  },
};

// Konstanten für Tests
export const constants = {
  // Standard-Timeouts
  DEFAULT_TIMEOUT: 5000,
  PERFORMANCE_TIMEOUT: 1000,
  INTEGRATION_TIMEOUT: 10000,

  // Standard-Limits
  MAX_MEMORY_USAGE: 50 * 1024 * 1024, // 50MB
  MAX_ARRAY_SIZE: 10000,

  // Standard-Werte
  DEFAULT_CURRENCY: "EUR",
  DEFAULT_TAX_RATE: 19,
  DEFAULT_COUNTRY_CODE: "DE",
};

// Export für einfachen Import in Tests
export default {
  testData,
  testUtils,
  assertions,
  constants,
  createMockExecuteFunctions,
  mockCredentials,
  mockNode,
};