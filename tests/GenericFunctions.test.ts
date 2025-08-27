import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { IExecuteFunctions } from "n8n-core";
import { NodeApiError, IHttpRequestOptions } from "n8n-workflow";
import {
  lexwareApiRequest,
  lexwareApiRequestAllItems,
  lexwareApiUpload,
  lexwareApiDownload,
  lexwareApiRequestPagedAll,
} from "../nodes/Lexware/GenericFunctions";

describe("GenericFunctions - Umfassende Tests", () => {
  let mockExecuteFunctions: jest.Mocked<IExecuteFunctions>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockExecuteFunctions = {
      getCredentials: jest.fn(),
      getNode: jest.fn(() => ({ name: "Test Node" })),
      helpers: {
        httpRequest: jest.fn(),
      },
    } as any;
  });

  describe("lexwareApiRequest", () => {
    const mockCredentials = {
      accessToken: "test-token-123",
      baseUrl: "https://api.lexware.de",
    };

    beforeEach(() => {
      mockExecuteFunctions.getCredentials.mockResolvedValue(mockCredentials);
    });

    it("sollte erfolgreiche GET-Anfrage durchführen", async () => {
      // Arrange
      const mockResponse = { data: "test response" };
      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await lexwareApiRequest.call(
        mockExecuteFunctions,
        "GET",
        "/v1/test"
      );

      // Assert
      expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
        url: "https://api.lexware.de/v1/test",
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: "Bearer test-token-123",
        },
        json: true,
        qs: {},
      });
      expect(result).toBe(mockResponse);
    });

    it("sollte erfolgreiche POST-Anfrage mit Body durchführen", async () => {
      // Arrange
      const requestBody = { name: "Test", value: 123 };
      const mockResponse = { id: "created-123" };
      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await lexwareApiRequest.call(
        mockExecuteFunctions,
        "POST",
        "/v1/create",
        requestBody
      );

      // Assert
      expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
        url: "https://api.lexware.de/v1/create",
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: "Bearer test-token-123",
        },
        json: true,
        qs: {},
        body: requestBody,
      });
      expect(result).toBe(mockResponse);
    });

    it("sollte Query-Parameter korrekt anhängen", async () => {
      // Arrange
      const queryParams = { page: 1, size: 25, filter: "active" };
      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({});

      // Act
      await lexwareApiRequest.call(
        mockExecuteFunctions,
        "GET",
        "/v1/list",
        {},
        queryParams
      );

      // Assert
      expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
        url: "https://api.lexware.de/v1/list",
        method: "GET",
        headers: expect.any(Object),
        json: true,
        qs: queryParams,
      });
    });

    it("sollte Body bei GET-Anfragen entfernen", async () => {
      // Arrange
      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({});

      // Act
      await lexwareApiRequest.call(
        mockExecuteFunctions,
        "GET",
        "/v1/test",
        { someData: "should be removed" }
      );

      // Assert
      const calledOptions = mockExecuteFunctions.helpers.httpRequest.mock.calls[0][0];
      expect(calledOptions).not.toHaveProperty("body");
    });

    it("sollte Body bei leerem Objekt entfernen", async () => {
      // Arrange
      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({});

      // Act
      await lexwareApiRequest.call(
        mockExecuteFunctions,
        "POST",
        "/v1/test",
        {}
      );

      // Assert
      const calledOptions = mockExecuteFunctions.helpers.httpRequest.mock.calls[0][0];
      expect(calledOptions).not.toHaveProperty("body");
    });

    it("sollte optionOverrides korrekt anwenden", async () => {
      // Arrange
      const overrides = {
        timeout: 30000,
        returnFullResponse: true,
      };
      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({});

      // Act
      await lexwareApiRequest.call(
        mockExecuteFunctions,
        "GET",
        "/v1/test",
        {},
        {},
        overrides
      );

      // Assert
      expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
        expect.objectContaining(overrides)
      );
    });

    it("sollte 429 Rate-Limiting mit Retry handhaben", async () => {
      // Arrange
      const rateLimitError = {
        response: {
          statusCode: 429,
          headers: { "retry-after": "2" },
        },
      };
      
      mockExecuteFunctions.helpers.httpRequest
        .mockRejectedValueOnce(rateLimitError)
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce({ success: true });

      // Mock für sleep
      jest.spyOn(global, "setTimeout").mockImplementation(
        (callback: any) => callback()
      );

      // Act
      const result = await lexwareApiRequest.call(
        mockExecuteFunctions,
        "GET",
        "/v1/test"
      );

      // Assert
      expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledTimes(3);
      expect(result).toEqual({ success: true });
    });

    it("sollte nach maximalen Retries Fehler werfen", async () => {
      // Arrange
      const rateLimitError = {
        response: {
          statusCode: 429,
          headers: {},
        },
      };

      mockExecuteFunctions.helpers.httpRequest.mockRejectedValue(rateLimitError);

      // Mock für sleep
      jest.spyOn(global, "setTimeout").mockImplementation(
        (callback: any) => callback()
      );

      // Act & Assert
      await expect(
        lexwareApiRequest.call(mockExecuteFunctions, "GET", "/v1/test")
      ).rejects.toEqual(rateLimitError);

      expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledTimes(6); // 1 + 5 Retries
    });

    it("sollte API-Fehler korrekt formatieren", async () => {
      // Arrange
      const apiError = {
        response: {
          statusCode: 400,
          body: {
            message: "Validation failed",
            errors: ["Field 'name' is required"],
          },
        },
        message: "Request failed",
      };

      mockExecuteFunctions.helpers.httpRequest.mockRejectedValue(apiError);

      // Act & Assert
      await expect(
        lexwareApiRequest.call(mockExecuteFunctions, "POST", "/v1/create", {})
      ).rejects.toThrow(NodeApiError);
    });

    it("sollte String-Fehlermeldungen handhaben", async () => {
      // Arrange
      const apiError = {
        response: {
          statusCode: 500,
          body: "Internal server error",
        },
      };

      mockExecuteFunctions.helpers.httpRequest.mockRejectedValue(apiError);

      // Act & Assert
      await expect(
        lexwareApiRequest.call(mockExecuteFunctions, "GET", "/v1/test")
      ).rejects.toThrow(NodeApiError);
    });

    it("sollte verschiedene Delay-Strategien bei Rate-Limiting verwenden", async () => {
      // Test für exponential backoff ohne Retry-After Header
      const rateLimitError = {
        response: {
          statusCode: 429,
          headers: {},
        },
      };

      let sleepCalls: number[] = [];
      jest.spyOn(global, "setTimeout").mockImplementation((callback: any, delay: number) => {
        sleepCalls.push(delay);
        callback();
        return {} as any;
      });

      mockExecuteFunctions.helpers.httpRequest
        .mockRejectedValueOnce(rateLimitError)
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce({ success: true });

      await lexwareApiRequest.call(mockExecuteFunctions, "GET", "/v1/test");

      // Sollte exponential backoff verwenden
      expect(sleepCalls.length).toBeGreaterThan(0);
      expect(sleepCalls[1]).toBeGreaterThan(sleepCalls[0]);
    });
  });

  describe("lexwareApiRequestAllItems", () => {
    beforeEach(() => {
      mockExecuteFunctions.getCredentials.mockResolvedValue({
        accessToken: "test-token",
        baseUrl: "https://api.lexware.de",
      });
    });

    it("sollte alle Seiten abrufen", async () => {
      // Arrange
      const page0Response = {
        data: [{ id: 1 }, { id: 2 }],
      };
      const page1Response = {
        data: [{ id: 3 }, { id: 4 }],
      };
      const page2Response = {
        data: [],
      };

      mockExecuteFunctions.helpers.httpRequest
        .mockResolvedValueOnce(page0Response)
        .mockResolvedValueOnce(page1Response)
        .mockResolvedValueOnce(page2Response);

      // Act
      const result = await lexwareApiRequestAllItems.call(
        mockExecuteFunctions,
        "GET",
        "/v1/items"
      );

      // Assert
      expect(result).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }]);
      expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledTimes(3);
    });

    it("sollte mit 'items' Property umgehen", async () => {
      // Arrange
      const mockResponse = {
        items: [{ id: 1 }, { id: 2 }],
      };

      mockExecuteFunctions.helpers.httpRequest
        .mockResolvedValueOnce(mockResponse)
        .mockResolvedValueOnce({ items: [] });

      // Act
      const result = await lexwareApiRequestAllItems.call(
        mockExecuteFunctions,
        "GET",
        "/v1/items"
      );

      // Assert
      expect(result).toEqual([{ id: 1 }, { id: 2 }]);
    });

    it("sollte bei nicht-Array-Antwort stoppen", async () => {
      // Arrange
      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
        message: "Not an array",
      });

      // Act
      const result = await lexwareApiRequestAllItems.call(
        mockExecuteFunctions,
        "GET",
        "/v1/items"
      );

      // Assert
      expect(result).toEqual([]);
      expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledTimes(1);
    });

    it("sollte existierende Query-Parameter beibehalten", async () => {
      // Arrange
      const existingQs = { filter: "active", sort: "name" };
      
      mockExecuteFunctions.helpers.httpRequest
        .mockResolvedValueOnce({ data: [{ id: 1 }] })
        .mockResolvedValueOnce({ data: [] });

      // Act
      await lexwareApiRequestAllItems.call(
        mockExecuteFunctions,
        "GET",
        "/v1/items",
        {},
        existingQs
      );

      // Assert
      expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
        url: "https://api.lexware.de/v1/items",
        method: "GET",
        headers: expect.any(Object),
        json: true,
        qs: { page: 0, filter: "active", sort: "name" },
      });
    });
  });

  describe("lexwareApiUpload", () => {
    beforeEach(() => {
      mockExecuteFunctions.getCredentials.mockResolvedValue({
        accessToken: "upload-token",
        baseUrl: "https://api.lexware.de",
      });
    });

    it("sollte Datei erfolgreich hochladen", async () => {
      // Arrange
      const formData = {
        file: {
          value: Buffer.from("file content"),
          options: {
            filename: "test.pdf",
            contentType: "application/pdf",
          },
        },
        type: "document",
      };

      const mockResponse = { id: "uploaded-file-123" };
      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await lexwareApiUpload.call(
        mockExecuteFunctions,
        "/v1/files",
        formData
      );

      // Assert
      expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
        method: "POST",
        url: "https://api.lexware.de/v1/files",
        headers: {
          Accept: "application/json",
          Authorization: "Bearer upload-token",
        },
        json: true,
        formData,
      });
      expect(result).toBe(mockResponse);
    });

    it("sollte Upload-Optionen überschreiben können", async () => {
      // Arrange
      const formData = { file: "test" };
      const overrides = { timeout: 60000 };

      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({});

      // Act
      await lexwareApiUpload.call(
        mockExecuteFunctions,
        "/v1/files",
        formData,
        overrides
      );

      // Assert
      expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
        expect.objectContaining(overrides)
      );
    });

    it("sollte Upload-Fehler mit Retry handhaben", async () => {
      // Arrange
      const formData = { file: "test" };
      const rateLimitError = {
        response: { statusCode: 429, headers: {} },
      };

      jest.spyOn(global, "setTimeout").mockImplementation(
        (callback: any) => callback()
      );

      mockExecuteFunctions.helpers.httpRequest
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce({ success: true });

      // Act
      const result = await lexwareApiUpload.call(
        mockExecuteFunctions,
        "/v1/files",
        formData
      );

      // Assert
      expect(result).toEqual({ success: true });
      expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledTimes(2);
    });
  });

  describe("lexwareApiDownload", () => {
    beforeEach(() => {
      mockExecuteFunctions.getCredentials.mockResolvedValue({
        accessToken: "download-token",
        baseUrl: "https://api.lexware.de",
      });
    });

    it("sollte Datei erfolgreich herunterladen", async () => {
      // Arrange
      const mockResponse = {
        body: Buffer.from("file content"),
        headers: {
          "content-type": "application/pdf",
          "content-disposition": 'attachment; filename="document.pdf"',
        },
      };

      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await lexwareApiDownload.call(
        mockExecuteFunctions,
        "/v1/files/123"
      );

      // Assert
      expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
        method: "GET",
        url: "https://api.lexware.de/v1/files/123",
        headers: {
          Authorization: "Bearer download-token",
        },
        json: false,
        encoding: null,
        returnFullResponse: true,
      });
      expect(result).toBe(mockResponse);
    });

    it("sollte Download-Optionen überschreiben können", async () => {
      // Arrange
      const overrides = { timeout: 120000 };
      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({});

      // Act
      await lexwareApiDownload.call(
        mockExecuteFunctions,
        "/v1/files/123",
        overrides
      );

      // Assert
      expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
        expect.objectContaining(overrides)
      );
    });

    it("sollte Download-Fehler mit Retry handhaben", async () => {
      // Arrange
      const networkError = {
        response: { statusCode: 429, headers: { "retry-after": "1" } },
      };

      jest.spyOn(global, "setTimeout").mockImplementation(
        (callback: any) => callback()
      );

      mockExecuteFunctions.helpers.httpRequest
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce({ body: Buffer.from("content") });

      // Act
      const result = await lexwareApiDownload.call(
        mockExecuteFunctions,
        "/v1/files/123"
      );

      // Assert
      expect(result).toEqual({ body: Buffer.from("content") });
      expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledTimes(2);
    });
  });

  describe("lexwareApiRequestPagedAll", () => {
    beforeEach(() => {
      mockExecuteFunctions.getCredentials.mockResolvedValue({
        accessToken: "paged-token",
        baseUrl: "https://api.lexware.de",
      });
    });

    it("sollte alle Seiten mit Lexware-Paging abrufen", async () => {
      // Arrange
      const page0Response = {
        content: [{ id: 1 }, { id: 2 }],
        last: false,
        number: 0,
        size: 2,
      };

      const page1Response = {
        content: [{ id: 3 }, { id: 4 }],
        last: false,
        number: 1,
        size: 2,
      };

      const page2Response = {
        content: [{ id: 5 }],
        last: true,
        number: 2,
        size: 2,
      };

      mockExecuteFunctions.helpers.httpRequest
        .mockResolvedValueOnce(page0Response)
        .mockResolvedValueOnce(page1Response)
        .mockResolvedValueOnce(page2Response);

      // Act
      const result = await lexwareApiRequestPagedAll.call(
        mockExecuteFunctions,
        "/v1/contacts"
      );

      // Assert
      expect(result).toEqual([
        { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }
      ]);
      expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledTimes(3);
    });

    it("sollte bei last=true stoppen", async () => {
      // Arrange
      const lastPageResponse = {
        content: [{ id: 1 }],
        last: true,
      };

      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(lastPageResponse);

      // Act
      const result = await lexwareApiRequestPagedAll.call(
        mockExecuteFunctions,
        "/v1/contacts"
      );

      // Assert
      expect(result).toEqual([{ id: 1 }]);
      expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledTimes(1);
    });

    it("sollte bei leerem content stoppen", async () => {
      // Arrange
      const emptyResponse = {
        content: [],
        last: false,
      };

      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(emptyResponse);

      // Act
      const result = await lexwareApiRequestPagedAll.call(
        mockExecuteFunctions,
        "/v1/contacts"
      );

      // Assert
      expect(result).toEqual([]);
      expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledTimes(1);
    });

    it("sollte custom page und size Parameter verwenden", async () => {
      // Arrange
      const customQs = { page: 5, size: 50, filter: "active" };
      
      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
        content: [],
        last: true,
      });

      // Act
      await lexwareApiRequestPagedAll.call(
        mockExecuteFunctions,
        "/v1/contacts",
        customQs
      );

      // Assert
      expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
        url: "https://api.lexware.de/v1/contacts",
        method: "GET",
        headers: expect.any(Object),
        json: true,
        qs: { page: 5, size: 50, filter: "active" },
      });
    });

    it("sollte Standard-Werte für page und size verwenden", async () => {
      // Arrange
      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
        content: [],
        last: true,
      });

      // Act
      await lexwareApiRequestPagedAll.call(
        mockExecuteFunctions,
        "/v1/contacts"
      );

      // Assert
      expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
        url: "https://api.lexware.de/v1/contacts",
        method: "GET",
        headers: expect.any(Object),
        json: true,
        qs: { page: 0, size: 25 },
      });
    });

    it("sollte mit fehlendem content property umgehen", async () => {
      // Arrange
      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
        // Kein content property
        last: true,
      });

      // Act
      const result = await lexwareApiRequestPagedAll.call(
        mockExecuteFunctions,
        "/v1/contacts"
      );

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe("Integration Tests", () => {
    beforeEach(() => {
      mockExecuteFunctions.getCredentials.mockResolvedValue({
        accessToken: "integration-token",
        baseUrl: "https://api.lexware.de",
      });
    });

    it("sollte mehrere API-Funktionen zusammen verwenden können", async () => {
      // Simulate a complex workflow: upload file, then create invoice
      
      // Upload
      const uploadFormData = {
        file: {
          value: Buffer.from("invoice attachment"),
          options: { filename: "invoice.pdf" },
        },
        type: "invoice",
      };

      mockExecuteFunctions.helpers.httpRequest
        .mockResolvedValueOnce({ id: "file-123" }) // Upload response
        .mockResolvedValueOnce({ id: "invoice-456" }); // Create invoice response

      // Upload file
      const uploadResult = await lexwareApiUpload.call(
        mockExecuteFunctions,
        "/v1/files",
        uploadFormData
      );

      // Create invoice
      const invoiceResult = await lexwareApiRequest.call(
        mockExecuteFunctions,
        "POST",
        "/v1/invoices",
        { title: "Test Invoice", attachmentId: uploadResult.id }
      );

      // Assert
      expect(uploadResult.id).toBe("file-123");
      expect(invoiceResult.id).toBe("invoice-456");
      expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledTimes(2);
    });
  });

  describe("Error Recovery", () => {
    beforeEach(() => {
      mockExecuteFunctions.getCredentials.mockResolvedValue({
        accessToken: "recovery-token",
        baseUrl: "https://api.lexware.de",
      });
    });

    it("sollte nach temporären Netzwerkfehlern erfolgreich sein", async () => {
      // Arrange
      const networkError = new Error("ECONNRESET");
      const rateLimitError = { response: { statusCode: 429, headers: {} } };
      const successResponse = { data: "success" };

      jest.spyOn(global, "setTimeout").mockImplementation(
        (callback: any) => callback()
      );

      mockExecuteFunctions.helpers.httpRequest
        .mockRejectedValueOnce(networkError) // Würde normalerweise nicht retry werden
        .mockRejectedValueOnce(rateLimitError) // Wird retry
        .mockResolvedValueOnce(successResponse);

      // Act & Assert für Rate Limiting
      const result = await lexwareApiRequest.call(
        mockExecuteFunctions,
        "GET",
        "/v1/test"
      );

      // Der Network Error wird nicht retried, aber wenn es sich um Rate Limiting handelt
      // (wie im zweiten Aufruf), wird es retried
      expect(result).toEqual(successResponse);
    });

    it("sollte bei dauerhaften Fehlern aufgeben", async () => {
      // Arrange
      const permanentError = {
        response: { statusCode: 404, body: "Not found" },
      };

      mockExecuteFunctions.helpers.httpRequest.mockRejectedValue(permanentError);

      // Act & Assert
      await expect(
        lexwareApiRequest.call(mockExecuteFunctions, "GET", "/v1/nonexistent")
      ).rejects.toThrow(NodeApiError);

      // Sollte nicht retried werden
      expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledTimes(1);
    });
  });
});