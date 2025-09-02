# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.1] - 2024-12-19

### 🐛 Fixed
- **Comprehensive Input Validation**: Added robust validation for all API requests
  - Prevents malformed data from causing API errors
  - UUID validation for entity IDs
  - String length validation with proper limits
  - Number range validation for prices and percentages
  - Date format validation with automatic parsing
  - Currency code validation (3-letter ISO codes)
  - Address validation for both contactId and manual address fields
  - Enum validation for type fields (e.g., article types, tax types)

### 🔧 Improved
- **Error Handling**: Better error messages with field-specific validation failures
- **Data Sanitization**: Automatic trimming and cleaning of input data
- **Type Safety**: Enhanced TypeScript validation throughout the codebase

### 📚 Code Quality
- **Modular Validation**: Centralized validation utility class (`LexwareValidator`)
- **Consistent Error Reporting**: Standardized error messages across all resources
- **Clean Request Bodies**: Automatic removal of undefined/empty values

---

## [1.1.0] - 2024-12-19

### ✨ Added
- **Quotations Expiry Date**: Added missing `expiryDate` field to Quotations resource
  - Available for create, update, and createByJson operations
  - Proper dateTime type with validation
  - Follows Lexware API specification

- **Manual Address Support for Quotations**: Complete manual address functionality
  - Full address field support: name, supplement, street, city, zip, countryCode
  - Alternative to contactId for flexible address handling  
  - Intelligent address logic (contactId takes priority, fallback to manual address)
  - Consistent with [Lexware API Documentation](https://developers.lexware.io/docs/#quotations-endpoint-create-a-quotation)

### 🔧 Improved
- **Total Price Optimization**: Simplified totalPrice handling for Quotations
  - Now only requires `currency` field (as per API specification)
  - Removed redundant totalNetAmount, totalGrossAmount, totalTaxAmount fields
  - Lexware automatically calculates all amounts
  - Better user experience with simplified configuration

### 🐛 Fixed
- **Quotations Update Endpoint**: Corrected endpoint URL from `/v1/quotation/{id}` to `/v1/quotations/{id}`
- **Update Operation Structure**: Properly implemented structured update operation instead of generic body parameter

### 🎯 Enhanced
- **Type Safety**: Added comprehensive `Quotation` interface to TypeScript definitions
- **Code Consistency**: Applied CamelCase naming conventions throughout
- **Modular Structure**: Maintained English-only, modular architecture

### 📚 Documentation
- Enhanced field descriptions with practical examples
- Added API compatibility notes
- Improved inline documentation for address handling

---

## [1.0.2] - 2024-12-18

### 🔧 Improved
- Minor bug fixes and stability improvements
- Enhanced error handling

---

## [1.0.1] - 2024-12-17

### 🐛 Fixed
- Initial release bug fixes
- Package configuration improvements

---

## [1.0.0] - 2024-12-16

### 🎉 Initial Release
- **Complete Lexware API Coverage**: All major resources implemented
- **230+ Tests**: Comprehensive test suite with 100% pass rate
- **TypeScript Support**: Full type definitions and strict type checking
- **Robust Error Handling**: Retry mechanisms and rate limiting
- **Modular Architecture**: Clean, maintainable codebase

#### Supported Resources
- Articles (Full CRUD)
- Contacts (Company & Person management)
- Invoices (Creation, management, JSON line items)
- Dunnings (Management with preceding voucher support)
- Order Confirmations (Complete workflow)
- Quotations (Quote management)
- Voucher Lists (Retrieval with filtering)
- Vouchers (Comprehensive management)
- Print Layouts (Configuration access)
- Countries (International data)
- Files (Binary upload/download)

#### Key Features
- ✅ Pagination support for large datasets
- ✅ VAT validation for EU and Swiss VAT IDs
- ✅ Date/time utilities with timezone support
- ✅ Binary data handling for file operations
- ✅ Memory efficient processing
- ✅ Rate limiting and retry mechanisms
