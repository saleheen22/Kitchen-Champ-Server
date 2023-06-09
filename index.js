const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config()
const port = process.env.PORT || 5000;

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rlcgnwx.mongodb.net/?retryWrites=true&w=majority`;



// middleware
app.use(cors());
app.use(express.json());




// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
     client.connect();

<<<<<<< HEAD
     const classCollection = client.db('kitchenChamp').collection('class');
=======
    const classCollections = client.db('kitchenChamp').collection('class');
>>>>>>> 5262a66 (initial setup)

     const usersCollection = client.db('kitchenChamp').collection('users');

     

     //getting data
     app.get('/class', async(req,res) => {
        const cursor = classCollection.find();
        const result = await cursor.toArray();
        res.send(result);
    })

    

<<<<<<< HEAD
=======
   app.get('/class', async(req,res) => {
    const cursor = classCollections.find();
    const result = await cursor.toArray();
    res.send(result);
})

>>>>>>> 5262a66 (initial setup)








    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Kitchen Champ is Running')
  })
  
  app.listen(port, () => {
    console.log(`Kitchen Champ is running on port ${port}`);
  })