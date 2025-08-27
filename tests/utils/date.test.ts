import { describe, it, expect } from "@jest/globals";
import { formatToLexwareDate } from "../../nodes/Lexware/utils/date";

describe("date.ts - formatToLexwareDate Umfassende Tests", () => {
  
  describe("Basic Functionality", () => {
    it("sollte undefined für leere/undefined Eingaben zurückgeben", () => {
      expect(formatToLexwareDate(undefined)).toBeUndefined();
      expect(formatToLexwareDate("")).toBeUndefined();
      expect(formatToLexwareDate("   ")).toBeUndefined();
    });

    it("sollte ISO-Datum korrekt formatieren", () => {
      // Arrange
      const input = "2024-03-15";
      
      // Act
      const result = formatToLexwareDate(input);
      
      // Assert
      expect(result).toMatch(/^2024-03-15T00:00:00\.000[+-]\d{2}:\d{2}$/);
    });

    it("sollte ISO-DateTime korrekt formatieren", () => {
      // Arrange
      const input = "2024-03-15T14:30:45";
      
      // Act
      const result = formatToLexwareDate(input);
      
      // Assert
      expect(result).toMatch(/^2024-03-15T14:30:45\.000[+-]\d{2}:\d{2}$/);
    });

    it("sollte Leerzeichen durch T ersetzen", () => {
      // Arrange
      const input = "2024-03-15 14:30:45";
      
      // Act
      const result = formatToLexwareDate(input);
      
      // Assert
      expect(result).toMatch(/^2024-03-15T14:30:45\.000[+-]\d{2}:\d{2}$/);
    });
  });

  describe("Date Format Variations", () => {
    it("sollte verschiedene Datumsformate handhaben", () => {
      const testCases = [
        {
          input: "2024-01-01",
          expectedPattern: /^2024-01-01T00:00:00\.000[+-]\d{2}:\d{2}$/,
        },
        {
          input: "2024-12-31",
          expectedPattern: /^2024-12-31T00:00:00\.000[+-]\d{2}:\d{2}$/,
        },
        {
          input: "2024-06-15",
          expectedPattern: /^2024-06-15T00:00:00\.000[+-]\d{2}:\d{2}$/,
        },
      ];

      testCases.forEach(({ input, expectedPattern }) => {
        const result = formatToLexwareDate(input);
        expect(result).toMatch(expectedPattern);
      });
    });

    it("sollte verschiedene Zeit-Formate handhaben", () => {
      const testCases = [
        {
          input: "2024-03-15T00:00:00",
          expectedPattern: /^2024-03-15T00:00:00\.000[+-]\d{2}:\d{2}$/,
        },
        {
          input: "2024-03-15T23:59:59",
          expectedPattern: /^2024-03-15T23:59:59\.000[+-]\d{2}:\d{2}$/,
        },
        {
          input: "2024-03-15T12:30:45",
          expectedPattern: /^2024-03-15T12:30:45\.000[+-]\d{2}:\d{2}$/,
        },
      ];

      testCases.forEach(({ input, expectedPattern }) => {
        const result = formatToLexwareDate(input);
        expect(result).toMatch(expectedPattern);
      });
    });

    it("sollte Millisekunden korrekt formatieren", () => {
      // Arrange
      const input = "2024-03-15T12:30:45.123";
      
      // Act
      const result = formatToLexwareDate(input);
      
      // Assert
      expect(result).toMatch(/^2024-03-15T12:30:45\.123[+-]\d{2}:\d{2}$/);
    });

    it("sollte fehlende Millisekunden mit .000 ergänzen", () => {
      // Arrange
      const input = "2024-03-15T12:30:45";
      
      // Act
      const result = formatToLexwareDate(input);
      
      // Assert
      expect(result).toContain(".000");
    });
  });

  describe("Timezone Handling", () => {
    it("sollte Timezone-Offset korrekt berechnen", () => {
      // Arrange
      const input = "2024-06-15T12:00:00"; // Sommerzeit
      
      // Act
      const result = formatToLexwareDate(input);
      
      // Assert
      expect(result).toMatch(/[+-]\d{2}:\d{2}$/);
      
      // Der Offset sollte aus + oder - gefolgt von HH:MM bestehen
      const offsetMatch = result?.match(/([+-])(\d{2}):(\d{2})$/);
      expect(offsetMatch).toBeTruthy();
      
      const [, sign, hours, minutes] = offsetMatch!;
      expect(sign).toMatch(/[+-]/);
      expect(parseInt(hours)).toBeGreaterThanOrEqual(0);
      expect(parseInt(hours)).toBeLessThanOrEqual(14); // Max UTC+14
      expect(parseInt(minutes)).toBeGreaterThanOrEqual(0);
      expect(parseInt(minutes)).toBeLessThanOrEqual(59);
    });

    it("sollte Winterzeit korrekt handhaben", () => {
      // Arrange
      const input = "2024-01-15T12:00:00"; // Winterzeit
      
      // Act
      const result = formatToLexwareDate(input);
      
      // Assert
      expect(result).toMatch(/[+-]\d{2}:\d{2}$/);
    });

    it("sollte verschiedene Zeitzonen konsistent handhaben", () => {
      // Diese Tests sind abhängig von der lokalen Zeitzone des Testsystems
      const inputs = [
        "2024-01-01T00:00:00",
        "2024-07-01T00:00:00",
        "2024-12-31T23:59:59",
      ];

      inputs.forEach(input => {
        const result = formatToLexwareDate(input);
        expect(result).toMatch(/^2024-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}[+-]\d{2}:\d{2}$/);
      });
    });
  });

  describe("Edge Cases", () => {
    it("sollte Schaltjahre korrekt handhaben", () => {
      // Arrange
      const leapYearDate = "2024-02-29"; // 2024 ist ein Schaltjahr
      
      // Act
      const result = formatToLexwareDate(leapYearDate);
      
      // Assert
      expect(result).toMatch(/^2024-02-29T00:00:00\.000[+-]\d{2}:\d{2}$/);
    });

    it("sollte End-of-Month Daten handhaben", () => {
      const endOfMonthDates = [
        "2024-01-31", // Januar
        "2024-02-29", // Februar (Schaltjahr)
        "2024-04-30", // April
        "2024-12-31", // Dezember
      ];

      endOfMonthDates.forEach(date => {
        const result = formatToLexwareDate(date);
        expect(result).toBeTruthy();
        expect(result).toContain(date);
      });
    });

    it("sollte Mitternacht korrekt handhaben", () => {
      // Arrange
      const midnight = "2024-03-15T00:00:00";
      
      // Act
      const result = formatToLexwareDate(midnight);
      
      // Assert
      expect(result).toContain("T00:00:00.000");
    });

    it("sollte End-of-Day korrekt handhaben", () => {
      // Arrange
      const endOfDay = "2024-03-15T23:59:59";
      
      // Act
      const result = formatToLexwareDate(endOfDay);
      
      // Assert
      expect(result).toContain("T23:59:59.000");
    });

    it("sollte ungültige Daten als String zurückgeben", () => {
      const invalidDates = [
        "invalid-date",
        "2024-13-01", // Ungültiger Monat
        "2024-02-30", // Ungültiger Tag für Februar
        "not-a-date",
        "2024/03/15", // Falsches Format
      ];

      invalidDates.forEach(invalidDate => {
        const result = formatToLexwareDate(invalidDate);
        // Bei ungültigen Daten wird der Original-String zurückgegeben
        expect(result).toBe(invalidDate);
      });
    });

    it("sollte Strings mit führenden/nachfolgenden Leerzeichen handhaben", () => {
      // Arrange
      const input = "  2024-03-15T12:30:45  ";
      
      // Act
      const result = formatToLexwareDate(input);
      
      // Assert
      expect(result).toMatch(/^2024-03-15T12:30:45\.000[+-]\d{2}:\d{2}$/);
    });
  });

  describe("Format Consistency", () => {
    it("sollte immer zweistellige Zahlen für Datum/Zeit verwenden", () => {
      // Arrange
      const input = "2024-01-05T09:05:03";
      
      // Act
      const result = formatToLexwareDate(input);
      
      // Assert
      expect(result).toMatch(/^2024-01-05T09:05:03\.000[+-]\d{2}:\d{2}$/);
      // Überprüfen, dass keine einstelligen Zahlen vorhanden sind
      expect(result).not.toMatch(/T\d:/); // Keine einstellige Stunde
      expect(result).not.toMatch(/:\d:/); // Keine einstellige Minute/Sekunde
      expect(result).not.toMatch(/-\d-/); // Kein einstelliger Monat
      expect(result).not.toMatch(/-\d$/); // Kein einstelliger Tag
    });

    it("sollte immer dreistellige Millisekunden verwenden", () => {
      const testCases = [
        { input: "2024-03-15T12:30:45", expectedMs: "000" },
        { input: "2024-03-15T12:30:45.1", expectedMs: "100" },
        { input: "2024-03-15T12:30:45.12", expectedMs: "120" },
        { input: "2024-03-15T12:30:45.123", expectedMs: "123" },
      ];

      testCases.forEach(({ input, expectedMs }) => {
        const result = formatToLexwareDate(input);
        expect(result).toContain(`.${expectedMs}`);
      });
    });

    it("sollte immer korrektes Timezone-Format verwenden", () => {
      // Arrange
      const input = "2024-03-15T12:30:45";
      
      // Act
      const result = formatToLexwareDate(input);
      
      // Assert
      // Timezone sollte im Format ±HH:MM sein
      expect(result).toMatch(/[+-]\d{2}:\d{2}$/);
      
      // Timezone-Teil extrahieren und validieren
      const timezoneMatch = result?.match(/([+-])(\d{2}):(\d{2})$/);
      expect(timezoneMatch).toBeTruthy();
      
      const [, sign, hours, minutes] = timezoneMatch!;
      expect(["Â", "-"]).toContain(sign);
      expect(hours).toMatch(/^\d{2}$/);
      expect(minutes).toMatch(/^\d{2}$/);
    });
  });

  describe("Real-World Scenarios", () => {
    it("sollte typische Geschäftsdaten handhaben", () => {
      const businessDates = [
        "2024-01-01", // Neujahr
        "2024-04-01", // Q1 Ende
        "2024-07-01", // Q2 Ende
        "2024-10-01", // Q3 Ende
        "2024-12-31", // Jahresende
      ];

      businessDates.forEach(date => {
        const result = formatToLexwareDate(date);
        expect(result).toBeTruthy();
        expect(result).toContain("T00:00:00.000");
      });
    });

    it("sollte Rechnungsdaten handhaben", () => {
      const invoiceDates = [
        "2024-03-15", // Rechnungsdatum
        "2024-03-15T09:30:00", // Erstellungszeit
        "2024-04-14", // Fälligkeitsdatum (30 Tage später)
      ];

      invoiceDates.forEach(date => {
        const result = formatToLexwareDate(date);
        expect(result).toBeTruthy();
        expect(result).toMatch(/^2024-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}[+-]\d{2}:\d{2}$/);
      });
    });

    it("sollte API-Input-Formate handhaben", () => {
      // Simuliere verschiedene Formate, die von APIs kommen könnten
      const apiFormats = [
        "2024-03-15",
        "2024-03-15T12:30:45",
        "2024-03-15 12:30:45",
        "2024-03-15T12:30:45.123",
        "2024-03-15T12:30:45Z", // Mit Z am Ende
      ];

      apiFormats.forEach(format => {
        const result = formatToLexwareDate(format);
        // Alle sollten erfolgreich verarbeitet werden
        expect(result).toBeTruthy();
        if (format !== "2024-03-15T12:30:45Z") {
          // Z-Format könnte anders behandelt werden
          expect(result).toMatch(/^2024-03-15T\d{2}:\d{2}:\d{2}\.\d{3}[+-]\d{2}:\d{2}$/);
        }
      });
    });
  });

  describe("Performance Tests", () => {
    it("sollte viele Daten schnell verarbeiten", () => {
      // Arrange
      const dates = Array.from({ length: 1000 }, (_, i) => 
        `2024-03-${String(i % 28 + 1).padStart(2, '0')}`
      );
      
      const startTime = Date.now();
      
      // Act
      const results = dates.map(date => formatToLexwareDate(date));
      
      // Assert
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(1000); // Sollte unter 1 Sekunde dauern
      expect(results).toHaveLength(1000);
      expect(results.every(result => result !== undefined)).toBe(true);
    });

    it("sollte bei wiederholten Aufrufen konsistent sein", () => {
      // Arrange
      const input = "2024-03-15T12:30:45";
      
      // Act
      const results = Array.from({ length: 100 }, () => formatToLexwareDate(input));
      
      // Assert
      const uniqueResults = new Set(results);
      expect(uniqueResults.size).toBe(1); // Alle Ergebnisse sollten identisch sein
    });
  });
});