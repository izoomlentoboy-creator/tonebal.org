import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import type { Request, Response } from "../types";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: Request;
  res: Response;
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  const req = opts.req as unknown as Request;
  const res = opts.res as unknown as Response;

  try {
    user = await sdk.authenticateRequest(req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req,
    res,
    user,
  };
}
