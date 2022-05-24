import express from 'express';
import cors from 'cors';
require('dotenv').config();
import { MongoClient, ObjectId, ServerApiVersion } from 'mongodb';

// variable
const port = process.env.PORT || 5000;
const app = express();

// use middleware
app.use(express.json());
const corsConfig = {
  origin: true,
  credentials: true,
};
app.use(cors(corsConfig));
app.options('*', cors(corsConfig));

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.sjrht.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    const partsCollection = client.db('bicycleForLife').collection('parts');
    const reviewsCollection = client.db('bicycleForLife').collection('reviews');

    app.get('/', async (req, res) => {
      res.send('Working');
    });

    // Get all parts
    app.get('/part', async (req, res) => {
      const parts = await partsCollection.find({}).toArray();
      res.send(parts);
    });

    // Get Single part
    app.get('/part/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const part = await partsCollection.findOne(query);
      res.send(part);
    });

    // get all reviews
    app.get('/review', async (req, res) => {
      const reviews = await reviewsCollection.find({}).toArray();
      res.send(reviews);
    });
  } finally {
  }
}
run().catch(console.dir);

app.listen(port, console.log(`Listening to port ${port}`));
