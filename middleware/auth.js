const jwt = require("jsonwebtoken");

// variable
const {secret_key} = require("../utils/variables.js");

// middleware
const auth = (req, res, next) => {

    // check token availability
    const token = req.header("x-auth-token");
    if (!token) return res.status(401).send("ابتدا باید وارد حساب کاربری خود شوید");

    try {
        req.user = jwt.verify(token, secret_key);
        next();
    } catch (ex) {
        res.status(400).send("احراز هویت ناموفق بود");
    }
}

module.exports = auth;