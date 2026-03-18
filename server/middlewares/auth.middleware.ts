
import jwt from "jsonwebtoken";

export function authMiddleware(req:any,res:any,next:any){
  const auth = req.headers.authorization;
  if(!auth){
    return res.status(401).json({error:"Token não enviado"});
  }

  const token = auth.split(" ")[1];

  try{
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev_secret");
    req.user = decoded;
    next();
  }catch(e){
    return res.status(401).json({error:"Token inválido"});
  }
}
