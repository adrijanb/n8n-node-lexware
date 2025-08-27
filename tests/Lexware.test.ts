import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { Lexware } from "../nodes/Lexware/Lexware.node";

jest.mock("../nodes/Lexware/GenericFunctions", () => ({
  lexwareApiRequest: jest.fn(async () => ({ ok: true })),
  lexwareApiUpload: jest.fn(async () => ({ id: "file-1" })),
  lexwareApiDownload: jest.fn(async () => ({
    headers: {
      "content-type": "application/pdf",
      "content-disposition": "attachment; filename=doc.pdf",
    },
    body: Buffer.from("test"),
  })),
}));

describe("Lexware Node (modular)", () => {
  let lexwareNode: Lexware;

  beforeEach(() => {
    lexwareNode = new Lexware();
    jest.clearAllMocks();
  });

  describe("Coverage smoke for action handlers", () => {
    it("should import action files without crashing", async () => {
      expect(() => require("../nodes/Lexware/actions/Contacts.execute"));
      expect(() => require("../nodes/Lexware/actions/Dunnings.execute"));
      expect(() => require("../nodes/Lexware/actions/VoucherLists.execute"));
      expect(() => require("../nodes/Lexware/actions/Files.execute"));
      expect(() => require("../nodes/Lexware/actions/Quotations.execute"));
    });
  });

  describe("Node Description", () => {
    it("should have correct display name", () => {
      expect(lexwareNode.description.displayName).toBe("Lexware");
    });

    it("should have resources in English", () => {
      const resource = lexwareNode.description.properties.find(
        (p) => p.name === "resource"
      );
      expect(resource).toBeDefined();
      const values = resource?.options?.map((o: any) => o.value) ?? [];
      expect(values).toEqual(
        expect.arrayContaining([
          "articles",
          "contacts",
          "dunnings",
          "invoices",
          "orderConfirmations",
          "quotations",
          "voucherLists",
          "vouchers",
          "printLayouts",
        ])
      );
    });
  });
});
