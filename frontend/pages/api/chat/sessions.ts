import type { NextApiRequest, NextApiResponse } from "next";
import { proxy } from "@/lib/api-proxy";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    return proxy(req, res, "/chat/sessions", { method: "POST" });
  }
  return proxy(req, res, "/chat/sessions");
}
