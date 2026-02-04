// Express types for server code
import type { IncomingHttpHeaders, IncomingMessage, ServerResponse } from "http";

export interface CookieOptions {
  maxAge?: number;
  signed?: boolean;
  expires?: Date;
  httpOnly?: boolean;
  path?: string;
  domain?: string;
  secure?: boolean;
  encode?: (val: string) => string;
  sameSite?: boolean | "lax" | "strict" | "none";
}

export interface Request extends IncomingMessage {
  body: any;
  query: Record<string, any>;
  params: Record<string, any>;
  headers: IncomingHttpHeaders;
  protocol: string;
  originalUrl: string;
  hostname: string;
  path: string;
  cookies: Record<string, any>;
}

export interface Response extends ServerResponse {
  status(code: number): this;
  sendStatus(code: number): this;
  json(body?: any): this;
  send(body?: any): this;
  redirect(url: string): void;
  redirect(status: number, url: string): void;
  cookie(name: string, val: string | object, options?: CookieOptions): this;
  clearCookie(name: string, options?: CookieOptions): this;
  set(field: string, value?: string | string[]): this;
  set(fields: Record<string, string>): this;
  sendFile(path: string, options?: any, fn?: (err?: Error) => void): void;
}

export interface Application {
  use: (...args: any[]) => this;
  get(path: string, ...handlers: any[]): this;
  post(path: string, ...handlers: any[]): this;
  put(path: string, ...handlers: any[]): this;
  delete(path: string, ...handlers: any[]): this;
  patch(path: string, ...handlers: any[]): this;
}

export type NextFunction = (err?: any) => void;
