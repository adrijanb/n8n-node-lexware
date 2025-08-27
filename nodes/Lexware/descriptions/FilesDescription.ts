import { INodeProperties } from "n8n-workflow";

export const filesOperations: INodeProperties = {
  displayName: "Operation",
  name: "operation",
  type: "options",
  noDataExpression: true,
  displayOptions: {
    show: { resource: ["files"] },
  },
  options: [
    { name: "Upload", value: "upload", description: "Upload a file", action: "Upload a file" },
    { name: "Download", value: "download", description: "Download a file", action: "Download a file" },
  ],
  default: "upload",
};

export const filesFields: INodeProperties[] = [
  // Upload
  {
    displayName: "Binary Property",
    name: "binaryPropertyName",
    type: "string",
    default: "data",
    description: "Name der Binär-Property aus dem vorherigen Node",
    displayOptions: { show: { resource: ["files"], operation: ["upload"] } },
  },
  {
    displayName: "Type",
    name: "type",
    type: "options",
    options: [
      { name: "Voucher", value: "voucher" },
      { name: "Generic", value: "generic" },
    ],
    default: "voucher",
    displayOptions: { show: { resource: ["files"], operation: ["upload"] } },
  },
  // Download
  {
    displayName: "File ID",
    name: "fileId",
    type: "string",
    required: true,
    default: "",
    displayOptions: { show: { resource: ["files"], operation: ["download"] } },
  },
  {
    displayName: "Binary Property",
    name: "downloadBinaryPropertyName",
    type: "string",
    default: "data",
    description: "Name der Binär-Property für den Download",
    displayOptions: { show: { resource: ["files"], operation: ["download"] } },
  },
];


