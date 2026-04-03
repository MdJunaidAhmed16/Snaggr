import postgres from 'postgres'
import fs from 'fs'
import path from 'path'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>

const db = postgres(process.env.POSTGRES_URL!, {
  ssl: 'require',
  max: 1,           // Serverless-friendly: avoid connection exhaustion
  idle_timeout: 20,
  connect_timeout: 10,
})

// Compatibility wrapper: returns { rows } matching the prior @vercel/postgres interface
// so all callers (const { rows } = await sql`...`) work without changes.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sqlTag(strings: TemplateStringsArray, ...values: any[]): Promise<{ rows: Row[] }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = await (db as any)(strings, ...values)
  return { rows }
}

sqlTag.query = async (text: string): Promise<{ rows: Row[] }> => {
  const rows = await db.unsafe(text)
  return { rows: rows as Row[] }
}

export const sql = sqlTag

export async function runMigrations(): Promise<void> {
  try {
    const schemaPath = path.join(process.cwd(), 'lib', 'db', 'schema.sql')
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8')

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
