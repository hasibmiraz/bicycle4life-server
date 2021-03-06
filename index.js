const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const jwt = require('jsonwebtoken');

// variables
const port = process.env.PORT || 5000;
const app = express();

// use middleware
app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.sjrht.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: 'Unauthorized access!' });
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: 'Forbidden access!' });
    }
    req.decoded = decoded;
    next();
  });
};

async function run() {
  try {
    await client.connect();
    const partsCollection = client.db('bicycleForLife').collection('parts');
    const reviewsCollection = client.db('bicycleForLife').collection('reviews');
    const orderCollection = client.db('bicycleForLife').collection('orders');
    const userCollection = client.db('bicycleForLife').collection('users');

    const checkAdmin = async (req, res, next) => {
      const requester = req.decoded.email;
      const requesterAccount = await userCollection.findOne({
        email: requester,
      });
      if (requesterAccount.isAdmin) {
        next();
      } else {
        res.status(403).send({ message: 'Forbidden Access!' });
      }
    };

    app.get('/', (req, res) => {
      res.send('Working');
    });

    // Get all parts for home page
    app.get('/part', async (req, res) => {
      const parts = await partsCollection.find({}).toArray();
      res.send(parts);
    });

    // Get all parts for home page
    app.get('/part/admin', verifyJWT, checkAdmin, async (req, res) => {
      const parts = await partsCollection.find({}).toArray();
      res.send(parts);
    });

    // Add new prdouct
    app.post('/add-product', verifyJWT, checkAdmin, async (req, res) => {
      const order = req.body;
      const result = await partsCollection.insertOne(order);
      res.send({ success: true, result });
    });

    // Get Single part
    app.get('/part/:id', verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const part = await partsCollection.findOne(query);
      res.send(part);
    });

    // Delete product
    app.delete('/product/:id', verifyJWT, checkAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await partsCollection.deleteOne(filter);
      res.send(result);
    });

    // Get Orders of a specific user
    app.get('/part-orders', verifyJWT, async (req, res) => {
      const email = req.query.email;
      const decoded = req.decoded.email;
      if (email === decoded) {
        const query = { email };
        const orders = await orderCollection.find(query).toArray();
        return res.send(orders);
      } else {
        return res.send(403).send({ message: 'Unauthorized access!' });
      }
    });

    // Ship order
    app.put('/order/:id', verifyJWT, checkAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const updatedDoc = {
        $set: {
          shipped: true,
        },
      };
      const result = await orderCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    // Get All orders
    app.get('/all-orders', verifyJWT, checkAdmin, async (req, res) => {
      const result = await orderCollection.find({}).toArray();
      res.send(result);
    });

    // Delete Order
    app.delete('/order/:id', verifyJWT, checkAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await orderCollection.deleteOne(filter);
      res.send(result);
    });

    // Order Parts
    app.post('/part', verifyJWT, async (req, res) => {
      const order = req.body;
      const result = await orderCollection.insertOne(order);
      res.send({ success: true, result });
    });

    // Delete Order
    app.delete('/part/:id', verifyJWT, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await orderCollection.deleteOne(filter);
      res.send(result);
    });

    // get all reviews
    app.get('/review', async (req, res) => {
      const reviews = await reviewsCollection.find({}).toArray();
      res.send(reviews);
    });

    // Create a review
    app.post('/review', verifyJWT, async (req, res) => {
      const review = req.body;
      const result = await reviewsCollection.insertOne(review);
      res.send({ success: true, result });
    });

    // Get all users
    app.get('/user', verifyJWT, async (req, res) => {
      const result = await userCollection.find({}).toArray();
      res.send(result);
    });

    // create user in db
    app.put('/user/:email', async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email };
      const options = { upsert: true };
      const updatedDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(
        filter,
        updatedDoc,
        options
      );
      const token = jwt.sign({ email }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '1d',
      });
      res.send({ result, token });
    });

    // get admins
    app.get('/admin/:email', async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email });
      const isAdmin = user.isAdmin;
      res.send({ admin: isAdmin });
    });

    // Make user admin
    app.put('/user/admin/:email', verifyJWT, checkAdmin, async (req, res) => {
      const email = req.params.email;
      const filter = { email };
      const updatedDoc = {
        $set: {
          isAdmin: true,
        },
      };
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });
  } finally {
  }
}
run().catch(console.dir);

app.listen(port, console.log(`Listening to port ${port}`));
