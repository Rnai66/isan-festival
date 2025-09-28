const express = require("express");
const { MongoClient, ObjectId, GridFSBucket } = require("mongodb");
const multer = require("multer");
const path = require("path");

const app = express();
const port = 3000;

const uri = "mongodb+srv://rnaibro_db_user:8N0wPmLYgoyhaXed@cluster0.s0gno4s.mongodb.net/myappy";
const client = new MongoClient(uri);

app.use(express.static("public")); // เสิร์ฟ index.html

let db, bucket;
(async () => {
  await client.connect();
  db = client.db("myappy");
  bucket = new GridFSBucket(db, { bucketName: "banners" });
  console.log("✅ Connected to MongoDB & GridFS ready");
})();

// API: รายชื่อผู้ใช้
app.get("/api/users", async (req, res) => {
  try {
    const users = await db.collection("users").find().toArray();
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

// API: อัปโหลดโปสเตอร์
const upload = multer({ storage: multer.memoryStorage() });
app.post("/api/banners/upload", upload.single("file"), async (req, res) => {
  try {
    const { originalname, mimetype, buffer } = req.file;
    const { title, day, artist } = req.body;

    const uploadStream = bucket.openUploadStream(originalname, {
      contentType: mimetype,
      metadata: { title, day, artist, type: "concert-poster-isan-retro-2569" },
    });

    uploadStream.end(buffer, () => {
      res.json({ ok: true, id: uploadStream.id.toString() });
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Upload error");
  }
});

// API: ลิสต์โปสเตอร์
app.get("/api/banners", async (req, res) => {
  try {
    const files = await db
      .collection("banners.files")
      .find({})
      .project({ _id: 1, filename: 1, uploadDate: 1, metadata: 1 })
      .sort({ "metadata.day": 1 })
      .toArray();
    res.json(files.map(f => ({
      id: f._id,
      filename: f.filename,
      title: f.metadata?.title,
      day: f.metadata?.day,
      artist: f.metadata?.artist
    })));
  } catch (err) {
    console.error(err);
    res.status(500).send("List error");
  }
});

// API: เสิร์ฟรูปจาก GridFS
app.get("/api/banners/:id", async (req, res) => {
  try {
    const _id = new ObjectId(req.params.id);
    const files = await db.collection("banners.files").find({ _id }).toArray();
    if (!files.length) return res.status(404).send("Not found");

    res.setHeader("Content-Type", files[0].contentType || "image/jpeg");
    bucket.openDownloadStream(_id).pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).send("Stream error");
  }
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});

