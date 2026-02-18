import { IExecuteFunctions } from "n8n-core";
import {
  IDataObject,
  INodeExecutionData,
  NodeOperationError,
} from "n8n-workflow";
import { lexwareApiRequest } from "../GenericFunctions";
import { parseLineItemsFromJson } from "../utils/LineItems";
import { formatToLexwareDate } from "../utils/date";

function buildInvoiceBody(
  getParam: (name: string, index?: number, defaultValue?: unknown) => unknown,
  i: number
): IDataObject {
  const title = (getParam("title", i, "") as string) || "";
  const introduction = (getParam("introduction", i, "") as string) || "";
  const remark = (getParam("remark", i, "") as string) || "";
  const voucherDateRaw = (getParam("voucherDate", i, "") as string) || "";
  const voucherDate = formatToLexwareDate(voucherDateRaw);
  const contactId = (getParam("contactId", i, "") as string) || "";

  const rawItems = (getParam("lineItems.item", i, []) as IDataObject[]) || [];
  const lineItems = Array.isArray(rawItems) ? rawItems.map((it) => {
    const unit = (it.unitPrice as IDataObject)?.value as
      | IDataObject
      | undefined;
    const quantity = (it.quantity as number) ?? 1;
    const net = (unit?.netAmount as number) ?? 0;
    const rate = (unit?.taxRatePercentage as number) ?? 0;
    const gross = (unit?.grossAmount as number) ?? net * (1 + rate / 100);
    const cleaned: IDataObject = {
      type: it.type || "custom",
      name: it.name,
      description: it.description,
      quantity,
      unitName: it.unitName,
      unitPrice: unit
        ? {
          currency: unit.currency,
          netAmount: unit.netAmount,
          grossAmount: unit.grossAmount ?? gross,
          taxRatePercentage: unit.taxRatePercentage,
        }
        : undefined,
      discountPercentage: it.discountPercentage,
    };
    // lineItemAmount ist optional – nur senden, wenn vorhanden und nicht null
    if (it.lineItemAmount !== null && it.lineItemAmount !== undefined) {
      cleaned.lineItemAmount = it.lineItemAmount;
    }
    return cleaned;
  }) : [];

  const body: IDataObject = {
    title,
    introduction: introduction || undefined,
    remark: remark || undefined,
    voucherDate,
    address: contactId ? { contactId } : undefined,
    lineItems,
  };
  const totalPriceVal = getParam("totalPrice.value", i, {}) as IDataObject;
  if (totalPriceVal && Object.keys(totalPriceVal).length) {
    const cleanedTotalPrice: IDataObject = { ...totalPriceVal };

    // Clean discounts: only one of absolute or percentage can be set, and not both at 0
    const abs = cleanedTotalPrice.totalDiscountAbsolute as number;
    const pct = cleanedTotalPrice.totalDiscountPercentage as number;

    if (pct !== undefined && pct > 0) {
      delete cleanedTotalPrice.totalDiscountAbsolute;
    } else if (abs !== undefined && abs > 0) {
      delete cleanedTotalPrice.totalDiscountPercentage;
    } else {
      // Both are 0 or undefined - remove both to avoid API error
      delete cleanedTotalPrice.totalDiscountAbsolute;
      delete cleanedTotalPrice.totalDiscountPercentage;
    }

    (body as IDataObject).totalPrice = cleanedTotalPrice;
  } else {
    // Fallback: aus Positionen berechnen
    const currency =
      (lineItems[0]?.unitPrice as IDataObject | undefined)?.currency ?? "EUR";
    let totalNetAmount = 0;
    let totalGrossAmount = 0;
    for (const li of lineItems) {
      const q = (li.quantity as number) ?? 1;
      const up = li.unitPrice as IDataObject | undefined;
      const net = (up?.netAmount as number) ?? 0;
      const gross = (up?.grossAmount as number) ?? 0;
      totalNetAmount += net * q;
      totalGrossAmount += (gross || net) * q;
    }
    const totalTaxAmount = Math.max(totalGrossAmount - totalNetAmount, 0);
    (body as IDataObject).totalPrice = {
      currency,
      totalNetAmount,
      totalGrossAmount,
      totalTaxAmount,
    } as IDataObject;
  }
  const taxConditionsVal = getParam(
    "taxConditions.value",
    i,
    {}
  ) as IDataObject;
  if (taxConditionsVal && Object.keys(taxConditionsVal).length) {
    (body as IDataObject).taxConditions = taxConditionsVal;
  } else {
    (body as IDataObject).taxConditions = { taxType: "net", taxTypeNote: "" };
  }
  const shippingConditionsVal = getParam(
    "shippingConditions.value",
    i,
    {}
  ) as IDataObject;
  if (shippingConditionsVal && Object.keys(shippingConditionsVal).length) {
    (body as IDataObject).shippingConditions = shippingConditionsVal;
  } else {
    (body as IDataObject).shippingConditions = {
      shippingType: "delivery",
      shippingDate: voucherDate || undefined,
      shippingEndDate: voucherDate || undefined,
    } as IDataObject;
  }
  const xRechnung = getParam("xRechnung", i, undefined) as
    | IDataObject
    | string
    | undefined;
  // xRechnung nur senden, wenn Objekt oder nicht-leerer String, der nicht "null" ist
  if (typeof xRechnung === "string") {
    if (xRechnung.trim() && xRechnung.trim().toLowerCase() !== "null") {
      (body as IDataObject).xRechnung = xRechnung;
    }
  } else if (xRechnung) {
    (body as IDataObject).xRechnung = xRechnung;
  }
  // Payment Conditions
  const paymentConditionsVal = getParam(
    "paymentConditions.value",
    i,
    {}
  ) as IDataObject;
  if (paymentConditionsVal && Object.keys(paymentConditionsVal).length) {
    const discount = (
      paymentConditionsVal.paymentDiscountConditions as IDataObject | undefined
    )?.value as IDataObject | undefined;
    (body as IDataObject).paymentConditions = {
      paymentTermLabel: paymentConditionsVal.paymentTermLabel,
      paymentTermDuration: paymentConditionsVal.paymentTermDuration,
      paymentDiscountConditions: discount
        ? {
          discountPercentage: discount.discountPercentage,
          discountRange: discount.discountRange,
        }
        : undefined,
    } as IDataObject;
  }
  return body;
}

