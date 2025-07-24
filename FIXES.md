# Database Fixes Applied

## Fix: Numeric Field Overflow in Rule Creation (2025-01-24)

**Issue**: Rule creation was failing with numeric field overflow error.

**Root Cause**: Database triggers `apply_rules()` and `apply_rules_enhanced()` were trying to store integer confidence values (0-100) from the rules table into the transaction confidence field which has a `numeric(3,2)` constraint (max value 9.99).

**Fix Applied**: Updated both database functions to convert integer confidence values to decimal:
- Rules table: stores confidence as integer 0-100
- Transactions table: stores confidence as decimal 0.00-1.00
- Conversion: `confidence_decimal = confidence_integer / 100.0`

**Migration Applied**: 
- `fix_confidence_conversion_in_triggers`
- `fix_apply_rules_confidence_conversion`

**Result**: Rule creation now works without numeric overflow errors.