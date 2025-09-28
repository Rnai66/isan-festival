const { MongoClient } = require("mongodb");

const uri =
  "mongodb+srv://rnaibro_db_user:8N0wPmLYgoyhaXed@cluster0.s0gno4s.mongodb.net/myDatabase?retryWrites=true&w=majority&appName=Cluster0";

const client = new MongoClient(uri);

async function connectDB() {
  try {
    await client.connect();
    console.log("Connected successfully to MongoDB Atlas");
    return client.db("myDatabase");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
}

module.exports = { connectDB, client };
