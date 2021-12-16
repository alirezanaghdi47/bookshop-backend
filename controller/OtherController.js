const express = require("express");
const router = express.Router();

// model
const {User} = require("../model/UserModel");
const {Cart} = require("../model/CartModel");
const {Book} = require("../model/BookModel");

// middleware
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

// get (api/admin-chart)
router.get("/admin-chart", [auth, admin], async (req, res) => {
    const users = await User.find();
    const carts = await Cart.find({isOpen: false});
    const books = await Book.find();

    res.send({
        totalPrice: carts.map(item => item.totalPrice).reduce((prevValue, total) => total + prevValue, 0),
        booksCount: books.length,
        cartsCount: carts.length,
        usersCount: users.length,
    })
});

// get (api/chart)
router.get("/chart", [auth], async (req, res) => {
    const carts = await Cart.find({user: req.user._id , isOpen: false});

    res.send({
        totalPrice: carts.map(item => item.totalPrice).reduce((previousValue, total) => total + previousValue, 0),
        cartsCount: carts.length,
    })
});


module.exports = router;


