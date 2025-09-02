import { INodeProperties } from "n8n-workflow";

export const quotationsOperations: INodeProperties = {
  displayName: "Operation",
  name: "operation",
  type: "options",
  noDataExpression: true,
  displayOptions: { show: { resource: ["quotations"] } },
  options: [
    {
      name: "Create",
      value: "create",
      description: "Create a quotation",
      action: "Create a quotation",
    },
    {
      name: "Create By JSON",
      value: "createByJson",
      description: "Create a quotation by JSON (Line Items JSON)",
      action: "Create a quotation by JSON",
    },
    {
      name: "Delete",
      value: "delete",
      description: "Delete a quotation",
      action: "Delete a quotation",
    },
    {
      name: "Get",
      value: "get",
      description: "Get a quotation",
      action: "Get a quotation",
    },
    {
      name: "Get Many",
      value: "getAll",
      description: "Get many quotations",
      action: "Get many quotations",
    },
    {
      name: "Update",
      value: "update",
      description: "Update a quotation",
      action: "Update a quotation",
    },
  ],
  default: "getAll",
};

export const quotationsFields: INodeProperties[] = [
  {
    displayName: "Quotation ID",
    name: "quotationId",
    type: "string",
    required: true,
    displayOptions: {
      show: {
        resource: ["quotations"],
        operation: ["get", "update", "delete"],
      },
    },
    default: "",
  },
  // Create/Update structured fields (analog Invoices)
  {
    displayName: "Title",
    name: "title",
    type: "string",
    displayOptions: {
      show: {
        resource: ["quotations"],
        operation: ["create", "update", "createByJson"],
      },
    },
    default: "",
  },
  {
    displayName: "Introduction",
    name: "introduction",
    type: "string",
    displayOptions: {
      show: {
        resource: ["quotations"],
        operation: ["create", "update", "createByJson"],
      },
    },
    default: "",
  },
  {
    displayName: "Remark",
    name: "remark",
    type: "string",
    displayOptions: {
      show: {
        resource: ["quotations"],
        operation: ["create", "update", "createByJson"],
      },
    },
    default: "",
  },
  {
    displayName: "Voucher Date",
    name: "voucherDate",
    type: "dateTime",
    displayOptions: {
      show: {
        resource: ["quotations"],
        operation: ["create", "update", "createByJson"],
      },
    },
    default: "",
  },
  {
    displayName: "Expiry Date",
    name: "expiryDate",
    type: "dateTime",
    displayOptions: {
      show: {
        resource: ["quotations"],
        operation: ["create", "update", "createByJson"],
      },
    },
    default: "",
    description: "Date until which the quotation is valid",
  },
  {
    displayName: "Contact ID",
    name: "contactId",
    type: "string",
    displayOptions: {
      show: {
        resource: ["quotations"],
        operation: ["create", "update", "createByJson"],
      },
    },
    default: "",
    description: "Recipient contact ID (alternative to manual address)",
  },
  {
    displayName: "Manual Address",
    name: "manualAddress",
    type: "fixedCollection",
    typeOptions: { multipleValues: false },
    displayOptions: {
      show: {
        resource: ["quotations"],
        operation: ["create", "update", "createByJson"],
      },
    },
    default: {},
    description: "Manual address data (alternative to contact ID)",
    options: [
      {
        name: "address",
        displayName: "Address",
        values: [
          {
            displayName: "Name",
            name: "name",
            type: "string",
            default: "",
            description: "Company or person name",
          },
          {
            displayName: "Supplement",
            name: "supplement",
            type: "string",
            default: "",
            description: "Address supplement (e.g., department, floor)",
          },
          {
            displayName: "Street",
            name: "street",
            type: "string",
            default: "",
            description: "Street address",
          },
          {
            displayName: "City",
            name: "city",
            type: "string",
            default: "",
            description: "City name",
          },
          {
            displayName: "ZIP Code",
            name: "zip",
            type: "string",
            default: "",
            description: "Postal code",
          },
          {
            displayName: "Country Code",
            name: "countryCode",
            type: "string",
            default: "DE",
            description: "ISO country code (e.g., DE, AT, CH)",
          },
        ],
      },
    ],
  },
  {
    displayName: "Line Items",
    name: "lineItems",
    type: "fixedCollection",
    typeOptions: { multipleValues: true },
    displayOptions: {
      show: { resource: ["quotations"], operation: ["create", "update"] },
    },
    default: {},
    options: [
      {
        name: "item",
        displayName: "Item",
        values: [
          {
            displayName: "Type",
            name: "type",
            type: "options",
            options: [
              { name: "Custom", value: "custom" },
              { name: "Text", value: "text" },
            ],
            default: "custom",
            description:
              "Type of line item according to Lexware API specification",
          },
          { displayName: "Name", name: "name", type: "string", default: "" },
          {
            displayName: "Description",
            name: "description",
            type: "string",
            default: "",
          },
          {
            displayName: "Quantity",
            name: "quantity",
            type: "number",
            default: 1,
          },
          {
            displayName: "Unit Name",
            name: "unitName",
            type: "string",
            default: "",
          },
          {
            displayName: "Unit Price",
            name: "unitPrice",
            type: "fixedCollection",
            typeOptions: { multipleValues: false },
            default: {},
            options: [
              {
                name: "value",
                displayName: "Value",
                values: [
                  {
                    displayName: "Currency",
                    name: "currency",
                    type: "options",
                    options: [
                      { name: "Euro (EUR)", value: "EUR" },
                      { name: "US Dollar (USD)", value: "USD" },
                      { name: "British Pound (GBP)", value: "GBP" },
                      { name: "Swiss Franc (CHF)", value: "CHF" },
                    ],
                    default: "EUR",
                    description: "Currency for the unit price",
                  },
                  {
                    displayName: "Price Type",
                    name: "priceType",
                    type: "options",
                    options: [
                      { name: "Net Price (excluding tax)", value: "net" },
                      { name: "Gross Price (including tax)", value: "gross" },
                    ],
                    default: "net",
                    description:
                      "Whether the entered price includes or excludes tax",
                  },
                  {
                    displayName: "Price Amount",
                    name: "priceAmount",
                    type: "number",
                    default: 0,
                    description:
                      "The price amount (net or gross depending on selection above)",
                  },
                  {
                    displayName: "Tax Rate %",
                    name: "taxRatePercentage",
                    type: "number",
                    default: 19,
                    description: "Tax rate percentage (e.g., 19 for 19% VAT)",
                  },
                ],
              },
            ],
          },
          {
            displayName: "Discount %",
            name: "discountPercentage",
            type: "number",
            default: 0,
          },
        ],
      },
    ],
  },
  {
    displayName: "Total Price",
    name: "totalPrice",
    type: "fixedCollection",
    typeOptions: { multipleValues: false },
    displayOptions: {
      show: {
        resource: ["quotations"],
        operation: ["create", "update", "createByJson"],
      },
    },
    default: {},
    description:
      "Only currency is required - amounts are calculated automatically by Lexware",
    options: [
      {
        name: "value",
        displayName: "Value",
        values: [
          {
            displayName: "Currency",
            name: "currency",
            type: "string",
            default: "EUR",
            description: "Currency code (e.g., EUR, USD, CHF)",
          },
        ],
      },
    ],
  },
  {
    displayName: "Tax Conditions",
    name: "taxConditions",
    type: "fixedCollection",
    typeOptions: { multipleValues: false },
    displayOptions: {
      show: {
        resource: ["quotations"],
        operation: ["create", "update", "createByJson"],
      },
    },
    default: {},
    options: [
      {
        name: "value",
        displayName: "Value",
        values: [
          {
            displayName: "Tax Type",
            name: "taxType",
            type: "options",
            options: [
              { name: "net", value: "net" },
              { name: "gross", value: "gross" },
            ],
            default: "net",
          },
          {
            displayName: "Tax Type Note",
            name: "taxTypeNote",
            type: "string",
            default: "",
          },
        ],
      },
    ],
  },
  // CreateByJson: raw line items JSON
  {
    displayName: "Line Items JSON",
    name: "lineItemsJson",
    type: "json",
    displayOptions: {
      show: { resource: ["quotations"], operation: ["createByJson"] },
    },
    default: "[]",
    description: "Array of line item objects (JSON)",
  },
  {
    displayName: "Page",
    name: "page",
    type: "number",
    displayOptions: {
      show: { resource: ["quotations"], operation: ["getAll"] },
    },
    default: 0,
    description: "Page number",
  },
];
