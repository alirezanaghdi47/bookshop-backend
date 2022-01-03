const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();
const fileType = require('file-type');

// variables
const {IMAGE_ENPOINT} = process.env;

// model
const {Book} = require("../model/BookModel");
const {Category} = require("../model/CategoryModel");
const {Advertise} = require("../model/AdvertiseModel");

// middleware
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const {uploadImage, upload} = require("../middleware/upload");

// get (api/book/books)
router.get("/books", [auth, admin], async (req, res) => {

    const page = parseInt(req.query.page > 0 ? req.query.page : 0);
    const limit = parseInt(req.query.limit) || 5;

    const booksCount = await Book
        .find({isRemoved: false})
        .count();

    const books = await Book
        .find({isRemoved: false})
        .populate({
            path: "category",
            model: "Category"
        })
        .skip(page ? page * limit : "")
        .limit(limit ? limit : "")

    res.send({data: books, count: booksCount});
});

// get (api/book/books/:id)
router.get("/books/:id", async (req, res) => {

    // validation book id
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).send("کتابی با این مشخصات وجود ندارد");

    // read book
    const book = await Book
        .findOne({_id: req.params.id, isRemoved: false})
        .populate({
            path: "category",
            model: "Category"
        });

    //result
    res.send(book);
});

// get (api/book/published-books)
router.get("/published-books", async (req, res) => {

    const page = parseInt(req.query.page > 0 ? req.query.page : 0);
    const limit = parseInt(req.query.limit) || 5;
    const search = req.query.search;
    const sort = req.query.sort;

    let books = [];
    let booksCount = 0;

    if (search) {
        booksCount = await Book
            .find({isPublished: true, isRemoved: false, name: {$regex: search, $options: "i"}})
            .count();
        books = await Book
            .find({isPublished: true, name: {$regex: search, $options: "i"}, isRemoved: false})
            .populate({
                path: "category",
                model: "Category"
            })
            .skip(page ? page * limit : "")
            .limit(limit ? limit : "")
            .sort(sort);
    } else {
        booksCount = await Book
            .find({isPublished: true, isRemoved: false})
            .count();
        books = await Book
            .find({isPublished: true, isRemoved: false})
            .populate({
                path: "category",
                model: "Category"
            })
            .skip(page ? page * limit : "")
            .limit(limit ? limit : "")
            .sort(sort);
    }

    // result
    res.send({data: books, count: booksCount});
});

// get (api/book/published-books/:id)
router.get("/published-books/:id", async (req, res) => {

    // validation book id
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).send("کتابی با این مشخصات وجود ندارد");

    // read book
    const book = await Book
        .findOne({_id: req.params.id, isRemoved: false, isPublished: true})
        .populate({
            path: "category",
            model: "Category"
        });

    //result
    res.send(book);
});

// get (api/book/relative-books)
router.get("/relative-books/:id", async (req, res) => {

    // validation book id
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).send("کتابی با این مشخصات وجود ندارد");

    const book = await Book
        .findById(req.params.id)
        .populate({
            path: "category",
            model: "Category",
        });

    const booksCount = await Book
        .find({_id: {$ne: req.params.id}, isPublished: true, isRemoved: false, category: {_id: book.category._id}})
        .count();

    const books = await Book
        .find({_id: {$ne: req.params.id}, isPublished: true, isRemoved: false, category: {_id: book.category._id}})
        .populate({
            path: "category",
            model: "Category",
        })
        .limit(10)
        .sort("-date");

    // result
    res.send({data: books, count: booksCount});
});

// post (api/book/add-book)
router.post("/add-book", [auth, admin, upload.single("image")], async (req, res) => {

    // validation category id
    if (!mongoose.Types.ObjectId.isValid(req.body.category)) return res.status(400).send("دسته بندی با این مشخصات وجود ندارد");

    // check category availability
    const category = await Category.findById(req.body.category);
    if (!category) return res.status(404).send("دسته بندی با این مشخصات وجود ندارد");

    const filetype = await fileType.fromBuffer(req.file.buffer);
    const filename = "book-" + Date.now() + `.${filetype.ext}`;

    // handle book image
    await uploadImage(req.file.buffer, filename, 1920, 1080);

    // add book
    const book = new Book({
        name: req.body.name,
        imageUrl: `${IMAGE_ENPOINT}/${filename}`,
        year: req.body.year,
        lang: req.body.lang,
        pageCount: req.body.pageCount,
        shabak: req.body.shabak,
        price: req.body.price,
        discount: req.body.discount || 0,
        detail: req.body.detail,
        numberInStock: req.body.numberInStock,
        authors: req.body.authors,
        isPublished: req.body.isPublished,
        category: req.body.category
    });

    await book.save();

    res.send("کتاب ایجاد شد");
});

// put (api/book/edit-book/:id)
router.put("/edit-book/:id", [auth, admin, upload.single("image")], async (req, res) => {

    // validation book id
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).send("کتابی با این مشخصات وجود ندارد");

    // validation category id
    if (!mongoose.Types.ObjectId.isValid(req.body.category)) return res.status(400).send("دسته بندی با این مشخصات وجود ندارد");

    // check book availability
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).send("کتابی با این مشخصات وجود ندارد");

    // check category availability
    const category = await Category.findById(req.body.category);
    if (!category) return res.status(404).send("دسته بندی با این مشخصات وجود ندارد");

    const filetype = req.file !== undefined ? await fileType.fromBuffer(req.file?.buffer) : undefined;
    const filename = req.file !== undefined ? "book-" + Date.now() + `.${filetype.ext}` : undefined;

    // upload book if changed
    if (req.file?.buffer) {
        await uploadImage(req.file.buffer, filename, 1920, 1080);
    }

    // edit book
    book.name = req.body.name;
    book.imageUrl = req.file !== undefined ? `${IMAGE_ENPOINT}/${filename}` : book.imageUrl;
    book.year = req.body.year;
    book.lang = req.body.lang;
    book.pageCount = req.body.pageCount;
    book.shabak = req.body.shabak;
    book.price = req.body.price;
    book.discount = req.body.discount || 0;
    book.detail = req.body.detail;
    book.numberInStock = req.body.numberInStock;
    book.authors = req.body.authors;
    book.isPublished = req.body.isPublished;
    book.category = req.body.category;

    await book.save();

    res.send("کتاب ویرایش شد");
});

// delete (api/book/delete-book/:id)
router.delete("/delete-book/:id", [auth, admin], async (req, res) => {

    // validation book id
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).send("کتابی با این مشخصات وجود ندارد");

    // delete book
    const book = await Book.findById(req.params.id);
    book.isRemoved = true;
    await book.save();

    // result
    res.send("کتاب حذف شد");
});

module.exports = router;
