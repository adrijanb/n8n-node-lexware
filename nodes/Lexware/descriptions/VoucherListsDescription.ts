import { INodeProperties } from "n8n-workflow";

export const voucherListsOperations: INodeProperties = {
  displayName: "Operation",
  name: "operation",
  type: "options",
  noDataExpression: true,
  displayOptions: { show: { resource: ["voucherLists"] } },
  options: [
    {
      name: "Get",
      value: "get",
      description: "Get a voucher list",
      action: "Get a voucher list",
    },
    {
      name: "Get Many",
      value: "getAll",
      description: "Get many voucher lists",
      action: "Get many voucher lists",
    },
  ],
  default: "getAll",
};

export const voucherListsFields: INodeProperties[] = [
  {
    displayName: "Voucher List ID",
    name: "voucherListId",
    type: "string",
    required: true,
    displayOptions: {
      show: { resource: ["voucherLists"], operation: ["get"] },
    },
    default: "",
  },
  {
    displayName: "Page",
    name: "page",
    type: "number",
    displayOptions: {
      show: { resource: ["voucherLists"], operation: ["getAll"] },
    },
    default: 0,
    description: "Page number",
  },
  {
    displayName: "Status",
    name: "status",
    type: "string",
    displayOptions: {
      show: { resource: ["voucherLists"], operation: ["getAll"] },
    },
    default: "",
    description: "Optional status filter",
  },
  {
    displayName: "Voucher Number",
    name: "voucherNumber",
    type: "string",
    displayOptions: {
      show: { resource: ["voucherLists"], operation: ["getAll"] },
    },
    default: "",
    description:
      "Filter by voucherNumber (according to docs, filtering vouchers by number should be done via voucherlist)",
  },
];
