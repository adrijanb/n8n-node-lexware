import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { IExecuteFunctions } from "n8n-core";
import { executePrintLayouts } from "../../nodes/Lexware/actions/PrintLayouts.execute";

// Mock der GenericFunctions
jest.mock("../../nodes/Lexware/GenericFunctions", () => ({
  lexwareApiRequest: jest.fn(),
}));

describe("PrintLayouts.execute - Umfassende Tests", () => {
  let mockExecuteFunctions: jest.Mocked<IExecuteFunctions>;
  const mockGenericFunctions = jest.requireMock("../../nodes/Lexware/GenericFunctions") as any;
  const { lexwareApiRequest } = mockGenericFunctions;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockExecuteFunctions = {
      getNodeParameter: jest.fn(),
      getNode: jest.fn(() => ({ name: "Lexware PrintLayouts" })),
    } as any;
  });

  describe("GET_ALL Operation", () => {
    it("sollte alle Print-Layouts abrufen", async () => {
      // Arrange
      const mockLayouts = [
        {
          id: "layout-1",
          name: "Standard Rechnung",
          type: "invoice",
          template: "default",
          active: true,
        },
        {
          id: "layout-2", 
          name: "Angebot Layout",
          type: "quotation",
          template: "modern",
          active: true,
        },
        {
          id: "layout-3",
          name: "Mahnung Layout",
          type: "dunning",
          template: "formal",
          active: false,
        },
      ];

      lexwareApiRequest.mockResolvedValue(mockLayouts);

      // Act
      const result = await executePrintLayouts.call(mockExecuteFunctions, 0, "getAll");

      // Assert
      expect(lexwareApiRequest).toHaveBeenCalledWith("GET", "/v1/print-layouts");
      expect(result).toEqual([
        { json: mockLayouts[0] },
        { json: mockLayouts[1] },
        { json: mockLayouts[2] },
      ]);
    });

    it("sollte mit leerer Layout-Liste umgehen", async () => {
      // Arrange
      lexwareApiRequest.mockResolvedValue([]);

      // Act
      const result = await executePrintLayouts.call(mockExecuteFunctions, 0, "getAll");

      // Assert
      expect(lexwareApiRequest).toHaveBeenCalledWith("GET", "/v1/print-layouts");
      expect(result).toEqual([]);
    });

    it("sollte mit einzelnem Layout-Objekt umgehen", async () => {
      // Arrange
      const singleLayout = {
        id: "single-layout",
        name: "Einzelnes Layout",
        type: "invoice",
      };
      lexwareApiRequest.mockResolvedValue(singleLayout);

      // Act
      const result = await executePrintLayouts.call(mockExecuteFunctions, 0, "getAll");

      // Assert
      expect(result).toEqual([{ json: singleLayout }]);
    });

    it("sollte komplexe Layout-Strukturen handhaben", async () => {
      // Arrange
      const complexLayouts = [
        {
          id: "complex-1",
          name: "Unternehmens-Layout",
          type: "invoice",
          template: "corporate",
          settings: {
            header: {
              logo: true,
              companyInfo: true,
              contactInfo: true,
            },
            footer: {
              pageNumbers: true,
              legalText: "Geschäftsführer: Max Mustermann",
              bankInfo: true,
            },
            colors: {
              primary: "#003366",
              secondary: "#0066CC",
              accent: "#FF6600",
            },
            fonts: {
              heading: "Arial Bold",
              body: "Arial",
              size: 11,
            },
          },
          customFields: [
            {
              name: "Projekt-Nummer",
              position: "header",
              required: true,
            },
            {
              name: "Kostenstelle",
              position: "footer",
              required: false,
            },
          ],
          active: true,
          createdAt: "2024-01-15T10:30:00Z",
          modifiedAt: "2024-03-10T14:20:00Z",
        },
      ];

      lexwareApiRequest.mockResolvedValue(complexLayouts);

      // Act
      const result = await executePrintLayouts.call(mockExecuteFunctions, 0, "getAll");

      // Assert
      expect(result).toHaveLength(1);
      expect((result[0].json.settings as any).header.logo).toBe(true);
      expect((result[0].json.settings as any).colors.primary).toBe("#003366");
      expect(result[0].json.customFields).toHaveLength(2);
    });

    it("sollte verschiedene Layout-Typen unterstützen", async () => {
      // Arrange
      const layoutTypes = [
        { id: "l1", type: "invoice", name: "Rechnungs-Layout" },
        { id: "l2", type: "quotation", name: "Angebots-Layout" },
        { id: "l3", type: "order", name: "Auftrags-Layout" },
        { id: "l4", type: "dunning", name: "Mahnungs-Layout" },
        { id: "l5", type: "delivery", name: "Lieferschein-Layout" },
        { id: "l6", type: "credit", name: "Gutschrift-Layout" },
      ];

      lexwareApiRequest.mockResolvedValue(layoutTypes);

      // Act
      const result = await executePrintLayouts.call(mockExecuteFunctions, 0, "getAll");

      // Assert
      expect(result).toHaveLength(6);
      layoutTypes.forEach((layout, index) => {
        expect(result[index].json.type).toBe(layout.type);
        expect(result[index].json.name).toBe(layout.name);
      });
    });

    it("sollte Layout-Metadaten korrekt verarbeiten", async () => {
      // Arrange
      const layoutsWithMetadata = [
        {
          id: "meta-1",
          name: "Layout mit Metadaten",
          metadata: {
            version: "2.1.0",
            author: "Design Team",
            description: "Modernes Layout für professionelle Rechnungen",
            tags: ["modern", "professional", "blue"],
            compatibility: ["invoice", "quotation"],
            lastUsed: "2024-03-15T09:30:00Z",
            usageCount: 147,
          },
          templateEngine: "mustache",
          templateVersion: "1.4.2",
        },
      ];

      lexwareApiRequest.mockResolvedValue(layoutsWithMetadata);

      // Act
      const result = await executePrintLayouts.call(mockExecuteFunctions, 0, "getAll");

      // Assert
      expect((result[0].json.metadata as any).version).toBe("2.1.0");
      expect((result[0].json.metadata as any).tags).toContain("modern");
      expect((result[0].json.metadata as any).usageCount).toBe(147);
    });

    it("sollte keine Parameter benötigen", async () => {
      // Arrange
      lexwareApiRequest.mockResolvedValue([]);

      // Act
      await executePrintLayouts.call(mockExecuteFunctions, 0, "getAll");

      // Assert
      expect(mockExecuteFunctions.getNodeParameter).not.toHaveBeenCalled();
      expect(lexwareApiRequest).toHaveBeenCalledWith("GET", "/v1/print-layouts");
      expect(lexwareApiRequest.mock.calls[0]).toHaveLength(2); // Nur method und endpoint
    });
  });

  describe("Error Handling", () => {
    it("sollte bei ungültiger Operation einen Fehler werfen", async () => {
      // Act & Assert
      await expect(
        executePrintLayouts.call(mockExecuteFunctions, 0, "invalidOperation")
      ).rejects.toThrow("Unsupported operation: invalidOperation");
    });

    it("sollte API-Fehler weiterleiten", async () => {
      // Arrange
      const apiError = new Error("Service temporarily unavailable");
      lexwareApiRequest.mockRejectedValue(apiError);

      // Act & Assert
      await expect(
        executePrintLayouts.call(mockExecuteFunctions, 0, "getAll")
      ).rejects.toThrow("Service temporarily unavailable");
    });

    it("sollte HTTP-Fehler-Codes handhaben", async () => {
      // Arrange
      const httpError = new Error("HTTP 500: Internal Server Error");
      lexwareApiRequest.mockRejectedValue(httpError);

      // Act & Assert
      await expect(
        executePrintLayouts.call(mockExecuteFunctions, 0, "getAll")
      ).rejects.toThrow("HTTP 500: Internal Server Error");
    });

    it("sollte Network-Fehler handhaben", async () => {
      // Arrange
      const networkError = new Error("Network connection failed");
      lexwareApiRequest.mockRejectedValue(networkError);

      // Act & Assert
      await expect(
        executePrintLayouts.call(mockExecuteFunctions, 0, "getAll")
      ).rejects.toThrow("Network connection failed");
    });
  });

  describe("Performance Tests", () => {
    it("sollte schnell ausgeführt werden", async () => {
      // Arrange
      const startTime = Date.now();
      lexwareApiRequest.mockResolvedValue([]);

      // Act
      await executePrintLayouts.call(mockExecuteFunctions, 0, "getAll");

      // Assert
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(100);
    });

    it("sollte große Layout-Listen effizient verarbeiten", async () => {
      // Arrange
      const largeLayoutList = Array.from({ length: 1000 }, (_, i) => ({
        id: `layout-${i}`,
        name: `Layout ${i}`,
        type: i % 2 === 0 ? "invoice" : "quotation",
        active: i % 3 !== 0,
        template: `template-${i % 10}`,
      }));

      lexwareApiRequest.mockResolvedValue(largeLayoutList);
      const startTime = Date.now();

      // Act
      const result = await executePrintLayouts.call(mockExecuteFunctions, 0, "getAll");

      // Assert
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(500);
      expect(result).toHaveLength(1000);
      expect(result[0].json.id).toBe("layout-0");
      expect(result[999].json.id).toBe("layout-999");
    });

    it("sollte bei wiederholten Aufrufen konsistent performen", async () => {
      // Arrange
      const layouts = Array.from({ length: 50 }, (_, i) => ({
        id: `perf-layout-${i}`,
        name: `Performance Layout ${i}`,
      }));

      lexwareApiRequest.mockResolvedValue(layouts);
      const times: number[] = [];

      // Act - 10 Aufrufe zur Performance-Messung
      for (let i = 0; i < 10; i++) {
        const start = Date.now();
        await executePrintLayouts.call(mockExecuteFunctions, 0, "getAll");
        const end = Date.now();
        times.push(end - start);
      }

      // Assert
      const avgTime = times.reduce((a, b) => a + b) / times.length;
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);

      expect(maxTime - minTime).toBeLessThan(Math.max(avgTime * 2, 1)); // Variation unter 200%
      expect(avgTime).toBeLessThan(100); // Durchschnitt unter 100ms
    });
  });

  describe("Response Format Tests", () => {
    it("sollte mit null/undefined Antworten umgehen", async () => {
      // Test null response
      lexwareApiRequest.mockResolvedValue(null);
      const nullResult = await executePrintLayouts.call(mockExecuteFunctions, 0, "getAll");
      expect(nullResult).toEqual([{ json: null }]);

      // Test undefined response
      lexwareApiRequest.mockResolvedValue(undefined);
      const undefinedResult = await executePrintLayouts.call(mockExecuteFunctions, 0, "getAll");
      expect(undefinedResult).toEqual([{ json: undefined }]);
    });

    it("sollte mit verschachtelten Array-Strukturen umgehen", async () => {
      // Arrange
      const nestedResponse = {
        layouts: [
          { id: "nested-1", name: "Nested Layout 1" },
          { id: "nested-2", name: "Nested Layout 2" },
        ],
        metadata: {
          total: 2,
          page: 1,
        },
      };

      lexwareApiRequest.mockResolvedValue(nestedResponse);

      // Act
      const result = await executePrintLayouts.call(mockExecuteFunctions, 0, "getAll");

      // Assert
      expect(result).toEqual([{ json: nestedResponse }]);
    });

    it("sollte Unicode-Zeichen in Layout-Namen handhaben", async () => {
      // Arrange
      const unicodeLayouts = [
        { id: "unicode-1", name: "Ämter & Öffentliche Einrichtungen" },
        { id: "unicode-2", name: "Español - Facturas Técnicas" },
        { id: "unicode-3", name: "中文发票模板" },
        { id: "unicode-4", name: "Русский шаблон счета" },
        { id: "unicode-5", name: "🎨 Creative Design Layout 🖌️" },
      ];

      lexwareApiRequest.mockResolvedValue(unicodeLayouts);

      // Act
      const result = await executePrintLayouts.call(mockExecuteFunctions, 0, "getAll");

      // Assert
      expect(result).toHaveLength(5);
      expect(result[0].json.name).toBe("Ämter & Öffentliche Einrichtungen");
      expect(result[1].json.name).toBe("Español - Facturas Técnicas");
      expect(result[2].json.name).toBe("中文发票模板");
      expect(result[3].json.name).toBe("Русский шаблон счета");
      expect(result[4].json.name).toBe("🎨 Creative Design Layout 🖌️");
    });

    it("sollte mit verschiedenen Datentypen in Properties umgehen", async () => {
      // Arrange
      const mixedTypeLayouts = [
        {
          id: "mixed-1",
          name: "Mixed Types Layout",
          active: true,
          priority: 1,
          ratio: 1.5,
          tags: ["important", "default"],
          settings: {
            enabled: false,
            count: 0,
            nested: {
              deep: "value",
            },
          },
          nullValue: null,
          undefinedValue: undefined,
        },
      ];

      lexwareApiRequest.mockResolvedValue(mixedTypeLayouts);

      // Act
      const result = await executePrintLayouts.call(mockExecuteFunctions, 0, "getAll");

      // Assert
      const layout = result[0].json;
      expect(typeof layout.active).toBe("boolean");
      expect(typeof layout.priority).toBe("number");
      expect(typeof layout.ratio).toBe("number");
      expect(Array.isArray(layout.tags)).toBe(true);
      expect(typeof layout.settings).toBe("object");
      expect(layout.nullValue).toBe(null);
    });
  });

  describe("Edge Cases", () => {
    it("sollte mit sehr langen Layout-Namen umgehen", async () => {
      // Arrange
      const longNameLayout = {
        id: "long-name",
        name: "a".repeat(1000), // 1000 Zeichen langer Name
        type: "invoice",
      };

      lexwareApiRequest.mockResolvedValue([longNameLayout]);

      // Act
      const result = await executePrintLayouts.call(mockExecuteFunctions, 0, "getAll");

      // Assert
      expect(result[0].json.name).toHaveLength(1000);
      expect(result[0].json.name).toBe("a".repeat(1000));
    });

    it("sollte mit leeren/ungültigen IDs umgehen", async () => {
      // Arrange
      const invalidIdLayouts = [
        { id: "", name: "Empty ID Layout" },
        { id: null, name: "Null ID Layout" },
        { id: undefined, name: "Undefined ID Layout" },
        { name: "No ID Layout" }, // Kein ID-Feld
      ];

      lexwareApiRequest.mockResolvedValue(invalidIdLayouts);

      // Act
      const result = await executePrintLayouts.call(mockExecuteFunctions, 0, "getAll");

      // Assert
      expect(result).toHaveLength(4);
      expect(result[0].json.id).toBe("");
      expect(result[1].json.id).toBe(null);
      expect(result[2].json.id).toBe(undefined);
      expect(result[3].json).not.toHaveProperty("id");
    });

    it("sollte mit zirkulären Referenzen umgehen", async () => {
      // Arrange
      const circularLayout: any = {
        id: "circular",
        name: "Circular Reference Layout",
      };
      circularLayout.self = circularLayout; // Zirkuläre Referenz

      // Da JSON.stringify bei zirkulären Referenzen fehlschlägt,
      // aber unser Code die Objekte direkt weitergibt, sollte es funktionieren
      lexwareApiRequest.mockResolvedValue([circularLayout]);

      // Act & Assert
      // Sollte nicht fehlschlagen, da wir die Objekte direkt verarbeiten
      const result = await executePrintLayouts.call(mockExecuteFunctions, 0, "getAll");
      expect(result[0].json.id).toBe("circular");
      expect(result[0].json.self).toBe(result[0].json); // Zirkuläre Referenz erhalten
    });
  });

  describe("API Integration", () => {
    it("sollte korrekte HTTP-Methode verwenden", async () => {
      // Arrange
      lexwareApiRequest.mockResolvedValue([]);

      // Act
      await executePrintLayouts.call(mockExecuteFunctions, 0, "getAll");

      // Assert
      expect(lexwareApiRequest).toHaveBeenCalledWith("GET", "/v1/print-layouts");
      expect(lexwareApiRequest.mock.calls[0][0]).toBe("GET");
    });

    it("sollte korrekten Endpoint verwenden", async () => {
      // Arrange
      lexwareApiRequest.mockResolvedValue([]);

      // Act
      await executePrintLayouts.call(mockExecuteFunctions, 0, "getAll");

      // Assert
      expect(lexwareApiRequest).toHaveBeenCalledWith("GET", "/v1/print-layouts");
      expect(lexwareApiRequest.mock.calls[0][1]).toBe("/v1/print-layouts");
    });

    it("sollte keine zusätzlichen Parameter oder Body senden", async () => {
      // Arrange
      lexwareApiRequest.mockResolvedValue([]);

      // Act
      await executePrintLayouts.call(mockExecuteFunctions, 0, "getAll");

      // Assert
      const callArgs = lexwareApiRequest.mock.calls[0];
      expect(callArgs).toHaveLength(2); // Nur method und endpoint
      expect(callArgs[2]).toBeUndefined(); // Kein body
      expect(callArgs[3]).toBeUndefined(); // Keine query params
    });
  });
});
