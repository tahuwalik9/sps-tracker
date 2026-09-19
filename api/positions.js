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
    const headers = {
      Authorization: `Basic ${credentials}`,
      Accept: "application/json",
    };
    const devicesUrl = TRACCAR_URL.replace(/\/positions\/?$/, "/devices");
    const [response, devicesResponse] = await Promise.all([
      fetch(TRACCAR_URL, { headers }),
      fetch(devicesUrl, { headers }),
    ]);

    if (!response.ok || !devicesResponse.ok) {
      const status = !response.ok ? response.status : devicesResponse.status;
      return res.status(status).json({
        error: `Traccar mengembalikan HTTP ${status}`,
      });
    }

    const data = await response.json();
    const devices = await devicesResponse.json();
    const deviceDetails = Object.fromEntries(
      devices.map((device) => [
        device.id,
        {
          name: device.name || device.uniqueId,
          status: device.status || "unknown",
          lastUpdate: device.lastUpdate || null,
        },
      ]),
    );

    return res.status(200).json(
      data.map((position) => ({
        ...position,
        deviceName:
          deviceDetails[position.deviceId]?.name ||
          `Peserta ${position.deviceId}`,
        deviceStatus: deviceDetails[position.deviceId]?.status || "unknown",
        deviceLastUpdate: deviceDetails[position.deviceId]?.lastUpdate || null,
      })),
    );
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
