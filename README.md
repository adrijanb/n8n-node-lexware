# n8n Lexware Integration

[![npm version](https://badge.fury.io/js/n8n-nodes-lexware.svg)](https://badge.fury.io/js/n8n-nodes-lexware)
[![npm downloads](https://img.shields.io/npm/dm/n8n-nodes-lexware.svg)](https://www.npmjs.com/package/n8n-nodes-lexware)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A comprehensive n8n community node package for seamless Lexware API integration. This package provides modular access to all major Lexware resources with full CRUD operations, robust error handling, and extensive testing coverage.

## 🚀 **Now Available on npm!**

```bash
npm install n8n-nodes-lexware
```

### 📚 Resources

- **Documentation**: [Lexware API Samples](https://developers.lexware.io/assets/public/Lexware-API-Samples.postman_collection.json)
- **npm Package**: https://www.npmjs.com/package/n8n-nodes-lexware
- **GitHub Repository**: https://github.com/adrijanb/n8n-node-lexware

## ✨ Features

### 🆕 **What's New in v1.1.0**

- **Quotations Expiry Date**: Set validity periods for your quotes
- **Manual Address Support**: Full address handling alternative to contactId
- **Simplified Total Price**: Only currency required - automatic calculations
- **Enhanced API Compliance**: Perfect alignment with Lexware API specifications

### 🏢 **Complete Lexware API Coverage**

- **Articles**: Full CRUD operations with type filtering and pricing management
- **Contacts**: Company & person management with VAT validation and role assignment
- **Invoices**: Invoice creation, management, and JSON-based line item support
- **Dunnings**: Dunning management with preceding voucher support and finalization
- **Order Confirmations**: Complete order confirmation workflow
- **Quotations**: Quote management with expiry dates, manual addresses, and flexible line item handling
- **Voucher Lists**: Voucher list retrieval with status filtering
- **Vouchers**: Comprehensive voucher management
- **Print Layouts**: Print layout configuration access
- **Countries**: Country data with international support
- **Files**: File upload/download with binary data handling

### 🔧 **Technical Features**

- ✅ **230+ Tests** with 100% pass rate
- ✅ **TypeScript** support with full type definitions
- ✅ **Robust Error Handling** with retry mechanisms and rate limiting
- ✅ **Pagination Support** for large datasets
- ✅ **Binary Data Handling** for file operations
- ✅ **VAT Validation** for EU and Swiss VAT IDs
- ✅ **Date/Time Utilities** with timezone support
- ✅ **Memory Efficient** processing for large operations

## 📦 Installation

### For n8n Users (Recommended)

Install the package directly from npm:

```bash
npm install n8n-nodes-lexware
```

Then restart your n8n instance. The Lexware node will be available in your node palette.

### For Development

```bash
git clone https://github.com/adrijanb/n8n-node-lexware.git
cd n8n-node-lexware
npm install
npm run build
npm test  # Run the 230+ test suite
```

## 🔐 Credentials Setup

Create a new Lexware API credential in n8n with the following information:

- **Access Token**: Your Lexware API access token
- **Base URL**: Base URL of the Lexware API (default: `https://api.lexware.io`)

## 🎯 Quick Start

1. **Add the Lexware node** to your n8n workflow
2. **Configure credentials** using your Lexware API access token
3. **Select a Resource**: Choose from Articles, Contacts, Invoices, Dunnings, Order Confirmations, Quotations, Voucher Lists, Vouchers, Print Layouts, Countries, or Files
4. **Select an Operation**: Choose from Create, Get, Get Many, Update, Delete (depending on resource)
5. **Configure parameters** based on your specific use case

### 💡 Pro Tips

- Use **Get Many** operations with pagination for large datasets
- Leverage **JSON line items** for complex invoice/quotation structures
- Take advantage of **VAT validation** for international business
- Use **file operations** for document management workflows

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
  - PUT `/v1/quotations/{id}`
  - DELETE `/v1/quotations/{id}`

#### New Features (v1.1.0)
- **Expiry Date Support**: Set quotation validity periods
- **Manual Address Handling**: Alternative to contactId with full address fields
- **Simplified Total Price**: Only currency required - amounts calculated automatically

```json
{
  "title": "Software Development Quote",
  "expiryDate": "2024-12-31T23:59:59.000Z",
  "address": {
    "name": "Berliner Kindl GmbH",
    "street": "Jubiläumsweg 25",
    "city": "Berlin",
    "zip": "14089",
    "countryCode": "DE"
  },
  "totalPrice": {
    "currency": "EUR"
  }
}
```

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

## 📋 API Reference

### Core Resources & Operations

| Resource                | Create | Read | Update | Delete | List | Special Operations                |
| ----------------------- | :----: | :--: | :----: | :----: | :--: | :-------------------------------- |
| **Articles**            |   ✅   |  ✅  |   ✅   |   ✅   |  ✅  | Type filtering                    |
| **Contacts**            |   ✅   |  ✅  |   ✅   |   ✅   |  ✅  | Company/Person, VAT validation    |
| **Invoices**            |   ✅   |  ✅  |   ✅   |   ✅   |  ✅  | JSON line items, Status filtering |
| **Dunnings**            |   ✅   |  ✅  |   ❌   |   ❌   |  ❌  | Finalize, Preceding voucher       |
| **Order Confirmations** |   ✅   |  ✅  |   ✅   |   ✅   |  ✅  | Pagination                        |
| **Quotations**          |   ✅   |  ✅  |   ✅   |   ✅   |  ✅  | JSON line items, Expiry dates, Manual addresses |
| **Voucher Lists**       |   ❌   |  ✅  |   ❌   |   ❌   |  ✅  | Status filtering                  |
| **Vouchers**            |   ✅   |  ✅  |   ✅   |   ✅   |  ✅  | Status filtering                  |
| **Print Layouts**       |   ❌   |  ❌  |   ❌   |   ❌   |  ✅  | Configuration access              |
| **Countries**           |   ❌   |  ❌  |   ❌   |   ❌   |  ✅  | International data                |
| **Files**               |   ✅   |  ✅  |   ❌   |   ❌   |  ❌  | Binary upload/download            |

### Advanced Features

- **Pagination**: Automatic handling of large result sets
- **Error Retry**: Built-in retry logic with exponential backoff
- **Rate Limiting**: Automatic handling of API rate limits
- **VAT Validation**: EU and Swiss VAT ID validation
- **Date Formatting**: Automatic timezone-aware date conversion
- **Binary Data**: Full support for file upload/download operations

## 💼 Example Workflows

See `examples/workflow-lexware-articles.json` for a complete example demonstrating:

- Fetching articles with filtering
- Creating new articles with pricing
- Error handling and retry logic

## 🧪 Testing & Quality

This package includes a comprehensive test suite with **230+ tests** covering:

- ✅ **Unit Tests** for all API functions
- ✅ **Integration Tests** for complete workflows
- ✅ **Error Handling Tests** for robust error management
- ✅ **Performance Tests** for large data operations
- ✅ **Edge Case Testing** for boundary conditions

```bash
npm test                    # Run all tests
npm run test:watch         # Run tests in watch mode
npm run lint               # Run linting
npm run build              # Build the project
```

## 🛠️ Development

### Architecture

- **TypeScript** with strict type checking
- **Modular Design** with separate resource descriptions and actions
- **Generic Request Helper** in `GenericFunctions.ts` with retry logic
- **Comprehensive Error Handling** with proper n8n error types
- **Memory Efficient** processing for large datasets

### Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Run the test suite (`npm test`)
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Support

- **Issues**: [Report bugs or request features via GitHub Issues](https://github.com/adrijanb/n8n-node-lexware/issues)
- **Documentation**: Check the [Lexware API Documentation](https://developers.lexware.io/)
- **Community**: Join the n8n community for general support

## 🏆 Credits

Developed by **Adrijan Bajrami** - A comprehensive n8n community node for the Lexware ecosystem.

---

**Made with ❤️ for the n8n community**
