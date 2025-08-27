import { describe, it, expect } from "@jest/globals";
import { IDataObject } from "n8n-workflow";
import {
  parseLineItemsFromCollection,
  parseLineItemsFromJson,
} from "../../nodes/Lexware/utils/LineItems";

describe("LineItems.ts - Umfassende Tests", () => {
  
  describe("parseLineItemsFromCollection", () => {
    
    it("sollte leere Arrays korrekt handhaben", () => {
      // Act
      const result = parseLineItemsFromCollection([]);
      
      // Assert
      expect(result).toEqual([]);
    });

    it("sollte undefined/null korrekt handhaben", () => {
      // Act
      const resultUndefined = parseLineItemsFromCollection(undefined as any);
      const resultNull = parseLineItemsFromCollection(null as any);
      
      // Assert
      expect(resultUndefined).toEqual([]);
      expect(resultNull).toEqual([]);
    });

    it("sollte vollständige LineItems korrekt parsen", () => {
      // Arrange
      const input: IDataObject[] = [
        {
          type: "product",
          name: "Premium Service",
          description: "Hochwertige Beratung",
          quantity: 5,
          unitName: "Stunden",
          unitPrice: {
            value: {
              currency: "EUR",
              netAmount: 100,
              grossAmount: 119,
              taxRatePercentage: 19,
            },
          },
          discountPercentage: 5,
          lineItemAmount: 475,
        },
        {
          type: "service",
          name: "Support",
          description: "Technischer Support",
          quantity: 10,
          unitName: "Stunden",
          unitPrice: {
            value: {
              currency: "EUR",
              netAmount: 80,
              grossAmount: 95.2,
              taxRatePercentage: 19,
            },
          },
          discountPercentage: 0,
          lineItemAmount: 800,
        },
      ];

      // Act
      const result = parseLineItemsFromCollection(input);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        type: "product",
        name: "Premium Service",
        description: "Hochwertige Beratung",
        quantity: 5,
        unitName: "Stunden",
        unitPrice: {
          currency: "EUR",
          netAmount: 100,
          grossAmount: 119,
          taxRatePercentage: 19,
        },
        discountPercentage: 5,
        lineItemAmount: 475,
      });
      expect(result[1]).toEqual({
        type: "service",
        name: "Support",
        description: "Technischer Support",
        quantity: 10,
        unitName: "Stunden",
        unitPrice: {
          currency: "EUR",
          netAmount: 80,
          grossAmount: 95.2,
          taxRatePercentage: 19,
        },
        discountPercentage: 0,
        lineItemAmount: 800,
      });
    });

    it("sollte Standard-Werte für fehlende Felder setzen", () => {
      // Arrange
      const input: IDataObject[] = [
        {
          name: "Minimales Item",
          // Alle anderen Felder fehlen
        },
      ];

      // Act
      const result = parseLineItemsFromCollection(input);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        type: "custom", // Standard-Wert
        name: "Minimales Item",
        description: undefined,
        quantity: undefined,
        unitName: undefined,
        unitPrice: undefined,
        discountPercentage: undefined,
        lineItemAmount: undefined,
      });
    });

    it("sollte unitPrice ohne value handhaben", () => {
      // Arrange
      const input: IDataObject[] = [
        {
          type: "test",
          name: "Test Item",
          unitPrice: {
            // Kein value property
            currency: "EUR",
            netAmount: 50,
          },
        },
      ];

      // Act
      const result = parseLineItemsFromCollection(input);

      // Assert
      expect(result[0].unitPrice).toBeUndefined();
    });

    it("sollte verschiedene Datentypen für Felder handhaben", () => {
      // Arrange
      const input: IDataObject[] = [
        {
          type: null,
          name: 123, // Zahl statt String
          description: true, // Boolean statt String
          quantity: "5", // String statt Zahl
          unitName: [],
          unitPrice: {
            value: {
              currency: "USD",
              netAmount: "150", // String statt Zahl
              grossAmount: null,
              taxRatePercentage: undefined,
            },
          },
          discountPercentage: "10",
          lineItemAmount: false,
        },
      ];

      // Act
      const result = parseLineItemsFromCollection(input);

      // Assert
      expect(result[0]).toEqual({
        type: "custom", // null wird zu "custom"
        name: 123,
        description: true,
        quantity: "5",
        unitName: [],
        unitPrice: {
          currency: "USD",
          netAmount: "150",
          grossAmount: null,
          taxRatePercentage: undefined,
        },
        discountPercentage: "10",
        lineItemAmount: false,
      });
    });

    it("sollte komplexe verschachtelte Strukturen handhaben", () => {
      // Arrange
      const input: IDataObject[] = [
        {
          type: "complex",
          name: "Complex Item",
          unitPrice: {
            value: {
              currency: "EUR",
              netAmount: 200,
              grossAmount: 238,
              taxRatePercentage: 19,
              // Zusätzliche Felder, die nicht kopiert werden sollten
              extraField: "should not appear",
              nested: {
                deep: "value",
              },
            },
          },
        },
      ];

      // Act
      const result = parseLineItemsFromCollection(input);

      // Assert
      expect(result[0].unitPrice).toEqual({
        currency: "EUR",
        netAmount: 200,
        grossAmount: 238,
        taxRatePercentage: 19,
      });
      expect(result[0].unitPrice).not.toHaveProperty("extraField");
      expect(result[0].unitPrice).not.toHaveProperty("nested");
    });

    it("sollte große Arrays effizient verarbeiten", () => {
      // Arrange
      const largeInput = Array.from({ length: 1000 }, (_, i) => ({
        type: "bulk",
        name: `Item ${i}`,
        quantity: i,
        unitPrice: {
          value: {
            currency: "EUR",
            netAmount: i * 10,
            grossAmount: i * 11.9,
            taxRatePercentage: 19,
          },
        },
      }));

      const startTime = Date.now();

      // Act
      const result = parseLineItemsFromCollection(largeInput);

      // Assert
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(500); // Sollte unter 500ms dauern
      expect(result).toHaveLength(1000);
      expect(result[0].name).toBe("Item 0");
      expect(result[999].name).toBe("Item 999");
    });
  });

  describe("parseLineItemsFromJson", () => {
    
    it("sollte JSON-String korrekt parsen", () => {
      // Arrange
      const jsonString = JSON.stringify([
        {
          type: "product",
          name: "JSON Product",
          price: 100,
        },
        {
          type: "service",
          name: "JSON Service",
          price: 200,
        },
      ]);

      // Act
      const result = parseLineItemsFromJson(jsonString);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        type: "product",
        name: "JSON Product",
        price: 100,
      });
      expect(result[1]).toEqual({
        type: "service",
        name: "JSON Service",
        price: 200,
      });
    });

    it("sollte einzelnes Objekt als JSON-String parsen", () => {
      // Arrange
      const jsonString = JSON.stringify({
        type: "single",
        name: "Single Item",
        price: 150,
      });

      // Act
      const result = parseLineItemsFromJson(jsonString);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        type: "single",
        name: "Single Item",
        price: 150,
      });
    });

    it("sollte Array-Objekt direkt zurückgeben", () => {
      // Arrange
      const arrayInput = [
        { name: "Direct Array Item 1" },
        { name: "Direct Array Item 2" },
      ];

      // Act
      const result = parseLineItemsFromJson(arrayInput);

      // Assert
      expect(result).toEqual(arrayInput);
    });

    it("sollte einzelnes Objekt in Array wrappen", () => {
      // Arrange
      const objectInput = {
        name: "Single Object",
        price: 75,
      };

      // Act
      const result = parseLineItemsFromJson(objectInput as any);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(objectInput);
    });

    it("sollte leere/undefined Eingaben handhaben", () => {
      // Act & Assert
      expect(parseLineItemsFromJson(undefined)).toEqual([]);
      expect(parseLineItemsFromJson(null as any)).toEqual([]);
      expect(parseLineItemsFromJson("")).toEqual([]);
      expect(parseLineItemsFromJson("[]")).toEqual([]);
      expect(parseLineItemsFromJson("{}")).toEqual([{}]);
    });

    it("sollte ungültiges JSON handhaben", () => {
      const invalidJsonInputs = [
        "{ invalid json",
        "{ name: 'missing quotes' }",
        "[{ incomplete",
        "not json at all",
        "{ trailing comma, }",
      ];

      invalidJsonInputs.forEach(input => {
        expect(() => parseLineItemsFromJson(input)).toThrow("Invalid JSON provided for line items");
      });
    });

    it("sollte komplexe JSON-Strukturen handhaben", () => {
      // Arrange
      const complexJson = JSON.stringify([
        {
          type: "complex",
          name: "Complex Item",
          metadata: {
            tags: ["premium", "featured"],
            attributes: {
              color: "blue",
              size: "large",
            },
          },
          pricing: {
            net: 100,
            gross: 119,
            currency: "EUR",
          },
          dates: {
            created: "2024-03-15T10:30:00Z",
            modified: "2024-03-16T14:20:00Z",
          },
        },
      ]);

      // Act
      const result = parseLineItemsFromJson(complexJson);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].metadata.tags).toEqual(["premium", "featured"]);
      expect(result[0].metadata.attributes.color).toBe("blue");
      expect(result[0].pricing.net).toBe(100);
    });

    it("sollte verschiedene JSON-Datentypen korrekt handhaben", () => {
      // Arrange
      const jsonWithTypes = JSON.stringify([
        {
          string: "text",
          number: 42,
          boolean: true,
          nullValue: null,
          array: [1, 2, 3],
          object: { nested: "value" },
        },
      ]);

      // Act
      const result = parseLineItemsFromJson(jsonWithTypes);

      // Assert
      expect(result[0]).toEqual({
        string: "text",
        number: 42,
        boolean: true,
        nullValue: null,
        array: [1, 2, 3],
        object: { nested: "value" },
      });
    });

    it("sollte Unicode-Zeichen korrekt handhaben", () => {
      // Arrange
      const unicodeJson = JSON.stringify([
        {
          name: "Äpfel & Öl für Übung",
          description: "Special chars: áéíóú àèìòù âêîôû ñç €£¥",
          emoji: "🍎🛢️📚",
          chinese: "中文测试",
          arabic: "اختبار العربية",
        },
      ]);

      // Act
      const result = parseLineItemsFromJson(unicodeJson);

      // Assert
      expect(result[0].name).toBe("Äpfel & Öl für Übung");
      expect(result[0].emoji).toBe("🍎🛢️📚");
      expect(result[0].chinese).toBe("中文测试");
      expect(result[0].arabic).toBe("اختبار العربية");
    });

    it("sollte große JSON-Arrays effizient verarbeiten", () => {
      // Arrange
      const largeArray = Array.from({ length: 5000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        price: i * 1.5,
        active: i % 2 === 0,
      }));
      const largeJson = JSON.stringify(largeArray);

      const startTime = Date.now();

      // Act
      const result = parseLineItemsFromJson(largeJson);

      // Assert
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(1000); // Sollte unter 1 Sekunde dauern
      expect(result).toHaveLength(5000);
      expect(result[0].id).toBe(0);
      expect(result[4999].id).toBe(4999);
    });

    it("sollte tief verschachtelte Objekte handhaben", () => {
      // Arrange
      const deepNested = {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: {
                  value: "deep value",
                  array: [1, 2, { nested: true }],
                },
              },
            },
          },
        },
      };
      const jsonString = JSON.stringify([deepNested]);

      // Act
      const result = parseLineItemsFromJson(jsonString);

      // Assert
      expect(result[0].level1.level2.level3.level4.level5.value).toBe("deep value");
      expect(result[0].level1.level2.level3.level4.level5.array[2].nested).toBe(true);
    });

    it("sollte JSON mit speziellen Zahlenformaten handhaben", () => {
      // Arrange
      const specialNumbers = JSON.stringify([
        {
          integer: 42,
          float: 3.14159,
          negative: -100,
          zero: 0,
          scientific: 1.23e-4,
          large: 999999999999999,
        },
      ]);

      // Act
      const result = parseLineItemsFromJson(specialNumbers);

      // Assert
      expect(result[0].integer).toBe(42);
      expect(result[0].float).toBe(3.14159);
      expect(result[0].negative).toBe(-100);
      expect(result[0].zero).toBe(0);
      expect(result[0].scientific).toBe(1.23e-4);
      expect(result[0].large).toBe(999999999999999);
    });
  });

  describe("Integration Tests", () => {
    
    it("sollte beide Funktionen zusammen verwenden können", () => {
      // Simulate a workflow where JSON is parsed and then processed by collection parser
      
      // Arrange
      const jsonInput = JSON.stringify([
        {
          type: "service",
          name: "Consulting",
          quantity: 10,
          unitPrice: {
            value: {
              currency: "EUR",
              netAmount: 150,
              grossAmount: 178.5,
              taxRatePercentage: 19,
            },
          },
        },
      ]);

      // Act
      const fromJson = parseLineItemsFromJson(jsonInput);
      const processed = parseLineItemsFromCollection(fromJson);

      // Assert
      expect(processed).toHaveLength(1);
      expect(processed[0]).toEqual({
        type: "service",
        name: "Consulting",
        description: undefined,
        quantity: 10,
        unitName: undefined,
        unitPrice: {
          currency: "EUR",
          netAmount: 150,
          grossAmount: 178.5,
          taxRatePercentage: 19,
        },
        discountPercentage: undefined,
        lineItemAmount: undefined,
      });
    });

    it("sollte Konsistenz zwischen beiden Ansätzen gewährleisten", () => {
      // Arrange
      const testData = [
        {
          type: "test",
          name: "Consistency Test",
          unitPrice: {
            value: {
              currency: "EUR",
              netAmount: 100,
            },
          },
        },
      ];

      // Act
      const fromCollection = parseLineItemsFromCollection(testData);
      const fromJson = parseLineItemsFromJson(JSON.stringify(testData));
      const fromJsonProcessed = parseLineItemsFromCollection(fromJson);

      // Assert
      expect(fromCollection).toEqual(fromJsonProcessed);
    });
  });

  describe("Error Handling", () => {
    
    it("sollte robust gegen fehlerhafte Eingaben sein", () => {
      const errorProneInputs = [
        [null], // Array mit null
        [undefined], // Array mit undefined
        [{ unitPrice: { value: null } }], // Null unitPrice.value
        [{ unitPrice: "not an object" }], // String statt Objekt
        [{ quantity: {} }], // Objekt statt Primitive
      ];

      errorProneInputs.forEach(input => {
        expect(() => parseLineItemsFromCollection(input as any)).not.toThrow();
      });
    });

    it("sollte zirkuläre Referenzen in JSON handhaben", () => {
      // JSON.stringify würde bei zirkulären Referenzen bereits fehlschlagen
      // Aber wir testen die Robustheit unserer Funktion
      const objectWithCircular: any = { name: "test" };
      objectWithCircular.self = objectWithCircular;

      // JSON.stringify würde hier einen Fehler werfen
      expect(() => JSON.stringify([objectWithCircular])).toThrow();
      
      // Unsere Funktion sollte mit bereits geparsten Objekten arbeiten
      expect(() => parseLineItemsFromJson([objectWithCircular])).not.toThrow();
    });
  });

  describe("Memory and Performance", () => {
    
    it("sollte Speicher effizient nutzen", () => {
      // Test mit sehr großem Dataset
      const hugeArray = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        data: "x".repeat(100), // 100 Zeichen pro Item
      }));

      const startTime = Date.now();
      const startMemory = process.memoryUsage().heapUsed;

      // Act
      const result = parseLineItemsFromCollection(hugeArray);

      const endTime = Date.now();
      const endMemory = process.memoryUsage().heapUsed;

      // Assert
      expect(result).toHaveLength(10000);
      expect(endTime - startTime).toBeLessThan(2000); // Unter 2 Sekunden
      
      // Memory usage sollte reasonable sein (weniger als 100MB zusätzlich)
      const memoryDiff = endMemory - startMemory;
      expect(memoryDiff).toBeLessThan(100 * 1024 * 1024); // 100MB
    });

    it("sollte bei wiederholten Aufrufen konsistent performen", () => {
      const testData = Array.from({ length: 100 }, (_, i) => ({
        name: `Item ${i}`,
        price: i,
      }));

      const times: number[] = [];

      // 10 Durchläufe zur Performance-Messung
      for (let i = 0; i < 10; i++) {
        const start = Date.now();
        parseLineItemsFromCollection(testData);
        const end = Date.now();
        times.push(end - start);
      }

      // Alle Zeiten sollten ähnlich sein (keine großen Ausreißer)
      const avgTime = times.reduce((a, b) => a + b) / times.length;
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);

      expect(maxTime - minTime).toBeLessThan(avgTime * 2); // Variation unter 200%
    });
  });
});