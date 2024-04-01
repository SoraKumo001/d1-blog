import { User } from "@prisma/client/edge";
import { serialize } from "cookie";
import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";

export type Context<Env = { [key: string]: string }> = {
  req: Request;
  prisma: PrismaClient;
  user?: User;
  cookies: { [key: string]: string };
  setCookie: typeof serialize;
  env: Env;
};

export let prisma: PrismaClient;

export const getPrisma = (db: D1Database) => {
  if (prisma) return prisma;
  const adapter = new PrismaD1(db);
  prisma = new PrismaClient({ adapter });
  return prisma;
};
