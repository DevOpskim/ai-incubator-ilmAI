import type { NextApiRequest, NextApiResponse } from "next";
import { proxy } from "@/lib/api-proxy";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const method = req.method || "GET";
  if (method === "POST") {
    return proxy(req, res, "/topics/", { method: "POST", body: req.body });
  }
  return proxy(req, res, "/topics/");
}
