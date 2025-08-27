import { INodeProperties } from "n8n-workflow";

export const orderConfirmationsOperations: INodeProperties = {
  displayName: "Operation",
  name: "operation",
  type: "options",
  noDataExpression: true,
  displayOptions: { show: { resource: ["orderConfirmations"] } },
  options: [
    {
      name: "Create",
      value: "create",
      description: "Create an order confirmation",
      action: "Create an order confirmation",
    },
    {
      name: "Delete",
      value: "delete",
      description: "Delete an order confirmation",
      action: "Delete an order confirmation",
    },
    {
      name: "Get",
      value: "get",
      description: "Get an order confirmation",
      action: "Get an order confirmation",
    },
    {
      name: "Get Many",
      value: "getAll",
      description: "Get many order confirmations",
      action: "Get many order confirmations",
    },
    {
      name: "Update",
      value: "update",
      description: "Update an order confirmation",
      action: "Update an order confirmation",
    },
  ],
  default: "getAll",
};

export const orderConfirmationsFields: INodeProperties[] = [
  {
    displayName: "Order Confirmation ID",
    name: "orderConfirmationId",
    type: "string",
    required: true,
    displayOptions: {
      show: {
        resource: ["orderConfirmations"],
        operation: ["get", "update", "delete"],
      },
    },
    default: "",
  },
  {
    displayName: "Order Confirmation",
    name: "orderConfirmation",
    type: "json",
    displayOptions: {
      show: {
        resource: ["orderConfirmations"],
        operation: ["create", "update"],
      },
    },
    default:
      '{"title": "Order Confirmation", "voucherDate": "", "lineItems": [], "totalPrice": {}}',
    description:
      "Raw JSON body for order confirmation according to Lexware API",
  },
  {
    displayName: "Page",
    name: "page",
    type: "number",
    displayOptions: {
      show: { resource: ["orderConfirmations"], operation: ["getAll"] },
    },
    default: 0,
    description: "Page number",
  },
];
