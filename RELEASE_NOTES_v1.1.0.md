# 🚀 Release v1.1.0: Enhanced Quotations with Expiry Dates and Manual Addresses

We're excited to announce **v1.1.0** of the n8n Lexware Integration with significant enhancements to the Quotations module!

## ✨ New Features

### 📅 **Quotations Expiry Date Support**
- Set validity periods for your quotations
- Proper `dateTime` field with validation
- Complies with Lexware API specifications
- Available for create, update, and createByJson operations

### 🏠 **Manual Address Handling**
- Alternative to `contactId` for flexible address management
- Complete address field support:
  - Company/Person name
  - Street address with supplement
  - City, ZIP code, and country code
- Smart address logic: `contactId` takes priority, fallback to manual address
- Perfect alignment with [Lexware API Documentation](https://developers.lexware.io/docs/#quotations-endpoint-create-a-quotation)

### 💰 **Simplified Total Price Configuration**
- Now only requires `currency` field (as per API specification)
- Lexware automatically calculates all amounts (net, gross, tax)
- Removed redundant manual amount fields
- Better user experience with simplified setup

## 🐛 Bug Fixes

- **Fixed Quotations Update Endpoint**: Corrected URL from `/v1/quotation/{id}` to `/v1/quotations/{id}`
- **Enhanced Update Operation**: Properly structured update with all field support

## 🔧 Improvements

- **Enhanced Type Safety**: Added comprehensive `Quotation` interface
- **Code Consistency**: Applied CamelCase naming conventions throughout
- **API Compliance**: Perfect alignment with Lexware API specifications
- **Documentation**: Enhanced field descriptions and examples

## 📖 Usage Examples

### Creating a Quotation with Expiry Date and Manual Address

```json
{
  "title": "Software Development Quote",
  "introduction": "Thank you for your interest in our services",
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
  },
  "lineItems": [
    {
      "type": "custom",
      "name": "Development Hours",
      "quantity": 40,
      "unitPrice": {
        "currency": "EUR",
        "netAmount": 95.00,
        "taxRatePercentage": 19
      }
    }
  ]
}
```

## 🚀 Migration Notes

### From v1.0.x to v1.1.0

**No breaking changes!** This is a feature release with backward compatibility.

**Total Price Changes (Optional):**
- If you're currently setting `totalNetAmount`, `totalGrossAmount`, or `totalTaxAmount` manually, you can remove these fields
- Only `currency` is now required - Lexware calculates everything else automatically
- Your existing configurations will continue to work

## 📦 Installation

### For n8n Users
```bash
npm install n8n-nodes-lexware@1.1.0
```

### From GitHub
```bash
git clone https://github.com/adrijanb/n8n-node-lexware.git
cd n8n-node-lexware
git checkout v1.1.0
npm install && npm run build
```

## 🏆 What's Next?

- Enhanced validation for manual addresses
- Additional date/time utilities
- Performance optimizations for large datasets
- More automated field calculations

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

## 📄 Full Changelog

See [CHANGELOG.md](CHANGELOG.md) for a complete list of changes.

---

**Made with ❤️ for the n8n community by [Adrijan Bajrami](https://github.com/adrijanb)**
