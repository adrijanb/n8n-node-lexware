import { IExecuteFunctions } from "n8n-core";
import { INodeExecutionData } from "n8n-workflow";
import { lexwareApiRequest } from "../GenericFunctions";

export async function executePrintLayouts(
  this: IExecuteFunctions,
  i: number,
  operation: string
): Promise<INodeExecutionData[]> {
  let responseData: any;

  switch (operation) {
    case "getAll":
      responseData = await lexwareApiRequest.call(
        this,
        "GET",
        "/v1/print-layouts"
      );
      break;
    default:
      throw new Error(`Unsupported operation: ${operation}`);
  }

  const items = Array.isArray(responseData) ? responseData : [responseData];
  return items.map((data) => ({ json: data }));
}
