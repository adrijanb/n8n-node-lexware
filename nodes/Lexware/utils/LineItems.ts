import { IDataObject } from "n8n-workflow";

export function parseLineItemsFromCollection(
  rawItems: IDataObject[] = []
): IDataObject[] {
  return (rawItems || []).map((it) => {
    const unitPriceValue = (it?.unitPrice as IDataObject)?.value as
      | IDataObject
      | undefined;

    let unitPrice: IDataObject | undefined;

    if (unitPriceValue) {
      const currency = unitPriceValue.currency || "EUR";
      const taxRatePercentage = Number(unitPriceValue.taxRatePercentage) || 19;

      // Check if we have the new price structure with priceType and priceAmount
      if (
        unitPriceValue.priceType &&
        unitPriceValue.priceAmount !== undefined
      ) {
        const priceAmount = Number(unitPriceValue.priceAmount);
        const priceType = unitPriceValue.priceType as string;

        // According to Lexware API: only send netAmount OR grossAmount, not both
        if (priceType === "net") {
          unitPrice = {
            currency,
            netAmount: Math.round(priceAmount * 100) / 100,
            taxRatePercentage,
          };
        } else {
          unitPrice = {
            currency,
            grossAmount: Math.round(priceAmount * 100) / 100,
            taxRatePercentage,
          };
        }
      } else {
        // Fallback to old structure for backward compatibility
        unitPrice = {
          currency,
          netAmount: unitPriceValue.netAmount,
          grossAmount: unitPriceValue.grossAmount,
          taxRatePercentage,
        };
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
      postingCategoryId: it?.postingCategoryId,
    };

    // Add optional fields only if they are set
    if (it?.alternative !== undefined) {
      lineItem.alternative = it.alternative;
    }
    if (it?.optional !== undefined) {
      lineItem.optional = it.optional;
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
