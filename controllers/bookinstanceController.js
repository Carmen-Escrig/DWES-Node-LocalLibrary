const Book = require("../models/book");
const Author = require("../models/author");
const Genre = require("../models/genre");
const BookInstance = require("../models/bookinstance");

const async = require("async");
const { body, validationResult } = require("express-validator");

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
// Display BookInstance create form on GET.
exports.bookinstance_create_get = async (req, res, next) => {
  try {
    const books = await Book.find({}, "title").exec();
    res.render("bookInstance_form", {
      title: "Create BookInstance",
      book_list: books,
    });
  } catch (err) {
    next(err);
  }
};


// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
  // Validate and sanitize fields.
  body("book", "Book must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("imprint", "Imprint must not be empty")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("status", "Status must not be empty")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("due_back", "Invalid date")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),
  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/errors messages.
      res.render("bookInstance_form", {
        title: "Create Book Instance",
        bookinstance: req.body,
        errors: errors.array(),
      });
      return;
    }
    // Data from form is valid.

    // Create an Author object with escaped and trimmed data.
    const bookInstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
    });
    bookInstance.save((err) => {
      if (err) {
        return next(err);
      }
      // Successful - redirect to new author record.
      res.redirect(bookInstance.url);
    });
  },
];

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
