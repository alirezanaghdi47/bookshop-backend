const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();
const fileType = require('file-type');

// variables
const {IMAGE_ENPOINT} = process.env;

// model
const {Advertise} = require("../model/AdvertiseModel");
const {Book} = require("../model/BookModel");

// middleware
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const {uploadAdvertise, upload} = require("../middleware/upload");

// get (api/advertise/advertises)
router.get("/advertises", async (req, res) => {

    const page = parseInt(req.query.page > 0 ? req.query.page : 0);
    const limit = parseInt(req.query.limit) || 5;

    const advertiseCount = await Advertise.find({isRemoved: false}).count();

    const advertises = await Advertise
        .find({isRemoved: false})
        .populate({
            path: "book",
            model: "Book"
        })
        .skip(page ? page * limit : "")
        .limit(limit ? limit : "")

    res.send({data: advertises, count: advertiseCount});
});

// get (api/advertise/published-advertises)
router.get("/published-advertises", async (req, res) => {

    const page = parseInt(req.query.page > 0 ? req.query.page : 0);
    const limit = parseInt(req.query.limit) || 5;

    const advertiseCount = await Advertise.find({isPublished: true, isRemoved: false}).count();

    const advertises = await Advertise
        .find({isPublished: true, isRemoved: false})
        .populate({
            path: "book",
            model: "Book"
        })
        .skip(page ? page * limit : "")
        .limit(limit ? limit : "")

    res.send({data: advertises, count: advertiseCount});
});

// get (api/advertise/advertises/:id)
router.get("/advertises/:id", async (req, res) => {

    const advertise = await Advertise.findOne({_id: req.params.id, isRemoved: false})

        .populate({
            path: "book",
            model: "Book"
        })

    res.send(advertise);
});


// post (api/advertise/add-advertise)
router.post("/add-advertise", [auth, admin, upload.single("image")], async (req, res) => {

    // validation book id
    if (!mongoose.Types.ObjectId.isValid(req.body.book)) return res.status(400).send("کتابی با این مشخصات وجود ندارد");

    // check book availability
    const book = await Book.findById(req.body.book);
    if (!book) return res.status(404).send("invalid book");

    const filetype = await fileType.fromBuffer(req.file.buffer);
    const filename = "advertise-" + Date.now() + `.${filetype.ext}`;

    // handle advertise image
    await uploadAdvertise(req.file.buffer, filename);

    // add advertise
    const advertise = new Advertise({
        imageUrl: `${IMAGE_ENPOINT}/${filename}`,
        book: req.body.book,
        isPublished: req.body.isPublished,
    });

    await advertise.save();

    res.send("تبلیغ ایجاد شد");
});

// put (api/advertise/edit-advertise/:id)
router.put("/edit-advertise/:id", [auth, admin, upload.single("image")], async (req, res) => {

    // validation advertise id
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).send("تبلیغی با این مشخصات وجود ندارد");

    // validation book id
    if (!mongoose.Types.ObjectId.isValid(req.body.book)) return res.status(400).send("کتابی با این مشخصات وجود ندارد");

    // check advertise availability
    const advertise = await Advertise.findById(req.params.id);
    if (!advertise) return res.status(404).send("تبلیغی با این مشخصات وجود ندارد");

    // check book availability
    const book = await Book.findById(req.body.book);
    if (!book) return res.status(404).send("کتابی با این مشخصات وجود ندارد");

    const filetype = req.file !== undefined ? await fileType.fromBuffer(req.file?.buffer) : undefined;
    const filename = req.file !== undefined ? "advertise-" + Date.now() + `.${filetype.ext}` : undefined;

    // upload advertise if changed
    if (req.file?.buffer) {
        await uploadAdvertise(req.file.buffer, filename);
    }

    // edit advertise
    advertise.imageUrl = req.file !== undefined ? `${IMAGE_ENPOINT}/${filename}` : advertise.imageUrl;
    advertise.book = req.body.book;
    advertise.isPublished = req.body.isPublished;

    await advertise.save();

    res.send("تبلیغ ویرایش شد");
});

// delete (api/advertise/delete-advertise/:id)
router.delete("/delete-advertise/:id", [auth, admin], async (req, res) => {

    // validation advertise id
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).send("تبلیغی با این مشخصات وجود ندارد");

    // delete advertise
    const advertise = await Advertise.findById(req.params.id);
    advertise.isRemoved = true
    await advertise.save();

    // result
    res.send("تبلیغ حذف شد");
});

module.exports = router;
