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
  {
    displayName: "Quotation",
    name: "quotation",
    type: "json",
    displayOptions: {
      show: { resource: ["quotations"], operation: ["create", "update"] },
    },
    default:
      '{"title": "Quotation", "voucherDate": "", "lineItems": [], "totalPrice": {}}',
    description: "Raw JSON body for quotation according to Lexware API",
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
