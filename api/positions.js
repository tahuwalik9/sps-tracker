export default async function handler(req, res) {
  const TRACCAR_URL =
    "https://traccar-production-ff17.up.railway.app/api/positions";

  // Kredensial aman di sisi server Vercel
  const credentials = Buffer.from("admin:admin14#").toString("base64");

  try {
    const response = await fetch(TRACCAR_URL, {
      headers: {
        Authorization: `Basic ${credentials}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return res
        .status(response.status)
        .json({ error: "Gagal terhubung ke Traccar" });
    }

    const data = await response.json();

    // Izinkan akses dari frontend Anda
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
