import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY; // Fallback to anon for basic checks, but service role is better

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Error: Missing Supabase environment variables! Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function verifySchema() {
  console.log('🔍 Starting Schema Verification...');
  console.log('-----------------------------------');

  // 1. Read and Parse schema.sql
  const schemaPath = path.join(process.cwd(), 'src/lib/supabase/schema.sql');
  if (!fs.existsSync(schemaPath)) {
    console.error('❌ Error: schema.sql not found at', schemaPath);
    return;
  }

  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  const expectedSchema: Record<string, string[]> = {};

  // Improved Regex: Matches CREATE TABLE name ( content );
  // It looks for a word after CREATE TABLE, then matches everything up to a ); on its own line (allowing leading spaces)
  const tableRegex = /CREATE\s+TABLE\s+(\w+)\s*\(([\s\S]*?)\n\s*\);/gi;
  let match;

  while ((match = tableRegex.exec(schemaSql)) !== null) {
    const tableName = match[1];
    const content = match[2];
    
    const columnLines = content.split('\n')
      .map(line => line.trim())
      .filter(line => {
        const upperLine = line.toUpperCase();
        return line && 
               !line.startsWith('--') && 
               !upperLine.startsWith('PRIMARY KEY') && 
               !upperLine.startsWith('UNIQUE') && 
               !upperLine.startsWith('CHECK') && 
               !upperLine.startsWith('CONSTRAINT') &&
               !upperLine.startsWith('FOREIGN KEY');
      });

    const columns = columnLines.map(line => {
      // Clean up common SQL artifacts and take the first word (the column name)
      const cleanLine = line.replace(/^\s+/, '').replace(/"/g, '');
      const parts = cleanLine.split(/\s+/);
      const name = parts[0].replace(/,$/, ''); // Remove trailing comma if present
      return name;
    }).filter(name => name && !/^[();\s]+$/.test(name) && !['--', 'CONSTRAINT', 'PRIMARY', 'UNIQUE'].includes(name.toUpperCase()));

    expectedSchema[tableName] = columns;
  }

  const tableNames = Object.keys(expectedSchema);
  console.log(`📑 Found ${tableNames.length} tables in schema.sql: ${tableNames.join(', ')}`);

  // 2. Fetch Actual Schema from Supabase
  console.log('📡 Fetching live database metadata...');
  
  const { data: dbColumns, error } = await supabase
    .rpc('get_schema_metadata');

  if (error) {
    console.error('❌ Error fetching database metadata:', error.message);
    if (error.message.includes('permission denied') || error.message.includes('not found')) {
      console.error('💡 Tip: Ensure you have added the `get_schema_metadata` function to your database using schema.sql.');
    }
    return;
  }

  // 3. Compare and Report
  const actualSchema: Record<string, string[]> = {};
  dbColumns.forEach((col: any) => {
    if (!actualSchema[col.table_name]) actualSchema[col.table_name] = [];
    actualSchema[col.table_name].push(col.column_name);
  });

  let hasDiscrepancy = false;

  console.log('\n📊 VERIFICATION REPORT:');
  console.log('-----------------------------------');

  for (const tableName of tableNames) {
    if (!actualSchema[tableName]) {
      console.log(`❌ Table Missing: [${tableName}]`);
      hasDiscrepancy = true;
      continue;
    }

    const missingColumns = expectedSchema[tableName].filter(col => !actualSchema[tableName].includes(col));
    
    if (missingColumns.length > 0) {
      console.log(`❌ Table [${tableName}]: Missing columns: ${missingColumns.join(', ')}`);
      hasDiscrepancy = true;
    } else {
      console.log(`✅ Table [${tableName}]: OK`);
    }
  }

  console.log('-----------------------------------');
  if (hasDiscrepancy) {
    console.log('⚠️ Verification FAILED: Database and schema.sql are NOT aligned.');
    process.exit(1);
  } else {
    console.log('🎉 Verification PASSED: Database and schema.sql are properly aligned!');
  }
}

verifySchema().catch(err => {
  console.error('💥 Unexpected error during verification:', err);
  process.exit(1);
});
