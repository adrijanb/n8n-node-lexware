import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { IExecuteFunctions } from "n8n-core";
import { IDataObject, NodeOperationError } from "n8n-workflow";
import { executeContacts } from "../../nodes/Lexware/actions/Contacts.execute";

// Mock der GenericFunctions
jest.mock("../../nodes/Lexware/GenericFunctions", () => ({
  lexwareApiRequest: jest.fn(),
  lexwareApiRequestPagedAll: jest.fn(),
}));

describe("Contacts.execute - Umfassende Tests", () => {
  let mockExecuteFunctions: jest.Mocked<IExecuteFunctions>;
  const { lexwareApiRequest, lexwareApiRequestPagedAll } = jest.requireMock("../../nodes/Lexware/GenericFunctions");

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockExecuteFunctions = {
      getNodeParameter: jest.fn(),
      getNode: jest.fn(() => ({ name: "Lexware Contacts" })),
    } as any;
  });

  describe("CREATE_COMPANY Operation", () => {
    it("sollte einen Firmenkontakt mit vollständigen Daten erstellen", async () => {
      // Arrange
      const companyData = {
        companyName: "Test GmbH",
        taxNumber: "12345678",
        vatRegistrationId: "DE123456789",
        allowTaxFreeInvoices: true,
        createAsCustomer: true,
        createAsVendor: false,
        note: "Test Firma",
        archived: false,
      };

      const contactPersons = [
        {
          salutation: "Herr",
          firstName: "Max",
          lastName: "Mustermann",
          primary: true,
          emailAddress: "max@test.de",
          phoneNumber: "+49123456789",
        },
      ];

      const billingAddress = [
        {
          supplement: "Gebäude A",
          street: "Teststraße 123",
          zip: "12345",
          city: "Teststadt",
          countryCode: "DE",
        },
      ];

      mockExecuteFunctions.getNodeParameter.mockImplementation((param) => {
        switch (param) {
          case "companyName": return companyData.companyName;
          case "taxNumber": return companyData.taxNumber;
          case "vatRegistrationId": return companyData.vatRegistrationId;
          case "allowTaxFreeInvoices": return companyData.allowTaxFreeInvoices;
          case "createAsCustomer": return companyData.createAsCustomer;
          case "createAsVendor": return companyData.createAsVendor;
          case "contactPersons.person": return contactPersons;
          case "billingAddress.address": return billingAddress;
          case "shippingAddress.address": return [];
          case "xRechnung": return {};
          case "emailAddresses": return {};
          case "phoneNumbers": return {};
          case "note": return companyData.note;
          case "archived": return companyData.archived;
          default: return "";
        }
      });

      const mockResponse = { id: "contact-123", version: 0 };
      lexwareApiRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await executeContacts.call(mockExecuteFunctions, 0, "createCompany");

      // Assert
      expect(lexwareApiRequest).toHaveBeenCalledWith(
        "POST",
        "/v1/contacts",
        expect.objectContaining({
          roles: { customer: {} },
          company: {
            name: companyData.companyName,
            allowTaxFreeInvoices: companyData.allowTaxFreeInvoices,
            contactPersons: contactPersons,
            taxNumber: companyData.taxNumber,
            vatRegistrationId: "DE123456789",
          },
          addresses: {
            billing: billingAddress,
            shipping: [],
          },
          note: companyData.note,
          archived: companyData.archived,
          version: 0,
        })
      );
      expect(result).toEqual([{ json: mockResponse }]);
    });

    it("sollte EU VAT IDs korrekt validieren", async () => {
      const validVatIds = [
        "DE123456789",
        "NL123456789B01",
        "AT U12345678",
        "FR12345678901",
        "IT12345678901",
        "CHE123456789MWST",
      ];

      for (const vatId of validVatIds) {
        jest.clearAllMocks();
        
        mockExecuteFunctions.getNodeParameter.mockImplementation((param) => {
          if (param === "vatRegistrationId") return vatId;
          if (param === "companyName") return "Test Company";
          if (param === "createAsCustomer") return true;
          return param.includes(".") ? [] : "";
        });

        lexwareApiRequest.mockResolvedValue({ id: "contact-test" });

        await executeContacts.call(mockExecuteFunctions, 0, "createCompany");

        expect(lexwareApiRequest).toHaveBeenCalled();
      }
    });

    it("sollte ungültige VAT IDs ablehnen", async () => {
      // Arrange
      mockExecuteFunctions.getNodeParameter.mockImplementation((param) => {
        if (param === "vatRegistrationId") return "INVALID123";
        if (param === "companyName") return "Test Company";
        if (param === "createAsCustomer") return true;
        return param.includes(".") ? [] : "";
      });

      // Act & Assert
      await expect(
        executeContacts.call(mockExecuteFunctions, 0, "createCompany")
      ).rejects.toThrow(NodeOperationError);
    });

    it("sollte sowohl Customer als auch Vendor Rollen setzen können", async () => {
      // Arrange
      mockExecuteFunctions.getNodeParameter.mockImplementation((param) => {
        if (param === "companyName") return "Test Company";
        if (param === "createAsCustomer") return true;
        if (param === "createAsVendor") return true;
        return param.includes(".") ? [] : "";
      });

      lexwareApiRequest.mockResolvedValue({ id: "contact-both" });

      // Act
      await executeContacts.call(mockExecuteFunctions, 0, "createCompany");

      // Assert
      expect(lexwareApiRequest).toHaveBeenCalledWith(
        "POST",
        "/v1/contacts",
        expect.objectContaining({
          roles: { customer: {}, vendor: {} },
        })
      );
    });

    it("sollte Fehler werfen wenn keine Rolle gesetzt ist", async () => {
      // Arrange
      mockExecuteFunctions.getNodeParameter.mockImplementation((param) => {
        if (param === "companyName") return "Test Company";
        if (param === "createAsCustomer") return false;
        if (param === "createAsVendor") return false;
        return param.includes(".") ? [] : "";
      });

      // Act & Assert
      await expect(
        executeContacts.call(mockExecuteFunctions, 0, "createCompany")
      ).rejects.toThrow(NodeOperationError);
    });

    it("sollte E-Mail-Adressen korrekt normalisieren", async () => {
      // Arrange
      const emailAddresses = {
        business: [
          { email: "business@test.de" },
          { email: "business2@test.de" },
        ],
        private: [{ email: "private@test.de" }],
        other: [{ email: "" }], // Leere E-Mail sollte gefiltert werden
      };

      mockExecuteFunctions.getNodeParameter.mockImplementation((param) => {
        if (param === "companyName") return "Test Company";
        if (param === "createAsCustomer") return true;
        if (param === "emailAddresses") return emailAddresses;
        return param.includes(".") ? [] : "";
      });

      lexwareApiRequest.mockResolvedValue({ id: "contact-emails" });

      // Act
      await executeContacts.call(mockExecuteFunctions, 0, "createCompany");

      // Assert
      expect(lexwareApiRequest).toHaveBeenCalledWith(
        "POST",
        "/v1/contacts",
        expect.objectContaining({
          emailAddresses: {
            business: ["business@test.de", "business2@test.de"],
            private: ["private@test.de"],
          },
        })
      );
    });

    it("sollte Telefonnummern korrekt normalisieren", async () => {
      // Arrange
      const phoneNumbers = {
        business: [{ number: "+49 123 456789" }],
        mobile: [{ number: "+49 987 654321" }],
        fax: [{ number: "+49 123 456790" }],
        other: [{ number: "" }], // Leere Nummer sollte gefiltert werden
      };

      mockExecuteFunctions.getNodeParameter.mockImplementation((param) => {
        if (param === "companyName") return "Test Company";
        if (param === "createAsCustomer") return true;
        if (param === "phoneNumbers") return phoneNumbers;
        return param.includes(".") ? [] : "";
      });

      lexwareApiRequest.mockResolvedValue({ id: "contact-phones" });

      // Act
      await executeContacts.call(mockExecuteFunctions, 0, "createCompany");

      // Assert
      expect(lexwareApiRequest).toHaveBeenCalledWith(
        "POST",
        "/v1/contacts",
        expect.objectContaining({
          phoneNumbers: {
            business: ["+49 123 456789"],
            mobile: ["+49 987 654321"],
            fax: ["+49 123 456790"],
          },
        })
      );
    });
  });

  describe("CREATE_PERSON Operation", () => {
    it("sollte einen Personenkontakt erstellen", async () => {
      // Arrange
      const personData = {
        salutation: "Frau",
        firstName: "Maria",
        lastName: "Musterfrau",
      };

      mockExecuteFunctions.getNodeParameter.mockImplementation((param) => {
        if (param === "person") return personData;
        if (param === "createAsCustomer") return true;
        if (param === "createAsVendor") return false;
        return param.includes(".") ? [] : "";
      });

      lexwareApiRequest.mockResolvedValue({ id: "person-123" });

      // Act
      const result = await executeContacts.call(mockExecuteFunctions, 0, "createPerson");

      // Assert
      expect(lexwareApiRequest).toHaveBeenCalledWith(
        "POST",
        "/v1/contacts",
        expect.objectContaining({
          roles: { customer: {} },
          person: {
            salutation: personData.salutation,
            firstName: personData.firstName,
            lastName: personData.lastName,
          },
          version: 0,
        })
      );
    });

    it("sollte mit minimalen Personendaten umgehen", async () => {
      // Arrange
      mockExecuteFunctions.getNodeParameter.mockImplementation((param) => {
        if (param === "person") return { firstName: "Max", lastName: "Mustermann" };
        if (param === "createAsCustomer") return true;
        return param.includes(".") ? [] : "";
      });

      lexwareApiRequest.mockResolvedValue({ id: "person-minimal" });

      // Act
      await executeContacts.call(mockExecuteFunctions, 0, "createPerson");

      // Assert
      expect(lexwareApiRequest).toHaveBeenCalledWith(
        "POST",
        "/v1/contacts",
        expect.objectContaining({
          person: {
            salutation: undefined,
            firstName: "Max",
            lastName: "Mustermann",
          },
        })
      );
    });
  });

  describe("GET Operation", () => {
    it("sollte einen spezifischen Kontakt abrufen", async () => {
      // Arrange
      mockExecuteFunctions.getNodeParameter.mockReturnValue("contact-123");
      const mockResponse = { id: "contact-123", company: { name: "Test GmbH" } };
      lexwareApiRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await executeContacts.call(mockExecuteFunctions, 0, "get");

      // Assert
      expect(lexwareApiRequest).toHaveBeenCalledWith(
        "GET",
        "/v1/contacts/contact-123"
      );
      expect(result).toEqual([{ json: mockResponse }]);
    });
  });

  describe("GET_ALL Operation", () => {
    it("sollte alle Kontakte ohne Filter abrufen", async () => {
      // Arrange
      mockExecuteFunctions.getNodeParameter.mockImplementation((param) => {
        switch (param) {
          case "page": return 0;
          case "size": return 25;
          case "returnAll": return false;
          case "filter_customer": return "ignore";
          case "filter_vendor": return "ignore";
          default: return param.startsWith("filter_") ? "" : 0;
        }
      });

      const mockResponse = { content: [{ id: "contact-1" }] };
      lexwareApiRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await executeContacts.call(mockExecuteFunctions, 0, "getAll");

      // Assert
      expect(lexwareApiRequest).toHaveBeenCalledWith(
        "GET",
        "/v1/contacts",
        {},
        { page: 0, size: 25 }
      );
    });

    it("sollte mit returnAll alle Kontakte über Paging abrufen", async () => {
      // Arrange
      mockExecuteFunctions.getNodeParameter.mockImplementation((param) => {
        switch (param) {
          case "returnAll": return true;
          case "page": return 0;
          case "size": return 25;
          case "filter_customer": return "ignore";
          case "filter_vendor": return "ignore";
          default: return param.startsWith("filter_") ? "" : 0;
        }
      });

      const mockResponse = [{ id: "contact-1" }, { id: "contact-2" }];
      lexwareApiRequestPagedAll.mockResolvedValue(mockResponse);

      // Act
      await executeContacts.call(mockExecuteFunctions, 0, "getAll");

      // Assert
      expect(lexwareApiRequestPagedAll).toHaveBeenCalledWith(
        "/v1/contacts",
        { page: 0, size: 25 }
      );
    });

    it("sollte Filter korrekt anwenden", async () => {
      // Arrange
      mockExecuteFunctions.getNodeParameter.mockImplementation((param) => {
        switch (param) {
          case "filter_email": return "test@example.com";
          case "filter_name": return "Mustermann";
          case "filter_number": return 12345;
          case "filter_customer": return "true";
          case "filter_vendor": return "false";
          case "page": return 0;
          case "size": return 25;
          case "returnAll": return false;
          default: return "";
        }
      });

      lexwareApiRequest.mockResolvedValue({ content: [] });

      // Act
      await executeContacts.call(mockExecuteFunctions, 0, "getAll");

      // Assert
      expect(lexwareApiRequest).toHaveBeenCalledWith(
        "GET",
        "/v1/contacts",
        {},
        {
          page: 0,
          size: 25,
          filter_email: "test@example.com",
          filter_name: "Mustermann",
          filter_number: 12345,
          filter_customer: "true",
          filter_vendor: "false",
        }
      );
    });

    it("sollte zu kurze Filter ignorieren", async () => {
      // Arrange
      mockExecuteFunctions.getNodeParameter.mockImplementation((param) => {
        switch (param) {
          case "filter_email": return "ab"; // Zu kurz
          case "filter_name": return "xy"; // Zu kurz
          case "page": return 0;
          case "size": return 25;
          case "returnAll": return false;
          case "filter_customer": return "ignore";
          case "filter_vendor": return "ignore";
          default: return param.startsWith("filter_") ? "" : 0;
        }
      });

      lexwareApiRequest.mockResolvedValue({ content: [] });

      // Act
      await executeContacts.call(mockExecuteFunctions, 0, "getAll");

      // Assert
      expect(lexwareApiRequest).toHaveBeenCalledWith(
        "GET",
        "/v1/contacts",
        {},
        { page: 0, size: 25 }
      );
    });
  });

  describe("UPDATE Operation", () => {
    it("sollte einen Kontakt aktualisieren", async () => {
      // Arrange
      const contactId = "contact-123";
      mockExecuteFunctions.getNodeParameter.mockImplementation((param) => {
        if (param === "contactId") return contactId;
        if (param === "companyName") return "Aktualisierte GmbH";
        if (param === "createAsCustomer") return true;
        return param.includes(".") ? [] : "";
      });

      lexwareApiRequest.mockResolvedValue({ id: contactId });

      // Act
      const result = await executeContacts.call(mockExecuteFunctions, 0, "update");

      // Assert
      expect(lexwareApiRequest).toHaveBeenCalledWith(
        "PUT",
        `/v1/contacts/${contactId}`,
        expect.objectContaining({
          company: expect.objectContaining({
            name: "Aktualisierte GmbH",
          }),
        })
      );
    });
  });

  describe("DELETE Operation", () => {
    it("sollte einen Kontakt löschen", async () => {
      // Arrange
      mockExecuteFunctions.getNodeParameter.mockReturnValue("contact-123");
      lexwareApiRequest.mockResolvedValue({ success: true });

      // Act
      const result = await executeContacts.call(mockExecuteFunctions, 0, "delete");

      // Assert
      expect(lexwareApiRequest).toHaveBeenCalledWith(
        "DELETE",
        "/v1/contacts/contact-123"
      );
    });
  });

  describe("VAT ID Validation Helper Functions", () => {
    // Da die Helper-Funktionen privat sind, testen wir sie indirekt
    it("sollte deutsche VAT IDs validieren", async () => {
      const germanVatIds = [
        "DE123456789",
        "de123456789",
        "DE 123 456 789",
        "DE-123-456-789",
      ];

      for (const vatId of germanVatIds) {
        jest.clearAllMocks();
        
        mockExecuteFunctions.getNodeParameter.mockImplementation((param) => {
          if (param === "vatRegistrationId") return vatId;
          if (param === "companyName") return "Test";
          if (param === "createAsCustomer") return true;
          return param.includes(".") ? [] : "";
        });

        lexwareApiRequest.mockResolvedValue({ id: "test" });

        await executeContacts.call(mockExecuteFunctions, 0, "createCompany");

        expect(lexwareApiRequest).toHaveBeenCalledWith(
          "POST",
          "/v1/contacts",
          expect.objectContaining({
            company: expect.objectContaining({
              vatRegistrationId: "DE123456789",
            }),
          })
        );
      }
    });

    it("sollte Schweizer VAT IDs validieren", async () => {
      const swissVatIds = [
        "CHE123456789MWST",
        "CHE123456789TVA",
        "CHE123456789IVA",
        "CHE123456789",
      ];

      for (const vatId of swissVatIds) {
        jest.clearAllMocks();
        
        mockExecuteFunctions.getNodeParameter.mockImplementation((param) => {
          if (param === "vatRegistrationId") return vatId;
          if (param === "companyName") return "Test";
          if (param === "createAsCustomer") return true;
          return param.includes(".") ? [] : "";
        });

        lexwareApiRequest.mockResolvedValue({ id: "test" });

        await executeContacts.call(mockExecuteFunctions, 0, "createCompany");

        expect(lexwareApiRequest).toHaveBeenCalled();
      }
    });
  });

  describe("Error Handling", () => {
    it("sollte bei ungültiger Operation einen Fehler werfen", async () => {
      await expect(
        executeContacts.call(mockExecuteFunctions, 0, "invalidOperation")
      ).rejects.toThrow(NodeOperationError);
    });

    it("sollte API-Fehler weiterleiten", async () => {
      mockExecuteFunctions.getNodeParameter.mockReturnValue("contact-123");
      lexwareApiRequest.mockRejectedValue(new Error("API Error"));

      await expect(
        executeContacts.call(mockExecuteFunctions, 0, "get")
      ).rejects.toThrow("API Error");
    });
  });

  describe("Edge Cases", () => {
    it("sollte mit leeren xRechnung-Objekten umgehen", async () => {
      mockExecuteFunctions.getNodeParameter.mockImplementation((param) => {
        if (param === "companyName") return "Test";
        if (param === "createAsCustomer") return true;
        if (param === "xRechnung") return { buyerReference: "", vendorNumberAtCustomer: "" };
        return param.includes(".") ? [] : "";
      });

      lexwareApiRequest.mockResolvedValue({ id: "test" });

      await executeContacts.call(mockExecuteFunctions, 0, "createCompany");

      expect(lexwareApiRequest).toHaveBeenCalledWith(
        "POST",
        "/v1/contacts",
        expect.not.objectContaining({
          xRechnung: expect.anything(),
        })
      );
    });

    it("sollte mit gefüllten xRechnung-Objekten umgehen", async () => {
      mockExecuteFunctions.getNodeParameter.mockImplementation((param) => {
        if (param === "companyName") return "Test";
        if (param === "createAsCustomer") return true;
        if (param === "xRechnung") return { 
          buyerReference: "REF-123", 
          vendorNumberAtCustomer: "VENDOR-456" 
        };
        return param.includes(".") ? [] : "";
      });

      lexwareApiRequest.mockResolvedValue({ id: "test" });

      await executeContacts.call(mockExecuteFunctions, 0, "createCompany");

      expect(lexwareApiRequest).toHaveBeenCalledWith(
        "POST",
        "/v1/contacts",
        expect.objectContaining({
          xRechnung: {
            buyerReference: "REF-123",
            vendorNumberAtCustomer: "VENDOR-456",
          },
        })
      );
    });
  });
});