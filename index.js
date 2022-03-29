// run this script: npm run start-dev
const express = require("express");
const { MongoClient, ServerApiVersion } = require("mongodb");
const cors = require("cors");
require("dotenv").config();
const bson = require("bson");

const app = express();
const port = process.env.PORT || 5000;

//midleware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).send("Holla. The TBPL client server is ON");
});

app.listen(port, () => {
  console.log("Server is running on port", port);
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@tbpl-web.0khaa.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    const database = client.db(`${process.env.DB_NAME}`);

    // ALL useCollection API
    const userCollection = database.collection(
      `${process.env.DB_COLLECTION_USERS}`
    );

    app.post("/user/add", async (req, res) => {
      const user = req.body;
      const { email } = user;
      const userInfoFromDB = await userCollection.findOne({ email: email });
      console.log(userInfoFromDB);
      if (!userInfoFromDB) {
        const result = await userCollection.insertOne(user);
        console.log(
          `A document was inserted with the _id: ${result.insertedId}`
        );
        console.log(result);
        const userInfoFromDB = await userCollection.findOne({ email: email });
        res.json(userInfoFromDB);
      } else {
        res.json(userInfoFromDB);
      }
    });

    app.post("/user/update", async (req, res) => {
      const user = req.body;
      delete user._id;
      const { email } = user;
      const result = await userCollection.updateOne(
        { email: email },
        { $set: user },
        { upsert: true }
      );
      console.log(result);
      const userInfoFromDB = await userCollection.findOne({ email: email });
      if (result.upsertedCount == 1) {
        console.log(
          `A document was inserted with the _id: ${result.upsertedId}`
        );
        res.json(userInfoFromDB);
      } else {
        res.json(userInfoFromDB);
      }
    });

    app.get("/users/all", (req, res) => {
      userCollection.find().toArray((err, items) => {
        res.send(items);
        err && console.log(err);
      });
    });

    // ALL eventsCollection API
    const eventsCollection = database.collection(
      `${process.env.DB_COLLECTION_EVENTS}`
    );

    app.post("/event/add", async (req, res) => {
      const event = req.body;
      const result = await eventsCollection.insertOne(event);
      console.log(`A document was inserted with the _id: ${result.insertedId}`);
      res.json({
        msg: `A event was inserted with the _id: ${result.insertedId}`,
      });
    });

    app.get("/events/all", (req, res) => {
      eventsCollection.find().toArray((err, items) => {
        res.send(items);
        err && console.log(err);
      });
    });

    app.get("/event/:id", (req, res) => {
      const id = bson.ObjectId(req.params.id);
      console.log(id);
      eventsCollection.find({ _id: id }).toArray((err, documents) => {
        console.log(documents);
        res.send(documents);
        err && console.log(err);
      });
    });

    app.post("/event/update/:id", async (req, res) => {
      const id = bson.ObjectId(req.params.id);
      const event = req.body;
      delete event._id;
      const result = await eventsCollection.updateOne(
        { _id: id },
        { $set: event },
        { upsert: false }
      );
      {
        result.modifiedCount && console.log(`Event updated _id: ${id}`);
      }
      res.json(event);
    });

    app.post("/event/delete/:id", async (req, res) => {
      const id = bson.ObjectId(req.params.id);
      const result = eventsCollection.deleteOne({ _id: id });
      if (result.deletedCount === 1) {
        console.log("Successfully deleted one document.");
      } else {
        console.log("No documents matched the query. Deleted 0 documents.");
      }
    });

    //EID 2022

    const eidCollection = database.collection(
      `${process.env.DB_COLLECTION_EID2022}`
    );
    app.post("/eid/2022/participant/add", async (req, res) => {
      const participant = req.body;
      delete participant._id;
      const result = await eidCollection.insertOne(participant);
      console.log(`A document was inserted with the _id: ${result.insertedId}`);
      res.json({
        msg: `A eid festival 2022 participant added with the _id: ${result.insertedId}`,
      });
    });

    app.get("/eid/2022/participants/all", (req, res) => {
      eidCollection.find().toArray((err, items) => {
        res.send(items);
        err && console.log(err);
      });
    });

    app.post("/eid/2022/participant/del/:id", async (req, res) => {
      const id = bson.ObjectId(req.params.id);
      const result = eidCollection.deleteOne({ _id: id });
      if (result.deletedCount === 1) {
        console.log("Successfully deleted one document.");
      } else {
        console.log("No documents matched the query. Deleted 0 documents.");
      }
    });
  } finally {
    //await client.close();
  }
}
run().catch(console.dir);
