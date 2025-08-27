import { INodeProperties } from "n8n-workflow";

export const contactsOperations: INodeProperties = {
  displayName: "Operation",
  name: "operation",
  type: "options",
  noDataExpression: true,
  displayOptions: {
    show: {
      resource: ["contacts"],
    },
  },
  options: [
    {
      name: "Create Company",
      value: "createCompany",
      description: "Create a company contact",
      action: "Create a company contact",
    },
    {
      name: "Create Person",
      value: "createPerson",
      description: "Create a person contact",
      action: "Create a person contact",
    },
    {
      name: "Delete",
      value: "delete",
      description: "Delete a contact",
      action: "Delete a contact",
    },
    {
      name: "Get",
      value: "get",
      description: "Get a contact",
      action: "Get a contact",
    },
    {
      name: "Get Many",
      value: "getAll",
      description: "Get many contacts",
      action: "Get many contacts",
    },
    {
      name: "Update",
      value: "update",
      description: "Update a contact",
      action: "Update a contact",
    },
  ],
  default: "getAll",
};

export const contactsFields: INodeProperties[] = [
  // Contact ID
  {
    displayName: "Contact ID",
    name: "contactId",
    type: "string",
    required: true,
    displayOptions: {
      show: { resource: ["contacts"], operation: ["get", "update", "delete"] },
    },
    default: "",
  },
  // Create/Update structured fields

  {
    displayName: "Company Name",
    name: "companyName",
    type: "string",
    displayOptions: {
      show: { resource: ["contacts"], operation: ["createCompany", "update"] },
    },
    default: "",
    description: "Company name",
  },
  {
    displayName: "Tax Number",
    name: "taxNumber",
    type: "string",
    displayOptions: {
      show: { resource: ["contacts"], operation: ["createCompany", "update"] },
    },
    default: "",
  },
  {
    displayName: "VAT Registration ID",
    name: "vatRegistrationId",
    type: "string",
    displayOptions: {
      show: { resource: ["contacts"], operation: ["createCompany", "update"] },
    },
    default: "",
  },
  {
    displayName: "Create as Customer?",
    name: "createAsCustomer",
    type: "boolean",
    displayOptions: {
      show: {
        resource: ["contacts"],
        operation: ["createCompany", "createPerson", "update"],
      },
    },
    default: true,
    description: "Wenn aktiviert, wird die Rolle customer gesetzt",
  },
  {
    displayName: "Create as Vendor?",
    name: "createAsVendor",
    type: "boolean",
    displayOptions: {
      show: {
        resource: ["contacts"],
        operation: ["createCompany", "createPerson", "update"],
      },
    },
    default: false,
    description: "Wenn aktiviert, wird die Rolle vendor gesetzt",
  },
  {
    displayName: "Allow Tax Free Invoices",
    name: "allowTaxFreeInvoices",
    type: "boolean",
    displayOptions: {
      show: { resource: ["contacts"], operation: ["createCompany", "update"] },
    },
    default: false,
  },
  {
    displayName: "Contact Persons",
    name: "contactPersons",
    type: "fixedCollection",
    typeOptions: { multipleValues: true },
    displayOptions: {
      show: { resource: ["contacts"], operation: ["createCompany", "update"] },
    },
    default: {},
    options: [
      {
        name: "person",
        displayName: "Person",
        values: [
          {
            displayName: "Salutation",
            name: "salutation",
            type: "string",
            default: "",
          },
          {
            displayName: "First Name",
            name: "firstName",
            type: "string",
            default: "",
          },
          {
            displayName: "Last Name",
            name: "lastName",
            type: "string",
            default: "",
          },
          {
            displayName: "Primary",
            name: "primary",
            type: "boolean",
            default: false,
          },
          {
            displayName: "Email",
            name: "emailAddress",
            type: "string",
            default: "",
          },
          {
            displayName: "Phone",
            name: "phoneNumber",
            type: "string",
            default: "",
          },
        ],
      },
    ],
  },
  // Person details for createPerson
  {
    displayName: "Person",
    name: "person",
    type: "collection",
    displayOptions: {
      show: { resource: ["contacts"], operation: ["createPerson"] },
    },
    default: {},
    options: [
      {
        displayName: "Salutation",
        name: "salutation",
        type: "string",
        default: "",
      },
      {
        displayName: "First Name",
        name: "firstName",
        type: "string",
        default: "",
      },
      {
        displayName: "Last Name",
        name: "lastName",
        type: "string",
        default: "",
      },
    ],
  },
  {
    displayName: "XRechnung",
    name: "xRechnung",
    type: "collection",
    displayOptions: {
      show: {
        resource: ["contacts"],
        operation: ["createCompany", "createPerson", "update"],
      },
    },
    default: {},
    options: [
      {
        displayName: "Buyer Reference",
        name: "buyerReference",
        type: "string",
        default: "",
      },
      {
        displayName: "Vendor Number At Customer",
        name: "vendorNumberAtCustomer",
        type: "string",
        default: "",
      },
    ],
  },
  {
    displayName: "Email Addresses",
    name: "emailAddresses",
    type: "fixedCollection",
    displayOptions: {
      show: {
        resource: ["contacts"],
        operation: ["createCompany", "createPerson", "update"],
      },
    },
    default: {},
    options: [
      {
        name: "business",
        displayName: "Business",
        typeOptions: { multipleValues: true },
        values: [
          { displayName: "Email", name: "email", type: "string", default: "" },
        ],
      },
      {
        name: "office",
        displayName: "Office",
        typeOptions: { multipleValues: true },
        values: [
          { displayName: "Email", name: "email", type: "string", default: "" },
        ],
      },
      {
        name: "private",
        displayName: "Private",
        typeOptions: { multipleValues: true },
        values: [
          { displayName: "Email", name: "email", type: "string", default: "" },
        ],
      },
      {
        name: "other",
        displayName: "Other",
        typeOptions: { multipleValues: true },
        values: [
          { displayName: "Email", name: "email", type: "string", default: "" },
        ],
      },
    ],
  },
  {
    displayName: "Phone Numbers",
    name: "phoneNumbers",
    type: "fixedCollection",
    displayOptions: {
      show: {
        resource: ["contacts"],
        operation: ["createCompany", "createPerson", "update"],
      },
    },
    default: {},
    options: [
      {
        name: "business",
        displayName: "Business",
        typeOptions: { multipleValues: true },
        values: [
          {
            displayName: "Number",
            name: "number",
            type: "string",
            default: "",
          },
        ],
      },
      {
        name: "office",
        displayName: "Office",
        typeOptions: { multipleValues: true },
        values: [
          {
            displayName: "Number",
            name: "number",
            type: "string",
            default: "",
          },
        ],
      },
      {
        name: "mobile",
        displayName: "Mobile",
        typeOptions: { multipleValues: true },
        values: [
          {
            displayName: "Number",
            name: "number",
            type: "string",
            default: "",
          },
        ],
      },
      {
        name: "private",
        displayName: "Private",
        typeOptions: { multipleValues: true },
        values: [
          {
            displayName: "Number",
            name: "number",
            type: "string",
            default: "",
          },
        ],
      },
      {
        name: "fax",
        displayName: "Fax",
        typeOptions: { multipleValues: true },
        values: [
          {
            displayName: "Number",
            name: "number",
            type: "string",
            default: "",
          },
        ],
      },
      {
        name: "other",
        displayName: "Other",
        typeOptions: { multipleValues: true },
        values: [
          {
            displayName: "Number",
            name: "number",
            type: "string",
            default: "",
          },
        ],
      },
    ],
  },
  {
    displayName: "Note",
    name: "note",
    type: "string",
    typeOptions: { rows: 3 },
    displayOptions: {
      show: {
        resource: ["contacts"],
        operation: ["createCompany", "createPerson", "update"],
      },
    },
    default: "",
  },
  {
    displayName: "Archived",
    name: "archived",
    type: "boolean",
    displayOptions: {
      show: {
        resource: ["contacts"],
        operation: ["createCompany", "createPerson", "update"],
      },
    },
    default: false,
  },
  {
    displayName: "Billing Address",
    name: "billingAddress",
    type: "fixedCollection",
    typeOptions: { multipleValues: true },
    displayOptions: {
      show: {
        resource: ["contacts"],
        operation: ["createCompany", "createPerson", "update"],
      },
    },
    default: {},
    options: [
      {
        name: "address",
        displayName: "Address",
        values: [
          {
            displayName: "Supplement",
            name: "supplement",
            type: "string",
            default: "",
          },
          {
            displayName: "Street",
            name: "street",
            type: "string",
            default: "",
          },
          { displayName: "ZIP", name: "zip", type: "string", default: "" },
          { displayName: "City", name: "city", type: "string", default: "" },
          {
            displayName: "Country Code",
            name: "countryCode",
            type: "string",
            default: "DE",
          },
        ],
      },
    ],
  },
  {
    displayName: "Shipping Address",
    name: "shippingAddress",
    type: "fixedCollection",
    typeOptions: { multipleValues: true },
    displayOptions: {
      show: {
        resource: ["contacts"],
        operation: ["createCompany", "createPerson", "update"],
      },
    },
    default: {},
    options: [
      {
        name: "address",
        displayName: "Address",
        values: [
          {
            displayName: "Supplement",
            name: "supplement",
            type: "string",
            default: "",
          },
          {
            displayName: "Street",
            name: "street",
            type: "string",
            default: "",
          },
          { displayName: "ZIP", name: "zip", type: "string", default: "" },
          { displayName: "City", name: "city", type: "string", default: "" },
          {
            displayName: "Country Code",
            name: "countryCode",
            type: "string",
            default: "DE",
          },
        ],
      },
    ],
  },
  // Get Many
  {
    displayName: "Page",
    name: "page",
    type: "number",
    displayOptions: { show: { resource: ["contacts"], operation: ["getAll"] } },
    default: 0,
    description: "Page number",
  },
  {
    displayName: "Size",
    name: "size",
    type: "number",
    displayOptions: { show: { resource: ["contacts"], operation: ["getAll"] } },
    default: 25,
    description: "Seitengröße (bis 100/250 je Endpoint, siehe Doku)",
  },
  {
    displayName: "Return All",
    name: "returnAll",
    type: "boolean",
    displayOptions: { show: { resource: ["contacts"], operation: ["getAll"] } },
    default: false,
    description: "Alle Seiten abrufen (beachtet API Limits)",
  },
  {
    displayName: "Filter Email",
    name: "filter_email",
    type: "string",
    displayOptions: { show: { resource: ["contacts"], operation: ["getAll"] } },
    default: "",
    description:
      "Mindestens 3 Zeichen; durchsucht emailAddresses und Kontaktpersonen",
  },
  {
    displayName: "Filter Name",
    name: "filter_name",
    type: "string",
    displayOptions: { show: { resource: ["contacts"], operation: ["getAll"] } },
    default: "",
    description: "Mindestens 3 Zeichen; Namens-Teilstring",
  },
  {
    displayName: "Filter Number",
    name: "filter_number",
    type: "number",
    displayOptions: { show: { resource: ["contacts"], operation: ["getAll"] } },
    default: 0,
    description: "Customer- oder Vendor-Nummer",
  },
  {
    displayName: "Filter Customer Role",
    name: "filter_customer",
    type: "options",
    displayOptions: { show: { resource: ["contacts"], operation: ["getAll"] } },
    options: [
      { name: "Ignore", value: "ignore" },
      { name: "Has customer role", value: "true" },
      { name: "Has not customer role", value: "false" },
    ],
    default: "ignore",
  },
  {
    displayName: "Filter Vendor Role",
    name: "filter_vendor",
    type: "options",
    displayOptions: { show: { resource: ["contacts"], operation: ["getAll"] } },
    options: [
      { name: "Ignore", value: "ignore" },
      { name: "Has vendor role", value: "true" },
      { name: "Has not vendor role", value: "false" },
    ],
    default: "ignore",
  },
];
