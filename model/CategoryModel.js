const mongoose = require("mongoose");

// schema variables
const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 60
    },
    slug: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 60
    },
    isRemoved: {
        type: Boolean,
        required: true,
        default: false
    }
}, {timestamps: true , versionKey: false});

// model
const Category = mongoose.model("Category", categorySchema);

// exports
module.exports.Category = Category;
module.exports.categorySchema = categorySchema;
