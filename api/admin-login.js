import crypto from "node:crypto";

function signSession(payload, secret) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", secret).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

export default async function handler(req, res) {
  if (req.method === "DELETE") {
    res.setHeader("Set-Cookie", "sps_admin=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Strict");
    return res.status(200).json({ ok: true });
  }
  if (req.method !== "POST") return res.status(405).json({ error: "Method tidak didukung" });

  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!username || !password || !secret) {
    return res.status(500).json({ error: "Konfigurasi admin belum lengkap" });
  }

  const body = req.body || {};
  if (body.username !== username || body.password !== password) {
    return res.status(401).json({ error: "Kredensial admin tidak valid" });
  }

  const token = signSession({ username, exp: Date.now() + 8 * 60 * 60 * 1000 }, secret);
  res.setHeader("Set-Cookie", `sps_admin=${token}; Max-Age=28800; Path=/; HttpOnly; Secure; SameSite=Strict`);
  return res.status(200).json({ ok: true });
}
