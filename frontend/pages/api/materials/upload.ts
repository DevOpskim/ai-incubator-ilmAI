import type { NextApiRequest, NextApiResponse } from "next";

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL || "http://backend:8000";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const headers: Record<string, string> = {};
    const cookie = req.headers.cookie;
    if (cookie) headers["Cookie"] = cookie as string;

    const contentType = req.headers["content-type"];
    if (contentType) headers["Content-Type"] = contentType as string;

    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    }
    const buffer = Buffer.concat(chunks);

    const response = await fetch(`${BACKEND_URL}/materials/upload`, {
      method: "POST",
      headers,
      body: buffer,
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error("Upload proxy error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
