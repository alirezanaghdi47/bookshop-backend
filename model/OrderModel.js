const mongoose = require("mongoose");

// schema variables
const orderSchema = new mongoose.Schema({
    orderPrice: {
        type: Number,
        required: true,
        min: 0,
    },
    entity: {
        type: Number,
        required: true,
        min: 1,
    },
    book: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Book",
        required: true,
    },
}, {timestamps: true , versionKey: false});

// model
const Order = mongoose.model("Order", orderSchema);

// exports
module.exports.Order = Order;
module.exports.orderSchema = orderSchema;