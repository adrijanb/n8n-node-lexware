import { IExecuteFunctions } from "n8n-core";
import {
  IDataObject,
  NodeApiError,
  IHttpRequestOptions,
  IHttpRequestMethods,
  JsonObject,
} from "n8n-workflow";

export async function lexwareApiRequest(
  this: IExecuteFunctions,
  method: string,
  endpoint: string,
  body: IDataObject = {},
  qs: IDataObject = {},
  optionOverrides: Partial<IHttpRequestOptions> = {}
) {
  const credentials = await this.getCredentials("lexwareApi");

  const baseOptions: Partial<IHttpRequestOptions> = {
    method: method as IHttpRequestMethods,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${credentials.accessToken}`,
    },
    json: true,
    qs,
    body,
  };

  if (method === "GET" || Object.keys(body).length === 0) {
    delete (baseOptions as IHttpRequestOptions).body;
  }

  const url =
    (optionOverrides.url as string | undefined) ??
    `${credentials.baseUrl}${endpoint}`;
  const options: IHttpRequestOptions = {
    url,
    method: baseOptions.method,
    headers: baseOptions.headers as JsonObject,
    json: true,
    qs: (baseOptions.qs ?? {}) as JsonObject,
    body: baseOptions.body as JsonObject,
    ...optionOverrides,
  } as IHttpRequestOptions;

  try {
    return await this.helpers.httpRequest(options);
  } catch (error) {
    // Versuche, die Fehlermeldung der Lexware-API aussagekräftig zu extrahieren
    const err = error as unknown as {
      response?: { body?: any; data?: any; statusCode?: number };
      message?: string;
    };
    const body = (err?.response?.body ?? err?.response?.data) as any;
    const apiMsg =
      typeof body === "string"
        ? body
        : body?.message || body?.error || body?.detail || body?.errors;
    const merged: JsonObject = {
      message: (apiMsg
        ? `Lexware API error: ${JSON.stringify(apiMsg)}`
        : err?.message || "Request failed") as string,
      responseBody: body as JsonObject,
      statusCode: err?.response?.statusCode as
        | number
        | undefined as unknown as JsonObject,
    } as JsonObject;
    throw new NodeApiError(this.getNode(), merged);
  }
}

export async function lexwareApiRequestAllItems(
  this: IExecuteFunctions,
  method: string,
  endpoint: string,
  body: IDataObject = {},
  qs: IDataObject = {},
  optionOverrides: Partial<IHttpRequestOptions> = {}
) {
  const returnData: IDataObject[] = [];
  let page = 0;

  while (true) {
    const responseData = await lexwareApiRequest.call(
      this,
      method,
      endpoint,
      body,
      { page, ...qs },
      optionOverrides
    );
    const items = (responseData?.data ??
      responseData?.items ??
      responseData) as IDataObject[];
    if (!Array.isArray(items) || items.length === 0) break;
    returnData.push(...items);
    page += 1;
  }

  return returnData;
}

// Upload (multipart/form-data)
export async function lexwareApiUpload(
  this: IExecuteFunctions,
  endpoint: string,
  formData: IDataObject,
  optionOverrides: Partial<IHttpRequestOptions> = {}
) {
  const credentials = await this.getCredentials("lexwareApi");
  const options: IHttpRequestOptions = {
    method: "POST" as IHttpRequestMethods,
    url: `${credentials.baseUrl}${endpoint}`,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${credentials.accessToken}`,
    } as JsonObject,
    json: true,
    formData: formData as JsonObject,
    ...optionOverrides,
  } as IHttpRequestOptions;

  return this.helpers.httpRequest(options);
}

// Download binary file, returns full response to access headers
export async function lexwareApiDownload(
  this: IExecuteFunctions,
  endpoint: string,
  optionOverrides: Partial<IHttpRequestOptions> = {}
) {
  const credentials = await this.getCredentials("lexwareApi");
  const options: IHttpRequestOptions = {
    method: "GET" as IHttpRequestMethods,
    url: `${credentials.baseUrl}${endpoint}`,
    headers: {
      Authorization: `Bearer ${credentials.accessToken}`,
    } as JsonObject,
    json: false,
    encoding: null as unknown as JsonObject,
    returnFullResponse: true,
    ...optionOverrides,
  } as IHttpRequestOptions;

  return this.helpers.httpRequest(options);
}

// Paginierte Abfrage nach Lexware-Schema (content/last/size/number)
export async function lexwareApiRequestPagedAll(
  this: IExecuteFunctions,
  endpoint: string,
  qs: IDataObject = {},
  optionOverrides: Partial<IHttpRequestOptions> = {}
) {
  const allItems: IDataObject[] = [];
  let page = (qs.page as number) ?? 0;
  const size = (qs.size as number) ?? 25;

  while (true) {
    const response = await lexwareApiRequest.call(
      this,
      "GET",
      endpoint,
      {},
      { ...qs, page, size },
      optionOverrides
    );
    const content = (response?.content ?? []) as IDataObject[];
    if (Array.isArray(content) && content.length > 0) {
      allItems.push(...content);
    }
    const last = Boolean(response?.last);
    if (last || !Array.isArray(content) || content.length === 0) break;
    page += 1;
  }

  return allItems;
}
