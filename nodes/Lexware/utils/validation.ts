import { IDataObject, NodeOperationError } from "n8n-workflow";
import { IExecuteFunctions } from "n8n-core";
import { LexwareErrorHandler } from "./errorHandler";

/**
 * Validation utility for Lexware API requests
 */
export class LexwareValidator {
  private context: IExecuteFunctions;

  constructor(context: IExecuteFunctions) {
    this.context = context;
  }

  /**
   * Validates and sanitizes a string field
   */
  validateString(
    value: string | undefined,
    fieldName: string,
    options: {
      required?: boolean;
      minLength?: number;
      maxLength?: number;
      pattern?: RegExp;
    } = {}
  ): string | undefined {
    if (!value || value.trim() === "") {
      if (options.required) {
        const errorMessage = LexwareErrorHandler.formatValidationError(
          fieldName,
          value,
          "is required and cannot be empty"
        );
        throw new NodeOperationError(this.context.getNode(), errorMessage, {
          description: `Please provide a valid value for ${fieldName}`,
        });
      }
      return undefined;
    }

    const trimmed = value.trim();

    if (options.minLength && trimmed.length < options.minLength) {
      const errorMessage = LexwareErrorHandler.formatValidationError(
        fieldName,
        value,
        `must be at least ${options.minLength} characters long (current: ${trimmed.length})`
      );
      throw new NodeOperationError(this.context.getNode(), errorMessage, {
        description: `Please provide a longer value for ${fieldName}`,
      });
    }

    if (options.maxLength && trimmed.length > options.maxLength) {
      const errorMessage = LexwareErrorHandler.formatValidationError(
        fieldName,
        value,
        `cannot be longer than ${options.maxLength} characters (current: ${trimmed.length})`
      );
      throw new NodeOperationError(this.context.getNode(), errorMessage, {
        description: `Please provide a shorter value for ${fieldName}`,
      });
    }

    if (options.pattern && !options.pattern.test(trimmed)) {
      const errorMessage = LexwareErrorHandler.formatValidationError(
        fieldName,
        value,
        "has invalid format"
      );
      throw new NodeOperationError(this.context.getNode(), errorMessage, {
        description: `Please provide a valid format for ${fieldName}`,
      });
    }

    return trimmed;
  }

  /**
   * Validates a date string
   */
  validateDate(
    value: string | undefined,
    fieldName: string,
    options: { required?: boolean } = {}
  ): string | undefined {
    if (!value || value.trim() === "") {
      if (options.required) {
        throw new NodeOperationError(
          this.context.getNode(),
          `Field '${fieldName}' is required`
        );
      }
      return undefined;
    }

    const trimmed = value.trim();

    // Try to parse the date
    const date = new Date(trimmed);
    if (isNaN(date.getTime())) {
      throw new NodeOperationError(
        this.context.getNode(),
        `Field '${fieldName}' must be a valid date`
      );
    }

    // Return ISO string for consistency
    return date.toISOString();
  }

  /**
   * Validates a currency code
   */
  validateCurrency(
    value: string | undefined,
    fieldName: string,
    options: { required?: boolean } = {}
  ): string | undefined {
    if (!value || value.trim() === "") {
      if (options.required) {
        throw new NodeOperationError(
          this.context.getNode(),
          `Field '${fieldName}' is required`
        );
      }
      return undefined;
    }

    const trimmed = value.trim().toUpperCase();

    // Basic currency code validation (3 letters)
    const currencyPattern = /^[A-Z]{3}$/;
    if (!currencyPattern.test(trimmed)) {
      throw new NodeOperationError(
        this.context.getNode(),
        `Field '${fieldName}' must be a valid 3-letter currency code (e.g., EUR, USD, CHF)`
      );
    }

    return trimmed;
  }

