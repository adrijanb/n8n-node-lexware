# n8n Lexware Integration

A modular n8n community node for the Lexware API. This package exposes separate resources (Articles, Contacts, Invoices, Dunnings, Order Confirmations, Quotations, Voucher Lists, Vouchers, Print Layouts) with create/read/update/delete operations where applicable.

- Documentation sample collection (Postman): [Lexware API Samples](https://developers.lexware.io/assets/public/Lexware-API-Samples.postman_collection.json)

## Features

- Articles: create, get, get many (with filters), update, delete
- Contacts: create, get, get many (paged), update, delete
- Invoices: create, get, get many (status, page), update, delete
- Dunnings: create (with finalize and preceding voucher support), get
- Order Confirmations: create, get, get many (paged), update, delete
- Quotations: create, get, get many (paged), update, delete
- Voucher Lists: get, get many (paged, status)
- Vouchers: create, get, get many (paged, status), update, delete
- Print Layouts: get many

## Installation

```bash
npm install
npm run build
# then install into your n8n instance
npm install -g .
```

## Credentials

- Access Token: Your Lexware API access token
- Base URL: Base URL of the Lexware API (default: https://api.lexware.io)

## Usage

1. Add the Lexware node in your n8n workflow
2. Select a Resource (Articles, Contacts, Invoices, Dunnings, Order Confirmations, Quotations, Voucher Lists, Vouchers, Print Layouts)
3. Select an Operation (Create, Get, Get Many, Update, Delete)
4. Enter the required fields

### Articles

- Endpoints used (per the official samples):
  - GET `/v1/articles/{id}`
  - GET `/v1/articles?page=0&[type=PRODUCT|SERVICE]`
  - POST `/v1/articles`
  - PUT `/v1/article/{id}` (note the singular form for PUT in samples)
- Body example for create/update (simplified):

```json
{
  "title": "Lexware buchhaltung Premium 2024",
  "description": "...",
  "type": "PRODUCT",
  "articleNumber": "LXW-BUHA-2024-001",
  "gtin": "9783648170632",
  "unitName": "Download-Code",
  "price": {
    "netPrice": 61.9,
    "grossPrice": 73.66,
    "leadingPrice": "NET",
    "taxRate": 19
  }
}
```

### Contacts

- Endpoints used:
  - GET `/v1/contacts/{id}`
  - GET `/v1/contacts?page=0`
  - POST `/v1/contacts`
  - PUT `/v1/contact/{id}` (note singular form for PUT per samples)

### Invoices

- Endpoints used:
  - GET `/v1/invoices/{id}`
  - GET `/v1/invoices?page=0&status=PAID`
  - POST `/v1/invoices`
  - PUT `/v1/invoice/{id}`
  - DELETE `/v1/invoices/{id}`

### Dunnings

- Endpoints used:
  - GET `/v1/dunnings/{id}`
  - POST `/v1/dunnings?finalize=true&precedingSalesVoucherId={id}` (query flags optional)

### Order Confirmations

- Endpoints used:
  - GET `/v1/order-confirmations/{id}`
  - GET `/v1/order-confirmations?page=0`
  - POST `/v1/order-confirmations`
  - PUT `/v1/order-confirmation/{id}`
  - DELETE `/v1/order-confirmations/{id}`

### Quotations

- Endpoints used:
  - GET `/v1/quotations/{id}`
  - GET `/v1/quotations?page=0`
  - POST `/v1/quotations`
  - PUT `/v1/quotation/{id}`
  - DELETE `/v1/quotations/{id}`

### Voucher Lists

- Endpoints used:
  - GET `/v1/voucher-lists/{id}`
  - GET `/v1/voucher-lists?page=0&status=...`

### Vouchers

- Endpoints used:
  - GET `/v1/vouchers/{id}`
  - GET `/v1/vouchers?page=0&status=...`
  - POST `/v1/vouchers`
  - PUT `/v1/voucher/{id}`
  - DELETE `/v1/vouchers/{id}`

### Print Layouts

- Endpoint used:
  - GET `/v1/print-layouts`

## Example

See `examples/workflow-lexware-articles.json` for a basic example fetching articles and creating one.

## Development

- TypeScript + linting
- Modular resources: descriptions and actions per resource
- Generic request helper in `nodes/Lexware/GenericFunctions.ts`

## License

MIT
