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

        const { netAmount, grossAmount } = calculatePriceAmounts(
          priceAmount,
          taxRatePercentage,
          priceType
        );

        unitPrice = {
          currency,
          netAmount,
          grossAmount,
          taxRatePercentage,
        };
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

    // Parse subItems if provided as JSON string
    let subItems: IDataObject[] = [];
    if (it?.subItems) {
      try {
        if (typeof it.subItems === "string") {
          subItems = JSON.parse(it.subItems as string);
        } else if (Array.isArray(it.subItems)) {
          subItems = it.subItems as IDataObject[];
        }
      } catch (error) {
        console.warn("Failed to parse subItems JSON:", error);
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
