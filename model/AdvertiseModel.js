const mongoose = require("mongoose");

// schema variables
const AdvertiseSchema = new mongoose.Schema({
    imageUrl: {
        type: String,
        required: true,
    },
    book: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Book",
        required: true
    },
    isPublished: {
        type: Boolean,
        required: true,
    },
    isRemoved: {
        type: Boolean,
        required: true,
        default: false
    }
}, {timestamps: true, versionKey: false});

// model
const Advertise = mongoose.model("Advertise", AdvertiseSchema);

// exports
module.exports.Advertise = Advertise;
module.exports.AdvertiseSchema = AdvertiseSchema;