const mongoose = require("mongoose");

// schema variables
const cartSchema = new mongoose.Schema({
    totalPrice: {
        type: Number,
        required: true,
        min: 0,
    },
    orders: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            required: true,
        }
    ],
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    isOpen: {
        type: Boolean,
        default: true,
    }
}, {timestamps: true , versionKey: false});

// model
const Cart = mongoose.model("Cart", cartSchema);

// exports
module.exports.Cart = Cart;
module.exports.cartSchema = cartSchema;