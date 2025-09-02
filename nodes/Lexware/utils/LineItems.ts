import { IDataObject } from "n8n-workflow";

export function parseLineItemsFromCollection(
  rawItems: IDataObject[] = []
): IDataObject[] {
  return (rawItems || []).map((it) => {
    const unitPriceValue = (it?.unitPrice as IDataObject)?.value as
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

    // Parse subItems if provided as JSON string
    let subItems: IDataObject[] = [];
    if (it?.subItems) {
      try {
        if (typeof it.subItems === 'string') {
          subItems = JSON.parse(it.subItems as string);
        } else if (Array.isArray(it.subItems)) {
          subItems = it.subItems as IDataObject[];
        }
      } catch (error) {
        console.warn('Failed to parse subItems JSON:', error);
      }
    }

    const lineItem: IDataObject = {
      type: it?.type || "custom",
      name: it?.name,
      description: it?.description,
      quantity: it?.quantity,
      unitName: it?.unitName,
      unitPrice,
      discountPercentage: it?.discountPercentage,
      lineItemAmount: it?.lineItemAmount,
    };

    // Add optional fields only if they are set
    if (it?.alternative !== undefined) {
      lineItem.alternative = it.alternative;
    }
    if (it?.optional !== undefined) {
      lineItem.optional = it.optional;
    }
    if (subItems.length > 0) {
      lineItem.subItems = subItems;
    }

    return lineItem;
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
