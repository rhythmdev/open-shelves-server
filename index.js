const express = require('express');
const cors = require('cors');
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 8080;

const corsConfig = {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Origin', 'X-Requested-With', 'Accept', 'x-client-key', 'x-client-token', 'x-client-secret', 'Authorization'],
    credentials: true


}
app.use(cors(corsConfig))
app.options("", cors(corsConfig))


app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hjmkubl.mongodb.net/?retryWrites=true&w=majority`;


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

        const booksCategoryCollection = client.db('openShelves').collection('booksCategory');
        const booksCollection = client.db('openShelves').collection('books');
        const borrowedBooksCollection = client.db('openShelves').collection('borrowedBooks');

        // get books category
        app.get('/api/booksCategory', async (req, res) => {
            const result = await booksCategoryCollection.find().toArray();
            res.send(result)
        })

        // get books by category
        app.get('/api/books/:category', async (req, res) => {
            const category = req.params.category;
            const result = await booksCollection.find({ category: category }).toArray();
            res.send(result);
        })

        //get all books
        app.get('/api/books', async (req, res) => {
            const result = await booksCollection.find().toArray();
            res.send(result);
        })

        // get single book by id
        app.get('/api/singleBook/:id', async (req, res) => {
            const singleBook = req.params.id
            const query = { _id: new ObjectId(singleBook) }
            const result = await booksCollection.findOne(query);
            res.send(result)
        })
        // get borrowed book by email
        app.get('/api/borrowedBook/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            const result = await borrowedBooksCollection.find(query).toArray();
            res.send(result);
        })

        // for borrow book
        app.post('/api/borrowBook', async (req, res) => {
            const borrowedBook = req.body;
            const existingBook = await borrowedBooksCollection.findOne({ email: borrowedBook.email, bookId: borrowedBook.bookId })

            if (existingBook) {
                res.send('You already borrowed this book')
            }
            else {
                const result = await borrowedBooksCollection.insertOne(borrowedBook);
                res.send(result)
            }
        })
        //update book quantity
        app.patch('/api/updateBookQuantity/:bookId', async (req, res) => {
            const bookId = req.params.bookId;
            const previousQuantity = await booksCollection.findOne({ _id: new ObjectId(bookId) })

            const newQuantity = previousQuantity.book_quantity - 1;
            const updateDoc = {
                $set: {
                    book_quantity: newQuantity
                },
            };

            const result = await booksCollection.updateOne({ _id: new ObjectId(bookId) }, updateDoc);
            const updatedBook = await booksCollection.findOne({ _id: new ObjectId(bookId) })

            res.send({ result, updatedBook })

        })

        // for increase book quantity
        app.patch('/api/increaseBookQuantity/:bookId', async (req, res) => {
            const bookId = req.params.bookId;
            const previousQuantity = await booksCollection.findOne({ _id: new ObjectId(bookId) })

            const newIncreasedQuantity = previousQuantity.book_quantity + 1;
            const updateDoc = {
                $set: {
                    book_quantity: newIncreasedQuantity
                },
            };

            const result = await booksCollection.updateOne({ _id: new ObjectId(bookId) }, updateDoc);

            res.send(result)

        })


        // for delete book
        app.delete('/api/returnBook/:id', async (req, res) => {
            const id = req.params.id;
            const result = await borrowedBooksCollection.deleteOne({ _id: new ObjectId(id) });
            res.send(result)
        })

        // update book
        app.put('/api/updateBook/:id', async (req, res) => {
            const id = req.params.id;
            const updateBook = req.body;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updatedBook = {
                $set: {
                    book_name: updateBook.book_name,
                    book_image: updateBook.book_image,
                    author_name: updateBook.author_name,
                    rating: updateBook.rating,
                    category: updateBook.category,
                }
            }
            const result = await booksCollection.updateOne(filter, updatedBook, options);
            res.send(result);
        })





        // for add book
        app.post('/api/addBook', async (req, res) => {
            const newBook = req.body;
            const result = await booksCollection.insertOne(newBook);
            res.send(result);
        })

        // for books categories 
        app.post('/api/booksCategory', async (req, res) => {
            const booksCategory = req.body;
            const result = await booksCategoryCollection.insertOne(booksCategory);
            res.send(result)
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
    res.send('Open Shelves Server Is Running')
})
app.listen(port, () => {
    console.log(`Open Shelves Server Is Running On Port ${port}`);
})