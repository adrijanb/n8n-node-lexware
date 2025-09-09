import { IExecuteFunctions } from "n8n-core";
import {
  IDataObject,
  INodeExecutionData,
  NodeOperationError,
} from "n8n-workflow";
import {
  lexwareApiRequest,
  lexwareApiRequestPagedAll,
} from "../GenericFunctions";

function normalizeVatId(vatId: string): string {
  return (vatId || "").toUpperCase().replace(/[\s\-\._/]/g, "");
}

function isValidEuOrChVatId(vatId: string): boolean {
  const patterns: Record<string, RegExp> = {
    AT: /^ATU\d{8}$/,
    BE: /^BE0?\d{9}$/,
    BG: /^BG\d{9,10}$/,
    CY: /^CY\d{8}L$/,
    CZ: /^CZ\d{8,10}$/,
    DE: /^DE\d{9}$/,
    DK: /^DK\d{8}$/,
    EE: /^EE\d{9}$/,
    EL: /^EL\d{9}$/,
    ES: /^ES[0-9A-Z]\d{7}[0-9A-Z]$/,
    FI: /^FI\d{8}$/,
    FR: /^FR[0-9A-Z]{2}\d{9}$/,
    HR: /^HR\d{11}$/,
    HU: /^HU\d{8}$/,
    IE: /^IE\d{7}[A-W][A-I]?$/,
    IT: /^IT\d{11}$/,
    LT: /^LT(\d{9}|\d{12})$/,
    LU: /^LU\d{8}$/,
    LV: /^LV\d{11}$/,
    MT: /^MT\d{8}$/,
    NL: /^NL\d{9}B\d{2}$/,
    PL: /^PL\d{10}$/,
    PT: /^PT\d{9}$/,
    RO: /^RO\d{2,10}$/,
    SE: /^SE\d{12}$/,
    SI: /^SI\d{8}$/,
    SK: /^SK\d{10}$/,
    CH: /^CHE\d{9}(MWST|TVA|IVA)?$/,
  };
  const code = vatId.substring(0, 2);
  if (!Object.prototype.hasOwnProperty.call(patterns, code)) return false;
  return patterns[code].test(vatId);
}