  /**
   * Validates a number field
   */
  validateNumber(
    value: number | string | undefined,
    fieldName: string,
    options: {
      required?: boolean;
      min?: number;
      max?: number;
      integer?: boolean;
    } = {}
  ): number | undefined {
    if (value === undefined || value === null || value === "") {
      if (options.required) {
        throw new NodeOperationError(
          this.context.getNode(),
          `Field '${fieldName}' is required`
        );
      }
      return undefined;
    }

    const num = typeof value === "string" ? parseFloat(value) : value;

    if (isNaN(num)) {
      throw new NodeOperationError(
        this.context.getNode(),
        `Field '${fieldName}' must be a valid number`
      );
    }

    if (options.integer && !Number.isInteger(num)) {
      throw new NodeOperationError(
        this.context.getNode(),
        `Field '${fieldName}' must be an integer`
      );
    }

    if (options.min !== undefined && num < options.min) {
      throw new NodeOperationError(
        this.context.getNode(),
        `Field '${fieldName}' must be at least ${options.min}`
      );
    }

    if (options.max !== undefined && num > options.max) {
      throw new NodeOperationError(
        this.context.getNode(),
        `Field '${fieldName}' cannot be greater than ${options.max}`
      );
    }

    return num;
  }

  /**
   * Validates an address object
   */
  validateAddress(
    contactId: string | undefined,
    manualAddress: IDataObject | undefined
  ): IDataObject | undefined {
    // If contactId is provided, use it
    if (contactId && contactId.trim()) {
      const trimmedContactId = contactId.trim();

      // Basic UUID validation for contactId
      const uuidPattern =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidPattern.test(trimmedContactId)) {
        throw new NodeOperationError(
          this.context.getNode(),
          `Contact ID must be a valid UUID format`
        );
      }

      return { contactId: trimmedContactId };
    }

    // If manual address is provided, validate it
    if (manualAddress && Object.keys(manualAddress).length > 0) {
      const validatedAddress: IDataObject = {};

      // Name is required for manual address
      const name = this.validateString(
        manualAddress.name as string,
        "address.name",
        { required: true, maxLength: 255 }
      );
      if (name) validatedAddress.name = name;

      // Optional fields
      const supplement = this.validateString(
        manualAddress.supplement as string,
        "address.supplement",
        { maxLength: 255 }
      );
      if (supplement) validatedAddress.supplement = supplement;

      const street = this.validateString(
        manualAddress.street as string,
        "address.street",
        { maxLength: 255 }
      );
      if (street) validatedAddress.street = street;

      const city = this.validateString(
        manualAddress.city as string,
        "address.city",
        { maxLength: 255 }
      );
      if (city) validatedAddress.city = city;

      const zip = this.validateString(
        manualAddress.zip as string,
        "address.zip",
        { maxLength: 20 }
      );
      if (zip) validatedAddress.zip = zip;

      // Country code validation
      const countryCode = this.validateString(
        manualAddress.countryCode as string,
        "address.countryCode",
        { pattern: /^[A-Z]{2}$/ }
      );
      if (countryCode) {
        validatedAddress.countryCode = countryCode.toUpperCase();
      } else {
        validatedAddress.countryCode = "DE"; // Default to Germany
      }

      return validatedAddress;
    }

