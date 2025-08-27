import { INodeProperties } from "n8n-workflow";

export const dunningsOperations: INodeProperties = {
  displayName: "Operation",
  name: "operation",
  type: "options",
  noDataExpression: true,
  displayOptions: { show: { resource: ["dunnings"] } },
  options: [
    {
      name: "Create",
      value: "create",
      description: "Create a dunning",
      action: "Create a dunning",
    },
    {
      name: "Get",
      value: "get",
      description: "Get a dunning",
      action: "Get a dunning",
    },
  ],
  default: "create",
};

export const dunningsFields: INodeProperties[] = [
  {
    displayName: "Dunning ID",
    name: "dunningId",
    type: "string",
    required: true,
    displayOptions: { show: { resource: ["dunnings"], operation: ["get"] } },
    default: "",
  },
  // Create structured fields
  {
    displayName: "Preceding Sales Voucher ID",
    name: "precedingSalesVoucherId",
    type: "string",
    required: true,
    displayOptions: { show: { resource: ["dunnings"], operation: ["create"] } },
    default: "",
    description: "ID der zu mahnenden Ausgangsrechnung (sales voucher)",
  },
  {
    displayName: "Voucher Date",
    name: "voucherDate",
    type: "dateTime",
    displayOptions: { show: { resource: ["dunnings"], operation: ["create"] } },
    default: "",
  },
  {
    displayName: "Title",
    name: "title",
    type: "string",
    displayOptions: { show: { resource: ["dunnings"], operation: ["create"] } },
    default: "",
  },
  {
    displayName: "Additional Line Items",
    name: "lineItems",
    type: "fixedCollection",
    typeOptions: { multipleValues: true },
    displayOptions: { show: { resource: ["dunnings"], operation: ["create"] } },
    default: {},
    description:
      "Zusätzliche Positionen (werden NACH den Positionen der Rechnung angehängt)",
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
    displayName: "Finalize",
    name: "finalize",
    type: "boolean",
    displayOptions: { show: { resource: ["dunnings"], operation: ["create"] } },
    default: false,
    description: "Finalize dunning creation",
  },
];
