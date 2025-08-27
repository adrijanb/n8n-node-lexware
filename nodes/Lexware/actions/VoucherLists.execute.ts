import { IExecuteFunctions } from "n8n-core";
import {
  IDataObject,
  INodeExecutionData,
  NodeOperationError,
} from "n8n-workflow";
import { lexwareApiRequest } from "../GenericFunctions";

export async function executeVoucherLists(
  this: IExecuteFunctions,
  i: number,
  operation: string
): Promise<INodeExecutionData[]> {
  let responseData: any;

  switch (operation) {
    case "get": {
      const id = this.getNodeParameter("voucherListId", i) as string;
      responseData = await lexwareApiRequest.call(
        this,
        "GET",
        `/v1/voucher-lists/${id}`
      );
      break;
    }
    case "getAll": {
      const page = this.getNodeParameter("page", i, 0) as number;
      const status = this.getNodeParameter("status", i, "") as string;
      const voucherNumber = this.getNodeParameter(
        "voucherNumber",
        i,
        ""
      ) as string;
      const qs: IDataObject = {};
      if (page !== undefined) qs.page = page;
      if (status) qs.status = status;
      if (voucherNumber) qs.voucherNumber = voucherNumber;
      responseData = await lexwareApiRequest.call(
        this,
        "GET",
        "/v1/voucherlist",
        {},
        qs
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
