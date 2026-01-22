import { IExecuteFunctions } from "n8n-core";
import {
  IDataObject,
  IHttpRequestOptions,
  IHttpRequestMethods,
  JsonObject,
} from "n8n-workflow";
import { LexwareErrorHandler } from "./utils/errorHandler";

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function httpRequestWithBackoff(
  this: IExecuteFunctions,
  options: IHttpRequestOptions,
  maxRetries = 5,
  baseDelayMs = 500,
  maxDelayMs = 10000
) {
  let attempt = 0;
  while (true) {
    try {
      return await this.helpers.httpRequest(options);
    } catch (error) {
      const err = error as unknown as {
        response?: {
          statusCode?: number;
          headers?: Record<string, any>;
          body?: any;
          data?: any;
        };
      };
      const status = err?.response?.statusCode;
      if (status === 429 && attempt < maxRetries) {
        // Honor Retry-After header if present
        const retryAfterHeader = err?.response?.headers?.["retry-after"];
        let delay = Number(retryAfterHeader) * 1000;
        if (!delay || Number.isNaN(delay)) {
          const exp = Math.min(baseDelayMs * 2 ** attempt, maxDelayMs);
          // jitter ±20%
          delay = Math.floor(exp * (1 + Math.random() * 0.2));
        }
        await sleep(delay);
        attempt += 1;
        continue;
      }
      throw error;
    }
  }
}

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

  // Extract resource type and operation for better error handling
  const resourceType = endpoint.split("/")[2] || "unknown";
  const operation = method.toLowerCase();

  try {
    return await httpRequestWithBackoff.call(this, options);
  } catch (error: any) {
    // Enhanced error handling with complete API response
    const response = error.response ?? {};
    const errorData =
      response.data ??
      response.body ??
      error.data ??
      error.body ??
      {};
    const statusCode =
      response.status ??
      response.statusCode ??
      error.status ??
      error.statusCode ??
      500;

    // Create comprehensive error message with API response
    let errorMessage = `Lexware API Error (${statusCode}) for ${operation} operation on ${resourceType}`;

    if (errorData.message) {
      errorMessage += `\n\nAPI Message: ${errorData.message}`;
    }

    // Always include the complete API response for debugging
    errorMessage += `\n\n📋 Complete Lexware API Response:\n${JSON.stringify(
      errorData,
      null,
      2
    )}`;

    // Include request details for better debugging
    errorMessage += `\n\n🔍 Request Details:`;
    errorMessage += `\nURL: ${options.url}`;
    errorMessage += `\nMethod: ${options.method}`;
    if (options.body && Object.keys(options.body).length > 0) {
      errorMessage += `\nRequest Body: ${JSON.stringify(
        options.body,
        null,
        2
      )}`;
    }
    if (options.qs && Object.keys(options.qs).length > 0) {
      errorMessage += `\nQuery Parameters: ${JSON.stringify(
        options.qs,
        null,
        2
      )}`;
    }

    const errorHandler = new LexwareErrorHandler(this);
    return errorHandler.handleApiError(
      {
        ...error,
        message: errorMessage,
        response: {
          ...error.response,
          data: errorData,
        },
      },
      operation,
      resourceType
    );
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

  return httpRequestWithBackoff.call(this, options);
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

  return httpRequestWithBackoff.call(this, options);
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
