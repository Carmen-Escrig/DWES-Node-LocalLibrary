const Book = require("../models/book");
const Author = require("../models/author");
const Genre = require("../models/genre");
const BookInstance = require("../models/bookinstance");

const async = require("async");
const { body, validationResult } = require("express-validator");

exports.index = async (req, res) => {
  const results = await Promise.all([
    Book.countDocuments({}),
    BookInstance.countDocuments({}),
    BookInstance.countDocuments({ status: "Available" }),
    Author.countDocuments({}),
    Genre.countDocuments({})
  ]);

  res.render("index", {
    title: "Local Library Home",
    error: null,
    data: {
      book_count: results[0],
      book_instance_count: results[1],
      book_instance_available_count: results[2],
      author_count: results[3],
      genre_count: results[4]
    }
  });
};


// Display list of all Books.
exports.book_list = async function (req, res, next) {
  try {
    const list_books = await Book.find({}, "title author")
      .sort({ title: 1 })
      .populate("author")
      .exec();
    res.render("book_list", { title: "Book List", book_list: list_books });
  } catch (err) {
    next(err);
  }
};


// Display detail page for a specific book.
exports.book_detail = async (req, res, next) => {
  try {
    const results = await Promise.all([
      Book.findById(req.params.id)
        .populate("author")
        .populate("genre")
        .exec(),
      BookInstance.find({ book: req.params.id }).exec()
    ]);

    const book = results[0];
    const book_instances = results[1];

    if (book == null) {
      const err = new Error("Book not found");
      err.status = 404;
      return next(err);
    }

    res.render("book_detail", {
      title: book.title,
      book: book,
      book_instances: book_instances
    });
  } catch (err) {
    return next(err);
  }
};

// Display book create form on GET.
exports.book_create_get = async (req, res, next) => {
  try {
    const results = await Promise.all([
      Author.find(),
      Genre.find()
    ]);

    res.render("book_form", {
      title: "Create Book",
      authors: results[0],
      genres: results[1],
    });
  } catch (err) {
    next(err);
  }
};


// Handle book create on POST.
exports.book_create_post = [
  // Convert the genre to an array.
  async (req, res, next) => {
    if (!Array.isArray(req.body.genre)) {
      req.body.genre =
        typeof req.body.genre === "undefined" ? [] : [req.body.genre];
    }
    next();
  },

 // Validate and sanitize fields.
 body("title", "Title must not be empty.")
 .trim()
 .isLength({ min: 1 })
 .escape(),
body("author", "Author must not be empty.")
 .trim()
 .isLength({ min: 1 })
 .escape(),
body("summary", "Summary must not be empty.")
 .trim()
 .isLength({ min: 1 })
 .escape(),
body("isbn", "ISBN must not be empty").trim().isLength({ min: 1 }).escape(),
body("genre.*").escape(),

  // Process request after validation and sanitization.
  async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a Book object with escaped and trimmed data.
    const book = new Book({
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      genre: req.body.genre,
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages.

      // Get all authors and genres for form.
      const results = await Promise.all([
        Author.find(),
        Genre.find()
      ]);

      const authors = results[0];
      const genres = results[1];

      // Mark our selected genres as checked.
      for (const genre of genres) {
        if (book.genre.includes(genre._id)) {
          genre.checked = "true";
        }
      }
      res.render("book_form", {
        title: "Create Book",
        authors: authors,
        genres: genres,
        book,
        errors: errors.array(),
      });
      return;
    }

    // Data from form is valid. Save book.
    try {
      await book.save();
      // Successful: redirect to new book record.
      res.redirect(book.url);
    } catch (err) {
      next(err);
    }
  },
];

// Display book delete form on GET.
exports.book_delete_get = async (req, res, next) => {
  try {
    const results = await Promise.all([
      Book.findById(req.params.id).exec(),
    ]);

    if (results[0] == null) {
      // No results.
      res.redirect("/catalog/books");
    } else {
      // Successful, so render.
      res.render("book_delete", {
        title: "Delete Book",
        book: results[0],
      });
    }
  } catch (err) {
    next(err);
  }
};

// Handle book delete on POST.
exports.book_delete_post = async (req, res, next) => {
  try {
    const results = await Promise.all([
      Book.findById(req.body.bookid).exec(),
    ]);

    const book = results[0];


    // Delete object and redirect to the list of books.
    await Book.findByIdAndDelete(req.body.bookid);
    // Success - go to books list
    res.redirect("/catalog/books");
  } catch (err) {
    next(err);
  }
};

// Display book update form on GET.
exports.book_update_get = async (req, res, next) => {
  try {
    // Get book, authors and genres for form.
    const results = await Promise.all([
      Book.findById(req.params.id).populate("author").populate("genre").exec(),
      Author.find(),
      Genre.find(),
    ]);

    const book = results[0];
    const authors = results[1];
    const genres = results[2];

    if (book == null) {
      // No results.
      const err = new Error("Book not found");
      err.status = 404;
      return next(err);
    }

    // Success.
    // Mark our selected genres as checked.
    for (const genre of genres) {
      for (const bookGenre of book.genre) {
        if (genre._id.toString() === bookGenre._id.toString()) {
          genre.checked = "true";
        }
      }
    }

    res.render("book_form", {
      title: "Update Book",
      authors: authors,
      genres: genres,
      book: book,
    });
  } catch (err) {
    return next(err);
  }
};

// Handle book update on POST.
exports.book_update_post = [
  // Convert the genre to an array
  async (req, res, next) => {
    if (!Array.isArray(req.body.genre)) {
      req.body.genre =
        typeof req.body.genre === "undefined" ? [] : [req.body.genre];
    }
    next();
  },

  // Validate and sanitize fields.
  body("title", "Title must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("author", "Author must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("summary", "Summary must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("isbn", "ISBN must not be empty").trim().isLength({ min: 1 }).escape(),
  body("genre.*").escape(),

  // Process request after validation and sanitization.
  async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a Book object with escaped/trimmed data and old id.
    const book = new Book({
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      genre: typeof req.body.genre === "undefined" ? [] : req.body.genre,
      _id: req.params.id, //This is required, or a new ID will be assigned!
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages.

      // Get all authors and genres for form.
      const results = await Promise.all([
        Author.find(),
        Genre.find()
      ]);

      const [authors, genres] = results;

      // Mark our selected genres as checked.
      for (const genre of genres) {
        if (book.genre.includes(genre._id)) {
          genre.checked = "true";
        }
      }
      res.render("book_form", {
        title: "Update Book",
        authors,
        genres,
        book,
        errors: errors.array(),
      });
      return;
    }

    // Data from form is valid. Update the record.
    const thebook = await Book.findByIdAndUpdate(req.params.id, book, {});

    // Successful: redirect to book detail page.
    res.redirect(thebook.url);
  },
];
