const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();

// model
const {Cart} = require("../model/CartModel");
const {Book} = require("../model/BookModel");
const {Order} = require("../model/OrderModel");

// middleware
const auth = require("../middleware/auth");

// post (api/order/add-order)
router.post("/add-order", auth, async (req, res) => {

    // validation book id
    if (!mongoose.Types.ObjectId.isValid(req.body.book._id)) return res.status(400).send("کتابی با این مشخصات وجود ندارد");

    // decrement book
    const book = await Book.findById(req.body.book._id);

    const openCart = await Cart
        .findOne({isOpen: true, user: req.user._id})
        .populate({
            path: "orders",
        });

    // check open cart is exist or not
    if (!openCart) {

        // add order
        const newOrder = new Order({
            orderPrice: book.price - (book.price * (book.discount / 100)),
            entity: 1,
            book: book._id
        });
        await newOrder.save();

        // add cart
        const order = await Order.findById(newOrder?._id);
        const newCart = new Cart({
            totalPrice: book.price - (book.price * (book.discount / 100)),
            orders: [order._id],
            user: req.user._id
        });
        await newCart.save();

    } else {

        let oldBooks = openCart?.orders?.map(order => order.book._id.toString());
        let oldOrders = openCart?.orders?.map(order => order);

        // check book is equivalent to old books or not
        if (!oldBooks?.includes(book._id.toString())) {

            // add order
            const newOrder = new Order({
                orderPrice: book.price - (book.price * (book.discount / 100)),
                entity: 1,
                book: book._id
            });
            await newOrder.save();

            // edit cart
            const order = await Order.findById(newOrder._id);
            const cart = await Cart.findById(openCart?._id);
            cart.totalPrice += book.price - (book.price * (book.discount / 100));
            cart.orders = [...cart.orders, order._id];
            await cart.save();

        } else {

            // edit order
            const oldOrder = oldOrders.find(order => order.book._id.toString() === book._id.toString());
            oldOrder.entity += 1;
            await oldOrder.save();

            // edit cart
            const cart = await Cart.findById(openCart?._id);
            cart.totalPrice += book.price - (book.price * (book.discount / 100));
            await cart.save();

        }

    }

    // result
    res.send("کتاب به سبد خرید اضافه شد");
});

// put (api/cart/edit-order/:id)
router.put("/edit-order/:id", auth, async (req, res) => {

    // validation book id
    if (!mongoose.Types.ObjectId.isValid(req.body.book._id)) return res.status(400).send("کتابی با این مشخصات وجود ندارد");

    const book = await Book.findById(req.body.book._id);
    const order = await Order.findById(req.params.id);
    const cart = await Cart
        .findOne({isOpen: true, user: req.user._id})
        .populate({
            path: "orders",
        });

    // check entity of order
    if (order.entity > 1) {

        // edit order
        order.entity -= 1;
        await order.save();

        // edit cart
        cart.totalPrice -= book.price - (book.price * (book.discount / 100));
        await cart.save();

    } else {

        // delete order
        await Order.findByIdAndRemove(order._id);

        // edit cart
        cart.totalPrice -= book.price - (book.price * (book.discount / 100));
        cart.orders = cart.orders.filter(item => item._id.toString() !== order._id.toString());
        cart.save();
    }

    // result
    res.send("کتاب از سبد خرید کسر شد");
});

// delete (api/order/delete-order/:id)
router.delete("/delete-order/:id", auth, async (req, res) => {

    // validation book id
    if (!mongoose.Types.ObjectId.isValid(req.body.book._id)) return res.status(400).send("کتابی با این مشخصات وجود ندارد");

    const book = await Book.findById(req.body.book._id);
    const order = await Order.findById(req.params.id);
    const cart = await Cart
        .findOne({isOpen: true, user: req.user._id})
        .populate({
            path: "orders",
        });

    // edit cart
    cart.totalPrice -= (order.entity * (book.price - (book.price * (book.discount / 100))));
    cart.orders = cart.orders.filter(item => item._id.toString() !== order._id.toString());
    cart.save();

    // delete order
    await Order.findByIdAndRemove(order._id);

    // result
    res.send("کتاب از سبد خرید حذف شد");
});

module.exports = router;


