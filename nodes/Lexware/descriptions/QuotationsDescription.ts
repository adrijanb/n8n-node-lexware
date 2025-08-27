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
    description: "Recipient contact ID",
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
          {
            displayName: "Line Item Amount",
            name: "lineItemAmount",
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
