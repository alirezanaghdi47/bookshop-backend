const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const fileType = require("file-type");

// variables
const {ADMIN_EMAIL, ADMIN_ACL, USER_ACL, IMAGE_ENPOINT} = process.env;

// model
const {User} = require("../model/UserModel");

// middleware
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const {uploadAvatar, upload} = require("../middleware/upload");

// get (api/user/users)
router.get("/users", [auth, admin], async (req, res) => {

    const page = parseInt(req.query.page > 0 ? req.query.page : 0);
    const limit = parseInt(req.query.limit) || 5;

    const usersCount = await User.find({_id: {$ne: req.user._id}}).count();

    const users = await User
        .find({_id: {$ne: req.user._id}})
        .skip(page ? page * limit : "")
        .limit(limit ? limit : "")

    res.send({data: users, count: usersCount});
});

// get (api/user/user-info)
router.get("/user-info", auth, async (req, res) => {

    // read user
    const user = await User.findById(req.user._id)

    //result
    res.send(user);
});

// post (api/user/register)
router.post("/register", async (req, res) => {

    // check user availability
    let user = await User.findOne({email: req.body.email});
    if (user) return res.status(400).send("کاربر با ایمیل مشابه وجود دارد");

    // add user
    user = new User({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        acl: req.body.email === ADMIN_EMAIL ? ADMIN_ACL : USER_ACL,
    });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    await user.save();

    // result
    res.send("عضویت کاربر انجام شد");
});

// post (api/user/login)
router.post("/login", async (req, res) => {

    // check user availability
    let user = await User.findOne({email: req.body.email});
    if (!user) return res.status(400).send("کاربری با این مشخصات وجود ندارد");

    // check password & hash password equality
    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) return res.status(400).send("ایمیل یا رمز عبور نادرست است");

    // generate token
    const token = user.generateAuthToken();

    // result
    res.send({data: token, message: "شما به اکانت خود وارد شدید"});
});

// put (api/user/edit-user)
router.put("/edit-user", [auth, upload.single("avatar")], async (req, res) => {

    const filetype = req.file !== undefined ? await fileType.fromBuffer(req.file?.buffer) : undefined;
    const filename = req.file !== undefined ? "avatar-" + Date.now() + `.${filetype.ext}` : undefined;

    // upload user if changed
    if (req.file?.buffer) {
        await uploadAvatar(req.file.buffer, filename);
    }

    // edit user
    const user = await User.findById(req.user._id);
    user.avatarUrl = req.file !== undefined ? `${IMAGE_ENPOINT}/${filename}` : user.avatarUrl;
    user.gender = req.body.gender;
    user.melliCode = req.body.melliCode;
    user.address = req.body.address;
    user.postalCode = req.body.postalCode;
    await user.save();

    // generate token
    const token = user.generateAuthToken();

    // result
    res.send({data: token , message: "اطلاعات کاربری ویرایش شد"});
});

// delete (api/user/delete-avatar)
router.delete("/delete-avatar-user", auth, async (req, res) => {

    const user = await User.findById(req.user._id);
    user.avatarUrl = "";
    user.save();

    // generate token
    const token = user.generateAuthToken();

    // result
    res.send({data: token , message: "عکس پروفایل حذف شد"});
});

// exports
module.exports = router;


