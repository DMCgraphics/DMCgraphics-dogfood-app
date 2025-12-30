#!/bin/bash

# This script exports the Supabase schema
# You'll need to get your database connection string from Supabase dashboard

echo "=== Supabase Schema Export Tool ==="
echo ""
echo "1. Go to your Supabase project dashboard:"
echo "   https://supabase.com/dashboard/project/tczvietgpixwonpqaotl/settings/database"
echo ""
echo "2. Copy the 'Connection string' under 'Connection pooling'"
echo "   It should look like: postgresql://postgres.[PROJECT]:[PASSWORD]@[HOST]:6543/postgres"
echo ""
echo "3. Run this command with your connection string:"
echo ""
echo "   pg_dump --schema-only --no-owner --no-acl \\"
echo "     'your-connection-string-here' > schema.sql"
echo ""
echo "This will create a schema.sql file you can import to your new database."
echo ""
echo "To import to new database, run:"
echo "   psql 'new-database-connection-string' < schema.sql"
