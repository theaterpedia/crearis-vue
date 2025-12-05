import { db } from './server/database/init'

async function setNew() {
    await new Promise(r => setTimeout(r, 1000))
    
    // Set opus1 to status new (1)
    await db.run("UPDATE projects SET status = 1 WHERE domaincode = $1", ["opus1"])
    
    const opus1 = await db.get("SELECT id, domaincode, status FROM projects WHERE domaincode = $1", ["opus1"])
    console.log("Updated opus1:", opus1)
    
    process.exit(0)
}
setNew()
