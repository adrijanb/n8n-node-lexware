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
import { LexwareValidator } from "../utils/validation";

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
      const expiryDate = this.getNodeParameter("expiryDate", i, "") as string;
      const contactId = this.getNodeParameter("contactId", i, "") as string;
      const manualAddressRaw =
        (this.getNodeParameter(
          "manualAddress.address",
          i,
          {}
        ) as IDataObject) || {};
      const lineItemsRaw =
        (this.getNodeParameter("lineItems.item", i, []) as IDataObject[]) || [];
      const totalPriceRaw =
        (this.getNodeParameter("totalPrice.value", i, {}) as IDataObject) || {};
      const taxConditionsRaw =
        (this.getNodeParameter("taxConditions.value", i, {}) as IDataObject) ||
        {};

      // Build address object - prefer contactId, fallback to manual address
      let address: IDataObject | undefined;
      if (contactId) {
        address = { contactId };
      } else if (Object.keys(manualAddressRaw).length > 0) {
        address = {
          name: manualAddressRaw.name || undefined,
          supplement: manualAddressRaw.supplement || undefined,
          street: manualAddressRaw.street || undefined,
          city: manualAddressRaw.city || undefined,
          zip: manualAddressRaw.zip || undefined,
          countryCode: manualAddressRaw.countryCode || undefined,
        };
        // Remove undefined values
        address = Object.fromEntries(
          Object.entries(address).filter(([_, value]) => value !== undefined)
        );
      }

      const body: IDataObject = {
        title: title || undefined,
        introduction: introduction || undefined,
        remark: remark || undefined,
        voucherDate: voucherDate || undefined,
        expiryDate: expiryDate || undefined,
        address: address,
        lineItems: parseLineItemsFromCollection(lineItemsRaw),
        totalPrice: totalPriceRaw.currency
          ? { currency: totalPriceRaw.currency }
          : undefined,
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
      const expiryDate = this.getNodeParameter("expiryDate", i, "") as string;
      const contactId = this.getNodeParameter("contactId", i, "") as string;
      const manualAddressRaw =
        (this.getNodeParameter(
          "manualAddress.address",
          i,
          {}
        ) as IDataObject) || {};
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

      // Build address object - prefer contactId, fallback to manual address
      let address: IDataObject | undefined;
      if (contactId) {
        address = { contactId };
      } else if (Object.keys(manualAddressRaw).length > 0) {
        address = {
          name: manualAddressRaw.name || undefined,
          supplement: manualAddressRaw.supplement || undefined,
          street: manualAddressRaw.street || undefined,
          city: manualAddressRaw.city || undefined,
          zip: manualAddressRaw.zip || undefined,
          countryCode: manualAddressRaw.countryCode || undefined,
        };
        // Remove undefined values
        address = Object.fromEntries(
          Object.entries(address).filter(([_, value]) => value !== undefined)
        );
      }

      const body: IDataObject = {
        title: title || undefined,
        introduction: introduction || undefined,
        remark: remark || undefined,
        voucherDate: voucherDate || undefined,
        expiryDate: expiryDate || undefined,
        address: address,
        lineItems: parseLineItemsFromJson(lineItemsJson),
        totalPrice: totalPriceRaw.currency
          ? { currency: totalPriceRaw.currency }
          : undefined,
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
      const title = this.getNodeParameter("title", i, "") as string;
      const introduction = this.getNodeParameter(
        "introduction",
        i,
        ""
      ) as string;
      const remark = this.getNodeParameter("remark", i, "") as string;
      const voucherDate = this.getNodeParameter("voucherDate", i, "") as string;
      const expiryDate = this.getNodeParameter("expiryDate", i, "") as string;
      const contactId = this.getNodeParameter("contactId", i, "") as string;
      const manualAddressRaw =
        (this.getNodeParameter(
          "manualAddress.address",
          i,
          {}
        ) as IDataObject) || {};
      const lineItemsRaw =
        (this.getNodeParameter("lineItems.item", i, []) as IDataObject[]) || [];
      const totalPriceRaw =
        (this.getNodeParameter("totalPrice.value", i, {}) as IDataObject) || {};
      const taxConditionsRaw =
        (this.getNodeParameter("taxConditions.value", i, {}) as IDataObject) ||
        {};

      // Build address object - prefer contactId, fallback to manual address
      let address: IDataObject | undefined;
      if (contactId) {
        address = { contactId };
      } else if (Object.keys(manualAddressRaw).length > 0) {
        address = {
          name: manualAddressRaw.name || undefined,
          supplement: manualAddressRaw.supplement || undefined,
          street: manualAddressRaw.street || undefined,
          city: manualAddressRaw.city || undefined,
          zip: manualAddressRaw.zip || undefined,
          countryCode: manualAddressRaw.countryCode || undefined,
        };
        // Remove undefined values
        address = Object.fromEntries(
          Object.entries(address).filter(([_, value]) => value !== undefined)
        );
      }

      const body: IDataObject = {
        title: title || undefined,
        introduction: introduction || undefined,
        remark: remark || undefined,
        voucherDate: voucherDate || undefined,
        expiryDate: expiryDate || undefined,
        address: address,
        lineItems: parseLineItemsFromCollection(lineItemsRaw),
        totalPrice: totalPriceRaw.currency
          ? { currency: totalPriceRaw.currency }
          : undefined,
        taxConditions:
          Object.keys(taxConditionsRaw).length > 0
            ? taxConditionsRaw
            : undefined,
      };
      responseData = await lexwareApiRequest.call(
        this,
        "PUT",
        `/v1/quotations/${id}`,
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
