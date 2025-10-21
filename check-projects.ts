import pg from 'pg'

const client = new pg.Client({
  host: 'localhost',
  port: 5432,
  user: 'crearis_admin',
  password: 'crearis_secure_2024',
  database: 'crearis_admin_dev'
})

async function checkProjects() {
  await client.connect()
  
  console.log('📋 Projects table columns:')
  const schema = await client.query(`
    SELECT column_name, data_type, is_nullable 
    FROM information_schema.columns 
    WHERE table_name = 'projects'
    ORDER BY ordinal_position
  `)
  schema.rows.forEach((row: any) => {
    console.log(`  - ${row.column_name}: ${row.data_type}`)
  })
  
  console.log('\n📋 Sample projects:')
  const projects = await client.query('SELECT * FROM projects WHERE username IN ($1, $2)', ['tp', 'regio1'])
  console.log(JSON.stringify(projects.rows, null, 2))
  
  await client.end()
}

checkProjects().catch(console.error)
