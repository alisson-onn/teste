import { z } from "zod";
import { createHash } from "crypto";
import { SignJWT, jwtVerify } from "jose";
import { eq } from "drizzle-orm";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { db, schema } from "./db.sqlite";
import { TRPCError } from "@trpc/server";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "sid-secret-key-2025"
);
const COOKIE_NAME = "sid_sst_token";

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

async function createToken(userId: number, email: string, role: string): Promise<string> {
  return new SignJWT({ userId, email, role })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { userId: number; email: string; role: string };
  } catch {
    return null;
  }
}

export const authRouter = router({
  // Login com email/senha
  login: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(4),
    }))
    .mutation(async ({ input, ctx }) => {
      const passwordHash = hashPassword(input.password);
      
      const user = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, input.email))
        .limit(1);

      if (user.length === 0 || user[0].passwordHash !== passwordHash) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "E-mail ou senha incorretos.",
        });
      }

      if (!user[0].active) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Usuário inativo. Contate o administrador.",
        });
      }

      // Update last signed in
      await db
        .update(schema.users)
        .set({ lastSignedIn: new Date().toISOString() })
        .where(eq(schema.users.id, user[0].id));

      const token = await createToken(user[0].id, user[0].email, user[0].role);

      // Set cookie
      ctx.res.cookie(COOKIE_NAME, token, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: "lax",
        path: "/",
      });

      return {
        success: true,
        user: {
          id: user[0].id,
          name: user[0].name,
          email: user[0].email,
          role: user[0].role,
          sector: user[0].sector,
        },
      };
    }),

  // Logout
  logout: publicProcedure.mutation(({ ctx }) => {
    ctx.res.clearCookie(COOKIE_NAME, { path: "/" });
    return { success: true };
  }),

  // Get current user
  me: publicProcedure.query(async ({ ctx }) => {
    const token = ctx.req.cookies?.[COOKIE_NAME];
    if (!token) return null;

    const payload = await verifyToken(token);
    if (!payload) return null;

    const user = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, payload.userId))
      .limit(1);

    if (user.length === 0 || !user[0].active) return null;

    return {
      id: user[0].id,
      name: user[0].name,
      email: user[0].email,
      role: user[0].role,
      sector: user[0].sector,
    };
  }),

  // Change password
  changePassword: protectedProcedure
    .input(z.object({
      currentPassword: z.string(),
      newPassword: z.string().min(6),
    }))
    .mutation(async ({ input, ctx }) => {
      const user = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, ctx.user.id))
        .limit(1);

      if (user[0].passwordHash !== hashPassword(input.currentPassword)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Senha atual incorreta." });
      }

      await db
        .update(schema.users)
        .set({ passwordHash: hashPassword(input.newPassword) })
        .where(eq(schema.users.id, ctx.user.id));

      return { success: true };
    }),
});
