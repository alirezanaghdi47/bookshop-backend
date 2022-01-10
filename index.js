const dotenv = require("dotenv");
const mongoose = require("mongoose");
const express = require("express");
const bodyParser = require('body-parser');
const cors = require("cors");

dotenv.config();
const app = express();

// variables
const {MONGO_DB_ADDRESS, ORIGIN_1, ORIGIN_2} = process.env;

// connect to database
mongoose.connect(
    MONGO_DB_ADDRESS,
    {useNewUrlParser:true, useUnifiedTopology:true},
    (err) => {
        if (err) {
            console.log(err)
        } else {
            console.log("connected to mongodb")
        }
    });

// middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cors({
    origin: [ORIGIN_1, ORIGIN_2],
    optionsSuccessStatus: 200,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
    credentials: true
}));

// controller
const userController = require("./controller/UserController");
const bookController = require("./controller/BookController");
const categoryController = require("./controller/CategoryController");
const cartController = require("./controller/CartController");
const orderController = require("./controller/OrderController");
const otherController = require("./controller/OtherController");

// routes
app.use("/api/user", userController);
app.use("/api/book", bookController);
app.use("/api/category", categoryController);
app.use("/api/cart", cartController);
app.use("/api/order", orderController);
app.use("/api", otherController);

// connect to backend
const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`listening port ${port}`));