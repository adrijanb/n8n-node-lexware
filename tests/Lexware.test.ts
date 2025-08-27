import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { Lexware } from "../nodes/Lexware/Lexware.node";

jest.mock("../nodes/Lexware/GenericFunctions", () => ({
  lexwareApiRequest: jest.fn(async () => ({ ok: true })),
}));

describe("Lexware Node (modular)", () => {
  let lexwareNode: Lexware;

  beforeEach(() => {
    lexwareNode = new Lexware();
    jest.clearAllMocks();
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
