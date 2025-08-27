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

export async function executeQuotations(
  this: IExecuteFunctions,
  i: number,
  operation: string
): Promise<INodeExecutionData[]> {
  let responseData: any;

  switch (operation) {
    case "create": {
      // Structured create
      const title = this.getNodeParameter("title", i, "") as string;
      const introduction = this.getNodeParameter(
        "introduction",
        i,
        ""
      ) as string;
      const remark = this.getNodeParameter("remark", i, "") as string;
      const voucherDate = this.getNodeParameter("voucherDate", i, "") as string;
      const contactId = this.getNodeParameter("contactId", i, "") as string;
      const lineItemsRaw =
        (this.getNodeParameter("lineItems.item", i, []) as IDataObject[]) || [];
      const totalPriceRaw =
        (this.getNodeParameter("totalPrice.value", i, {}) as IDataObject) || {};
      const taxConditionsRaw =
        (this.getNodeParameter("taxConditions.value", i, {}) as IDataObject) ||
        {};

      const body: IDataObject = {
        title: title || undefined,
        introduction: introduction || undefined,
        remark: remark || undefined,
        voucherDate: voucherDate || undefined,
        address: contactId ? { contactId } : undefined,
        lineItems: parseLineItemsFromCollection(lineItemsRaw),
        totalPrice:
          Object.keys(totalPriceRaw).length > 0 ? totalPriceRaw : undefined,
        taxConditions:
          Object.keys(taxConditionsRaw).length > 0
            ? taxConditionsRaw
            : undefined,
      };
      responseData = await lexwareApiRequest.call(
        this,
        "POST",
        "/v1/quotations",
        body
      );
      break;
    }
    case "createByJson": {
      const title = this.getNodeParameter("title", i, "") as string;
      const introduction = this.getNodeParameter(
        "introduction",
        i,
        ""
      ) as string;
      const remark = this.getNodeParameter("remark", i, "") as string;
      const voucherDate = this.getNodeParameter("voucherDate", i, "") as string;
      const contactId = this.getNodeParameter("contactId", i, "") as string;
      const lineItemsJson = this.getNodeParameter(
        "lineItemsJson",
        i,
        []
      ) as IDataObject[];
      const totalPriceRaw =
        (this.getNodeParameter("totalPrice.value", i, {}) as IDataObject) || {};
      const taxConditionsRaw =
        (this.getNodeParameter("taxConditions.value", i, {}) as IDataObject) ||
        {};

      const body: IDataObject = {
        title: title || undefined,
        introduction: introduction || undefined,
        remark: remark || undefined,
        voucherDate: voucherDate || undefined,
        address: contactId ? { contactId } : undefined,
        lineItems: parseLineItemsFromJson(lineItemsJson),
        totalPrice:
          Object.keys(totalPriceRaw).length > 0 ? totalPriceRaw : undefined,
        taxConditions:
          Object.keys(taxConditionsRaw).length > 0
            ? taxConditionsRaw
            : undefined,
      };
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
