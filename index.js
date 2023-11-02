const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const cors = require('cors');
const app = express()

const secret = 'veryverysecretamikawkbolbona'

//parsers
app.use(express.json())
app.use(cookieParser())
app.use({
    origin:'http://localhost:5173',
    credentials: true
})

//DB URI
const uri = "mongodb+srv://admin:admin@cluster0.awbitmm.mongodb.net/clean-co?retryWrites=true&w=majority";

// MongoDB Connection

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
        await client.connect();

        // connect collection

        const serviceCollection = client.db('clean-co').collection('services')
        const bookingCollection = client.db('clean-co').collection('bookings')


        // middlewares
        //verfy token and grant access
        const gateman = (req, res , next) => {
            const { token } = req.cookies
        
            //if client does not send token
            if(!token){
                return res.status(401).send({message:'You are not authorized'})
            }

            // verify a token symmetric
            jwt.verify(token,secret, function (err, decoded) {
                if(err){
                    return res.status(401).send({message:'You are not authorized'})
                }
            // attach decoded user so that others can get it
              req.user= decoded
            next()
            });

          
        }


        app.get('/api/v1/services', gateman, async (req, res) => {
            const cursor = serviceCollection.find()
            const result = await cursor.toArray()

            res.send(result)
        })

        app.post('/api/v1/user/create-booking', async (req, res) => {
            const booking = req.body;
            const result = await bookingCollection.insertOne(booking)
            res.send(result)
        })

        // user specific bookings
        app.get('/api/v1/user/bookings',gateman, async (req, res) => {
           
            const queryEmail = req.query.email;
            const tokenEmail = req.user.email
       
            // agei check kre flbo eta match hyse 
            if(queryEmail !== tokenEmail) {
                return  res.status(403).send({message:'forbidden access'})
            }
                
            //query ?email="mir@gmail.com" // email specific
            // query ?   X    // all data 
           let query ={}
           if(queryEmail){
            query.email = queryEmail
           }

           const result = await bookingCollection.find(query).toArray()
           res.send(result)
        })
  
         




        app.delete('/api/v1/user/cancel-booking/:bookingId', async (req, res) => {
            const id = req.params.bookingId
            const query = { _id: new ObjectId(id) }
            const result = await bookingCollection.deleteOne(query)

            res.send(result)

        })


        app.post('/api/v1/auth/access-token', (req, res) => {
            // creating token and send to client
            const user = req.body
            const token = jwt.sign(user, secret, { expiresIn: 60 * 60 })
            // res.send(token)
            res.cookie('token', token, {
                httpOnly: true,
                secure: false,
                sameSite: 'none'
            }).send({ success: true })

        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        //   await client.close();
    }
}
run().catch(console.dir);



const port = 5000

app.get('/', (req, res) => {
    res.send('Hello World!')
})


app.listen(port, () => {
    console.log(`Clean co server is listening on port ${port}`)
})





