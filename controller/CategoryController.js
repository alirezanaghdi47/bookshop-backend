const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();

// model
const {Category} = require("../model/CategoryModel");
const {Book} = require("../model/BookModel");

// middleware
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

// get (api/category/categories)
router.get("/categories", [auth, admin], async (req, res) => {

    const page = parseInt(req.query.page > 0 ? req.query.page : 0);
    const limit = parseInt(req.query.limit) || 5;

    const categoriesCount = await Category.find({isRemoved: false}).count();

    const categories = await Category
        .find({isRemoved: false})
        .skip(page ? page * limit : "")
        .limit(limit ? limit : "")

    res.send({data: categories, count: categoriesCount});
});

// get (api/category/categories/:id)
router.get("/categories/:id", [auth, admin], async (req, res) => {

    // validation book id
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).send("دسته بندی با این مشخصات وجود ندارد");

    const category = await Category.findById(req.params.id);

    res.send(category);
});

// post (api/category/add-category)
router.post("/add-category", [auth, admin], async (req, res) => {

    // add category
    const category = new Category({
        name: req.body.name,
        slug: req.body.slug,
    });
    await category.save();

    res.send("دسته بندی ایجاد شد");
});

// put (api/category/edit-category/:id)
router.put("/edit-category/:id", [auth, admin], async (req, res) => {

    // validation category id
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).send("دسته بندی با این مشخصات وجود ندارد");

    // edit category
    const category = await Category.findById(req.params.id);
    category.name = req.body.name;
    category.slug = req.body.slug;
    await category.save();

    res.send("دسته بندی ویرایش شد");
});

// patch (api/category/edit-category-status/:id)
router.patch("/edit-category-status/:id", [auth, admin], async (req, res) => {

    // validation category id
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).send("دسته بندی با این مشخصات وجود ندارد");

    const books = await Book
        .find({isPublished: true})
        .populate({
            path: "category",
            model: "Category"
        });

    // edit book
    for (let i = 0; i < books.length; i++) {
        if (books[i]?.category?._id?.toString() === req.params.id?.toString()){
            const book = await Book.findById(books[i]?._id);
            book.isPublished = false;
            book.save();
        }
    }

    // delete category
    const category = await Category.findById(req.params.id);
    category.isRemoved = true;
    await category.save();

    // result
    res.send("دسته بندی حذف شد");
});


module.exports = router;


