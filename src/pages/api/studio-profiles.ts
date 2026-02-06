import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs/promises";
import path from "path";

const VARIANT_FILES: Record<string, string> = {
  thicken: "thicken-profiles.json",
  coralstone: "coralstone-profiles.json",
  coralstonedamped: "coralstonedamped-profiles.json",
  torusdamped: "torusdamped-profiles.json",
  spheremorph: "spheremorph-profiles.json",
  coralmorph: "coralmorph-profiles.json",
  // Gallery variants (isolated from Studio data)
  "gallery-thicken": "gallery-thicken-profiles.json",
  "gallery-coralstone": "gallery-coralstone-profiles.json",
  "gallery-coralstonedamped": "gallery-coralstonedamped-profiles.json",
  "gallery-coralmorph": "gallery-coralmorph-profiles.json",
  // Radial waveform variants
  "radial-outward": "radial-outward-profiles.json",
  "radial-bidirectional": "radial-bidirectional-profiles.json",
  "radial-inward": "radial-inward-profiles.json",
  // Linear waveform
  "linear-waveform": "linear-waveform-profiles.json",
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const variant = req.query.variant as string;
  const fileName = VARIANT_FILES[variant];
  if (!fileName) {
    return res.status(400).json({ error: "Invalid variant" });
  }
  const filePath = path.join(process.cwd(), fileName);

  if (req.method === "GET") {
    try {
      const data = await fs.readFile(filePath, "utf-8");
      return res.json(JSON.parse(data));
    } catch {
      return res.json([]);
    }
  }

  if (req.method === "POST") {
    try {
      await fs.writeFile(filePath, JSON.stringify(req.body, null, 2));
      return res.json({ success: true });
    } catch {
      return res.status(500).json({ error: "Failed to save profiles" });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  res.status(405).end();
}
