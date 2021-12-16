const mongoose = require("mongoose");

// schema variables
const bookSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 60
    },
    imageUrl: {
        type: String,
        required: true,
    },
    year: {
        type: String,
        required: true,
    },
    lang: {
        type: String,
        required: true,
    },
    pageCount: {
        type: Number,
        required: true,
        min: 0
    },
    shabak: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    discount: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
    },
    detail: {
        type: String,
        required: true,
        minlength: 10,
    },
    numberInStock: {
        type: Number,
        required: true,
        min: 0,
    },
    authors: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 60
    },
    isPublished: {
        type: Boolean,
        required: true,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true
    },
    isRemoved: {
        type: Boolean,
        required: true,
        default: false
    }
}, {timestamps: true, versionKey: false});

bookSchema.index({name: 'text'});

// model
const Book = mongoose.model("Book", bookSchema);

// exports
module.exports.Book = Book;
module.exports.bookSchema = bookSchema;