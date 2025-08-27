import { IExecuteFunctions } from "n8n-core";
import {
  IDataObject,
  INodeExecutionData,
  NodeOperationError,
} from "n8n-workflow";
import { lexwareApiRequest } from "../GenericFunctions";

export async function executeOrderConfirmations(
  this: IExecuteFunctions,
  i: number,
  operation: string
): Promise<INodeExecutionData[]> {
  let responseData: any;

  switch (operation) {
    case "create": {
      const body = this.getNodeParameter("orderConfirmation", i) as IDataObject;
      responseData = await lexwareApiRequest.call(
        this,
        "POST",
        "/v1/order-confirmations",
        body
      );
      break;
    }
    case "get": {
      const id = this.getNodeParameter("orderConfirmationId", i) as string;
      responseData = await lexwareApiRequest.call(
        this,
        "GET",
        `/v1/order-confirmations/${id}`
      );
      break;
    }
    case "getAll": {
      const page = this.getNodeParameter("page", i, 0) as number;
      responseData = await lexwareApiRequest.call(
        this,
        "GET",
        "/v1/order-confirmations",
        {},
        { page }
      );
      break;
    }
    case "update": {
      const id = this.getNodeParameter("orderConfirmationId", i) as string;
      const body = this.getNodeParameter("orderConfirmation", i) as IDataObject;
      // Following the samples pattern, use singular for update if API requires
      responseData = await lexwareApiRequest.call(
        this,
        "PUT",
        `/v1/order-confirmation/${id}`,
        body
      );
      break;
    }
    case "delete": {
      const id = this.getNodeParameter("orderConfirmationId", i) as string;
      responseData = await lexwareApiRequest.call(
        this,
        "DELETE",
        `/v1/order-confirmations/${id}`
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
