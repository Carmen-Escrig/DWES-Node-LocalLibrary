const Book = require("../models/book");
const Author = require("../models/author");
const Genre = require("../models/genre");
const BookInstance = require("../models/bookinstance");

const async = require("async");
const { body, validationResult } = require("express-validator");

// Display list of all Authors.
exports.author_list = async function (req, res, next) {
  try {
    const list_author = await Author.find({}, "first_name family_name date_of_birth date_of_death")
      .sort({ family_name: 1 })
      .exec();
    res.render("author", { title: "Author List", author_list: list_author });
  } catch (err) {
    next(err);
  }
};

// Display detail page for a specific Author.
exports.author_detail = async (req, res, next) => {
  try {
    const results = await Promise.all([
      Author.findById(req.params.id).exec(),
      Book.find({ author: req.params.id }, "title summary").exec()
    ]);

    const author = results[0];
    const authors_books = results[1];

    if (author == null) {
      const err = new Error("Author not found");
      err.status = 404;
      return next(err);
    }

    res.render("author_detail", {
      title: "Author Detail",
      author: author,
      author_books: authors_books
    });
  } catch (err) {
    return next(err);
  }
};

// Display Author create form on GET.
exports.author_create_get = (req, res, next) => {
  res.render("author_form", { title: "Create Author" });
};


// Handle Author create on POST.
exports.author_create_post = [
  // Validate and sanitize fields.
  body("first_name")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("First name must be specified.")
    .isAlphanumeric()
    .withMessage("First name has non-alphanumeric characters."),
  body("family_name")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("Family name must be specified.")
    .isAlphanumeric()
    .withMessage("Family name has non-alphanumeric characters."),
  body("date_of_birth", "Invalid date of birth")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),
  body("date_of_death", "Invalid date of death")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),
  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/errors messages.
      res.render("author_form", {
        title: "Create Author",
        author: req.body,
        errors: errors.array(),
      });
      return;
    }
    // Data from form is valid.

    // Create an Author object with escaped and trimmed data.
    const author = new Author({
      first_name: req.body.first_name,
      family_name: req.body.family_name,
      date_of_birth: req.body.date_of_birth,
      date_of_death: req.body.date_of_death,
    });
    author.save((err) => {
      if (err) {
        return next(err);
      }
      // Successful - redirect to new author record.
      res.redirect(author.url);
    });
  },
];


// Display Author delete form on GET.
exports.author_delete_get = async (req, res, next) => {
  try {
    const results = await Promise.all([
      Author.findById(req.params.id).exec(),
      Book.find({ author: req.params.id }).exec()
    ]);

    if (results[0] == null) {
      // No results.
      res.redirect("/catalog/authors");
    } else {
      // Successful, so render.
      res.render("author_delete", {
        title: "Delete Author",
        author: results[0],
        author_books: results[1]
      });
    }
  } catch (err) {
    next(err);
  }
};

// Handle Author delete on POST.
exports.author_delete_post = async (req, res, next) => {
  try {
    const results = await Promise.all([
      Author.findById(req.body.authorid).exec(),
      Book.find({ author: req.body.authorid }).exec()
    ]);

    const author = results[0];
    const authors_books = results[1];

    // Success
    if (authors_books.length > 0) {
      // Author has books. Render in same way as for GET route.
      res.render("author_delete", {
        title: "Delete Author",
        author: author,
        author_books: authors_books,
      });
      return;
    }

    // Author has no books. Delete object and redirect to the list of authors.
    await Author.findByIdAndRemove(req.body.authorid);
    // Success - go to author list
    res.redirect("/catalog/authors");
  } catch (err) {
    next(err);
  }
};

// Display Author update form on GET.
exports.author_update_get = async (req, res) => {
 try {
    // Get name, family name, date of birth and date of death for form.
    const results = await Promise.all([
      Author.findById(req.params.id).exec(),
    ]);

    const author = results[0];

    if (author == null) {
      // No results.
      const err = new Error("Author not found");
      err.status = 404;
      return next(err);
    }

    // Success.
    res.render("author_form", {
      title: "Update Author",
      author: author,
    });
  } catch (err) {
    return next(err);
  }
};
// Handle Author update on POST.
exports.author_update_post = (req, res) => {
  res.send("NOT IMPLEMENTED: Author update POST");
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