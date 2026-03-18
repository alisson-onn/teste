
export async function logAudit(db:any, user:any, action:string, table:string){
  try{
    await db.insert("audit_logs").values({
      user: user?.id || "system",
      action,
      table,
      created_at: new Date()
    });
  }catch(e){
    console.error("audit log error",e);
  }
}
