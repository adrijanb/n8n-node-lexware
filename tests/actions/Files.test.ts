import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { IExecuteFunctions } from "n8n-core";
import { IDataObject, NodeOperationError } from "n8n-workflow";
import { executeFiles } from "../../nodes/Lexware/actions/Files.execute";

// Mock der GenericFunctions
jest.mock("../../nodes/Lexware/GenericFunctions", () => ({
  lexwareApiUpload: jest.fn(),
  lexwareApiDownload: jest.fn(),
}));

describe("Files.execute - Umfassende Tests", () => {
  let mockExecuteFunctions: jest.Mocked<IExecuteFunctions>;
  const mockGenericFunctions = jest.requireMock("../../nodes/Lexware/GenericFunctions") as any;
  const { lexwareApiUpload, lexwareApiDownload } = mockGenericFunctions;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockExecuteFunctions = {
      getNodeParameter: jest.fn(),
      getNode: jest.fn(() => ({ name: "Lexware Files" })),
      getInputData: jest.fn(),
      helpers: {
        getBinaryDataBuffer: jest.fn(),
        prepareBinaryData: jest.fn(),
      },
    } as any;
  });

  describe("UPLOAD Operation", () => {
    it("sollte eine Datei erfolgreich hochladen", async () => {
      // Arrange
      const binaryPropertyName = "attachment";
      const type = "voucher";
      const fileContent = Buffer.from("Test file content");
      const fileName = "test-document.pdf";
      const mimeType = "application/pdf";

      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce(binaryPropertyName)
        .mockReturnValueOnce(type);

      mockExecuteFunctions.getInputData.mockReturnValue([
        {
          json: {},
          binary: {
            [binaryPropertyName]: {
              fileName,
              mimeType,
              data: "base64encodeddata",
            },
          },
        },
      ]);

      mockExecuteFunctions.helpers.getBinaryDataBuffer.mockResolvedValue(fileContent);

      const mockResponse = {
        id: "file-123",
        fileName,
        type,
        size: fileContent.length,
      };
      lexwareApiUpload.mockResolvedValue(mockResponse);

      // Act
      const result = await executeFiles.call(mockExecuteFunctions, 0, "upload");

      // Assert
      expect(lexwareApiUpload).toHaveBeenCalledWith("/v1/files", {
        file: {
          value: fileContent,
          options: {
            filename: fileName,
            contentType: mimeType,
          },
        },
        type,
      });
      expect(result).toEqual([{ json: mockResponse }]);
    });

    it("sollte Standard-Werte für fehlende Metadaten verwenden", async () => {
      // Arrange
      const binaryPropertyName = "data";
      const fileContent = Buffer.from("Test content");

      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce(binaryPropertyName)
        .mockReturnValueOnce("voucher");

      mockExecuteFunctions.getInputData.mockReturnValue([
        {
          json: {},
          binary: {
            [binaryPropertyName]: {
              data: "base64data",
              mimeType: "application/octet-stream",
              fileName: "test-file.txt",
            },
          },
        },
      ]);

      mockExecuteFunctions.helpers.getBinaryDataBuffer.mockResolvedValue(fileContent);
      lexwareApiUpload.mockResolvedValue({ id: "file-default" });

      // Act
      await executeFiles.call(mockExecuteFunctions, 0, "upload");

      // Assert
      expect(lexwareApiUpload).toHaveBeenCalledWith("/v1/files", {
        file: {
          value: fileContent,
          options: {
            filename: "test-file.txt",
            contentType: "application/octet-stream",
          },
        },
        type: "voucher",
      });
    });

    it("sollte verschiedene Dateitypen unterstützen", async () => {
      const testCases = [
        { type: "voucher", fileName: "receipt.pdf", mimeType: "application/pdf" },
        { type: "invoice", fileName: "invoice.xml", mimeType: "application/xml" },
        { type: "document", fileName: "contract.docx", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
        { type: "image", fileName: "logo.png", mimeType: "image/png" },
      ];

      for (const testCase of testCases) {
        jest.clearAllMocks();

        mockExecuteFunctions.getNodeParameter
          .mockReturnValueOnce("attachment")
          .mockReturnValueOnce(testCase.type);

        mockExecuteFunctions.getInputData.mockReturnValue([
          {
            json: {},
            binary: {
              attachment: {
                fileName: testCase.fileName,
                mimeType: testCase.mimeType,
                data: "base64data",
              },
            },
          },
        ]);

        mockExecuteFunctions.helpers.getBinaryDataBuffer.mockResolvedValue(Buffer.from("content"));
        lexwareApiUpload.mockResolvedValue({ id: `file-${testCase.type}` });

        await executeFiles.call(mockExecuteFunctions, 0, "upload");

        expect(lexwareApiUpload).toHaveBeenCalledWith("/v1/files", {
          file: {
            value: Buffer.from("content"),
            options: {
              filename: testCase.fileName,
              contentType: testCase.mimeType,
            },
          },
          type: testCase.type,
        });
      }
    });

    it("sollte Fehler werfen wenn binary property fehlt", async () => {
      // Arrange
      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce("missingProperty")
        .mockReturnValueOnce("voucher");

      mockExecuteFunctions.getInputData.mockReturnValue([
        {
          json: {},
          binary: {}, // Kein binary property
        },
      ]);

      // Act & Assert
      await expect(
        executeFiles.call(mockExecuteFunctions, 0, "upload")
      ).rejects.toThrow(NodeOperationError);
    });

    it("sollte Fehler werfen wenn binary data komplett fehlt", async () => {
      // Arrange
      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce("attachment")
        .mockReturnValueOnce("voucher");

      mockExecuteFunctions.getInputData.mockReturnValue([
        {
          json: {},
          // Kein binary Objekt
        },
      ]);

      // Act & Assert
      await expect(
        executeFiles.call(mockExecuteFunctions, 0, "upload")
      ).rejects.toThrow(NodeOperationError);
    });

    it("sollte große Dateien handhaben", async () => {
      // Arrange
      const largeFileContent = Buffer.alloc(10 * 1024 * 1024, "a"); // 10MB
      
      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce("largefile")
        .mockReturnValueOnce("document");

      mockExecuteFunctions.getInputData.mockReturnValue([
        {
          json: {},
          binary: {
            largefile: {
              fileName: "large-document.pdf",
              mimeType: "application/pdf",
              data: "base64data",
            },
          },
        },
      ]);

      mockExecuteFunctions.helpers.getBinaryDataBuffer.mockResolvedValue(largeFileContent);
      lexwareApiUpload.mockResolvedValue({ id: "large-file" });

      // Act
      await executeFiles.call(mockExecuteFunctions, 0, "upload");

      // Assert
      expect(lexwareApiUpload).toHaveBeenCalledWith("/v1/files", {
        file: {
          value: largeFileContent,
          options: {
            filename: "large-document.pdf",
            contentType: "application/pdf",
          },
        },
        type: "document",
      });
    });
  });

  describe("DOWNLOAD Operation", () => {
    it("sollte eine Datei erfolgreich herunterladen", async () => {
      // Arrange
      const fileId = "file-123";
      const downloadPropertyName = "downloadedFile";
      const fileContent = Buffer.from("Downloaded file content");
      const fileName = "downloaded-document.pdf";
      const contentType = "application/pdf";

      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce(fileId)
        .mockReturnValueOnce(downloadPropertyName);

      const mockResponse = {
        body: fileContent,
        headers: {
          "content-type": contentType,
          "content-disposition": `attachment; filename="${fileName}"`,
        },
      };
      lexwareApiDownload.mockResolvedValue(mockResponse);

      const binaryData = {
        data: "base64data",
        mimeType: contentType,
        fileName,
      };
      mockExecuteFunctions.helpers.prepareBinaryData.mockResolvedValue(binaryData);

      // Act
      const result = await executeFiles.call(mockExecuteFunctions, 0, "download");

      // Assert
      expect(lexwareApiDownload).toHaveBeenCalledWith(`/v1/files/${fileId}`);
      expect(mockExecuteFunctions.helpers.prepareBinaryData).toHaveBeenCalledWith(
        fileContent,
        fileName,
        contentType
      );
      expect(result).toEqual([{
        json: {},
        binary: { [downloadPropertyName]: binaryData },
      }]);
    });

    it("sollte Standard-Binary-Property-Name verwenden", async () => {
      // Arrange
      const fileId = "file-456";
      
      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce(fileId)
        .mockReturnValueOnce("data"); // Standard-Name

      lexwareApiDownload.mockResolvedValue({
        body: Buffer.from("content"),
        headers: { "content-type": "text/plain" },
      });

      mockExecuteFunctions.helpers.prepareBinaryData.mockResolvedValue({
        data: "base64",
        mimeType: "text/plain",
        fileName: "download",
      });

      // Act
      const result = await executeFiles.call(mockExecuteFunctions, 0, "download");

      // Assert
      expect(result[0].binary).toHaveProperty("data");
    });

    it("sollte verschiedene Content-Disposition Header parsen", async () => {
      const testCases = [
        {
          header: 'attachment; filename="document.pdf"',
          expectedFileName: "document.pdf",
        },
        {
          header: "attachment; filename=simple.txt",
          expectedFileName: "simple.txt",
        },
        {
          header: "attachment; filename*=UTF-8''encoded%20file.pdf",
          expectedFileName: "encoded file.pdf",
        },
        {
          header: 'inline; filename="report with spaces.xlsx"',
          expectedFileName: "report with spaces.xlsx",
        },
        {
          header: "attachment", // Kein filename
          expectedFileName: "download",
        },
      ];

      for (const testCase of testCases) {
        jest.clearAllMocks();

        mockExecuteFunctions.getNodeParameter
          .mockReturnValueOnce("test-file")
          .mockReturnValueOnce("data");

        lexwareApiDownload.mockResolvedValue({
          body: Buffer.from("content"),
          headers: {
            "content-type": "application/octet-stream",
            "content-disposition": testCase.header,
          },
        });

        mockExecuteFunctions.helpers.prepareBinaryData.mockResolvedValue({
          data: "base64",
          mimeType: "application/octet-stream",
          fileName: testCase.expectedFileName,
        });

        await executeFiles.call(mockExecuteFunctions, 0, "download");

        expect(mockExecuteFunctions.helpers.prepareBinaryData).toHaveBeenCalledWith(
          Buffer.from("content"),
          testCase.expectedFileName,
          "application/octet-stream"
        );
      }
    });

    it("sollte mit fehlenden Headers umgehen", async () => {
      // Arrange
      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce("file-no-headers")
        .mockReturnValueOnce("data");

      lexwareApiDownload.mockResolvedValue({
        body: Buffer.from("content without headers"),
        headers: {}, // Keine Headers
      });

      mockExecuteFunctions.helpers.prepareBinaryData.mockResolvedValue({
        data: "base64",
        mimeType: "application/octet-stream",
        fileName: "download",
      });

      // Act
      await executeFiles.call(mockExecuteFunctions, 0, "download");

      // Assert
      expect(mockExecuteFunctions.helpers.prepareBinaryData).toHaveBeenCalledWith(
        Buffer.from("content without headers"),
        "download",
        "application/octet-stream"
      );
    });

    it("sollte mit undefined Headers umgehen", async () => {
      // Arrange
      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce("file-undefined-headers")
        .mockReturnValueOnce("data");

      lexwareApiDownload.mockResolvedValue({
        body: Buffer.from("content"),
        // headers: undefined - komplett fehlend
      });

      mockExecuteFunctions.helpers.prepareBinaryData.mockResolvedValue({
        data: "base64",
        mimeType: "application/octet-stream",
        fileName: "download",
      });

      // Act
      await executeFiles.call(mockExecuteFunctions, 0, "download");

      // Assert
      expect(mockExecuteFunctions.helpers.prepareBinaryData).toHaveBeenCalledWith(
        Buffer.from("content"),
        "download",
        "application/octet-stream"
      );
    });

    it("sollte UTF-8 Dateinamen korrekt dekodieren", async () => {
      // Arrange
      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce("file-utf8")
        .mockReturnValueOnce("data");

      lexwareApiDownload.mockResolvedValue({
        body: Buffer.from("content"),
        headers: {
          "content-type": "text/plain",
          "content-disposition": "attachment; filename*=UTF-8''%C3%84%C3%96%C3%9C%20Datei.txt", // ÄÖÜ Datei.txt
        },
      });

      mockExecuteFunctions.helpers.prepareBinaryData.mockResolvedValue({
        data: "base64",
        mimeType: "text/plain",
        fileName: "ÄÖÜ Datei.txt",
      });

      // Act
      await executeFiles.call(mockExecuteFunctions, 0, "download");

      // Assert
      expect(mockExecuteFunctions.helpers.prepareBinaryData).toHaveBeenCalledWith(
        Buffer.from("content"),
        "ÄÖÜ Datei.txt",
        "text/plain"
      );
    });

    it("sollte leere Datei-Downloads handhaben", async () => {
      // Arrange
      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce("empty-file")
        .mockReturnValueOnce("data");

      lexwareApiDownload.mockResolvedValue({
        body: Buffer.alloc(0), // Leere Datei
        headers: {
          "content-type": "text/plain",
          "content-disposition": 'attachment; filename="empty.txt"',
        },
      });

      mockExecuteFunctions.helpers.prepareBinaryData.mockResolvedValue({
        data: "",
        mimeType: "text/plain",
        fileName: "empty.txt",
      });

      // Act
      const result = await executeFiles.call(mockExecuteFunctions, 0, "download");

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].binary?.data?.fileName).toBe("empty.txt");
    });
  });

  describe("Error Handling", () => {
    it("sollte bei ungültiger Operation einen Fehler werfen", async () => {
      // Act & Assert
      await expect(
        executeFiles.call(mockExecuteFunctions, 0, "invalidOperation")
      ).rejects.toThrow(NodeOperationError);
    });

    it("sollte Upload-Fehler weiterleiten", async () => {
      // Arrange
      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce("attachment")
        .mockReturnValueOnce("voucher");

      mockExecuteFunctions.getInputData.mockReturnValue([
        {
          json: {},
          binary: {
            attachment: {
              fileName: "test.pdf",
              mimeType: "application/pdf",
              data: "base64data",
            },
          },
        },
      ]);

      mockExecuteFunctions.helpers.getBinaryDataBuffer.mockResolvedValue(Buffer.from("content"));
      lexwareApiUpload.mockRejectedValue(new Error("Upload failed"));

      // Act & Assert
      await expect(
        executeFiles.call(mockExecuteFunctions, 0, "upload")
      ).rejects.toThrow("Upload failed");
    });

    it("sollte Download-Fehler weiterleiten", async () => {
      // Arrange
      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce("file-123")
        .mockReturnValueOnce("data");

      lexwareApiDownload.mockRejectedValue(new Error("File not found"));

      // Act & Assert
      await expect(
        executeFiles.call(mockExecuteFunctions, 0, "download")
      ).rejects.toThrow("File not found");
    });

    it("sollte Binary-Data-Buffer-Fehler handhaben", async () => {
      // Arrange
      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce("attachment")
        .mockReturnValueOnce("voucher");

      mockExecuteFunctions.getInputData.mockReturnValue([
        {
          json: {},
          binary: {
            attachment: {
              fileName: "test.pdf",
              mimeType: "application/pdf",
              data: "invalid-base64",
            },
          },
        },
      ]);

      mockExecuteFunctions.helpers.getBinaryDataBuffer.mockRejectedValue(new Error("Invalid binary data"));

      // Act & Assert
      await expect(
        executeFiles.call(mockExecuteFunctions, 0, "upload")
      ).rejects.toThrow("Invalid binary data");
    });
  });

  describe("Edge Cases", () => {
    it("sollte mit sehr langen Dateinamen umgehen", async () => {
      // Arrange
      const longFileName = "a".repeat(1000) + ".txt";
      
      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce("file-long-name")
        .mockReturnValueOnce("data");

      lexwareApiDownload.mockResolvedValue({
        body: Buffer.from("content"),
        headers: {
          "content-type": "text/plain",
          "content-disposition": `attachment; filename="${longFileName}"`,
        },
      });

      mockExecuteFunctions.helpers.prepareBinaryData.mockResolvedValue({
        data: "base64",
        mimeType: "text/plain",
        fileName: longFileName,
      });

      // Act
      await executeFiles.call(mockExecuteFunctions, 0, "download");

      // Assert
      expect(mockExecuteFunctions.helpers.prepareBinaryData).toHaveBeenCalledWith(
        Buffer.from("content"),
        longFileName,
        "text/plain"
      );
    });

    it("sollte mit Sonderzeichen in Dateinamen umgehen", async () => {
      // Arrange
      const specialFileName = "файл с пробелами и символами @#$%.pdf";
      
      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce("special-chars")
        .mockReturnValueOnce("data");

      lexwareApiDownload.mockResolvedValue({
        body: Buffer.from("content"),
        headers: {
          "content-type": "application/pdf",
          "content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent(specialFileName)}`,
        },
      });

      mockExecuteFunctions.helpers.prepareBinaryData.mockResolvedValue({
        data: "base64",
        mimeType: "application/pdf",
        fileName: specialFileName,
      });

      // Act
      await executeFiles.call(mockExecuteFunctions, 0, "download");

      // Assert
      expect(mockExecuteFunctions.helpers.prepareBinaryData).toHaveBeenCalledWith(
        Buffer.from("content"),
        specialFileName,
        "application/pdf"
      );
    });
  });

  describe("Performance Tests", () => {
    it("sollte Upload effizient verarbeiten", async () => {
      // Arrange
      const startTime = Date.now();
      
      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce("attachment")
        .mockReturnValueOnce("voucher");

      mockExecuteFunctions.getInputData.mockReturnValue([
        {
          json: {},
          binary: {
            attachment: {
              fileName: "test.pdf",
              mimeType: "application/pdf",
              data: "base64data",
            },
          },
        },
      ]);

      mockExecuteFunctions.helpers.getBinaryDataBuffer.mockResolvedValue(Buffer.from("content"));
      lexwareApiUpload.mockResolvedValue({ id: "perf-test" });

      // Act
      await executeFiles.call(mockExecuteFunctions, 0, "upload");

      // Assert
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(100);
    });

    it("sollte Download effizient verarbeiten", async () => {
      // Arrange
      const startTime = Date.now();
      
      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce("file-123")
        .mockReturnValueOnce("data");

      lexwareApiDownload.mockResolvedValue({
        body: Buffer.from("content"),
        headers: { "content-type": "text/plain" },
      });

      mockExecuteFunctions.helpers.prepareBinaryData.mockResolvedValue({
        data: "base64",
        mimeType: "text/plain",
        fileName: "download",
      });

      // Act
      await executeFiles.call(mockExecuteFunctions, 0, "download");

      // Assert
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(100);
    });
  });
});
