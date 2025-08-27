import { INodeProperties } from "n8n-workflow";

export const countriesOperations: INodeProperties = {
  displayName: "Operation",
  name: "operation",
  type: "options",
  noDataExpression: true,
  displayOptions: {
    show: { resource: ["countries"] },
  },
  options: [
    {
      name: "Get Many",
      value: "getAll",
      description: "Retrieve list of countries",
      action: "Get many countries",
    },
  ],
  default: "getAll",
};

export const countriesFields: INodeProperties[] = [
  {
    displayName: "Return All",
    name: "returnAll",
    type: "boolean",
    displayOptions: {
      show: { resource: ["countries"], operation: ["getAll"] },
    },
    default: true,
  },
];
