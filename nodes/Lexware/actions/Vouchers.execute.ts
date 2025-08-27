import { IExecuteFunctions } from "n8n-core";
import {
  IDataObject,
  INodeExecutionData,
  NodeOperationError,
} from "n8n-workflow";
import { lexwareApiRequest } from "../GenericFunctions";
import {
  parseLineItemsFromCollection,
  parseLineItemsFromJson,
} from "../utils/LineItems";
import { formatToLexwareDate } from "../utils/date";

function buildVoucherBody(
  getParam: (name: string, index?: number, defaultValue?: unknown) => unknown,
  i: number
): IDataObject {
  const title = (getParam("title", i, "") as string) || "";
  const voucherDateRaw = (getParam("voucherDate", i, "") as string) || "";
  const voucherDate = formatToLexwareDate(voucherDateRaw);
  const contactId = (getParam("contactId", i, "") as string) || "";
  const rawItems = (getParam("lineItems.item", i, []) as IDataObject[]) || [];
  const lineItems = parseLineItemsFromCollection(rawItems);
  const body: IDataObject = {
    title,
    voucherDate,
    address: contactId ? { contactId } : undefined,
    lineItems,
  };
  return body;
}

export async function executeVouchers(
  this: IExecuteFunctions,
  i: number,
  operation: string
): Promise<INodeExecutionData[]> {
  let responseData: any;

  switch (operation) {
    case "create": {
      const getParam = (name: string, index?: number, def?: unknown) =>
        (
          this.getNodeParameter as unknown as (
            name: string,
            index?: number,
            defaultValue?: unknown
          ) => unknown
        )(name, index, def);
      const body = buildVoucherBody(getParam, i);
      responseData = await lexwareApiRequest.call(
        this,
        "POST",
        "/v1/vouchers",
        body
      );
      break;
    }
    case "createByJson": {
      const getParam = (name: string, index?: number, def?: unknown) =>
        (
          this.getNodeParameter as unknown as (
            name: string,
            index?: number,
            defaultValue?: unknown
          ) => unknown
        )(name, index, def);
      const standard = buildVoucherBody(getParam, i);
      const lineItemsJson = this.getNodeParameter(
        "lineItemsJson",
        i,
        "[]"
      ) as string;
      const jsonItems = parseLineItemsFromJson(lineItemsJson);
      const body = { ...standard, lineItems: jsonItems } as IDataObject;
      responseData = await lexwareApiRequest.call(
        this,
        "POST",
        "/v1/vouchers",
        body
      );
      break;
    }
    case "get": {
      const id = this.getNodeParameter("voucherId", i) as string;
      responseData = await lexwareApiRequest.call(
        this,
        "GET",
        `/v1/vouchers/${id}`
      );
      break;
    }
    case "getAll": {
      const page = this.getNodeParameter("page", i, 0) as number;
      const status = this.getNodeParameter("status", i, "") as string;
      const qs: IDataObject = {};
      if (page !== undefined) qs.page = page;
      if (status) qs.status = status;
      responseData = await lexwareApiRequest.call(
        this,
        "GET",
        "/v1/vouchers",
        {},
        qs
      );
      break;
    }
    case "update": {
      const id = this.getNodeParameter("voucherId", i) as string;
      const getParam = (name: string, index?: number, def?: unknown) =>
        (
          this.getNodeParameter as unknown as (
            name: string,
            index?: number,
            defaultValue?: unknown
          ) => unknown
        )(name, index, def);
      const body = buildVoucherBody(getParam, i);
      responseData = await lexwareApiRequest.call(
        this,
        "PUT",
        `/v1/voucher/${id}`,
        body
      );
      break;
    }
    case "delete": {
      const id = this.getNodeParameter("voucherId", i) as string;
      responseData = await lexwareApiRequest.call(
        this,
        "DELETE",
        `/v1/vouchers/${id}`
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
