import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { verifyToken } from "../auth.router";
import { db, schema } from "../db.sqlite";
import { eq } from "drizzle-orm";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    sector: string | null;
  } | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: TrpcContext["user"] = null;

  try {
    const cookieHeader = opts.req.headers.cookie || "";
    const cookies = Object.fromEntries(
      cookieHeader.split(";").map(c => {
        const [k, ...v] = c.trim().split("=");
        return [k, v.join("=")];
      })
    );

    const token = cookies["sid_sst_token"];
    if (token) {
      const payload = await verifyToken(token);
      if (payload) {
        const result = await db
          .select()
          .from(schema.users)
          .where(eq(schema.users.id, payload.userId))
          .limit(1);

        if (result.length > 0 && result[0].active) {
          user = {
            id: result[0].id,
            name: result[0].name,
            email: result[0].email,
            role: result[0].role,
            sector: result[0].sector,
          };
        }
      }
    }
  } catch {
    user = null;
  }

  return { req: opts.req, res: opts.res, user };
}
