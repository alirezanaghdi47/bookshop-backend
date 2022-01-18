const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();

// variable
const {email_service_username} = require("../utils/variables");

// model
const {Cart} = require("../model/CartModel");
const {Book} = require("../model/BookModel");
const {Order} = require("../model/OrderModel");

// middleware
const auth = require("../middleware/auth");
const sendMail = require("../middleware/mail");

// get (api/cart/carts)
router.get("/carts", auth, async (req, res) => {

    const page = parseInt(req.query.page > 0 ? req.query.page : 0);
    const limit = parseInt(req.query.limit) || 5;

    // carts count
    const cartsCount = await Cart
        .find({user: req.user._id, isOpen: false})
        .count();

    // find carts
    const carts = await Cart
        .find({user: req.user._id, isOpen: false})
        .skip(page ? page * limit : "")
        .limit(limit ? limit : "")

    // result
    res.send({data: carts, count: cartsCount});
});

// get (api/cart/carts/:id)
router.get("/carts/:id", auth, async (req, res) => {

    // validation cart id
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).send("سبد خریدی با این مشخصات وجود ندارد");

    const cart = await Cart
        .findOne({_id: req.params.id, isOpen: false})
        .populate([
            {
                path: "user",
                model: "User"
            },
            {
                path: "orders",
                populate: {
                    path: "book",
                    populate: {
                        path: "category",
                        model: "Category"
                    }
                }
            }
        ]);

    // result
    res.send(cart);
});

// get (api/cart/open-cart)
router.get("/open-cart", auth, async (req, res) => {

    const cart = await Cart
        .findOne({isOpen: true, user: req.user._id})
        .select({user: 0})
        .populate({
            path: "orders",
            populate: {
                path: "book",
                populate: {
                    path: "category",
                    model: "Category"
                }
            }
        });

    // result
    res.send(cart);
});

// patch (api/cart/edit-cart/:id)
router.patch("/edit-cart/:id", auth, async (req, res) => {

    const cart = await Cart
        .findById(req.params.id)
        .populate({
            path: "orders",
            populate: {
                path: "book",
                populate: {
                    path: "category",
                    model: "Category"
                }
            }
        });

    // check books availability status
    for (let i = 0; i < cart.orders.length; i++) {
        const order = await Order.findById(cart.orders[i]._id);
        const book = await Book.findById(order?.book);

        if (book?.isRemoved || !book?.isPublished) {
            return res.status(400).send(`کتاب ${book?.name} از فروشگاه حذف شده است`);
        } else if (book?.numberInStock === 0) {
            return res.status(400).send(`موجودی کتاب ${book?.name} به پایان رسیده است`);
        } else if (book?.numberInStock < order?.entity) {
            return res.status(400).send(`فقط ${book?.numberInStock} جلد از کتاب ${book?.name} باقی است`);
        }
    }

    // decrement book
    for (let i = 0; i < cart.orders.length; i++) {
        const order = await Order.findById(cart.orders[i]);
        const book = await Book.findById(order?.book);

        book.numberInStock -= order?.entity;
        book.save();
    }

    // edit cart
    cart.isOpen = false;
    cart.save();

    // send mail
    await sendMail({
        from: email_service_username,
        to: req.user.email,
        subject: "سفارش خرید",
        template: 'email',
        context: {
            subtitle: "کد پیگیری سفارش شما",
            code: cart._id
        }
    });


    // result
    res.send("کد پیگیری خرید برای شما ارسال شد");
});

module.exports = router;