function buildCompanyContactBody(
  ctx: IExecuteFunctions,
  getParam: (name: string, index?: number, defaultValue?: unknown) => unknown,
  i: number
): IDataObject {
  const companyName = (getParam("companyName", i, "") as string) || "";
  const taxNumber = (getParam("taxNumber", i, "") as string) || "";
  const vatRegistrationIdRaw =
    (getParam("vatRegistrationId", i, "") as string) || "";
  const allowTaxFreeInvoices = !!getParam("allowTaxFreeInvoices", i, false);
  const createAsCustomer = !!getParam("createAsCustomer", i, true);
  const createAsVendor = !!getParam("createAsVendor", i, false);
  // customer/vendor numbers werden automatisch vergeben -> keine Eingabe

  const contactPersons = (
    getParam("contactPersons.person", i, []) as IDataObject[]
  ).map((p) => ({
    salutation: p.salutation,
    firstName: p.firstName,
    lastName: p.lastName,
    primary: !!p.primary,
    emailAddress: p.emailAddress,
    phoneNumber: p.phoneNumber,
  }));

  const mapAddresses = (arr: IDataObject[] | IDataObject | undefined) => {
    // Ensure we have an array to work with
    const safeArr = Array.isArray(arr) ? arr : (arr ? [arr] : []);
    return safeArr.map((a) => ({
      supplement: a.supplement,
      street: a.street,
      zip: a.zip,
      city: a.city,
      countryCode: a.countryCode || "DE",
    }));
  };

  const billing = mapAddresses(
    (getParam("billingAddress.address", i, []) as IDataObject[]) || []
  );
  const shipping = mapAddresses(
    (getParam("shippingAddress.address", i, []) as IDataObject[]) || []
  );

  const xRechnung = (getParam("xRechnung", i, {}) as IDataObject) || {};
  const emailAddresses =
    (getParam("emailAddresses", i, {}) as IDataObject) || {};
  const phoneNumbers = (getParam("phoneNumbers", i, {}) as IDataObject) || {};
  const note = (getParam("note", i, "") as string) || "";
  const archived = !!getParam("archived", i, false);

  const body: IDataObject = {
    roles: {},
    company: {
      name: companyName,
      allowTaxFreeInvoices,
      contactPersons,
    },
    addresses: {
      billing,
      shipping,
    },
    note: note || undefined,
    archived,
  };

  // Optionale Felder nur setzen, wenn befüllt
  if (typeof taxNumber === "string" && taxNumber.trim().length > 0) {
    (body.company as IDataObject).taxNumber = taxNumber;
  }
  const vatNormalized = normalizeVatId(vatRegistrationIdRaw);
  if (vatNormalized.length > 0) {
    if (!isValidEuOrChVatId(vatNormalized)) {
      throw new NodeOperationError(
        ctx.getNode(),
        "Ungültige VAT Registration ID. Erlaubt sind nur EU/CH-Nummern (z. B. DE123456789, NL123456789B01, CHE123456789MWST)."
      );
    }
    (body.company as IDataObject).vatRegistrationId = vatNormalized;
  }

  // Keine expliziten role-Nummern setzen (werden von Lexware vergeben)
  if (createAsCustomer) (body.roles as IDataObject).customer = {};
  if (createAsVendor) (body.roles as IDataObject).vendor = {};
  if (!createAsCustomer && !createAsVendor) {
    throw new NodeOperationError(
      ctx.getNode(),
      "Es muss mindestens eine Rolle gesetzt sein (Customer oder Vendor)."
    );
  }

  // XRechnung nur befüllen, wenn Felder vorhanden
  const xrBuyer = (xRechnung as IDataObject).buyerReference as
    | string
    | undefined;
  const xrVendorAtCust = (xRechnung as IDataObject).vendorNumberAtCustomer as
    | string
    | undefined;
  const xr: IDataObject = {};
  if (typeof xrBuyer === "string" && xrBuyer.trim())
    xr.buyerReference = xrBuyer;
  if (typeof xrVendorAtCust === "string" && xrVendorAtCust.trim())
    xr.vendorNumberAtCustomer = xrVendorAtCust;
  if (Object.keys(xr).length > 0) body.xRechnung = xr;

  // E-Mail-Adressen in Arrays wandeln
  const normalizeStringCollection = (col?: IDataObject) => {
    const out: IDataObject = {};
    if (!col) return out;
    const keys = ["business", "office", "private", "other"] as const;
    for (const key of keys) {
      const rawValue = col[key];
      // Ensure we have an array to work with
      const arr = Array.isArray(rawValue) ? rawValue : (rawValue ? [rawValue] : []);
      const values = arr
        .map((e) => (typeof e === 'object' && e ? (e.email as string) : String(e)) || "")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      if (values.length > 0) (out as any)[key] = values;
    }
    return out;
  };
  const emails = normalizeStringCollection(emailAddresses as IDataObject);
  if (Object.keys(emails).length > 0) body.emailAddresses = emails;

  // Telefonnummern in Arrays wandeln
  const normalizePhoneCollection = (col?: IDataObject) => {
    const out: IDataObject = {};
    if (!col) return out;
    const keys = [
      "business",
      "office",
      "mobile",
      "private",
      "fax",
      "other",
    ] as const;
    for (const key of keys) {
      const rawValue = col[key];
      // Ensure we have an array to work with
      const arr = Array.isArray(rawValue) ? rawValue : (rawValue ? [rawValue] : []);
      const values = arr
        .map((e) => (typeof e === 'object' && e ? (e.number as string) : String(e)) || "")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      if (values.length > 0) (out as any)[key] = values;
    }
    return out;
  };
  const phones = normalizePhoneCollection(phoneNumbers as IDataObject);
  if (Object.keys(phones).length > 0) body.phoneNumbers = phones;

  return body;
}

