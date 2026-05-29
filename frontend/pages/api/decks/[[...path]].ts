import type { NextApiRequest, NextApiResponse } from "next";
import { proxy } from "@/lib/api-proxy";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { path } = req.query;
  const segments = Array.isArray(path) ? path : (path ? [path] : []);
  const backendPath = `/decks/${segments.join("/")}`;
  return proxy(req, res, backendPath);
}
