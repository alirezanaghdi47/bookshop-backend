// variables
const {ADMIN_ACL} = process.env;

// middleware
const admin = (req, res, next) => {
    if (req.user.acl !== ADMIN_ACL) return res.status(403).send("تنها مدیر سایت به این بخش دسترسی دارد");
    next();
}

module.exports = admin;