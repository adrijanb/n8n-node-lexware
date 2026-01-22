import { IExecuteFunctions } from "n8n-core";
import {
  IDataObject,
  INodeExecutionData,
  NodeOperationError,
} from "n8n-workflow";
import { lexwareApiRequest } from "../GenericFunctions";
import { LexwareValidator } from "../utils/validation";

function buildArticleBody(
  getParam: (name: string, index?: number, defaultValue?: unknown) => unknown,
  i: number,
  validator: LexwareValidator
): IDataObject {
  // Get raw values
  const titleRaw = getParam("title", i, "") as string;
  const descriptionRaw = getParam("description", i, "") as string;
  const typeRaw = getParam("type", i, "PRODUCT") as string;
  const articleNumberRaw = getParam("articleNumber", i, "") as string;
  const gtinRaw = getParam("gtin", i, "") as string;
  const noteRaw = getParam("note", i, "") as string;
  const unitNameRaw = getParam("unitName", i, "") as string;
  const netPriceRaw = getParam("netPrice", i, 0) as number;
  const grossPriceRaw = getParam("grossPrice", i, 0) as number;
  const leadingPriceRaw = getParam("leadingPrice", i, "NET") as string;
  const taxRateRaw = getParam("taxRate", i, 19) as number;

  // Validate all fields
  const title = validator.validateString(titleRaw, "title", { maxLength: 255 });
  const description = validator.validateString(descriptionRaw, "description", { maxLength: 1000 });
  const type = validator.validateString(typeRaw, "type", { required: true });
  const articleNumber = validator.validateString(articleNumberRaw, "articleNumber", { maxLength: 50 });
  const gtin = validator.validateString(gtinRaw, "gtin", { maxLength: 50 });
  const note = validator.validateString(noteRaw, "note", { maxLength: 1000 });
  const unitName = validator.validateString(unitNameRaw, "unitName", { maxLength: 50 });
  const netPrice = validator.validateNumber(netPriceRaw, "netPrice", { min: 0 });
  const grossPrice = validator.validateNumber(grossPriceRaw, "grossPrice", { min: 0 });
  const leadingPrice = validator.validateString(leadingPriceRaw, "leadingPrice", { required: true });
  const taxRate = validator.validateNumber(taxRateRaw, "taxRate", { min: 0, max: 100 });

  // Validate type enum
  if (type && !["PRODUCT", "SERVICE"].includes(type)) {
    throw new NodeOperationError(
      (validator as any).context.getNode(),
      `Article type must be either 'PRODUCT' or 'SERVICE'`
    );
  }

  // Validate leading price enum
  if (leadingPrice && !["NET", "GROSS"].includes(leadingPrice)) {
    throw new NodeOperationError(
      (validator as any).context.getNode(),
      `Leading price must be either 'NET' or 'GROSS'`
    );
  }

  // Build and clean the body using validator
  const body = validator.createCleanBody({
    title,
    description,
    type,
    articleNumber,
    gtin,
    note,
    unitName,
    price: validator.createCleanBody({
      netPrice,
      grossPrice,
      leadingPrice,
      taxRate,
    }),
  });
  
  return body;
}

export async function executeArticles(
  this: IExecuteFunctions,
  i: number,
  operation: string
): Promise<INodeExecutionData[]> {
  let responseData: any;

  switch (operation) {
    case "create": {
      const validator = new LexwareValidator(this);
      const getParam = (name: string, index?: number, def?: unknown) =>
        (
          this.getNodeParameter as unknown as (
            name: string,
            index?: number,
            defaultValue?: unknown
          ) => unknown
        )(name, index, def);
      const article = buildArticleBody(getParam, i, validator);
      (article as IDataObject).version = 0;
      responseData = await lexwareApiRequest.call(
        this,
        "POST",
        "/v1/articles",
        article
      );
      break;
    }
    case "get": {
      const validator = new LexwareValidator(this);
      const articleIdRaw = this.getNodeParameter("articleId", i) as string;
      const articleId = validator.validateString(articleIdRaw, "articleId", { 
        required: true,
        pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      });
      responseData = await lexwareApiRequest.call(
        this,
        "GET",
        `/v1/articles/${articleId}`
      );
      break;
    }
    case "getAll": {
      const page = this.getNodeParameter("page", i, 0) as number;
      const type = this.getNodeParameter("type", i, "") as string;
      const qs: IDataObject = {};
      if (page !== undefined) qs.page = page;
      if (type) qs.type = type;
      responseData = await lexwareApiRequest.call(
        this,
        "GET",
        "/v1/articles",
        {},
        qs
      );
      break;
    }
    case "update": {
      const validator = new LexwareValidator(this);
      const articleIdRaw = this.getNodeParameter("articleId", i) as string;
      const articleId = validator.validateString(articleIdRaw, "articleId", { 
        required: true,
        pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      });
      const version = this.getNodeParameter("version", i) as number;
      const getParam = (name: string, index?: number, def?: unknown) =>
        (
          this.getNodeParameter as unknown as (
            name: string,
            index?: number,
            defaultValue?: unknown
          ) => unknown
        )(name, index, def);
      const article = buildArticleBody(getParam, i, validator);
      if (version !== undefined && version !== null) {
        (article as IDataObject).version = version;
      }
      responseData = await lexwareApiRequest.call(
        this,
        "PUT",
        `/v1/articles/${articleId}`,
        article
      );
      break;
    }
    case "delete": {
      const articleId = this.getNodeParameter("articleId", i) as string;
      responseData = await lexwareApiRequest.call(
        this,
        "DELETE",
        `/v1/articles/${articleId}`
      );
      break;
    }
    default:
      throw new NodeOperationError(
        this.getNode(),
        `Unsupported operation: ${operation}`
      );
  }

  const returnItems = Array.isArray(responseData)
    ? responseData
    : [responseData];

  return returnItems.map((data) => ({ json: data }));
}
