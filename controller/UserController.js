const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const fileType = require("file-type");

// variable
const {admin_email , admin_acl , user_acl , image_endpoint , email_service_username} = require("../utils/variables.js");

// model
const {User} = require("../model/UserModel");

// middleware
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const sendMail = require("../middleware/mail");
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
        acl: req.body.email === admin_email ? admin_acl : user_acl,
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

// post (api/user/forget-password)
router.post("/forget-password", async (req, res) => {

    // check user availability
    let user = await User.findOne({email: req.body.email});
    if (!user) return res.status(400).send("کاربری با این مشخصات وجود ندارد");

    // generate random key
    user.forgetKey = user.generateVerifyKey();
    user.expireForgetKey = Date.now() + 2 * 60 * 1000;
    user.save();

    // send mail
    await sendMail({
        from: email_service_username,
        to: req.body.email,
        subject: "بازیابی رمز عبور",
        template: 'email',
        context: {
            subtitle: "کد بازیابی رمز عبور",
            code: user.forgetKey
        }
    });

    res.send({data: {email: req.body.email, expireForgetKey: user.expireForgetKey}});
});

// post (api/user/resend-key)
router.post("/resend-key", async (req, res) => {

    // check user availability
    let user = await User.findOne({email: req.body.email});
    if (!user) return res.status(400).send("کاربری با این مشخصات وجود ندارد");

    // generate random key
    user.forgetKey = user.generateVerifyKey();
    user.expireForgetKey = Date.now() + 2 * 60 * 1000;
    user.save();

    // send mail
    await sendMail({
        from: email_service_username,
        to: req.body.email,
        subject: "بازیابی رمز عبور",
        template: 'email',
        context: {
            subtitle: "کد بازیابی رمز عبور",
            code: user.forgetKey
        }
    });

    res.send({
        data: {email: req.body.email, expireForgetKey: user.expireForgetKey},
        message: "ایمیل کد اعتبار سنجی برای شما ارسال شد"
    });
});

// post (api/user/verify-key)
router.post("/verify-key", async (req, res) => {

    // check user availability
    let user = await User.findOne({email: req.body.email});
    if (!user) return res.status(400).send("کاربری با این مشخصات وجود ندارد");

    if (req.body.forgetKey === user.forgetKey) {
        if (user.expireForgetKey > Date.now()) {
            res.send("کد اعتبارسنجی صحیح است");
        } else {
            res.status(400).send("زمان ۲ دقیقه ای شما به پایان رسیده است");
        }
    } else {
        res.status(400).send("کد اعتبارسنجی اشتباه است");
    }

});

// post (api/user/confirm-password)
router.post("/confirm-password", async (req, res) => {

    // check user availability
    let user = await User.findOne({email: req.body.email});
    if (!user) return res.status(400).send("کاربری با این مشخصات وجود ندارد");

    // validate forget key expire time
    if (user.expireForgetKey < Date.now() + 300) return res.status(400).send("کد اعتبارسنجی فاقد اعتبار است");

    // encrypt password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);
    user.forgetKey = "";
    user.expireForgetKey = 0;
    await user.save();

    // result
    res.send("رمز عبور تغییر کرد");
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
    user.avatarUrl = req.file !== undefined ? `${image_endpoint}/${filename}` : user.avatarUrl;
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


