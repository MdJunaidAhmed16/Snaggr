// CommonJS migration runner for npm script usage
const { sql } = require('@vercel/postgres')
const fs = require('fs')
const path = require('path')

async function runMigrations() {
  try {
    const schemaPath = path.join(process.cwd(), 'lib', 'db', 'schema.sql')
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8')

    const statements = schemaSql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)

    for (const statement of statements) {
      await sql.query(statement)
      console.log('Executed:', statement.slice(0, 60) + '...')
    }

    console.log('All migrations completed successfully')
    process.exit(0)
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

runMigrations()
