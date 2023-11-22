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
  async (req, res, next) => {
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

    // Create an BookInstance object with escaped and trimmed data.
    const bookInstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
    });
    try {
      await bookInstance.save();
      // Successful - redirect to new author record.
      res.redirect(bookInstance.url);
    } catch (err) {
      next(err);
    }
  },
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = async (req, res, next) => {
  try {
    const results = await Promise.all([
      BookInstance.findById(req.params.id).exec(),
    ]);

    if (results[0] == null) {
      // No results.
      res.redirect("/catalog/bookinstances");
    } else {
      // Successful, so render.
      res.render("book_instance_delete", {
        title: "Delete Book Instance",
        book_instance: results[0],
      });
    }
  } catch (err) {
    next(err);
  }
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = async (req, res, next) => {
  try {
    const results = await Promise.all([
      BookInstance.findById(req.body.bookInstid).exec(),
    ]);

    const book = results[0];


    // Delete object and redirect to the list of book instances.
    await Book.findByIdAndDelete(req.body.bookInstid);
    // Success - go to books instances list
    res.redirect("/catalog/bookinstances");
  } catch (err) {
    next(err);
  }
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = async (req, res, next) => {
  try {
    // Get book instances and books for form.
    const results = await Promise.all([
      BookInstance.findById(req.params.id).populate("book").exec(),
      Book.find(),
    ]);

    const bookInstance = results[0];
    const books = results[1];

    if (bookInstance == null) {
      // No results.
      const err = new Error("Book Instance not found");
      err.status = 404;
      return next(err);
    }

    date = bookInstance.due_back.toISOString().replace(/T/, ' ').replace(/\..+/, '').substring(0, 10);

    // Success.

    res.render("bookInstance_form", {
      title: "Update Book Instance",
      book_list: books,
      bookinstance: bookInstance,
      date : date,
    });
  } catch (err) {
    return next(err);
  }
};


// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
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
  async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a BookInstance object with escaped/trimmed data and old id.
    const bookInstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
      _id: req.params.id, //This is required, or a new ID will be assigned!
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages.

      // Get all books for form.
      const results = await Promise.all([
        Book.find(),
      ]);

      const [books] = results;

      res.render("bookInstance_form", {
        title: "Update Book Instance",
        book_list: books,
        bookinstance: bookInstance,
        errors: errors.array(),
      });
      return;
    }

    // Data from form is valid. Update the record.
    const thebookinst = await BookInstance.findByIdAndUpdate(req.params.id, bookInstance, {});

    // Successful: redirect to book detail page.
    res.redirect(thebookinst.url);
  },
];

