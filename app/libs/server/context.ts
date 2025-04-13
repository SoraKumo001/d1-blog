import { PrismaD1 } from "@prisma/adapter-d1";
import { PrismaClient } from "@prisma/client";
import { getContext } from "hono/context-storage";
import type { User } from "@prisma/client";
import type { serialize } from "cookie";

export type Context = {
  req: Request;
  prisma: PrismaClient;
  user?: User;
  cookies: { [key: string]: string };
  setCookie: typeof serialize;
  env: { [key: string]: string };
};

type Env = {
  Variables: {
    prisma: PrismaClient;
  };
  Bindings: {
    database: Hyperdrive;
  };
};

// Create a proxy that returns a PrismaClient instance on SessionContext with the variable name prisma
export const prisma: PrismaClient = new Proxy<PrismaClient>({} as never, {
  get(_target: unknown, props: keyof PrismaClient) {
    const context = getContext<Env>();
    if (!context.get("prisma")) {
      const adapter = new PrismaD1(process.env.DB as unknown as D1Database);
      const prisma = new PrismaClient({
        adapter,
        log: ["error"],
      });
      context.set("prisma", prisma as never);
    }
    return context.get("prisma")[props];
  },
});
