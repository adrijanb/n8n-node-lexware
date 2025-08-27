import { IExecuteFunctions } from "n8n-core";
import { IDataObject, INodeExecutionData } from "n8n-workflow";
import { lexwareApiRequest } from "../GenericFunctions";
import { parseLineItemsFromCollection } from "../utils/LineItems";
import { formatToLexwareDate } from "../utils/date";

export async function executeDunnings(
  this: IExecuteFunctions,
  i: number,
  operation: string
): Promise<INodeExecutionData[]> {
  let responseData: any;

  switch (operation) {
    case "create": {
      const precedingSalesVoucherId = this.getNodeParameter(
        "precedingSalesVoucherId",
        i
      ) as string;
      const finalize = this.getNodeParameter("finalize", i, false) as boolean;
      const voucherDateRaw = this.getNodeParameter("voucherDate", i, "") as
        | string
        | undefined;
      const title = this.getNodeParameter("title", i, "") as string;
      const extraLineItemsRaw = this.getNodeParameter(
        "lineItems.item",
        i,
        []
      ) as IDataObject[] as IDataObject[];

      // 1) Bestehende Rechnung abrufen
      const baseInvoice = await lexwareApiRequest.call(
        this,
        "GET",
        `/v1/invoices/${precedingSalesVoucherId}`
      );

      const baseLineItems = (baseInvoice?.lineItems ?? []) as IDataObject[];
      const baseAddress = (baseInvoice?.address ?? {}) as IDataObject;
      const baseShipping = (baseInvoice?.shippingConditions ??
        {}) as IDataObject;
      const baseTaxConditions = (baseInvoice?.taxConditions ??
        {}) as IDataObject;
      const baseCurrency = (baseInvoice?.totalPrice?.currency || "EUR") as
        | string
        | undefined;

      // 2) Zusätzliche Positionen anhängen
      const extraLineItems = parseLineItemsFromCollection(extraLineItemsRaw);
      const lineItems = [...baseLineItems, ...extraLineItems];

      // 3) Total kalkulieren (einfacher Summator; Lexware validiert trotzdem)
      const toNum = (n: unknown) =>
        typeof n === "number" ? n : Number(n) || 0;
      const totalNetAmount = lineItems.reduce(
        (acc, it) => acc + toNum((it as IDataObject).lineItemAmount),
        0
      );

      const dunning: IDataObject = {
        title: title || undefined,
        voucherDate: formatToLexwareDate(voucherDateRaw) || undefined,
        address: baseAddress,
        lineItems,
        totalPrice: {
          currency: baseCurrency || "EUR",
          totalNetAmount,
        },
        taxConditions:
          Object.keys(baseTaxConditions).length > 0
            ? baseTaxConditions
            : ({ taxType: "net" } as IDataObject),
        shippingConditions:
          Object.keys(baseShipping).length > 0 ? baseShipping : undefined,
      };

      const qs: IDataObject = { precedingSalesVoucherId };
      if (finalize) qs.finalize = true;

      const res: any = await lexwareApiRequest.call(
        this,
        "POST",
        "/v1/dunnings",
        dunning,
        qs,
        { returnFullResponse: true }
      );

      // Viele Create-Endpoints liefern nur einen Location-Header zurück
      const location = res?.headers?.location as string | undefined;
      if (
        (!res?.body ||
          (typeof res.body === "object" &&
            Object.keys(res.body).length === 0)) &&
        location
      ) {
        const idMatch = location.match(/\/v1\/dunnings\/([^/?#]+)/i);
        responseData = {
          id: idMatch ? idMatch[1] : undefined,
          resourceUrl: location,
          statusCode: res?.statusCode,
        };
      } else {
        responseData = res?.body ?? {};
      }
      break;
    }
    case "get": {
      const dunningId = this.getNodeParameter("dunningId", i) as string;
      responseData = await lexwareApiRequest.call(
        this,
        "GET",
        `/v1/dunnings/${dunningId}`
      );
      break;
    }
    default:
      throw new Error(`Unsupported operation: ${operation}`);
  }

  const items = Array.isArray(responseData) ? responseData : [responseData];
  return items.map((data) => ({ json: data }));
}
