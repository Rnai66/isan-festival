const express = require("express");
const { MongoClient, GridFSBucket, ObjectId } = require("mongodb");
const path = require("path");

const app = express();

// ✅ Render ใช้ PORT จาก env
const port = process.env.PORT || 3000;

// ✅ ใช้ MONGODB_URI จาก env
const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/myappy";

// ✅ ป้องกัน TLS error
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  tls: true,
  tlsAllowInvalidCertificates: false,
  minPoolSize: 1,
  maxPoolSize: 5,
  serverSelectionTimeoutMS: 10000
});

let db;
let bucket;

async function connectDB() {
  try {
    await client.connect();
    console.log("✅ MongoDB Connected!");
    db = client.db("myappy");
    bucket = new GridFSBucket(db, { bucketName: "banners" });
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
  }
}
connectDB();

// ✅ serve static files
app.use(express.static(path.join(__dirname, "public")));

// ✅ list banners
app.get("/api/banners", async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: "DB not connected" });
    const files = await db.collection("banners.files").find().toArray();
    res.json(
      files.map((f) => ({
        id: f._id,
        filename: f.filename,
        title: f.metadata?.title,
        day: f.metadata?.day,
        artist: f.metadata?.artist,
      }))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ get banner by ID
app.get("/api/banners/:id", (req, res) => {
  try {
    if (!bucket) return res.status(500).send("DB not connected");
    const id = new ObjectId(req.params.id);
    bucket.openDownloadStream(id).pipe(res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://0.0.0.0:${port}`);
});