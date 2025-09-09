import { IExecuteFunctions } from "n8n-core";
import { IDataObject } from "n8n-workflow";
import { executeContacts } from "../../nodes/Lexware/actions/Contacts.execute";
import { lexwareApiRequest } from "../../nodes/Lexware/GenericFunctions";

// Mock the lexwareApiRequest function
jest.mock("../../nodes/Lexware/GenericFunctions", () => ({
  lexwareApiRequest: jest.fn(),
}));

describe("Contacts.execute - Array Handling Fix", () => {
  let mockExecuteFunctions: jest.Mocked<IExecuteFunctions>;

  beforeEach(() => {
    mockExecuteFunctions = {
      getNodeParameter: jest.fn(),
      getNode: jest.fn().mockReturnValue({ name: "Test Node" }),
      getCredentials: jest.fn().mockResolvedValue({
        apiUrl: "https://api.lexware.de",
        accessToken: "test-token",
      }),
      helpers: {
        httpRequest: jest.fn(),
      },
    } as any;

    // Reset mocks
    jest.clearAllMocks();
  });

  describe("Email Address Array Handling", () => {
    it("sollte mit nicht-Array E-Mail-Adressen umgehen (einzelnes Objekt)", async () => {
      // Arrange - Test case where emailAddresses.business is a single object instead of array
      const singleEmailObject = { email: "test@example.com" };
      
      mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
        if (param === "contactType") return "company";
        if (param === "company") return { name: "Test Company" };
        if (param === "emailAddresses") return { business: singleEmailObject };
        if (param === "billingAddress.address") return [];
        if (param === "shippingAddress.address") return [];
        if (param === "contactPersons.person") return [];
        if (param === "createAsCustomer") return true;
        if (param === "createAsVendor") return false;
        return param.includes(".") ? {} : "";
      });

      (lexwareApiRequest as jest.MockedFunction<typeof lexwareApiRequest>).mockResolvedValue({ 
        id: "test-contact-id" 
      });

      // Act
      const result = await executeContacts.call(mockExecuteFunctions, 0, "createCompany");

      // Assert - Should not throw "arr.map is not a function" error
      expect(result).toBeDefined();
      expect(lexwareApiRequest).toHaveBeenCalledWith(
        "POST",
        "/v1/contacts",
        expect.objectContaining({
          emailAddresses: {
            business: ["test@example.com"]
          }
        })
      );
    });

    it("sollte mit String-E-Mail-Adressen umgehen", async () => {
      // Arrange - Test case where emailAddresses.business is a string
      mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
        if (param === "contactType") return "company";
        if (param === "company") return { name: "Test Company" };
        if (param === "emailAddresses") return { business: "direct@example.com" };
        if (param === "billingAddress.address") return [];
        if (param === "shippingAddress.address") return [];
        if (param === "contactPersons.person") return [];
        if (param === "createAsCustomer") return true;
        if (param === "createAsVendor") return false;
        return param.includes(".") ? {} : "";
      });

      (lexwareApiRequest as jest.MockedFunction<typeof lexwareApiRequest>).mockResolvedValue({ 
        id: "test-contact-id" 
      });

      // Act
      const result = await executeContacts.call(mockExecuteFunctions, 0, "createCompany");

      // Assert
      expect(result).toBeDefined();
      expect(lexwareApiRequest).toHaveBeenCalledWith(
        "POST",
        "/v1/contacts",
        expect.objectContaining({
          emailAddresses: {
            business: ["direct@example.com"]
          }
        })
      );
    });
  });

  describe("Phone Number Array Handling", () => {
    it("sollte mit nicht-Array Telefonnummern umgehen", async () => {
      // Arrange
      const singlePhoneObject = { number: "+49 123 456789" };
      
      mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
        if (param === "contactType") return "company";
        if (param === "company") return { name: "Test Company" };
        if (param === "phoneNumbers") return { business: singlePhoneObject };
        if (param === "billingAddress.address") return [];
        if (param === "shippingAddress.address") return [];
        if (param === "contactPersons.person") return [];
        if (param === "createAsCustomer") return true;
        if (param === "createAsVendor") return false;
        return param.includes(".") ? {} : "";
      });

      (lexwareApiRequest as jest.MockedFunction<typeof lexwareApiRequest>).mockResolvedValue({ 
        id: "test-contact-id" 
      });

      // Act
      const result = await executeContacts.call(mockExecuteFunctions, 0, "createCompany");

      // Assert
      expect(result).toBeDefined();
      expect(lexwareApiRequest).toHaveBeenCalledWith(
        "POST",
        "/v1/contacts",
        expect.objectContaining({
          phoneNumbers: {
            business: ["+49 123 456789"]
          }
        })
      );
    });
  });

  describe("Address Array Handling", () => {
    it("sollte mit nicht-Array Adressen umgehen", async () => {
      // Arrange
      const singleAddress = {
        street: "Teststraße 1",
        city: "Berlin",
        zip: "10115",
        countryCode: "DE"
      };
      
      mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
        if (param === "contactType") return "company";
        if (param === "company") return { name: "Test Company" };
        if (param === "billingAddress.address") return singleAddress;
        if (param === "shippingAddress.address") return [];
        if (param === "contactPersons.person") return [];
        if (param === "createAsCustomer") return true;
        if (param === "createAsVendor") return false;
        return param.includes(".") ? {} : "";
      });

      (lexwareApiRequest as jest.MockedFunction<typeof lexwareApiRequest>).mockResolvedValue({ 
        id: "test-contact-id" 
      });

      // Act
      const result = await executeContacts.call(mockExecuteFunctions, 0, "createCompany");

      // Assert
      expect(result).toBeDefined();
      expect(lexwareApiRequest).toHaveBeenCalledWith(
        "POST",
        "/v1/contacts",
        expect.objectContaining({
          addresses: {
            billing: [{
              street: "Teststraße 1",
              city: "Berlin",
              zip: "10115",
              countryCode: "DE",
              supplement: undefined
            }],
            shipping: []
          }
        })
      );
    });
  });

  describe("Person Contact Array Handling", () => {
    it("sollte mit nicht-Array Daten bei Person-Kontakten umgehen", async () => {
      // Arrange
      const singleEmailObject = { email: "person@example.com" };
      
      mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
        if (param === "contactType") return "person";
        if (param === "person") return { 
          firstName: "Max", 
          lastName: "Mustermann",
          salutation: "Herr"
        };
        if (param === "emailAddresses") return { private: singleEmailObject };
        if (param === "billingAddress.address") return [];
        if (param === "shippingAddress.address") return [];
        if (param === "createAsCustomer") return true;
        if (param === "createAsVendor") return false;
        return param.includes(".") ? {} : "";
      });

      (lexwareApiRequest as jest.MockedFunction<typeof lexwareApiRequest>).mockResolvedValue({ 
        id: "test-person-id" 
      });

      // Act
      const result = await executeContacts.call(mockExecuteFunctions, 0, "createPerson");

      // Assert
      expect(result).toBeDefined();
      expect(lexwareApiRequest).toHaveBeenCalledWith(
        "POST",
        "/v1/contacts",
        expect.objectContaining({
          person: {
            firstName: "Max",
            lastName: "Mustermann", 
            salutation: "Herr"
          },
          emailAddresses: {
            private: ["person@example.com"]
          }
        })
      );
    });
  });
});
