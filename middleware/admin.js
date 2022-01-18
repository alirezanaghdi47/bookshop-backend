// variable
const {admin_acl} = require("../utils/variables.js");

// middleware
const admin = (req, res, next) => {
    if (req.user.acl !== admin_acl) return res.status(403).send("تنها مدیر سایت به این بخش دسترسی دارد");
    next();
}

module.exports = admin;