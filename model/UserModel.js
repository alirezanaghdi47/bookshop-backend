const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

// variable
const {secret_key , user_acl} = require("../utils/variables.js");

// schema variables
const userSchema = new mongoose.Schema({
    avatarUrl: {
        type: String,
        default: "",
    },
    name: {
        type: String,
        minlength: 3,
        maxlength: 60,
        required: true,
    },
    email: {
        type: String,
        unique: true,
        minlength: 3,
        maxlength: 60,
        required: true,
    },
    password: {
        type: String,
        minlength: 3,
        maxlength: 1000,
        required: true,
    },
    acl: {
        type: String,
        required: true,
        default: user_acl,
    },
    gender: {
        type: String,
        default: ""
    },
    melliCode: {
        type: String,
        default: "",
    },
    address: {
        type: String,
        maxlength: 1000,
        default: "",
    },
    postalCode: {
        type: String,
        default: "",
    },
    forgetKey: {
        type: String,
        default: ""
    },
    expireForgetKey: {
        type: Number,
        default: 0
    },
}, {timestamps: true, versionKey: false});

// schema methods
userSchema.methods.generateAuthToken = function () {
    return jwt.sign({
        _id: this._id,
        avatarUrl: this.avatarUrl,
        name: this.name,
        email: this.email,
        acl: this.acl,
        gender: this.gender,
        melliCode: this.melliCode,
        address: this.address,
        postalCode: this.postalCode,
    }, secret_key, {expiresIn: "24h"});
}

userSchema.methods.generateVerifyKey = function () {
    let temp = [];
    for (let i = 0; i < 6; i++) {
        temp.push(Math.floor(Math.random() * 10));
    }
    return temp.join("");
}

// model
const User = mongoose.model("User", userSchema);

// exports
module.exports.User = User;