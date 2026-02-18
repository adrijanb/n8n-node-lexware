import { INodeProperties } from "n8n-workflow";

export const invoicesOperations: INodeProperties = {
  displayName: "Operation",
  name: "operation",
  type: "options",
  noDataExpression: true,
  displayOptions: {
    show: {
      resource: ["invoices"],
    },
  },
  options: [
    {
      name: "Create",
      value: "create",
      description: "Create an invoice",
      action: "Create an invoice",
    },
    {
      name: "Create By JSON",
      value: "createByJson",
      description: "Create an invoice by JSON (Line Items JSON)",
      action: "Create an invoice by JSON",
    },
    {
      name: "Get",
      value: "get",
      description: "Get an invoice",
      action: "Get an invoice",
    },
    {
      name: "Get Many",
      value: "getAll",
      description: "Get many invoices",
      action: "Get many invoices",
    },
    {
      name: "Update",
      value: "update",
      description: "Update an invoice",
      action: "Update an invoice",
    },
  ],
  default: "getAll",
};

export const invoicesFields: INodeProperties[] = [
  // Invoice ID
  {
    displayName: "Invoice ID",
    name: "invoiceId",
    type: "string",
    required: true,
    displayOptions: {
      show: {
        resource: ["invoices"],
        operation: ["get", "update"],
      },
    },
    default: "",
    description: "ID of the invoice",
  },
  // Create/Update structured fields
  {
    displayName: "Title",
    name: "title",
    type: "string",
    displayOptions: {
      show: { resource: ["invoices"], operation: ["create", "update"] },
    },
    default: "",
  },
  {
    displayName: "Introduction",
    name: "introduction",
    type: "string",
    displayOptions: {
      show: { resource: ["invoices"], operation: ["create", "update"] },
    },
    default: "",
    description: "Introductory text shown on the invoice",
  },
  {
    displayName: "Remark",
    name: "remark",
    type: "string",
    displayOptions: {
      show: { resource: ["invoices"], operation: ["create", "update"] },
    },
    default: "",
    description: "Remark or footer note on the invoice",
  },
  {
    displayName: "Voucher Date",
    name: "voucherDate",
    type: "dateTime",
    displayOptions: {
      show: { resource: ["invoices"], operation: ["create", "update"] },
    },
    default: "",
  },
  {
    displayName: "Contact ID",
    name: "contactId",
    type: "string",
    displayOptions: {
      show: { resource: ["invoices"], operation: ["create", "update"] },
    },
    default: "",
    description: "Recipient contact ID",
  },
  // Line items
  {
    displayName: "Line Items",
    name: "lineItems",
    type: "fixedCollection",
    typeOptions: { multipleValues: true },
    displayOptions: {
      show: { resource: ["invoices"], operation: ["create", "update"] },
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
                    type: "string",
                    default: "EUR",
                  },
                  {
                    displayName: "Net Amount",
                    name: "netAmount",
                    type: "number",
                    default: 0,
                  },
                  {
                    displayName: "Gross Amount",
                    name: "grossAmount",
                    type: "number",
                    default: 0,
                  },
                  {
                    displayName: "Tax Rate %",
                    name: "taxRatePercentage",
                    type: "number",
                    default: 19,
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
  // Total Price
  {
    displayName: "Total Price",
    name: "totalPrice",
    type: "fixedCollection",
    typeOptions: { multipleValues: false },
    displayOptions: {
      show: {
        resource: ["invoices"],
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
            displayName: "Currency",
            name: "currency",
            type: "string",
            default: "EUR",
          },
          {
            displayName: "Total Net Amount",
            name: "totalNetAmount",
            type: "number",
            default: 0,
          },
          {
            displayName: "Total Gross Amount",
            name: "totalGrossAmount",
            type: "number",
            default: 0,
          },
          {
            displayName: "Total Tax Amount",
            name: "totalTaxAmount",
            type: "number",
            default: 0,
          },
          {
            displayName: "Total Discount (Absolute)",
            name: "totalDiscountAbsolute",
            type: "number",
            default: 0,
            description: "Optional total discount as absolute value",
          },
          {
            displayName: "Total Discount (%)",
            name: "totalDiscountPercentage",
            type: "number",
            default: 0,
            description: "Optional total discount as percentage",
          },
        ],
      },
    ],
  },
  // Tax Conditions
  {
    displayName: "Tax Conditions",
    name: "taxConditions",
    type: "fixedCollection",
    typeOptions: { multipleValues: false },
    displayOptions: {
      show: {
        resource: ["invoices"],
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
  // Payment Conditions
  {
    displayName: "Payment Conditions",
    name: "paymentConditions",
    type: "fixedCollection",
    typeOptions: { multipleValues: false },
    displayOptions: {
      show: {
        resource: ["invoices"],
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
            displayName: "Payment Term Label",
            name: "paymentTermLabel",
            type: "string",
            default: "",
          },
          {
            displayName: "Payment Term Duration",
            name: "paymentTermDuration",
            type: "number",
            default: 0,
          },
          {
            displayName: "Discount Conditions",
            name: "paymentDiscountConditions",
            type: "fixedCollection",
            typeOptions: { multipleValues: false },
            default: {},
            options: [
              {
                name: "value",
                displayName: "Value",
                values: [
                  {
                    displayName: "Discount %",
                    name: "discountPercentage",
                    type: "number",
                    default: 0,
                  },
                  {
                    displayName: "Discount Range (days)",
                    name: "discountRange",
                    type: "number",
                    default: 0,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  // Shipping Conditions
  {
    displayName: "Shipping Conditions",
    name: "shippingConditions",
    type: "fixedCollection",
    typeOptions: { multipleValues: false },
    displayOptions: {
      show: {
        resource: ["invoices"],
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
            displayName: "Shipping Date",
            name: "shippingDate",
            type: "dateTime",
            default: "",
          },
          {
            displayName: "Shipping End Date",
            name: "shippingEndDate",
            type: "dateTime",
            default: "",
          },
          {
            displayName: "Shipping Type",
            name: "shippingType",
            type: "options",
            options: [{ name: "delivery", value: "delivery" }],
            default: "delivery",
          },
        ],
      },
    ],
  },
  // Optional xRechnung JSON
  {
    displayName: "xRechnung (JSON)",
    name: "xRechnung",
    type: "json",
    displayOptions: {
      show: {
        resource: ["invoices"],
        operation: ["create", "update", "createByJson"],
      },
    },
    default: "null",
    description: "Optional xRechnung object to override buyer reference",
  },
  // Finalize
  {
    displayName: "Finalize",
    name: "finalize",
    type: "boolean",
    displayOptions: {
      show: { resource: ["invoices"], operation: ["create", "createByJson"] },
    },
    default: false,
    description: "Finalize invoice on creation (sets status open)",
  },
  // CreateByJson: raw line items JSON
  {
    displayName: "Line Items JSON",
    name: "lineItemsJson",
    type: "json",
    displayOptions: {
      show: { resource: ["invoices"], operation: ["createByJson"] },
    },
    default: "[]",
    description: "Array of line item objects (JSON)",
  },
  // Get Many filters
  {
    displayName: "Page",
    name: "page",
    type: "number",
    displayOptions: {
      show: {
        resource: ["invoices"],
        operation: ["getAll"],
      },
    },
    default: 0,
    description: "Page number",
  },
  {
    displayName: "Status",
    name: "status",
    type: "options",
    displayOptions: {
      show: {
        resource: ["invoices"],
        operation: ["getAll"],
      },
    },
    options: [
      { name: "Draft", value: "DRAFT" },
      { name: "Sent", value: "SENT" },
      { name: "Paid", value: "PAID" },
      { name: "Overdue", value: "OVERDUE" },
    ],
    default: "DRAFT",
    description: "Filter by invoice status",
  },
];
