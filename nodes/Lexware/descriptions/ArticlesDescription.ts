import { INodeProperties } from "n8n-workflow";

export const articlesOperations: INodeProperties = {
  displayName: "Operation",
  name: "operation",
  type: "options",
  noDataExpression: true,
  displayOptions: {
    show: {
      resource: ["articles"],
    },
  },
  options: [
    {
      name: "Create",
      value: "create",
      description: "Create a new article",
      action: "Create an article",
    },
    {
      name: "Delete",
      value: "delete",
      description: "Delete an article",
      action: "Delete an article",
    },
    {
      name: "Get",
      value: "get",
      description: "Get an article",
      action: "Get an article",
    },
    {
      name: "Get Many",
      value: "getAll",
      description: "Get many articles",
      action: "Get many articles",
    },
    {
      name: "Update",
      value: "update",
      description: "Update an article",
      action: "Update an article",
    },
  ],
  default: "getAll",
};

export const articlesFields: INodeProperties[] = [
  // Article ID
  {
    displayName: "Article ID",
    name: "articleId",
    type: "string",
    required: true,
    displayOptions: {
      show: {
        resource: ["articles"],
        operation: ["get", "update", "delete"],
      },
    },
    default: "",
    description: "ID of the article",
  },
  // Create/Update structured fields
  {
    displayName: "Title",
    name: "title",
    type: "string",
    displayOptions: {
      show: { resource: ["articles"], operation: ["create", "update"] },
    },
    default: "",
  },
  {
    displayName: "Description",
    name: "description",
    type: "string",
    displayOptions: {
      show: { resource: ["articles"], operation: ["create", "update"] },
    },
    default: "",
  },
  {
    displayName: "Type",
    name: "type",
    type: "options",
    options: [
      { name: "Product", value: "PRODUCT" },
      { name: "Service", value: "SERVICE" },
    ],
    displayOptions: {
      show: { resource: ["articles"], operation: ["create", "update"] },
    },
    default: "PRODUCT",
  },
  {
    displayName: "Article Number",
    name: "articleNumber",
    type: "string",
    displayOptions: {
      show: { resource: ["articles"], operation: ["create", "update"] },
    },
    default: "",
  },
  {
    displayName: "GTIN",
    name: "gtin",
    type: "string",
    displayOptions: {
      show: { resource: ["articles"], operation: ["create", "update"] },
    },
    default: "",
  },
  {
    displayName: "Note",
    name: "note",
    type: "string",
    displayOptions: {
      show: { resource: ["articles"], operation: ["create", "update"] },
    },
    default: "",
  },
  {
    displayName: "Unit Name",
    name: "unitName",
    type: "string",
    displayOptions: {
      show: { resource: ["articles"], operation: ["create", "update"] },
    },
    default: "",
  },
  {
    displayName: "Net Price",
    name: "netPrice",
    type: "number",
    displayOptions: {
      show: { resource: ["articles"], operation: ["create", "update"] },
    },
    default: 0,
  },
  {
    displayName: "Gross Price",
    name: "grossPrice",
    type: "number",
    displayOptions: {
      show: { resource: ["articles"], operation: ["create", "update"] },
    },
    default: 0,
  },
  {
    displayName: "Leading Price",
    name: "leadingPrice",
    type: "options",
    options: [
      { name: "Net", value: "NET" },
      { name: "Gross", value: "GROSS" },
    ],
    displayOptions: {
      show: { resource: ["articles"], operation: ["create", "update"] },
    },
    default: "NET",
  },
  {
    displayName: "Tax Rate",
    name: "taxRate",
    type: "number",
    displayOptions: {
      show: { resource: ["articles"], operation: ["create", "update"] },
    },
    default: 19,
  },
  // Get Many
  {
    displayName: "Page",
    name: "page",
    type: "number",
    displayOptions: {
      show: {
        resource: ["articles"],
        operation: ["getAll"],
      },
    },
    default: 0,
    description: "Page number",
  },
  {
    displayName: "Type",
    name: "type",
    type: "options",
    displayOptions: {
      show: {
        resource: ["articles"],
        operation: ["getAll"],
      },
    },
    options: [
      { name: "Product", value: "PRODUCT" },
      { name: "Service", value: "SERVICE" },
    ],
    default: "PRODUCT",
    description: "Filter by article type",
  },
];
