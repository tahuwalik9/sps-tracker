export default async function handler(req, res) {
  const TRACCAR_URL =
    "https://traccar-production-ff17.up.railway.app/api/positions";

  // Masukkan token Traccar Anda di sini
  const TRACCAR_TOKEN = "MASUKKAN_TOKEN_ANDA_DI_SINI";

  try {
    const response = await fetch(TRACCAR_URL, {
      headers: {
        Authorization: `Bearer ${TRACCAR_TOKEN}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return res
        .status(response.status)
        .json({ error: "Gagal terhubung ke Traccar" });
    }

    const data = await response.json();

    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