export async function executeInvoices(
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
      const invoice = buildInvoiceBody(getParam, i);
      const finalize = this.getNodeParameter("finalize", i, false) as boolean;
      responseData = await lexwareApiRequest.call(
        this,
        "POST",
        finalize ? "/v1/invoices?finalize=true" : "/v1/invoices",
        invoice
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
      const standard = buildInvoiceBody(getParam, i);
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
        "/v1/invoices",
        body
      );
      break;
    }
    case "get": {
      const invoiceId = this.getNodeParameter("invoiceId", i) as string;
      responseData = await lexwareApiRequest.call(
        this,
        "GET",
        `/v1/invoices/${invoiceId}`
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
        "/v1/invoices",
        {},
        qs
      );
      break;
    }
    case "update": {
      const invoiceId = this.getNodeParameter("invoiceId", i) as string;
      const getParam = (name: string, index?: number, def?: unknown) =>
        (
          this.getNodeParameter as unknown as (
            name: string,
            index?: number,
            defaultValue?: unknown
          ) => unknown
        )(name, index, def);
      const invoice = buildInvoiceBody(getParam, i);
      // Following the samples pattern, update might be addressed as singular form too. If API expects another path, adjust here accordingly.
      responseData = await lexwareApiRequest.call(
        this,
        "PUT",
        `/v1/invoice/${invoiceId}`,
        invoice
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
