const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());

/* =========================================================
   PORT
========================================================= */
const PORT = process.env.PORT || 3000;

/* =========================================================
   STATIC FILES
========================================================= */
app.use(express.static(path.join(__dirname)));

/* =========================================================
   HELPER
========================================================= */
function getEventPath(eventCode) {
  return path.join(__dirname, "data", "events", `${eventCode}.json`);
}

/* =========================================================
   LOGIN
========================================================= */
app.post("/api/login", (req, res) => {
  const { eventCode, username, password } = req.body;

  if (!eventCode)
    return res.status(400).json({ success: false, message: "eventCode wajib" });

  const filePath = getEventPath(eventCode);

  if (!fs.existsSync(filePath))
    return res.status(404).json({ success: false, message: "Event tidak ditemukan" });

  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  if (password === data.eventInfo.passwordAdmin) {
    return res.json({ success: true });
  }

  res.status(401).json({ success: false, message: "Login gagal" });
});

/* =========================================================
   REGISTER EVENT
========================================================= */
app.post("/api/register-event", (req, res) => {
  const {
    namaEvent,
    tanggalMulai,
    tanggalSelesai,
    lokasi,
    jumlahNomor,
    passwordAdmin
  } = req.body;

  if (!namaEvent)
    return res.status(400).json({ success: false, message: "Nama event wajib" });

  const eventCode = namaEvent.replace(/\s+/g, "").toUpperCase();
  const filePath = getEventPath(eventCode);

  if (fs.existsSync(filePath))
    return res.status(400).json({ success: false, message: "Event sudah ada" });

  const newEvent = {
    eventInfo: {
      namaEvent,
      tanggalMulai,
      tanggalSelesai,
      lokasi,
      jumlahNomor,
      passwordAdmin
    },
    database: {
      peserta: [],
      panitia: [],
      wasit: []
    },
    pertandingan: [],
    schedule: {}
  };

  fs.writeFileSync(filePath, JSON.stringify(newEvent, null, 2));

  res.json({
    success: true,
    message: "Event berhasil dibuat",
    eventCode
  });
});

/* =========================================================
   GET EVENT INFO
========================================================= */
app.get("/api/admin/event", (req, res) => {
  const { eventCode } = req.query;

  if (!eventCode)
    return res.status(400).json({ error: "eventCode wajib" });

  const filePath = getEventPath(eventCode);

  if (!fs.existsSync(filePath))
    return res.status(404).json({ error: "Event tidak ditemukan" });

  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  res.json({
    eventInfo: data.eventInfo || {},
    pertandingan: data.pertandingan || []
  });
});

/* =========================================================
   GET DATABASE
========================================================= */
app.get("/api/admin/database", (req, res) => {
  const { eventCode } = req.query;

  if (!eventCode)
    return res.status(400).json({ error: "eventCode wajib" });

  const filePath = getEventPath(eventCode);

  if (!fs.existsSync(filePath))
    return res.status(404).json({ error: "Event tidak ditemukan" });

  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  res.json({
    peserta: data.database?.peserta || [],
    panitia: data.database?.panitia || [],
    wasit: data.database?.wasit || [],
    pertandingan: data.pertandingan || []
  });
});

/* =========================================================
   SAVE DATABASE
========================================================= */
app.post("/api/admin/database", (req, res) => {
  const { eventCode, database, pertandingan } = req.body;

  if (!eventCode)
    return res.status(400).json({ error: "eventCode wajib" });

  const filePath = getEventPath(eventCode);

  if (!fs.existsSync(filePath))
    return res.status(404).json({ error: "Event tidak ditemukan" });

  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  if (database) data.database = database;
  if (pertandingan) data.pertandingan = pertandingan;

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

  res.json({ success: true });
});

/* =========================================================
   GET MATCH NUMBER
========================================================= */
app.get("/api/admin/match-number", (req, res) => {
  const { eventCode } = req.query;

  if (!eventCode)
    return res.status(400).json({ error: "eventCode wajib" });

  const filePath = getEventPath(eventCode);

  if (!fs.existsSync(filePath))
    return res.status(404).json({ error: "Event tidak ditemukan" });

  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  res.json(data.pertandingan || []);
});

/* =========================================================
   SAVE MATCH NUMBER
========================================================= */
app.post("/api/admin/match-number", (req, res) => {
  const { eventCode, matchNumber } = req.body;

  if (!eventCode)
    return res.status(400).json({ error: "eventCode wajib" });

  const filePath = getEventPath(eventCode);

  if (!fs.existsSync(filePath))
    return res.status(404).json({ error: "Event tidak ditemukan" });

  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  if (!data.pertandingan) data.pertandingan = [];

  const index = data.pertandingan.findIndex(
    m => String(m.id) === String(matchNumber.id)
  );

  if (index !== -1)
    data.pertandingan[index] = matchNumber;
  else
    data.pertandingan.push(matchNumber);

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

  res.json({ success: true });
});

/* =========================================================
   DELETE MATCH NUMBER
========================================================= */
app.delete("/api/admin/match-number", (req, res) => {
  const { eventCode, id } = req.body;

  if (!eventCode)
    return res.status(400).json({ error: "eventCode wajib" });

  const filePath = getEventPath(eventCode);

  if (!fs.existsSync(filePath))
    return res.status(404).json({ error: "Event tidak ditemukan" });

  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  data.pertandingan = (data.pertandingan || [])
    .filter(m => String(m.id) !== String(id));

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

  res.json({ success: true });
});

/* =========================================================
   GET SCHEDULE
========================================================= */
app.get("/api/admin/schedule", (req, res) => {
  const { eventCode } = req.query;

  if (!eventCode)
    return res.status(400).json({ error: "eventCode wajib" });

  const filePath = getEventPath(eventCode);

  if (!fs.existsSync(filePath))
    return res.status(404).json({ error: "Event tidak ditemukan" });

  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  res.json({
    schedule: data.schedule || {},
    courts: data.schedule?.courts || []
  });
});

/* =========================================================
   SAVE SCHEDULE
========================================================= */
app.post("/api/admin/schedule", (req, res) => {
  const { eventCode, schedule } = req.body;

  if (!eventCode)
    return res.status(400).json({ error: "eventCode wajib" });

  const filePath = getEventPath(eventCode);

  if (!fs.existsSync(filePath))
    return res.status(404).json({ error: "Event tidak ditemukan" });

  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  data.schedule = schedule;

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

  res.json({ success: true });
});

/* =========================================================
   START SERVER
========================================================= */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
