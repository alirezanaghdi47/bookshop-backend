const jwt = require("jsonwebtoken");

// variables
const {SECRET_KEY} = process.env;

// middleware
const auth = (req, res, next) => {

    // check token availability
    const token = req.header("x-auth-token");
    if (!token) return res.status(401).send("ابتدا باید وارد حساب کاربری خود شوید");

    try {
        req.user = jwt.verify(token, SECRET_KEY);
        next();
    } catch (ex) {
        res.status(400).send("احراز هویت ناموفق بود");
    }
}

module.exports = auth;