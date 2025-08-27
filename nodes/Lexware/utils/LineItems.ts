import { IDataObject } from "n8n-workflow";

export function parseLineItemsFromCollection(
  rawItems: IDataObject[] = []
): IDataObject[] {
  return (rawItems || []).map((it) => {
    const unitPriceValue = (it.unitPrice as IDataObject)?.value as
      | IDataObject
      | undefined;
    const unitPrice = unitPriceValue
      ? {
          currency: unitPriceValue.currency,
          netAmount: unitPriceValue.netAmount,
          grossAmount: unitPriceValue.grossAmount,
          taxRatePercentage: unitPriceValue.taxRatePercentage,
        }
      : undefined;

    return {
      type: it.type || "custom",
      name: it.name,
      description: it.description,
      quantity: it.quantity,
      unitName: it.unitName,
      unitPrice,
      discountPercentage: it.discountPercentage,
      lineItemAmount: it.lineItemAmount,
    } as IDataObject;
  });
}

export function parseLineItemsFromJson(
  jsonInput: string | IDataObject | IDataObject[] | undefined
): IDataObject[] {
  if (!jsonInput) return [];
  let parsed: unknown;
  if (typeof jsonInput === "string") {
    try {
      parsed = JSON.parse(jsonInput);
    } catch {
      throw new Error("Invalid JSON provided for line items");
    }
  } else {
    parsed = jsonInput;
  }
  if (Array.isArray(parsed)) return parsed as IDataObject[];
  if (typeof parsed === "object") return [parsed as IDataObject];
  return [];
}
