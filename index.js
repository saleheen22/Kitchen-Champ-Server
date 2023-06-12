const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const stripe = require('stripe')(process.env.PAYMENT_SECRET_KEY)

const port = process.env.PORT || 5000;

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rlcgnwx.mongodb.net/?retryWrites=true&w=majority`;



// middleware
app.use(cors());
app.use(express.json());


// verify jwt token
const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ error: true, message: 'unauthorized access' });
  }
  // bearer token
  const token = authorization.split(' ')[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ error: true, message: 'unauthorized access' })
    }
    req.decoded = decoded;
    next();
  })
}




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

    // all the collection name

    const classCollection = client.db('kitchenChamp').collection('class');

    const usersCollection = client.db('kitchenChamp').collection('users');
    const cartsCollection = client.db('kitchenChamp').collection('carts');
    const reviewsCollection = client.db('kitchenChamp').collection('reviews');
    const paymentCollection = client.db("kitchenChamp").collection("payments");







    app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })

      res.send({ token })
    })
    //admiin verify
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email }
      const user = await usersCollection.findOne(query);
      if (user?.role !== 'Admin') {
        return res.status(403).send({ error: true, message: 'forbidden message' });
      }
      next();
    };

    const verifyInstructor = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email }
      const user = await usersCollection.findOne(query);
      if (user?.role !== 'Instructor') {
        return res.status(403).send({ error: true, message: 'forbidden message' });
      }
      next();
    }

    const verifyStudent = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email }
      const user = await usersCollection.findOne(query);
      if (user?.role !== 'Student') {
        return res.status(403).send({ error: true, message: 'forbidden message' });
      }
      next();
    }

    //getting data
    // app.get('/class', async (req, res) => {
    //   const cursor = classCollection.find();
    //   const result = await cursor.toArray();
    //   res.send(result);
    // })

    // users apis
    app.get('/users', verifyJWT, async (req, res) => {
      const cursor = usersCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })

    app.get('/allusers', async (req, res) => {
      const cursor = usersCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })

    app.get('/class', async (req, res) => {
      const cursor = classCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })

    app.get('/class/approve', async (req, res) => {
      let query = { Status: 'Approved' }
      const cursor = classCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    })

    //update the class status
    app.patch('/class/checking/:id', async (req, res) => {
      const id = req.params.id;
      console.log(req.params.query);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          Status: 'Approved'
        },
      };

      const result = await classCollection.updateOne(filter, updateDoc);
      res.send(result);

    })

    app.patch('/class/deny/:id', async (req, res) => {
      const id = req.params.id;
      console.log(req.params.query);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          Status: 'Denied'
        },
      };

      const result = await classCollection.updateOne(filter, updateDoc);
      res.send(result);

    })

    app.patch('/class/feedback/:id', async (req, res) => {
      const id = req.params.id;
      const body = req.body;
      const text = body.feedback;




      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          Feedback: text
        },
      };

      const result = await classCollection.updateOne(filter, updateDoc);
      res.send(result);

    })












    app.post('/users', async (req, res) => {
      var user = req.body;
      user.role = 'Student';

      const query = { email: user.email }
      const existingUser = await usersCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: 'user already exists' })
      }

      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    //student api to add cart

    app.post('/addcart', verifyJWT, async (req, res) => {
      var cart = req.body;

      const query = { classId: cart.classId, studentEmail: cart.studentEmail }
      const existingCart = await cartsCollection.findOne(query);
      if (existingCart) {
        return res.send({ message: 'The class already added' })
      }

      const result = await cartsCollection.insertOne(cart);
      res.send(result);
    });




    ////////////////dkfdkfj
    app.delete('/carts/delete/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await cartsCollection.deleteOne(query);
      res.send(result);
    })





    //admin related
    app.get('/users/admin/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;

      if (req.decoded.email !== email) {
        res.send({ admin: false })
      }

      const query = { email: email }
      const user = await usersCollection.findOne(query);
      const result = { admin: user?.role === 'Admin' }
      res.send(result);
    })

    //update the user role
    app.patch('/users/admin/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: 'Admin',
          isAdminClicked: true,
        },
      };

      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);

    })

    app.patch('/users/instructor/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: 'Instructor',
          isInstClicked: true,
        },
      };

      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);

    })

    // app.patch('/users/adminClk/:id',  async (req, res) => {
    //   const id = req.params.id;
    //   console.log(id);
    //   const filter = { _id: new ObjectId(id) };
    //   const updateDoc = {
    //     $set: {
    //       isAdminClicked: false,
    //     },
    //   };

    //   const result = await usersCollection.updateOne(filter, updateDoc);
    //   res.send(result);

    // }) 


    // app.patch('/users/instClk/:id',  async (req, res) => {
    //   const id = req.params.id;
    //   console.log(id);
    //   const filter = { _id: new ObjectId(id) };
    //   const updateDoc = {
    //     $set: {
    //       isAdminClicked: true,
    //     },
    //   };

    //   const result = await usersCollection.updateOne(filter, updateDoc);
    //   res.send(result);

    // })



    app.get('/users/inst/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;

      if (req.decoded.email !== email) {
        res.send({ inst: false })
      }

      const query = { email: email }
      const user = await usersCollection.findOne(query);
      const result = { inst: user?.role === 'Instructor' }
      res.send(result);
    })


    app.get('/users/student/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;

      if (req.decoded.email !== email) {
        res.send({ student: false })
      }

      const query = { email: email }
      const user = await usersCollection.findOne(query);
      const result = { student: user?.role === "Student" }


      res.send(result);
    })



    // adding class by instructor
    app.post('/addclass', verifyJWT, verifyInstructor, async (req, res) => {
      const newClass = req.body;
      const result = await classCollection.insertOne(newClass)
      res.send(result);
    })


    app.get('/myclass', async (req, res) => {
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email }
      }
      const cursor = classCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    })


    app.get('/mycart', verifyJWT, async (req, res) => {
      let query = {};
      if (req.query?.email) {
        query = { studentEmail: req.query.email }
      }
      const cursor = cartsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    })







    app.get('/instructors1', async (req, res) => {
      let query = { role: 'Instructor' };

      const cursor = usersCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    })

    app.get('/reviews', async (req, res) => {
      const cursor = reviewsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })



    app.post('/create-payment-intent', verifyJWT, async (req, res) => {
      const { price } = req.body;

      const amount = price * 100;
      console.log(amount);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        payment_method_types: ['card']
      });

      res.send({
        clientSecret: paymentIntent.client_secret
      })
    })


    app.post('/payments', verifyJWT, async(req, res) => {
      const payment = req.body;
      const result = await paymentCollection.insertOne(payment);

      const query = {_id: {$in : payment.cartItems.map(id => new ObjectId(id))}}
      const deleteResult = await cartsCollection.deleteMany(query);
      const updateDoc = { $inc: { StudentCount: 1, seats: -1 } }
      const updatequery = { _id: { $in: payment.classId.map(id => new ObjectId(id)) } };
     const updatedResult = classCollection.updateMany(updatequery, updateDoc)
      res.send({result, deleteResult, updatedResult});
    })



















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