function buildPersonContactBody(
  ctx: IExecuteFunctions,
  getParam: (name: string, index?: number, defaultValue?: unknown) => unknown,
  i: number
): IDataObject {
  const person = (getParam("person", i, {}) as IDataObject) || {};
  const salutation = (person.salutation as string) || "";
  const firstName = (person.firstName as string) || "";
  const lastName = (person.lastName as string) || "";

  const xRechnung = (getParam("xRechnung", i, {}) as IDataObject) || {};
  const emailAddresses =
    (getParam("emailAddresses", i, {}) as IDataObject) || {};
  const phoneNumbers = (getParam("phoneNumbers", i, {}) as IDataObject) || {};
  const note = (getParam("note", i, "") as string) || "";
  const archived = !!getParam("archived", i, false);
  const createAsCustomer = !!getParam("createAsCustomer", i, true);
  const createAsVendor = !!getParam("createAsVendor", i, false);

  const mapAddresses = (arr: IDataObject[] | IDataObject | undefined) => {
    // Ensure we have an array to work with
    const safeArr = Array.isArray(arr) ? arr : (arr ? [arr] : []);
    return safeArr.map((a) => ({
      supplement: a.supplement,
      street: a.street,
      zip: a.zip,
      city: a.city,
      countryCode: a.countryCode || "DE",
    }));
  };
  const billing = mapAddresses(
    (getParam("billingAddress.address", i, []) as IDataObject[]) || []
  );
  const shipping = mapAddresses(
    (getParam("shippingAddress.address", i, []) as IDataObject[]) || []
  );

  const body: IDataObject = {
    roles: {},
    person: {
      salutation: salutation || undefined,
      firstName,
      lastName,
    },
    addresses: { billing, shipping },
    note: note || undefined,
    archived,
  };

  if (createAsCustomer) (body.roles as IDataObject).customer = {};
  if (createAsVendor) (body.roles as IDataObject).vendor = {};
  if (!createAsCustomer && !createAsVendor) {
    throw new NodeOperationError(
      ctx.getNode(),
      "Es muss mindestens eine Rolle gesetzt sein (Customer oder Vendor)."
    );
  }

  const xrBuyer = (xRechnung as IDataObject).buyerReference as
    | string
    | undefined;
  const xrVendorAtCust = (xRechnung as IDataObject).vendorNumberAtCustomer as
    | string
    | undefined;
  const xr: IDataObject = {};
  if (typeof xrBuyer === "string" && xrBuyer.trim())
    xr.buyerReference = xrBuyer;
  if (typeof xrVendorAtCust === "string" && xrVendorAtCust.trim())
    xr.vendorNumberAtCustomer = xrVendorAtCust;
  if (Object.keys(xr).length > 0) body.xRechnung = xr;

  // Reuse normalizers from company builder
  const normalizeStringCollection = (col?: IDataObject) => {
    const out: IDataObject = {};
    if (!col) return out;
    const keys = ["business", "office", "private", "other"] as const;
    for (const key of keys) {
      const rawValue = col[key];
      // Ensure we have an array to work with
      const arr = Array.isArray(rawValue) ? rawValue : (rawValue ? [rawValue] : []);
      const values = arr
        .map((e) => (typeof e === 'object' && e ? (e.email as string) : String(e)) || "")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      if (values.length > 0) (out as any)[key] = values;
    }
    return out;
  };
  const emails = normalizeStringCollection(emailAddresses as IDataObject);
  if (Object.keys(emails).length > 0) body.emailAddresses = emails;

  const normalizePhoneCollection = (col?: IDataObject) => {
    const out: IDataObject = {};
    if (!col) return out;
    const keys = [
      "business",
      "office",
      "mobile",
      "private",
      "fax",
      "other",
    ] as const;
    for (const key of keys) {
      const rawValue = col[key];
      // Ensure we have an array to work with
      const arr = Array.isArray(rawValue) ? rawValue : (rawValue ? [rawValue] : []);
      const values = arr
        .map((e) => (typeof e === 'object' && e ? (e.number as string) : String(e)) || "")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      if (values.length > 0) (out as any)[key] = values;
    }
    return out;
  };
  const phones = normalizePhoneCollection(phoneNumbers as IDataObject);
  if (Object.keys(phones).length > 0) body.phoneNumbers = phones;

  return body;
}

