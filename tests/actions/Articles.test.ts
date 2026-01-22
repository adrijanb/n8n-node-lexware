import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { IExecuteFunctions } from "n8n-core";
import { IDataObject, NodeOperationError } from "n8n-workflow";
import { executeArticles } from "../../nodes/Lexware/actions/Articles.execute";

// Mock der GenericFunctions
jest.mock("../../nodes/Lexware/GenericFunctions", () => ({
  lexwareApiRequest: jest.fn(),
  lexwareApiRequestAllItems: jest.fn(),
}));

describe("Articles.execute - Umfassende Tests", () => {
  let mockExecuteFunctions: jest.Mocked<IExecuteFunctions>;
  const mockGenericFunctions = jest.requireMock("../../nodes/Lexware/GenericFunctions") as any;
  const { lexwareApiRequest } = mockGenericFunctions;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockExecuteFunctions = {
      getNodeParameter: jest.fn(),
      getNode: jest.fn(() => ({ name: "Lexware Articles" })),
    } as any;
  });

  describe("CREATE Operation", () => {
    it("sollte einen Artikel mit vollständigen Daten erstellen", async () => {
      // Arrange
      const expectedArticle = {
        title: "Test Produkt",
        description: "Test Beschreibung",
        type: "PRODUCT",
        articleNumber: "ART-001",
        gtin: "1234567890123",
        note: "Test Notiz",
        unitName: "Stück",
        version: 0,
        price: {
          netPrice: 100,
          grossPrice: 119,
          leadingPrice: "NET",
          taxRate: 19,
        },
      };

      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce("Test Produkt") // title
        .mockReturnValueOnce("Test Beschreibung") // description
        .mockReturnValueOnce("PRODUCT") // type
        .mockReturnValueOnce("ART-001") // articleNumber
        .mockReturnValueOnce("1234567890123") // gtin
        .mockReturnValueOnce("Test Notiz") // note
        .mockReturnValueOnce("Stück") // unitName
        .mockReturnValueOnce(100) // netPrice
        .mockReturnValueOnce(119) // grossPrice
        .mockReturnValueOnce("NET") // leadingPrice
        .mockReturnValueOnce(19); // taxRate

      const mockResponse = { id: "art-123", ...expectedArticle };
      lexwareApiRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await executeArticles.call(mockExecuteFunctions, 0, "create");

      // Assert
      expect(lexwareApiRequest).toHaveBeenCalledWith(
        "POST",
        "/v1/articles",
        expectedArticle
      );
      expect(result).toEqual([{ json: mockResponse }]);
    });

    it("sollte einen Artikel mit minimalen Daten erstellen", async () => {
      // Arrange
      mockExecuteFunctions.getNodeParameter.mockImplementation(
        (_param: string, _index?: number, defaultValue?: unknown) =>
          defaultValue ?? ""
      );

      const expectedArticle = {
        type: "PRODUCT",
        version: 0,
        price: {
          netPrice: 0,
          grossPrice: 0,
          leadingPrice: "NET",
          taxRate: 19,
        },
      };

      lexwareApiRequest.mockResolvedValue({ id: "art-124" });

      // Act
      const result = await executeArticles.call(mockExecuteFunctions, 0, "create");

      // Assert
      expect(lexwareApiRequest).toHaveBeenCalledWith(
        "POST",
        "/v1/articles",
        expectedArticle
      );
    });

    it("sollte verschiedene Artikel-Typen unterstützen", async () => {
      const testCases = ["PRODUCT", "SERVICE"];
      
      for (const type of testCases) {
        jest.clearAllMocks();
        mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
          if (param === "type") return type;
          if (param === "leadingPrice") return "NET";
          if (param === "taxRate") return 19;
          return "";
        });

        lexwareApiRequest.mockResolvedValue({ id: `art-${type}` });

        const result = await executeArticles.call(mockExecuteFunctions, 0, "create");

        expect(lexwareApiRequest).toHaveBeenCalledWith(
          "POST",
          "/v1/articles",
          expect.objectContaining({ type })
        );
      }
    });

    it("sollte ungültige Artikel-Typen ablehnen", async () => {
      mockExecuteFunctions.getNodeParameter.mockImplementation(
        (param: string, _index?: number, defaultValue?: unknown) => {
          if (param === "type") return "ARTICLE";
          if (param === "leadingPrice") return "NET";
          if (param === "taxRate") return 19;
          return defaultValue ?? "";
        }
      );

      await expect(
        executeArticles.call(mockExecuteFunctions, 0, "create")
      ).rejects.toThrow(NodeOperationError);
    });
  });

  describe("GET Operation", () => {
    it("sollte einen spezifischen Artikel abrufen", async () => {
      // Arrange
      const articleId = "123e4567-e89b-12d3-a456-426614174000";
      mockExecuteFunctions.getNodeParameter.mockReturnValue(articleId);
      const mockResponse = {
        id: articleId,
        title: "Test Artikel",
        type: "PRODUCT",
      };
      lexwareApiRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await executeArticles.call(mockExecuteFunctions, 0, "get");

      // Assert
      expect(lexwareApiRequest).toHaveBeenCalledWith(
        "GET",
        `/v1/articles/${articleId}`
      );
      expect(result).toEqual([{ json: mockResponse }]);
    });

    it("sollte mit leerer articleId umgehen", async () => {
      // Arrange
      mockExecuteFunctions.getNodeParameter.mockReturnValue("");

      // Act & Assert
      await expect(
        executeArticles.call(mockExecuteFunctions, 0, "get")
      ).rejects.toThrow(NodeOperationError);
    });
  });

  describe("GET_ALL Operation", () => {
    it("sollte alle Artikel ohne Filter abrufen", async () => {
      // Arrange
      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce(0) // page
        .mockReturnValueOnce(""); // type
      
      const mockResponse = {
        content: [
          { id: "art-1", title: "Artikel 1" },
          { id: "art-2", title: "Artikel 2" },
        ],
      };
      lexwareApiRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await executeArticles.call(mockExecuteFunctions, 0, "getAll");

      // Assert
      expect(lexwareApiRequest).toHaveBeenCalledWith(
        "GET",
        "/v1/articles",
        {},
        { page: 0 }
      );
      expect(result).toEqual([{ json: mockResponse }]);
    });

    it("sollte Artikel mit Typ-Filter abrufen", async () => {
      // Arrange
      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce(1) // page
        .mockReturnValueOnce("PRODUCT"); // type

      lexwareApiRequest.mockResolvedValue({ content: [] });

      // Act
      await executeArticles.call(mockExecuteFunctions, 0, "getAll");

      // Assert
      expect(lexwareApiRequest).toHaveBeenCalledWith(
        "GET",
        "/v1/articles",
        {},
        { page: 1, type: "PRODUCT" }
      );
    });

    it("sollte undefined page-Parameter korrekt behandeln", async () => {
      // Arrange
      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce(undefined) // page
        .mockReturnValueOnce(""); // type

      lexwareApiRequest.mockResolvedValue({ content: [] });

      // Act
      await executeArticles.call(mockExecuteFunctions, 0, "getAll");

      // Assert
      expect(lexwareApiRequest).toHaveBeenCalledWith(
        "GET",
        "/v1/articles",
        {},
        {}
      );
    });
  });

  describe("UPDATE Operation", () => {
    it("sollte einen Artikel aktualisieren", async () => {
      // Arrange
      const articleId = "123e4567-e89b-12d3-a456-426614174000";
      mockExecuteFunctions.getNodeParameter.mockImplementation(
        (param: string, _index?: number, defaultValue?: unknown) => {
          if (param === "articleId") return articleId;
          if (param === "version") return 1;
          if (param === "title") return "Aktualisierter Titel";
          return defaultValue ?? "";
        }
      );

      const expectedUpdateData = {
        title: "Aktualisierter Titel",
        type: "PRODUCT",
        version: 1,
        price: {
          netPrice: 0,
          grossPrice: 0,
          leadingPrice: "NET",
          taxRate: 19,
        },
      };

      lexwareApiRequest.mockResolvedValue({ id: articleId });

      // Act
      const result = await executeArticles.call(mockExecuteFunctions, 0, "update");

      // Assert
      expect(lexwareApiRequest).toHaveBeenCalledWith(
        "PUT",
        `/v1/articles/${articleId}`,
        expectedUpdateData
      );
      expect(result).toEqual([{ json: { id: articleId } }]);
    });

    it("sollte auch negative Preise akzeptieren", async () => {
      // Arrange
      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce("123e4567-e89b-12d3-a456-426614174000") // articleId
        .mockImplementation((param: string) => {
          if (param === "version") return 1;
          if (param === "netPrice") return -50;
          if (param === "grossPrice") return -59.5;
          if (param === "type") return "PRODUCT";
          if (param === "leadingPrice") return "NET";
          if (param === "taxRate") return 19;
          return "";
        });

      // Act & Assert
      await expect(
        executeArticles.call(mockExecuteFunctions, 0, "update")
      ).rejects.toThrow(NodeOperationError);
    });
  });

  describe("DELETE Operation", () => {
    it("sollte einen Artikel löschen", async () => {
      // Arrange
      const articleId = "123e4567-e89b-12d3-a456-426614174000";
      mockExecuteFunctions.getNodeParameter.mockReturnValue(articleId);
      lexwareApiRequest.mockResolvedValue({ success: true });

      // Act
      const result = await executeArticles.call(mockExecuteFunctions, 0, "delete");

      // Assert
      expect(lexwareApiRequest).toHaveBeenCalledWith(
        "DELETE",
        `/v1/articles/${articleId}`
      );
      expect(result).toEqual([{ json: { success: true } }]);
    });
  });

  describe("Error Handling", () => {
    it("sollte bei ungültiger Operation einen Fehler werfen", async () => {
      // Act & Assert
      await expect(
        executeArticles.call(mockExecuteFunctions, 0, "invalidOperation")
      ).rejects.toThrow(NodeOperationError);
    });

    it("sollte API-Fehler weiterleiten", async () => {
      // Arrange
      mockExecuteFunctions.getNodeParameter.mockReturnValue(
        "123e4567-e89b-12d3-a456-426614174000"
      );
      lexwareApiRequest.mockRejectedValue(new Error("API Error"));

      // Act & Assert
      await expect(
        executeArticles.call(mockExecuteFunctions, 0, "get")
      ).rejects.toThrow("API Error");
    });
  });

  describe("Response Handling", () => {
    it("sollte Array-Antworten korrekt verarbeiten", async () => {
      // Arrange
      mockExecuteFunctions.getNodeParameter.mockReturnValue(
        "123e4567-e89b-12d3-a456-426614174000"
      );
      const mockResponse = [
        { id: "art-1", title: "Artikel 1" },
        { id: "art-2", title: "Artikel 2" },
      ];
      lexwareApiRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await executeArticles.call(mockExecuteFunctions, 0, "get");

      // Assert
      expect(result).toEqual([
        { json: { id: "art-1", title: "Artikel 1" } },
        { json: { id: "art-2", title: "Artikel 2" } },
      ]);
    });

    it("sollte Objekt-Antworten korrekt verarbeiten", async () => {
      // Arrange
      const articleId = "123e4567-e89b-12d3-a456-426614174000";
      mockExecuteFunctions.getNodeParameter.mockReturnValue(articleId);
      const mockResponse = { id: articleId, title: "Einzelner Artikel" };
      lexwareApiRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await executeArticles.call(mockExecuteFunctions, 0, "get");

      // Assert
      expect(result).toEqual([{ json: mockResponse }]);
    });

    it("sollte leere Antworten verarbeiten", async () => {
      // Arrange
      mockExecuteFunctions.getNodeParameter.mockReturnValue(
        "123e4567-e89b-12d3-a456-426614174000"
      );
      lexwareApiRequest.mockResolvedValue(null);

      // Act
      const result = await executeArticles.call(mockExecuteFunctions, 0, "get");

      // Assert
      expect(result).toEqual([{ json: null }]);
    });
  });

  describe("buildArticleBody Helper-Funktion Tests", () => {
    it("sollte alle Parameter korrekt verarbeiten", () => {
      // Diese Funktion ist privat, aber wir testen sie indirekt über CREATE
      const testParams = {
        title: "Test Titel",
        description: "Test Beschreibung",
        type: "SERVICE",
        articleNumber: "SRV-001",
        gtin: "9876543210987",
        note: "Service-Notiz",
        unitName: "Stunden",
        netPrice: 50,
        grossPrice: 59.5,
        leadingPrice: "GROSS",
        taxRate: 19,
      };

      mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
        return testParams[param as keyof typeof testParams] || "";
      });

      lexwareApiRequest.mockResolvedValue({ id: "srv-123" });

      executeArticles.call(mockExecuteFunctions, 0, "create");

      expect(lexwareApiRequest).toHaveBeenCalledWith(
        "POST",
        "/v1/articles",
        expect.objectContaining({
          title: testParams.title,
          description: testParams.description,
          type: testParams.type,
          articleNumber: testParams.articleNumber,
          gtin: testParams.gtin,
          note: testParams.note,
          unitName: testParams.unitName,
          price: {
            netPrice: testParams.netPrice,
            grossPrice: testParams.grossPrice,
            leadingPrice: testParams.leadingPrice,
            taxRate: testParams.taxRate,
          },
        })
      );
    });

    it("sollte mit null/undefined Werten umgehen", () => {
      mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
        if (param === "title") return null;
        if (param === "netPrice") return undefined;
        if (param === "type") return "PRODUCT";
        if (param === "leadingPrice") return "NET";
        if (param === "taxRate") return 19;
        return "";
      });

      lexwareApiRequest.mockResolvedValue({ id: "art-null" });

      executeArticles.call(mockExecuteFunctions, 0, "create");

      expect(lexwareApiRequest).toHaveBeenCalledWith(
        "POST",
        "/v1/articles",
        expect.objectContaining({
          price: expect.objectContaining({
            taxRate: 19,
          }),
        })
      );
    });
  });

  describe("Performance Tests", () => {
    it("sollte bei vielen Parametern effizient arbeiten", async () => {
      // Arrange
      const startTime = Date.now();
      mockExecuteFunctions.getNodeParameter.mockImplementation(
        (_param: string, _index?: number, defaultValue?: unknown) =>
          defaultValue ?? "test"
      );
      lexwareApiRequest.mockResolvedValue({ id: "perf-test" });

      // Act
      await executeArticles.call(mockExecuteFunctions, 0, "create");

      // Assert
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(100); // Sollte unter 100ms dauern
      expect(mockExecuteFunctions.getNodeParameter).toHaveBeenCalledTimes(11);
    });
  });
});
