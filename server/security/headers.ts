
import helmet from "helmet";

export function securityHeaders(app:any){
  app.use(helmet());
}
