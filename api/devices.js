export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (!["GET", "POST", "PUT", "DELETE"].includes(req.method)) {
    return res.status(405).json({ error: "Method tidak didukung" });
  }

  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin14";
  const authorization = req.headers.authorization || "";
  const expected = `Basic ${Buffer.from(`${adminUsername}:${adminPassword || ""}`).toString("base64")}`;
  if (authorization !== expected) {
    return res.status(401).json({ error: "Kredensial admin tidak valid" });
  }

  const traccarUrl =
    process.env.TRACCAR_URL ||
    "https://traccar-production-ff17.up.railway.app/api/positions";
  const traccarUsername = process.env.TRACCAR_USERNAME;
  const traccarPassword = process.env.TRACCAR_PASSWORD;
  if (!traccarUsername || !traccarPassword) {
    return res
      .status(500)
      .json({ error: "Kredensial Traccar belum dikonfigurasi" });
  }

  const devicesUrl = traccarUrl.replace(/\/positions\/?$/, "/devices");
  const traccarAuthorization = `Basic ${Buffer.from(`${traccarUsername}:${traccarPassword}`).toString("base64")}`;

  try {
    if (req.method === "GET") {
      const response = await fetch(devicesUrl, {
        headers: { Authorization: traccarAuthorization, Accept: "application/json" },
      });
      const body = await response.json().catch(() => ({}));
      return res.status(response.status).json(body);
    }

    const deviceId = req.query?.id || req.body?.id;
    if ((req.method === "PUT" || req.method === "DELETE") && !deviceId) {
      return res.status(400).json({ error: "ID device wajib diisi" });
    }

    if (req.method === "DELETE") {
      const response = await fetch(`${devicesUrl}/${encodeURIComponent(deviceId)}`, {
        method: "DELETE",
        headers: { Authorization: traccarAuthorization, Accept: "application/json" },
      });
      return res.status(response.status).json({ ok: response.ok });
    }

    const devices = Array.isArray(req.body) ? req.body : [req.body];
    if (!devices.length || devices.some((device) => !device?.name || !device?.uniqueId)) {
      return res.status(400).json({ error: "Setiap device wajib memiliki name dan uniqueId/BIB" });
    }

    const results = [];
    for (const device of devices) {
      const response = await fetch(devicesUrl, {
        method: req.method === "PUT" ? "PUT" : "POST",
        headers: {
          Authorization: traccarAuthorization,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          id: device.id,
          name: String(device.name).trim(),
          uniqueId: String(device.uniqueId).trim(),
          category: device.category
            ? String(device.category).trim()
            : undefined,
        }),
      });
      const body = await response.json().catch(() => ({}));
      results.push({
        name: device.name,
        uniqueId: device.uniqueId,
        ok: response.ok,
        status: response.status,
        result: body,
      });
    }
    return res.status(200).json(results);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
