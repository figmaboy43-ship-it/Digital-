#!/bin/bash
echo "" > supabase/missing_tables.sql

# Extract from line 62 (SERVICE CATEGORIES) to line 154 (just before WALLETS)
sed -n '62,154p' supabase/schema.sql >> supabase/missing_tables.sql

# Extract from line 165 (WALLET TRANSACTIONS) to the end
sed -n '165,$p' supabase/schema.sql >> supabase/missing_tables.sql