export async function executeContacts(
  this: IExecuteFunctions,
  i: number,
  operation: string
): Promise<INodeExecutionData[]> {
  let responseData: any;

  switch (operation) {
    case "createCompany": {
      const getParam = (name: string, index?: number, def?: unknown) =>
        (
          this.getNodeParameter as unknown as (
            name: string,
            index?: number,
            defaultValue?: unknown
          ) => unknown
        )(name, index, def);
      const body = buildCompanyContactBody(this, getParam, i);
      (body as IDataObject).version = 0;
      responseData = await lexwareApiRequest.call(
        this,
        "POST",
        "/v1/contacts",
        body
      );
      break;
    }
    case "createPerson": {
      const getParam = (name: string, index?: number, def?: unknown) =>
        (
          this.getNodeParameter as unknown as (
            name: string,
            index?: number,
            defaultValue?: unknown
          ) => unknown
        )(name, index, def);
      const body = buildPersonContactBody(this, getParam, i);
      (body as IDataObject).version = 0;
      responseData = await lexwareApiRequest.call(
        this,
        "POST",
        "/v1/contacts",
        body
      );
      break;
    }
    case "get": {
      const contactId = this.getNodeParameter("contactId", i) as string;
      responseData = await lexwareApiRequest.call(
        this,
        "GET",
        `/v1/contacts/${contactId}`
      );
      break;
    }
    case "getAll": {
      const page = this.getNodeParameter("page", i, 0) as number;
      const size = this.getNodeParameter("size", i, 25) as number;
      const returnAll = !!this.getNodeParameter("returnAll", i, false);
      const filter_email = (
        this.getNodeParameter("filter_email", i, "") as string
      ).trim();
      const filter_name = (
        this.getNodeParameter("filter_name", i, "") as string
      ).trim();
      const filter_number = this.getNodeParameter(
        "filter_number",
        i,
        0
      ) as number;
      const filter_customer = this.getNodeParameter(
        "filter_customer",
        i,
        "ignore"
      ) as string;
      const filter_vendor = this.getNodeParameter(
        "filter_vendor",
        i,
        "ignore"
      ) as string;

      const qs: IDataObject = { page, size };
      if (filter_email.length >= 3) qs.filter_email = filter_email;
      if (filter_name.length >= 3) qs.filter_name = filter_name;
      if (filter_number && Number.isFinite(filter_number))
        qs.filter_number = filter_number;
      if (filter_customer !== "ignore") qs.filter_customer = filter_customer;
      if (filter_vendor !== "ignore") qs.filter_vendor = filter_vendor;

      if (returnAll) {
        responseData = await lexwareApiRequestPagedAll.call(
          this,
          "/v1/contacts",
          qs
        );
      } else {
        responseData = await lexwareApiRequest.call(
          this,
          "GET",
          "/v1/contacts",
          {},
          qs
        );
      }
      break;
    }
    case "update": {
      const contactId = this.getNodeParameter("contactId", i) as string;
      const getParam = (name: string, index?: number, def?: unknown) =>
        (
          this.getNodeParameter as unknown as (
            name: string,
            index?: number,
            defaultValue?: unknown
          ) => unknown
        )(name, index, def);

      const body = buildCompanyContactBody(this, getParam, i);
      responseData = await lexwareApiRequest.call(
        this,
        "PUT",
        `/v1/contacts/${contactId}`,
        body
      );
      break;
    }
    case "delete": {
      const contactId = this.getNodeParameter("contactId", i) as string;
      responseData = await lexwareApiRequest.call(
        this,
        "DELETE",
        `/v1/contacts/${contactId}`
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
