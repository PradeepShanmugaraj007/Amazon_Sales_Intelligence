---
name: data_expert
description: Expert in Amazon MTR data structures and validation for the SellerIQ Pro platform.
---

# Data Expert Skill

This skill provides specialized knowledge for auditing, validating, and fixing data processing issues in the Amazon Sales Intelligence project.

## Core Capabilities
- **Schema Validation**: Verify that Amazon MTR CSV files match the expected headers (Invoice Amount, Tax CGST/SGST/IGST, Order ID, etc.).
- **Revenue Calculation**: Ensure Net Revenue is calculated as `Invoice Amount - Taxes`.
- **B2B/B2C Logic**: Correctly categorize transactions based on the presence of a GSTIN.
- **State Normalization**: Normalize state names to uppercase (e.g., "Maharashtra" -> "MAHARASHTRA").

## Usage Instructions
When asked to "audit data" or "fix revenue logic":
1. Check the `backend/app/services/processor.py` for calculation logic.
2. Check `frontend/src/utils.js` to ensure the frontend matches the backend.
3. Validate sample CSV rows against these rules.

## Project Context
- **Table**: `transactions` in `sellerdb`.
- **Primary Source**: Amazon Merchant Tax Report (MTR).
- **Key Metric**: Total Revenue should exclude cancelled orders and include refunds as negative values.
