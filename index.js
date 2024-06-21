const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
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
    const paymentCollection = client.db("EmployeeDB").collection("payment");

    // jwt related api
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);
      res.send({ token });
    });

    // middleware
    const verifyToken = (req, res, next) => {
      // console.log("inside verify token", req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "unauthorized access" });
      }
      const token = req.headers.authorization.split(" ")[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ messasge: "unauthorized access" });
        }
        req.decoded = decoded;
        next();
      });
    };

    // use verify admin after verify token
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const isAdmin = user.role === "admin";
      if (!isAdmin) {
        return res.status(403).send({ message: "forbidden access" });
      }
    };

    // employee info saving to database
    app.post("/users", async (req, res) => {
      const userInfo = req.body;
      // console.log(userInfo);
      const result = await userCollection.insertOne(userInfo);
      res.send(result);
    });

    // taking saved employee info to client side from database
    app.get("/users", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });
    // admin role check
    app.get("/user/admin/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      // console.log(req.decoded.email);
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: "forbidden access" });
      }
      const query = { email: email };
      const user = await userCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === "admin";
      }
      res.send({ admin });
    });
    // hr role check
    app.get("/user/hr/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      // console.log(req.decoded.email);
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: "forbidden access" });
      }
      const query = { email: email };
      const user = await userCollection.findOne(query);
      let hr = false;
      if (user) {
        hr = user?.role === "hr";
      }
      res.send({ hr });
    });

    // taking saved single employee info to client side from database
    app.get("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await userCollection.findOne(query);
      res.send(result);
    });

    // worksheet info saving to database
    app.post("/worksheet", async (req, res) => {
      const workInfo = req.body;
      // console.log(workInfo);
      const result = await worksheetCollection.insertOne(workInfo);
      res.send(result);
    });
    // taking saved worksheet info to client side from database
    app.get("/worksheet", async (req, res) => {
      const result = await worksheetCollection.find().toArray();
      res.send(result);
    });

    // payment to employee info saving to database
    app.post("/payment", async (req, res) => {
      const paymentInfo = req.body;
      // console.log(paymentInfo);
      const result = await paymentCollection.insertOne(paymentInfo);
      res.send(result);
    });

    // taking saved payment info to client side from database
    app.get("/payment", async (req, res) => {
      const result = await paymentCollection.find().toArray();
      res.send(result);
    });

    // make admin (update)
    app.patch(
      "/users/role/:id/:role",
      verifyToken,

      async (req, res) => {
        const id = req.params.id;
        const role = req.params.role;
        const filter = { _id: new ObjectId(id) };
        console.log(filter);
        const updatedDoc = {
          $set: {
            role: role,
          },
        };
        const result = await userCollection.updateOne(filter, updatedDoc);
        res.send(result);
      }
    );

    // verified (update)
    app.patch("/users/:id", async (req, res) => {
      const user_id = req.params.id;
      const user = req.body;
      const filter = { _id: new ObjectId(user_id) };
      const options = { upsert: true };
      const updatedUser = { $set: user };
      const result = await userCollection.updateOne(
        filter,
        updatedUser,
        options
      );
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
