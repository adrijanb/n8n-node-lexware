import { INodeProperties } from "n8n-workflow";

export const printLayoutsOperations: INodeProperties = {
  displayName: "Operation",
  name: "operation",
  type: "options",
  noDataExpression: true,
  displayOptions: { show: { resource: ["printLayouts"] } },
  options: [
    {
      name: "Get Many",
      value: "getAll",
      description: "Get print layouts",
      action: "Get print layouts",
    },
  ],
  default: "getAll",
};

export const printLayoutsFields: INodeProperties[] = [];
