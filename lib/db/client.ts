import { sql } from '@vercel/postgres'
import fs from 'fs'
import path from 'path'

export { sql }

export async function runMigrations(): Promise<void> {
  try {
    const schemaPath = path.join(process.cwd(), 'lib', 'db', 'schema.sql')
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8')

    // Split by semicolons and execute each statement
    const statements = schemaSql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)

    for (const statement of statements) {
      await sql.query(statement)
    }

    console.log('Migrations completed successfully')
  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  }
}
