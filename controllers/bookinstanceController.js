const Book = require("../models/book");
const Author = require("../models/author");
const Genre = require("../models/genre");
const BookInstance = require("../models/bookinstance");

const async = require("async");

exports.bookinstance_list = async function (req, res, next) {
  try {
    const list_instance_books = await BookInstance.find({}, "book status due_back")
      .sort({ book: 1 })
      .populate("book")
      .exec();
    res.render("book_instance", { title: "Book", bookinstance_list: list_instance_books });
  } catch (err) {
    next(err);
  }
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = async (req, res, next) => {
  try {
    const results = await Promise.all([
      BookInstance.findById(req.params.id)
        .populate("book")
        .exec(),
    ]);

    const bookInstance = results[0];

    if (bookInstance == null) {
      const err = new Error("Book not found");
      err.status = 404;
      return next(err);
    }

    res.render("book_instance_detail", {
      title: "Book",
      book_instance: bookInstance,
    });
  } catch (err) {
    return next(err);
  }
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = (req, res) => {
  res.send("NOT IMPLEMENTED: BookInstance create GET");
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = (req, res) => {
  res.send("NOT IMPLEMENTED: BookInstance create POST");
};

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = (req, res) => {
  res.send("NOT IMPLEMENTED: BookInstance delete GET");
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = (req, res) => {
  res.send("NOT IMPLEMENTED: BookInstance delete POST");
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = (req, res) => {
  res.send("NOT IMPLEMENTED: BookInstance update GET");
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = (req, res) => {
  res.send("NOT IMPLEMENTED: BookInstance update POST");
};
