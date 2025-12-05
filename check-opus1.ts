import { db } from './server/database/init'

async function check() {
    await new Promise(r => setTimeout(r, 1000))
    
    console.log('=== opus1 Project ===')
    const opus1 = await db.get('SELECT id, domaincode, heading, status FROM projects WHERE domaincode = $1', ['opus1'])
    console.log(opus1)
    console.log('Status interpretation: 1=new, 8=demo, 64=draft, 512=confirmed, 4096=released')
    
    console.log('\n=== Posts in opus1 ===')
    const posts = await db.all(`
        SELECT p.id, p.xmlid, p.status, p.owner_id, 
               p.r_owner, p.r_member, p.r_partner, p.r_participant
        FROM posts p
        JOIN projects pr ON p.project_id = pr.id
        WHERE pr.domaincode = $1
    `, ['opus1'])
    console.table(posts)
    
    console.log('\n=== opus1 Project Members ===')
    const members = await db.all(`
        SELECT pm.user_id, u.username, pm.configrole, pm.role
        FROM project_members pm
        JOIN users u ON pm.user_id = u.id
        JOIN projects p ON pm.project_id = p.id
        WHERE p.domaincode = $1
    `, ['opus1'])
    console.table(members)
    
    process.exit(0)
}
check()
