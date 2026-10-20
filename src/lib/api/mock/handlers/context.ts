import type { MockUser, Store } from "../types";
import type { MockResult } from "../http";

export type HandlerContext = {
  store: Store;
  params: Record<string, string>;
  query: URLSearchParams;
  json: unknown;
  form?: FormData;
  user: MockUser | null;
};

export type Handler = (ctx: HandlerContext) => MockResult;
