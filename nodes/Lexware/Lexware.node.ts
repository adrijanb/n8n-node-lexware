import { IExecuteFunctions } from "n8n-core";
import {
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from "n8n-workflow";

import {
  articlesFields,
  articlesOperations,
} from "./descriptions/ArticlesDescription";
import {
  contactsFields,
  contactsOperations,
} from "./descriptions/ContactsDescription";
import {
  dunningsFields,
  dunningsOperations,
} from "./descriptions/DunningsDescription";
import {
  printLayoutsFields,
  printLayoutsOperations,
} from "./descriptions/PrintLayoutsDescription";
import {
  invoicesFields,
  invoicesOperations,
} from "./descriptions/InvoicesDescription";

import { executeArticles } from "./actions/Articles.execute";
import { executeContacts } from "./actions/Contacts.execute";
import { executeDunnings } from "./actions/Dunnings.execute";
import { executePrintLayouts } from "./actions/PrintLayouts.execute";
import { executeInvoices } from "./actions/Invoices.execute";
import {
  orderConfirmationsFields,
  orderConfirmationsOperations,
} from "./descriptions/OrderConfirmationsDescription";
import { executeOrderConfirmations } from "./actions/OrderConfirmations.execute";
import {
  quotationsFields,
  quotationsOperations,
} from "./descriptions/QuotationsDescription";
import { executeQuotations } from "./actions/Quotations.execute";
import {
  voucherListsFields,
  voucherListsOperations,
} from "./descriptions/VoucherListsDescription";
import { executeVoucherLists } from "./actions/VoucherLists.execute";
import {
  vouchersFields,
  vouchersOperations,
} from "./descriptions/VouchersDescription";
import { executeVouchers } from "./actions/Vouchers.execute";
import {
  countriesFields,
  countriesOperations,
} from "./descriptions/CountriesDescription";
import { executeCountries } from "./actions/Countries.execute";
import { filesFields, filesOperations } from "./descriptions/FilesDescription";
import { executeFiles } from "./actions/Files.execute";

export class Lexware implements INodeType {
  description: INodeTypeDescription = {
    displayName: "Lexware",
    name: "lexware",
    icon: "file:lexware.svg",
    group: ["transform"],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description: "Interact with the Lexware API",
    defaults: {
      name: "Lexware",
    },
    inputs: ["main"],
    outputs: ["main"],
    credentials: [
      {
        name: "lexwareApi",
        required: true,
      },
    ],
    properties: [
      {
        displayName: "Resource",
        name: "resource",
        type: "options",
        noDataExpression: true,
        options: [
          { name: "Articles", value: "articles" },
          { name: "Contacts", value: "contacts" },
          { name: "Dunnings", value: "dunnings" },
          { name: "Invoices", value: "invoices" },
          { name: "Order Confirmations", value: "orderConfirmations" },
          { name: "Quotations", value: "quotations" },
          { name: "Voucher Lists", value: "voucherLists" },
          { name: "Vouchers", value: "vouchers" },
          { name: "Print Layouts", value: "printLayouts" },
          { name: "Countries", value: "countries" },
          { name: "Files", value: "files" },
        ],
        default: "articles",
      },
      articlesOperations,
      ...articlesFields,
      contactsOperations,
      ...contactsFields,
      dunningsOperations,
      ...dunningsFields,
      invoicesOperations,
      ...invoicesFields,
      orderConfirmationsOperations,
      ...orderConfirmationsFields,
      quotationsOperations,
      ...quotationsFields,
      voucherListsOperations,
      ...voucherListsFields,
      vouchersOperations,
      ...vouchersFields,
      printLayoutsOperations,
      ...printLayoutsFields,
      countriesOperations,
      ...countriesFields,
      filesOperations,
      ...filesFields,
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const resource = this.getNodeParameter("resource", 0) as string;
    const operation = this.getNodeParameter("operation", 0) as string;
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      switch (resource) {
        case "articles":
          returnData.push(...(await executeArticles.call(this, i, operation)));
          break;
        case "contacts":
          returnData.push(...(await executeContacts.call(this, i, operation)));
          break;
        case "dunnings":
          returnData.push(...(await executeDunnings.call(this, i, operation)));
          break;
        case "invoices":
          returnData.push(...(await executeInvoices.call(this, i, operation)));
          break;
        case "orderConfirmations":
          returnData.push(
            ...(await executeOrderConfirmations.call(this, i, operation))
          );
          break;
        case "quotations":
          returnData.push(
            ...(await executeQuotations.call(this, i, operation))
          );
          break;
        case "voucherLists":
          returnData.push(
            ...(await executeVoucherLists.call(this, i, operation))
          );
          break;
        case "vouchers":
          returnData.push(...(await executeVouchers.call(this, i, operation)));
          break;
        case "printLayouts":
          returnData.push(
            ...(await executePrintLayouts.call(this, i, operation))
          );
          break;
        case "countries":
          returnData.push(...(await executeCountries.call(this, i, operation)));
          break;
        case "files":
          returnData.push(...(await executeFiles.call(this, i, operation)));
          break;
        default:
          throw new Error(`Unsupported resource: ${resource}`);
      }
    }

    return [returnData];
  }
}
