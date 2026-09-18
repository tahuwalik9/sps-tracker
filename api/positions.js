export default async function handler(req, res) {
  const TRACCAR_URL =
    process.env.TRACCAR_URL ||
    "https://traccar-production-ff17.up.railway.app/api/positions";

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method tidak didukung" });
  }

  const username = process.env.TRACCAR_USERNAME;
  const password = process.env.TRACCAR_PASSWORD;

  if (!username || !password) {
    return res.status(500).json({
      error: "TRACCAR_USERNAME dan TRACCAR_PASSWORD belum dikonfigurasi",
    });
  }

  const credentials = Buffer.from(`${username}:${password}`).toString("base64");

  try {
    const response = await fetch(TRACCAR_URL, {
      headers: {
        Authorization: `Basic ${credentials}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Traccar mengembalikan HTTP ${response.status}`,
      });
    }

    const data = await response.json();

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