    // No address provided - this might be okay depending on the context
    return undefined;
  }

  /**
   * Validates line items array
   */
  validateLineItems(
    lineItems: IDataObject[] | undefined
  ): IDataObject[] | undefined {
    if (!lineItems || lineItems.length === 0) {
      return undefined;
    }

    return lineItems.map((item, index) => {
      const validatedItem: IDataObject = {};

      // Type validation
      const type = this.validateString(
        item.type as string,
        `lineItems[${index}].type`,
        { required: true }
      );
      if (type && !["custom", "material", "service", "text"].includes(type)) {
        throw new NodeOperationError(
          this.context.getNode(),
          `Line item type must be one of: 'custom', 'material', 'service', 'text'`
        );
      }
      validatedItem.type = type;

      // Name is required
      const name = this.validateString(
        item.name as string,
        `lineItems[${index}].name`,
        { required: true, maxLength: 255 }
      );
      validatedItem.name = name;

      // Optional description
      const description = this.validateString(
        item.description as string,
        `lineItems[${index}].description`,
        { maxLength: 1000 }
      );
      if (description) validatedItem.description = description;

      // Quantity validation
      const quantity = this.validateNumber(
        item.quantity as number,
        `lineItems[${index}].quantity`,
        { min: 0.01, max: 999999 }
      );
      if (quantity !== undefined) validatedItem.quantity = quantity;

      // Unit name
      const unitName = this.validateString(
        item.unitName as string,
        `lineItems[${index}].unitName`,
        { maxLength: 255 }
      );
      if (unitName) validatedItem.unitName = unitName;

      // Unit price validation
      if (item.unitPrice && typeof item.unitPrice === "object") {
        const unitPrice = item.unitPrice as IDataObject;
        const validatedUnitPrice: IDataObject = {};

        const currency = this.validateCurrency(
          unitPrice.currency as string,
          `lineItems[${index}].unitPrice.currency`
        );
        if (currency) validatedUnitPrice.currency = currency;

        // Check for new price structure with priceType and priceAmount
        if (unitPrice.priceType && unitPrice.priceAmount !== undefined) {
          const priceType = this.validateString(
            unitPrice.priceType as string,
            `lineItems[${index}].unitPrice.priceType`,
            { required: true }
          );

          if (priceType && !["net", "gross"].includes(priceType)) {
            throw new NodeOperationError(
              this.context.getNode(),
              `Price type must be either 'net' or 'gross' for lineItems[${index}].unitPrice.priceType`
            );
          }

          const priceAmount = this.validateNumber(
            unitPrice.priceAmount as number,
            `lineItems[${index}].unitPrice.priceAmount`,
            { min: 0, required: true }
          );

          const taxRatePercentage = this.validateNumber(
            unitPrice.taxRatePercentage as number,
            `lineItems[${index}].unitPrice.taxRatePercentage`,
            { min: 0, max: 100, required: true }
          );

          if (
            priceType &&
            priceAmount !== undefined &&
            taxRatePercentage !== undefined
          ) {
            // Calculate net and gross amounts automatically
            let netAmount: number;
            let grossAmount: number;

            if (priceType === "net") {
              netAmount = priceAmount;
              // For net price, only include netAmount in API request
              validatedUnitPrice.netAmount = Math.round(netAmount * 100) / 100;
            } else {
              grossAmount = priceAmount;
              // For gross price, only include grossAmount in API request
              validatedUnitPrice.grossAmount =
                Math.round(grossAmount * 100) / 100;
            }

            validatedUnitPrice.taxRatePercentage = taxRatePercentage;
          }
        } else {
          // Fallback to old validation for backward compatibility
          const netAmount = this.validateNumber(
            unitPrice.netAmount as number,
            `lineItems[${index}].unitPrice.netAmount`,
            { min: 0 }
          );
          if (netAmount !== undefined) validatedUnitPrice.netAmount = netAmount;

          const grossAmount = this.validateNumber(
            unitPrice.grossAmount as number,
            `lineItems[${index}].unitPrice.grossAmount`,
            { min: 0 }
          );
          if (grossAmount !== undefined)
            validatedUnitPrice.grossAmount = grossAmount;

          const taxRatePercentage = this.validateNumber(
            unitPrice.taxRatePercentage as number,
            `lineItems[${index}].unitPrice.taxRatePercentage`,
            { min: 0, max: 100 }
          );
          if (taxRatePercentage !== undefined)
            validatedUnitPrice.taxRatePercentage = taxRatePercentage;
        }

        if (Object.keys(validatedUnitPrice).length > 0) {
          validatedItem.unitPrice = validatedUnitPrice;
        }
      }

      // Discount percentage
      const discountPercentage = this.validateNumber(
        item.discountPercentage as number,
        `lineItems[${index}].discountPercentage`,
        { min: 0, max: 100 }
      );
      if (discountPercentage !== undefined)
        validatedItem.discountPercentage = discountPercentage;


      return validatedItem;
    });
  }

  /**
   * Validates total price object
   */
  validateTotalPrice(
    totalPrice: IDataObject | undefined
  ): IDataObject | undefined {
    if (!totalPrice || Object.keys(totalPrice).length === 0) {
      return undefined;
    }

    const validatedTotalPrice: IDataObject = {};

    // Currency is required for total price
    const currency = this.validateCurrency(
      totalPrice.currency as string,
      "totalPrice.currency",
      { required: true }
    );
    validatedTotalPrice.currency = currency;

    const totalDiscountAbsolute = this.validateNumber(
      totalPrice.totalDiscountAbsolute as number,
      "totalPrice.totalDiscountAbsolute",
      { min: 0 }
    );

    const totalDiscountPercentage = this.validateNumber(
      totalPrice.totalDiscountPercentage as number,
      "totalPrice.totalDiscountPercentage",
      { min: 0, max: 100 }
    );

    // Lexware API: "The total discount has to be either absolute or percentage but not both set at the same time!"
    // We prioritize percentage if it's non-zero. If both are zero, we skip both.
    if (totalDiscountPercentage !== undefined && totalDiscountPercentage > 0) {
      validatedTotalPrice.totalDiscountPercentage = totalDiscountPercentage;
    } else if (totalDiscountAbsolute !== undefined && totalDiscountAbsolute > 0) {
      validatedTotalPrice.totalDiscountAbsolute = totalDiscountAbsolute;
    }

    return validatedTotalPrice;
  }

  /**
   * Validates tax conditions object
   */
  validateTaxConditions(
    taxConditions: IDataObject | undefined
  ): IDataObject | undefined {
    if (!taxConditions || Object.keys(taxConditions).length === 0) {
      return undefined;
    }

    const validatedTaxConditions: IDataObject = {};

    const taxType = this.validateString(
      taxConditions.taxType as string,
      "taxConditions.taxType"
    );
    if (taxType && !["net", "gross"].includes(taxType)) {
      throw new NodeOperationError(
        this.context.getNode(),
        `Tax type must be either 'net' or 'gross'`
      );
    }
    if (taxType) validatedTaxConditions.taxType = taxType;

    const taxTypeNote = this.validateString(
      taxConditions.taxTypeNote as string,
      "taxConditions.taxTypeNote",
      { maxLength: 255 }
    );
    if (taxTypeNote) validatedTaxConditions.taxTypeNote = taxTypeNote;

    return Object.keys(validatedTaxConditions).length > 0
      ? validatedTaxConditions
      : undefined;
  }

  /**
   * Validates payment conditions
   */
  validatePaymentConditions(
    paymentConditions: IDataObject
  ): IDataObject | undefined {
    if (!paymentConditions || Object.keys(paymentConditions).length === 0) {
      return undefined;
    }

    const result: IDataObject = {};

    if (paymentConditions.paymentTermLabel) {
      result.paymentTermLabel = this.validateString(
        paymentConditions.paymentTermLabel as string,
        "paymentTermLabel",
        { maxLength: 255 }
      );
    }

    if (paymentConditions.paymentTermDuration !== undefined) {
      result.paymentTermDuration = this.validateNumber(
        paymentConditions.paymentTermDuration as number,
        "paymentTermDuration",
        { min: 0, integer: true }
      );
    }

    // Handle payment discount conditions
    const discountConditions =
      paymentConditions.paymentDiscountConditions as IDataObject;
    if (discountConditions?.value) {
      const discountValue = discountConditions.value as IDataObject;
      const discount: IDataObject = {};

      if (discountValue.discountPercentage !== undefined) {
        discount.discountPercentage = this.validateNumber(
          discountValue.discountPercentage as number,
          "discountPercentage",
          { min: 0, max: 100 }
        );
      }

      if (discountValue.discountRange !== undefined) {
        discount.discountRange = this.validateNumber(
          discountValue.discountRange as number,
          "discountRange",
          { min: 0, integer: true }
        );
      }

      if (Object.keys(discount).length > 0) {
        result.paymentDiscountConditions = discount;
      }
    }

    return Object.keys(result).length > 0 ? result : undefined;
  }

  /**
   * Creates a clean body object with only defined values
   */
  createCleanBody(body: IDataObject): IDataObject {
    const cleanBody: IDataObject = {};

    Object.entries(body).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        // For objects, check if they have any properties
        if (typeof value === "object" && !Array.isArray(value)) {
          if (Object.keys(value).length > 0) {
            cleanBody[key] = value;
          }
        } else if (Array.isArray(value)) {
          if (value.length > 0) {
            cleanBody[key] = value;
          }
        } else if (typeof value === "string") {
          if (value.trim() !== "") {
            cleanBody[key] = value.trim();
          }
        } else {
          cleanBody[key] = value;
        }
      }
    });

    return cleanBody;
  }
}
