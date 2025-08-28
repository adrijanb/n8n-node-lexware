import { IExecuteFunctions } from "n8n-core";
import {
  IDataObject,
  INodeExecutionData,
  NodeOperationError,
} from "n8n-workflow";
import { lexwareApiRequest } from "../GenericFunctions";

function buildArticleBody(
  getParam: (name: string, index?: number, defaultValue?: unknown) => unknown,
  i: number
): IDataObject {
  const title = (getParam("title", i, "") as string) || "";
  const description = (getParam("description", i, "") as string) || "";
  const type = (getParam("type", i, "PRODUCT") as string) || "PRODUCT";
  const articleNumber = (getParam("articleNumber", i, "") as string) || "";
  const gtin = (getParam("gtin", i, "") as string) || "";
  const note = (getParam("note", i, "") as string) || "";
  const unitName = (getParam("unitName", i, "") as string) || "";
  const netPrice = (getParam("netPrice", i, 0) as number) || 0;
  const grossPrice = (getParam("grossPrice", i, 0) as number) || 0;
  const leadingPrice = (getParam("leadingPrice", i, "NET") as string) || "NET";
  const taxRate = (getParam("taxRate", i, 19) as number) || 19;

  const body: IDataObject = {
    title,
    description,
    type,
    articleNumber,
    gtin,
    note,
    unitName,
    price: {
      netPrice,
      grossPrice,
      leadingPrice,
      taxRate,
    },
  };
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
      const getParam = (name: string, index?: number, def?: unknown) =>
        (
          this.getNodeParameter as unknown as (
            name: string,
            index?: number,
            defaultValue?: unknown
          ) => unknown
        )(name, index, def);
      const article = buildArticleBody(getParam, i);
      responseData = await lexwareApiRequest.call(
        this,
        "POST",
        "/v1/articles",
        article
      );
      break;
    }
    case "get": {
      const articleId = this.getNodeParameter("articleId", i) as string;
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
      const articleId = this.getNodeParameter("articleId", i) as string;
      const getParam = (name: string, index?: number, def?: unknown) =>
        (
          this.getNodeParameter as unknown as (
            name: string,
            index?: number,
            defaultValue?: unknown
          ) => unknown
        )(name, index, def);
      const article = buildArticleBody(getParam, i);
      responseData = await lexwareApiRequest.call(
        this,
        "PUT",
        `/v1/article/${articleId}`,
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
