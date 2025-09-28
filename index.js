const { connectDB, client } = require("./db");

async function main() {
  const db = await connectDB();
  const collection = db.collection("myCollection");

  const docs = await collection.find({}).toArray();
  console.log("Documents in collection:", docs);

  await client.close();
}

main();
