import { IExecuteFunctions } from "n8n-core";
import {
  IDataObject,
  INodeExecutionData,
  NodeOperationError,
} from "n8n-workflow";
import { lexwareApiRequest } from "../GenericFunctions";

export async function executeQuotations(
  this: IExecuteFunctions,
  i: number,
  operation: string
): Promise<INodeExecutionData[]> {
  let responseData: any;

  switch (operation) {
    case "create": {
      const body = this.getNodeParameter("quotation", i) as IDataObject;
      responseData = await lexwareApiRequest.call(
        this,
        "POST",
        "/v1/quotations",
        body
      );
      break;
    }
    case "get": {
      const id = this.getNodeParameter("quotationId", i) as string;
      responseData = await lexwareApiRequest.call(
        this,
        "GET",
        `/v1/quotations/${id}`
      );
      break;
    }
    case "getAll": {
      const page = this.getNodeParameter("page", i, 0) as number;
      responseData = await lexwareApiRequest.call(
        this,
        "GET",
        "/v1/quotations",
        {},
        { page }
      );
      break;
    }
    case "update": {
      const id = this.getNodeParameter("quotationId", i) as string;
      const body = this.getNodeParameter("quotation", i) as IDataObject;
      responseData = await lexwareApiRequest.call(
        this,
        "PUT",
        `/v1/quotation/${id}`,
        body
      );
      break;
    }
    case "delete": {
      const id = this.getNodeParameter("quotationId", i) as string;
      responseData = await lexwareApiRequest.call(
        this,
        "DELETE",
        `/v1/quotations/${id}`
      );
      break;
    }
    default:
      throw new NodeOperationError(
        this.getNode(),
        `Unsupported operation: ${operation}`
      );
  }

  const items = Array.isArray(responseData) ? responseData : [responseData];
  return items.map((data) => ({ json: data }));
}
