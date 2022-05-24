import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { MongoClient, ServerApiVersion } from 'mongodb';

// variables
const app = express();
const port = process.env.PORT || 5000;

// use middleware
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

    app.get('/part', async (req, res) => {
      const parts = await partsCollection.find({}).toArray();
      res.send(parts);
    });
  } finally {
  }
}
run().catch(console.dir);

app.listen(port, console.log(`Listening to port ${port}`));
