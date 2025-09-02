# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.4] - 02.09.2025

### 🎯 **Complete Line Items Support for Quotations**
- **Extended Line Item Types**: Vollständige Unterstützung für alle [Lexware API Line Item Types](https://developers.lexware.io/docs/#quotations-endpoint-create-a-quotation)
  - **Custom**: Standard benutzerdefinierte Artikel
  - **Material**: Materialien und Produkte 
  - **Service**: Dienstleistungen
  - **Text**: Reine Textpositionen

### 🛠️ **Advanced Line Item Features**
- **Alternative Items**: Unterstützung für alternative Positionen (`alternative: true/false`)
- **Optional Items**: Markierung optionaler Positionen (`optional: true/false`)
- **Sub Items**: Verschachtelte Line Items für komplexe Produktstrukturen
- **Complete Unit Price Structure**: Vollständige `unitPrice` Objekt-Unterstützung mit allen Feldern

### 🔧 **Enhanced Data Processing**
- **JSON Sub Items**: Flexible SubItems Definition über JSON Format
- **Automatic Field Handling**: Intelligente Verarbeitung optionaler Felder
- **Error Prevention**: Bessere Validierung verhindert "unit price must not be null" Fehler

### 📋 **Required Fields Compliance** 
Basierend auf der [Lexware API Dokumentation](https://developers.lexware.io/docs/#quotations-endpoint-create-a-quotation):
- **type**: erforderlich (custom, material, service, text)
- **name**: erforderlich
- **quantity**: erforderlich für type custom, service, material
- **unitName**: erforderlich für type custom, service, material  
- **unitPrice**: erforderlich für type custom, service, material
  - **currency**: erforderlich
  - **netAmount/grossAmount**: abhängig von taxConditions.taxType
  - **taxRatePercentage**: erforderlich

---

## [1.1.3] - 02.09.2025

### 🎯 **Lexware API-Specific Error Handling**

- **Official API Error Format Support**: Implementiert vollständige Unterstützung für [Lexware API Error Codes](https://developers.lexware.io/docs/#error-codes-regular-error-response)
  - **Regular Error Response Format**: Strukturierte Behandlung mit `message` und `details` Feldern
  - **Legacy Error Response Format**: Kompatibilität mit älteren `errors` Array Format
  - **Authorization Error Format**: Spezifische OAuth 2.0 Fehlerbehandlung (`invalid_token`, `expired_token`, `insufficient_scope`)

### 🔧 **Enhanced API Error Messages**

- **Complete API Response Display**: Vollständige Lexware API Antwort wird immer angezeigt
- **Request Details**: URL, Method, Body und Query Parameter für besseres Debugging
- **Structured Error Details**: Nummerierte Liste spezifischer Probleme
- **Format Detection**: Automatische Erkennung von Legacy vs. Regular Error Format
- **Documentation Links**: Direkte Links zur relevanten Lexware API Dokumentation

### 📚 **Developer Resources**

- **Rate Limiting Guidance**: Spezifische Hinweise zu Lexware's 2 requests/second Limit
- **Authentication Help**: Direkte Links zum API Key Management Portal
- **Solution Suggestions**: Konkrete Lösungsvorschläge für jede Fehlerart

### 🛡️ **Error Categories**

- **400 Bad Request**: Detaillierte Validierungsfehler mit Feldangaben
- **401 Unauthorized**: OAuth 2.0 spezifische Authentifizierungsfehler
- **403 Forbidden**: Berechtigungsprobleme mit Scope-Erklärungen
- **429 Rate Limit**: Token Bucket Algorithm Empfehlungen
- **5xx Server Errors**: Temporäre vs. persistente Server-Probleme

---

## [1.1.2] - 02.09.2025

### 🆕 **Enhanced Error Handling & Developer Experience**

- **`LexwareErrorHandler` Utility**: Professional error formatting and handling
  - Detailed HTTP status code handling (400, 401, 403, 404, 409, 422, 429, 5xx)
  - Structured error messages with actionable descriptions
  - Field-specific validation error formatting
  - Business logic error extraction and display
  - Rate limiting error handling with retry suggestions
  - Network and authentication error guidance

### 🛠️ **Improved Error Messages**

- **Context-Aware Errors**: Errors now include operation and resource type context
- **Validation Error Details**: Shows current vs. expected values (e.g., length limits)
- **API Error Passthrough**: Original Lexware API errors are properly formatted and displayed
- **Developer-Friendly Format**: Clear error structure with descriptions and suggestions

### 🔧 **Better Debugging Experience**

- **Error Context**: Automatic error context creation with sanitized parameters
- **Sensitive Data Protection**: Automatic sanitization of tokens and credentials in error logs
- **Enhanced Stack Traces**: Better error tracking through the validation and API layers

### 📚 **Code Quality**

- **Centralized Error Handling**: All API calls now use consistent error formatting
- **Type-Safe Error Handling**: Enhanced TypeScript support for error scenarios
- **Modular Architecture**: Separate validation and error handling utilities

---

## [1.1.1] - 02.09.2025

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

## [1.1.0] - 02.09.2025

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
