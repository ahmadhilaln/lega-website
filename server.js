const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());

/* =========================================================
   PORT (WAJIB untuk Render)
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
   GET EVENT INFO
========================================================= */
app.get("/api/admin/event", (req, res) => {

  const { eventCode } = req.query;
  if (!eventCode)
    return res.status(400).json({ error: "eventCode wajib" });

  const filePath = getEventPath(eventCode);
  if (!fs.existsSync(filePath))
    return res.status(404).json({ error: "Event tidak ditemukan" });

  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    res.json({
      eventInfo: data.eventInfo || {},
      pertandingan: data.pertandingan || []
    });
  } catch {
    res.status(500).json({ error: "JSON rusak" });
  }
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

  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    res.json({
      peserta: data.database?.peserta || [],
      panitia: data.database?.panitia || [],
      wasit: data.database?.wasit || [],
      pertandingan: data.pertandingan || []
    });

  } catch {
    res.status(500).json({ error: "JSON rusak" });
  }
});

/* =========================================================
   SAVE DATABASE + PERTANDINGAN
========================================================= */
app.post("/api/admin/database", (req, res) => {

  const { eventCode, database, pertandingan } = req.body;

  if (!eventCode)
    return res.status(400).json({ error: "eventCode wajib" });

  const filePath = getEventPath(eventCode);
  if (!fs.existsSync(filePath))
    return res.status(404).json({ error: "Event tidak ditemukan" });

  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    if (database) data.database = database;
    if (pertandingan) data.pertandingan = pertandingan;

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    res.json({ success: true });

  } catch {
    res.status(500).json({ error: "Gagal menyimpan data" });
  }
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

  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    res.json(data.pertandingan || []);
  } catch {
    res.status(500).json({ error: "JSON rusak" });
  }
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

  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    if (!data.pertandingan) {
      data.pertandingan = [];
    }

    const index = data.pertandingan.findIndex(
      m => String(m.id) === String(matchNumber.id)
    );

    if (index !== -1) {
      data.pertandingan[index] = matchNumber;
    } else {
      data.pertandingan.push(matchNumber);
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal menyimpan pertandingan" });
  }
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

  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    data.pertandingan = (data.pertandingan || [])
      .filter(m => String(m.id) !== String(id));

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    res.json({ success: true });

  } catch {
    res.status(500).json({ error: "Gagal menghapus pertandingan" });
  }
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

  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    res.json({
      schedule: data.schedule || {},
      courts: data.schedule?.courts || []
    });

  } catch {
    res.status(500).json({ error: "JSON rusak" });
  }
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

  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    data.schedule = schedule;

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    res.json({ success: true });

  } catch {
    res.status(500).json({ error: "Gagal menyimpan schedule" });
  }
});

/* =========================================================
   START SERVER
========================================================= */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});