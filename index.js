const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.azafshu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const userCollection = client.db("EmployeeDB").collection("users");
    const worksheetCollection = client.db("EmployeeDB").collection("worksheet");

    // employee info saving to database
    app.post("/users", async (req, res) => {
      const userInfo = req.body;
      console.log(userInfo);
      const result = await userCollection.insertOne(userInfo);
      res.send(result);
    });

    // taking saved employee info to client side from database
    app.get("/users", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });
    app.get("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await userCollection.findOne(query);
      res.send(result);
    });

    // worksheet info saving to database
    app.post("/worksheet", async (req, res) => {
      const workInfo = req.body;
      console.log(workInfo);
      const result = await worksheetCollection.insertOne(workInfo);
      res.send(result);
    });
    // taking saved worksheet info to client side from database
    app.get("/worksheet", async (req, res) => {
      const result = await worksheetCollection.find().toArray();
      res.send(result);
    });

    // ................
    // ................
    // ................
    // pinged info to check connection
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Employee horde is running");
});

app.listen(port, () => {
  console.log(`Employee horde is running on port = ${port}`);
});
