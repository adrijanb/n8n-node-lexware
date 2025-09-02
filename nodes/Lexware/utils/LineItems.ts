import { IDataObject } from "n8n-workflow";

/**
 * Calculate net and gross amounts based on price type and tax rate
 */
function calculatePriceAmounts(
  priceAmount: number,
  taxRatePercentage: number,
  priceType: string
): { netAmount: number; grossAmount: number } {
  if (priceType === "net") {
    // Price is net, calculate gross
    const netAmount = priceAmount;
    const grossAmount = netAmount * (1 + taxRatePercentage / 100);
    return {
      netAmount: Math.round(netAmount * 100) / 100, // Round to 2 decimal places
      grossAmount: Math.round(grossAmount * 100) / 100,
    };
  } else {
    // Price is gross, calculate net
    const grossAmount = priceAmount;
    const netAmount = grossAmount / (1 + taxRatePercentage / 100);
    return {
      netAmount: Math.round(netAmount * 100) / 100, // Round to 2 decimal places
      grossAmount: Math.round(grossAmount * 100) / 100,
    };
  }
}

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

    // Parse subItems from fixedCollection format
    let subItems: IDataObject[] = [];
    if (it?.subItems && typeof it.subItems === "object") {
      const subItemsCollection = (it.subItems as IDataObject)
        ?.subItem as IDataObject[];
      if (Array.isArray(subItemsCollection)) {
        subItems = subItemsCollection.map((subItem) => ({
          type: subItem.type || "custom",
          name: subItem.name,
          description: subItem.description,
          quantity: subItem.quantity,
          unitName: subItem.unitName,
          alternative: subItem.alternative || false,
          optional: subItem.optional || false,
        }));
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
