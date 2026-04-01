import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs/promises";
import path from "path";

const AUDIO_DIR = path.join(process.cwd(), "public", "audio");
const AUDIO_EXTENSIONS = new Set([".mp3", ".wav", ".ogg", ".m4a", ".flac", ".aac"]);

export const config = {
  api: { bodyParser: false },
};

async function listFiles(res: NextApiResponse) {
  try {
    const entries = await fs.readdir(AUDIO_DIR, { withFileTypes: true });
    const files = entries
      .filter((e) => e.isFile() && AUDIO_EXTENSIONS.has(path.extname(e.name).toLowerCase()))
      .map((e) => e.name)
      .sort();
    return res.json(files);
  } catch {
    return res.json([]);
  }
}

async function uploadFile(req: NextApiRequest, res: NextApiResponse) {
  const filename = req.headers["x-filename"] as string;
  if (!filename) return res.status(400).json({ error: "Missing x-filename header" });

  // Sanitize: replace spaces/special chars with underscores
  const ext = path.extname(filename).toLowerCase();
  if (!AUDIO_EXTENSIONS.has(ext)) return res.status(400).json({ error: "Unsupported format" });
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  const buffer = Buffer.concat(chunks);

  await fs.mkdir(AUDIO_DIR, { recursive: true });
  await fs.writeFile(path.join(AUDIO_DIR, safe), buffer);
  return res.json({ name: safe });
}

async function deleteFile(req: NextApiRequest, res: NextApiResponse) {
  const filename = req.query.name as string;
  if (!filename) return res.status(400).json({ error: "Missing name param" });

  const safe = path.basename(filename);
  const filePath = path.join(AUDIO_DIR, safe);
  try {
    await fs.unlink(filePath);
    return res.json({ ok: true });
  } catch {
    return res.status(404).json({ error: "File not found" });
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") return listFiles(res);
  if (req.method === "POST") return uploadFile(req, res);
  if (req.method === "DELETE") return deleteFile(req, res);
  return res.status(405).json({ error: "Method not allowed" });
}
