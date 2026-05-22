import type { NextApiRequest, NextApiResponse } from "next";

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL || "http://backend:8000";

export async function proxy(
  req: NextApiRequest,
  res: NextApiResponse,
  path: string,
  options?: { method?: string; body?: unknown; forwardSetCookie?: boolean }
) {
  try {
    const method = (options?.method || req.method || "GET").toUpperCase();
    const headers: Record<string, string> = {};
    const cookie = req.headers.cookie;
    if (cookie) headers["Cookie"] = cookie as string;

    const fetchOptions: RequestInit = { method, headers };

    const body = options?.body !== undefined ? options.body : req.body;
    if (body && method !== "GET") {
      headers["Content-Type"] = "application/json";
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(`${BACKEND_URL}${path}`, fetchOptions);
    const data = await response.json();

    if (options?.forwardSetCookie) {
      const setCookie = response.headers.get("set-cookie");
      if (setCookie) res.setHeader("Set-Cookie", setCookie);
    }

    res.status(response.status).json(data);
  } catch (error) {
    console.error(`Proxy [${path}]:`, error);
    res.status(500).json({ message: "Internal server error" });
  }
}
