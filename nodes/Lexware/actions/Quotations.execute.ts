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
      // Initialize validator
      const validator = new LexwareValidator(this);

      // Get raw parameters
      const titleRaw = this.getNodeParameter("title", i, "") as string;
      const introductionRaw = this.getNodeParameter("introduction", i, "") as string;
      const remarkRaw = this.getNodeParameter("remark", i, "") as string;
      const voucherDateRaw = this.getNodeParameter("voucherDate", i, "") as string;
      const expiryDateRaw = this.getNodeParameter("expiryDate", i, "") as string;
      const contactIdRaw = this.getNodeParameter("contactId", i, "") as string;
      const manualAddressRaw = 
        (this.getNodeParameter("manualAddress.address", i, {}) as IDataObject) || {};
      const lineItemsRaw =
        (this.getNodeParameter("lineItems.item", i, []) as IDataObject[]) || [];
      const totalPriceRaw =
        (this.getNodeParameter("totalPrice.value", i, {}) as IDataObject) || {};
      const taxConditionsRaw =
        (this.getNodeParameter("taxConditions.value", i, {}) as IDataObject) || {};

      // Validate all fields
      const title = validator.validateString(titleRaw, "title", { maxLength: 255 });
      const introduction = validator.validateString(introductionRaw, "introduction", { maxLength: 1000 });
      const remark = validator.validateString(remarkRaw, "remark", { maxLength: 1000 });
      const voucherDate = validator.validateDate(voucherDateRaw, "voucherDate");
      const expiryDate = validator.validateDate(expiryDateRaw, "expiryDate");
      const address = validator.validateAddress(contactIdRaw, manualAddressRaw);
      const lineItems = validator.validateLineItems(lineItemsRaw);
      const totalPrice = validator.validateTotalPrice(totalPriceRaw);
      const taxConditions = validator.validateTaxConditions(taxConditionsRaw);

      // Build and clean request body
      const body = validator.createCleanBody({
        title,
        introduction,
        remark,
        voucherDate,
        expiryDate,
        address,
        lineItems: lineItems || parseLineItemsFromCollection(lineItemsRaw),
        totalPrice,
        taxConditions,
      });

      responseData = await lexwareApiRequest.call(
        this,
        "POST",
        "/v1/quotations",
        body
      );
      break;
    }
    case "createByJson": {
      // Initialize validator
      const validator = new LexwareValidator(this);

      // Get raw parameters
      const titleRaw = this.getNodeParameter("title", i, "") as string;
      const introductionRaw = this.getNodeParameter("introduction", i, "") as string;
      const remarkRaw = this.getNodeParameter("remark", i, "") as string;
      const voucherDateRaw = this.getNodeParameter("voucherDate", i, "") as string;
      const expiryDateRaw = this.getNodeParameter("expiryDate", i, "") as string;
      const contactIdRaw = this.getNodeParameter("contactId", i, "") as string;
      const manualAddressRaw =
        (this.getNodeParameter("manualAddress.address", i, {}) as IDataObject) || {};
      const lineItemsJson = this.getNodeParameter(
        "lineItemsJson",
        i,
        "[]"
      ) as string | IDataObject[];
      const totalPriceRaw =
        (this.getNodeParameter("totalPrice.value", i, {}) as IDataObject) || {};
      const taxConditionsRaw =
        (this.getNodeParameter("taxConditions.value", i, {}) as IDataObject) || {};

      // Validate all fields
      const title = validator.validateString(titleRaw, "title", { maxLength: 255 });
      const introduction = validator.validateString(introductionRaw, "introduction", { maxLength: 1000 });
      const remark = validator.validateString(remarkRaw, "remark", { maxLength: 1000 });
      const voucherDate = validator.validateDate(voucherDateRaw, "voucherDate");
      const expiryDate = validator.validateDate(expiryDateRaw, "expiryDate");
      const address = validator.validateAddress(contactIdRaw, manualAddressRaw);
      
      // Parse line items from JSON first, then validate
      const parsedLineItems = parseLineItemsFromJson(lineItemsJson);
      const lineItems = validator.validateLineItems(parsedLineItems);
      
      const totalPrice = validator.validateTotalPrice(totalPriceRaw);
      const taxConditions = validator.validateTaxConditions(taxConditionsRaw);

      // Build and clean request body
      const body = validator.createCleanBody({
        title,
        introduction,
        remark,
        voucherDate,
        expiryDate,
        address,
        lineItems,
        totalPrice,
        taxConditions,
      });

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
      
      // Validate quotation ID
      const validator = new LexwareValidator(this);
      const validatedId = validator.validateString(id, "quotationId", { 
        required: true,
        pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      });
      
      responseData = await lexwareApiRequest.call(
        this,
        "GET",
        `/v1/quotations/${validatedId}`
      );
      break;
    }
    case "getAll": {
      const pageRaw = this.getNodeParameter("page", i, 0) as number;
      
      // Validate page number
      const validator = new LexwareValidator(this);
      const page = validator.validateNumber(pageRaw, "page", { 
        min: 0, 
        integer: true 
      }) || 0;
      
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
      // Initialize validator
      const validator = new LexwareValidator(this);

      // Get and validate quotation ID
      const idRaw = this.getNodeParameter("quotationId", i) as string;
      const id = validator.validateString(idRaw, "quotationId", { 
        required: true,
        pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      });

      // Get raw parameters
      const titleRaw = this.getNodeParameter("title", i, "") as string;
      const introductionRaw = this.getNodeParameter("introduction", i, "") as string;
      const remarkRaw = this.getNodeParameter("remark", i, "") as string;
      const voucherDateRaw = this.getNodeParameter("voucherDate", i, "") as string;
      const expiryDateRaw = this.getNodeParameter("expiryDate", i, "") as string;
      const contactIdRaw = this.getNodeParameter("contactId", i, "") as string;
      const manualAddressRaw =
        (this.getNodeParameter("manualAddress.address", i, {}) as IDataObject) || {};
      const lineItemsRaw =
        (this.getNodeParameter("lineItems.item", i, []) as IDataObject[]) || [];
      const totalPriceRaw =
        (this.getNodeParameter("totalPrice.value", i, {}) as IDataObject) || {};
      const taxConditionsRaw =
        (this.getNodeParameter("taxConditions.value", i, {}) as IDataObject) || {};

      // Validate all fields
      const title = validator.validateString(titleRaw, "title", { maxLength: 255 });
      const introduction = validator.validateString(introductionRaw, "introduction", { maxLength: 1000 });
      const remark = validator.validateString(remarkRaw, "remark", { maxLength: 1000 });
      const voucherDate = validator.validateDate(voucherDateRaw, "voucherDate");
      const expiryDate = validator.validateDate(expiryDateRaw, "expiryDate");
      const address = validator.validateAddress(contactIdRaw, manualAddressRaw);
      const lineItems = validator.validateLineItems(lineItemsRaw);
      const totalPrice = validator.validateTotalPrice(totalPriceRaw);
      const taxConditions = validator.validateTaxConditions(taxConditionsRaw);

      // Build and clean request body
      const body = validator.createCleanBody({
        title,
        introduction,
        remark,
        voucherDate,
        expiryDate,
        address,
        lineItems: lineItems || parseLineItemsFromCollection(lineItemsRaw),
        totalPrice,
        taxConditions,
      });

      responseData = await lexwareApiRequest.call(
        this,
        "PUT",
        `/v1/quotations/${id}`,
        body
      );
      break;
    }
    case "delete": {
      const idRaw = this.getNodeParameter("quotationId", i) as string;
      
      // Validate quotation ID
      const validator = new LexwareValidator(this);
      const id = validator.validateString(idRaw, "quotationId", { 
        required: true,
        pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      });
      
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
