import type { NextApiRequest, NextApiResponse } from "next";
import { proxy } from "@/lib/api-proxy";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (!id || Array.isArray(id)) {
    return res.status(400).json({ message: "Invalid material ID" });
  }

  const method = req.method || "GET";

  if (method === "DELETE") {
    try {
      const backendUrl = process.env.BACKEND_INTERNAL_URL || "http://backend:8000";
      const cookie = req.headers.cookie;
      const headers: Record<string, string> = {};
      if (cookie) headers["Cookie"] = cookie;

      const response = await fetch(`${backendUrl}/materials/${id}`, {
        method: "DELETE",
        headers,
      });
      res.status(response.status).end();
    } catch (error) {
      console.error(`Proxy DELETE /materials/${id}:`, error);
      res.status(500).json({ message: "Internal server error" });
    }
    return;
  }

  if (method === "PATCH") {
    const backendUrl = process.env.BACKEND_INTERNAL_URL || "http://backend:8000";
    try {
      const cookie = req.headers.cookie;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (cookie) headers["Cookie"] = cookie;

      const response = await fetch(`${backendUrl}/materials/${id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(req.body),
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      console.error(`Proxy PATCH /materials/${id}:`, error);
      res.status(500).json({ message: "Internal server error" });
    }
    return;
  }

  res.status(405).json({ message: "Method not allowed" });
}
