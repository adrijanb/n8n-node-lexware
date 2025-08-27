import { INodeProperties } from "n8n-workflow";

export const vouchersOperations: INodeProperties = {
  displayName: "Operation",
  name: "operation",
  type: "options",
  noDataExpression: true,
  displayOptions: { show: { resource: ["vouchers"] } },
  options: [
    {
      name: "Create",
      value: "create",
      description: "Create a voucher",
      action: "Create a voucher",
    },
    {
      name: "Create By JSON",
      value: "createByJson",
      description: "Create voucher by JSON (Line Items)",
      action: "Create voucher by JSON",
    },
    {
      name: "Delete",
      value: "delete",
      description: "Delete a voucher",
      action: "Delete a voucher",
    },
    {
      name: "Get",
      value: "get",
      description: "Get a voucher",
      action: "Get a voucher",
    },
    {
      name: "Get Many",
      value: "getAll",
      description: "Get many vouchers",
      action: "Get many vouchers",
    },
    {
      name: "Update",
      value: "update",
      description: "Update a voucher",
      action: "Update a voucher",
    },
  ],
  default: "getAll",
};

export const vouchersFields: INodeProperties[] = [
  {
    displayName: "Voucher ID",
    name: "voucherId",
    type: "string",
    required: true,
    displayOptions: {
      show: { resource: ["vouchers"], operation: ["get", "update", "delete"] },
    },
    default: "",
  },
  {
    displayName: "Title",
    name: "title",
    type: "string",
    displayOptions: {
      show: { resource: ["vouchers"], operation: ["create", "update"] },
    },
    default: "",
  },
  {
    displayName: "Voucher Date",
    name: "voucherDate",
    type: "dateTime",
    displayOptions: {
      show: { resource: ["vouchers"], operation: ["create", "update"] },
    },
    default: "",
  },
  {
    displayName: "Contact ID",
    name: "contactId",
    type: "string",
    displayOptions: {
      show: { resource: ["vouchers"], operation: ["create", "update"] },
    },
    default: "",
  },
  {
    displayName: "Line Items",
    name: "lineItems",
    type: "fixedCollection",
    typeOptions: { multipleValues: true },
    displayOptions: {
      show: { resource: ["vouchers"], operation: ["create", "update"] },
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
              { name: "custom", value: "custom" },
              { name: "text", value: "text" },
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
    displayName: "Line Items JSON",
    name: "lineItemsJson",
    type: "json",
    displayOptions: {
      show: { resource: ["vouchers"], operation: ["createByJson"] },
    },
    default: "[]",
  },
  {
    displayName: "Page",
    name: "page",
    type: "number",
    displayOptions: { show: { resource: ["vouchers"], operation: ["getAll"] } },
    default: 0,
    description: "Page number",
  },
  {
    displayName: "Status",
    name: "status",
    type: "string",
    displayOptions: { show: { resource: ["vouchers"], operation: ["getAll"] } },
    default: "",
    description: "Optional status filter",
  },
];
