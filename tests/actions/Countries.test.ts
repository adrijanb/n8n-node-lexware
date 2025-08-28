import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { IExecuteFunctions } from "n8n-core";
import { executeCountries } from "../../nodes/Lexware/actions/Countries.execute";

// Mock der GenericFunctions
jest.mock("../../nodes/Lexware/GenericFunctions", () => ({
  lexwareApiRequest: jest.fn(),
}));

describe("Countries.execute - Umfassende Tests", () => {
  let mockExecuteFunctions: jest.Mocked<IExecuteFunctions>;
  const mockGenericFunctions = jest.requireMock("../../nodes/Lexware/GenericFunctions") as any;
  const { lexwareApiRequest } = mockGenericFunctions;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockExecuteFunctions = {
      getNodeParameter: jest.fn(),
      getNode: jest.fn(() => ({ name: "Lexware Countries" })),
    } as any;
  });

  describe("GET_ALL Operation", () => {
    it("sollte alle Länder abrufen", async () => {
      // Arrange
      const mockCountries = [
        { code: "DE", name: "Deutschland" },
        { code: "AT", name: "Österreich" },
        { code: "CH", name: "Schweiz" },
        { code: "US", name: "United States" },
        { code: "FR", name: "France" },
      ];
      lexwareApiRequest.mockResolvedValue(mockCountries);

      // Act
      const result = await executeCountries.call(mockExecuteFunctions, 0, "getAll");

      // Assert
      expect(lexwareApiRequest).toHaveBeenCalledWith("GET", "/v1/countries");
      expect(result).toEqual([
        { json: { code: "DE", name: "Deutschland" } },
        { json: { code: "AT", name: "Österreich" } },
        { json: { code: "CH", name: "Schweiz" } },
        { json: { code: "US", name: "United States" } },
        { json: { code: "FR", name: "France" } },
      ]);
    });

    it("sollte mit leerer Länder-Liste umgehen", async () => {
      // Arrange
      lexwareApiRequest.mockResolvedValue([]);

      // Act
      const result = await executeCountries.call(mockExecuteFunctions, 0, "getAll");

      // Assert
      expect(lexwareApiRequest).toHaveBeenCalledWith("GET", "/v1/countries");
      expect(result).toEqual([]);
    });

    it("sollte mit einzelnem Land-Objekt umgehen", async () => {
      // Arrange
      const singleCountry = { code: "DE", name: "Deutschland" };
      lexwareApiRequest.mockResolvedValue(singleCountry);

      // Act
      const result = await executeCountries.call(mockExecuteFunctions, 0, "getAll");

      // Assert
      expect(lexwareApiRequest).toHaveBeenCalledWith("GET", "/v1/countries");
      expect(result).toEqual([{ json: singleCountry }]);
    });

    it("sollte mit null/undefined Antwort umgehen", async () => {
      // Arrange
      lexwareApiRequest.mockResolvedValue(null);

      // Act
      const result = await executeCountries.call(mockExecuteFunctions, 0, "getAll");

      // Assert
      expect(result).toEqual([{ json: null }]);
    });

    it("sollte keine Parameter benötigen", async () => {
      // Arrange
      lexwareApiRequest.mockResolvedValue([]);

      // Act
      await executeCountries.call(mockExecuteFunctions, 0, "getAll");

      // Assert
      expect(mockExecuteFunctions.getNodeParameter).not.toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("sollte bei ungültiger Operation einen Fehler werfen", async () => {
      // Act & Assert
      await expect(
        executeCountries.call(mockExecuteFunctions, 0, "invalidOperation")
      ).rejects.toThrow("Unsupported operation: invalidOperation");
    });

    it("sollte API-Fehler weiterleiten", async () => {
      // Arrange
      const apiError = new Error("API is unavailable");
      lexwareApiRequest.mockRejectedValue(apiError);

      // Act & Assert
      await expect(
        executeCountries.call(mockExecuteFunctions, 0, "getAll")
      ).rejects.toThrow("API is unavailable");
    });

    it("sollte Network-Timeouts handhaben", async () => {
      // Arrange
      const timeoutError = new Error("Request timeout");
      lexwareApiRequest.mockRejectedValue(timeoutError);

      // Act & Assert
      await expect(
        executeCountries.call(mockExecuteFunctions, 0, "getAll")
      ).rejects.toThrow("Request timeout");
    });
  });

  describe("Performance Tests", () => {
    it("sollte schnell ausgeführt werden", async () => {
      // Arrange
      const startTime = Date.now();
      lexwareApiRequest.mockResolvedValue([]);

      // Act
      await executeCountries.call(mockExecuteFunctions, 0, "getAll");

      // Assert
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(50); // Sollte unter 50ms dauern
    });

    it("sollte große Länder-Listen verarbeiten können", async () => {
      // Arrange
      const largeCountryList = Array.from({ length: 500 }, (_, i) => ({
        code: `C${i.toString().padStart(3, "0")}`,
        name: `Country ${i}`,
      }));
      lexwareApiRequest.mockResolvedValue(largeCountryList);

      // Act
      const result = await executeCountries.call(mockExecuteFunctions, 0, "getAll");

      // Assert
      expect(result).toHaveLength(500);
      expect(result[0]).toEqual({ json: { code: "C000", name: "Country 0" } });
      expect(result[499]).toEqual({ json: { code: "C499", name: "Country 499" } });
    });
  });

  describe("API Integration", () => {
    it("sollte korrekte HTTP-Methode und Endpoint verwenden", async () => {
      // Arrange
      lexwareApiRequest.mockResolvedValue([]);

      // Act
      await executeCountries.call(mockExecuteFunctions, 0, "getAll");

      // Assert
      expect(lexwareApiRequest).toHaveBeenCalledWith("GET", "/v1/countries");
      expect(lexwareApiRequest).toHaveBeenCalledTimes(1);
    });

    it("sollte keine zusätzlichen Parameter senden", async () => {
      // Arrange
      lexwareApiRequest.mockResolvedValue([]);

      // Act
      await executeCountries.call(mockExecuteFunctions, 0, "getAll");

      // Assert
      expect(lexwareApiRequest).toHaveBeenCalledWith("GET", "/v1/countries");
      // Überprüfen, dass keine weiteren Parameter übergeben wurden
      expect(lexwareApiRequest.mock.calls[0]).toHaveLength(2);
    });
  });

  describe("Response Format Tests", () => {
    it("sollte Standard-Länder-Format verarbeiten", async () => {
      // Arrange
      const standardCountries = [
        { code: "DE", name: "Deutschland", iso3: "DEU", numeric: 276 },
        { code: "US", name: "United States", iso3: "USA", numeric: 840 },
      ];
      lexwareApiRequest.mockResolvedValue(standardCountries);

      // Act
      const result = await executeCountries.call(mockExecuteFunctions, 0, "getAll");

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].json).toEqual(standardCountries[0]);
      expect(result[1].json).toEqual(standardCountries[1]);
    });

    it("sollte unvollständige Länder-Daten verarbeiten", async () => {
      // Arrange
      const incompleteCountries = [
        { code: "DE" }, // Nur Code
        { name: "United States" }, // Nur Name
        {}, // Leeres Objekt
      ];
      lexwareApiRequest.mockResolvedValue(incompleteCountries);

      // Act
      const result = await executeCountries.call(mockExecuteFunctions, 0, "getAll");

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0].json).toEqual({ code: "DE" });
      expect(result[1].json).toEqual({ name: "United States" });
      expect(result[2].json).toEqual({});
    });

    it("sollte mit verschiedenen Datentypen in der Antwort umgehen", async () => {
      // Arrange
      const mixedResponse = [
        { code: "DE", name: "Deutschland", active: true, population: 83000000 },
        { code: "VA", name: "Vatican", active: true, population: 800 },
      ];
      lexwareApiRequest.mockResolvedValue(mixedResponse);

      // Act
      const result = await executeCountries.call(mockExecuteFunctions, 0, "getAll");

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].json.population).toBe(83000000);
      expect(result[1].json.population).toBe(800);
      expect(result[0].json.active).toBe(true);
    });
  });

  describe("Edge Cases", () => {
    it("sollte mit sehr langen Ländernamen umgehen", async () => {
      // Arrange
      const longNameCountry = {
        code: "XX",
        name: "Very Long Country Name That Exceeds Normal Length Limits And Contains Many Words To Test System Robustness",
      };
      lexwareApiRequest.mockResolvedValue([longNameCountry]);

      // Act
      const result = await executeCountries.call(mockExecuteFunctions, 0, "getAll");

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].json.name).toBe(longNameCountry.name);
    });

    it("sollte mit Sonderzeichen in Ländernamen umgehen", async () => {
      // Arrange
      const specialCharCountries = [
        { code: "CI", name: "Côte d'Ivoire" },
        { code: "BH", name: "البحرين" }, // Arabisch
        { code: "CN", name: "中国" }, // Chinesisch
        { code: "RU", name: "Россия" }, // Kyrillisch
      ];
      lexwareApiRequest.mockResolvedValue(specialCharCountries);

      // Act
      const result = await executeCountries.call(mockExecuteFunctions, 0, "getAll");

      // Assert
      expect(result).toHaveLength(4);
      expect(result[0].json.name).toBe("Côte d'Ivoire");
      expect(result[1].json.name).toBe("البحرين");
      expect(result[2].json.name).toBe("中国");
      expect(result[3].json.name).toBe("Россия");
    });

    it("sollte mit numerischen Codes als Strings umgehen", async () => {
      // Arrange
      const numericCodeCountries = [
        { code: "001", name: "World" },
        { code: "150", name: "Europe" },
      ];
      lexwareApiRequest.mockResolvedValue(numericCodeCountries);

      // Act
      const result = await executeCountries.call(mockExecuteFunctions, 0, "getAll");

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].json.code).toBe("001");
      expect(result[1].json.code).toBe("150");
    });
  });

  describe("Concurrency Tests", () => {
    it("sollte mehrere gleichzeitige Aufrufe handhaben", async () => {
      // Arrange
      const mockCountries = [{ code: "DE", name: "Deutschland" }];
      lexwareApiRequest.mockResolvedValue(mockCountries);

      // Act
      const promises = Array.from({ length: 10 }, () =>
        executeCountries.call(mockExecuteFunctions, 0, "getAll")
      );
      const results = await Promise.all(promises);

      // Assert
      expect(results).toHaveLength(10);
      results.forEach((result) => {
        expect(result).toEqual([{ json: { code: "DE", name: "Deutschland" } }]);
      });
      expect(lexwareApiRequest).toHaveBeenCalledTimes(10);
    });
  });
});
