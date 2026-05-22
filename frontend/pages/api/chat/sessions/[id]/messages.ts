import type { NextApiRequest, NextApiResponse } from "next";
import { proxy } from "@/lib/api-proxy";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (req.method === "POST") {
    return proxy(req, res, `/chat/sessions/${id}/messages`, { method: "POST" });
  }
  return proxy(req, res, `/chat/sessions/${id}/messages`);
}
