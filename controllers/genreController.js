const Book = require("../models/book");
const Author = require("../models/author");
const Genre = require("../models/genre");
const BookInstance = require("../models/bookinstance");

const async = require("async");
const { body, validationResult } = require("express-validator");

// Display list of all Authors.
exports.genre_list = async function (req, res, next) {
  try {
    const list_genre = await Genre.find({}, "name")
      .sort({ name: 1 })
      .exec();
    res.render("genre", { title: "Genre List", genre_list: list_genre });
  } catch (err) {
    next(err);
  }
};

// Display detail page for a specific Genre.
exports.genre_detail = async (req, res, next) => {
  try {
    const results = await Promise.all([
      Genre.findById(req.params.id).exec(),
      Book.find({ genre: req.params.id }).exec()
    ]);

    const genre = results[0];
    const genre_books = results[1];

    if (genre == null) {
      const err = new Error("Genre not found");
      err.status = 404;
      return next(err);
    }

    res.render("genre_detail", {
      title: "Genre Detail",
      genre: genre,
      genre_books: genre_books
    });
  } catch (err) {
    return next(err);
  }
};

// Display Genre create form on GET.
exports.genre_create_get = async (req, res, next) => {
  res.render("genre_form", { title: "Create Genre" });
};


// Handle Genre create on POST.
exports.genre_create_post = [
  // Validate and sanitize the name field.
  body("name", "Genre name required").trim().isLength({ min: 1 }).escape(),

  // Process request after validation and sanitization.
  async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a genre object with escaped and trimmed data.
    const genre = new Genre({ name: req.body.name });

    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values/error messages.
      res.render("genre_form", {
        title: "Create Genre",
        genre,
        errors: errors.array(),
      });
      return;
    } else {
      try {
        // Data from form is valid.
        // Check if Genre with same name already exists.
        const found_genre = await Genre.findOne({ name: req.body.name }).exec();

        if (found_genre) {
          // Genre exists, redirect to its detail page.
          res.redirect(found_genre.url);
        } else {
          await genre.save();
          // Genre saved. Redirect to genre detail page.
          res.redirect(genre.url);
        }
      } catch (err) {
        return next(err);
      }
    }
  },
];

// Display Genre delete form on GET.
exports.genre_delete_get = async (req, res, next) => {
  try {
    const results = await Promise.all([
      Genre.findById(req.params.id).exec(),
    ]);

    if (results[0] == null) {
      // No results.
      res.redirect("/catalog/genres");
    } else {
      // Successful, so render.
      res.render("genre_delete", {
        title: "Delete Genre",
        genre: results[0],
      });
    }
  } catch (err) {
    next(err);
  }
};

// Handle Genre delete on POST.
exports.genre_delete_post = async (req, res, next) => {
  try {
    const results = await Promise.all([
      Genre.findById(req.body.genreid).exec(),
    ]);

    const genre = results[0];


    // Delete object and redirect to the list of books.
    await Genre.findByIdAndDelete(req.body.genreid);
    // Success - go to books list
    res.redirect("/catalog/genres");
  } catch (err) {
    next(err);
  }
};

// Display Genre update form on GET.
exports.genre_update_get = async (req, res, next) => {
  try {
    // Get genres for form.
    const results = await Promise.all([
      Genre.findById(req.params.id),
    ]);

    const genre = results[0];

    if (genre == null) {
      // No results.
      const err = new Error("Genre not found");
      err.status = 404;
      return next(err);
    }

    // Success.

    res.render("genre_form", {
      title: "Update Genre",
      genre: genre,
    });
  } catch (err) {
    return next(err);
  }
};

// Handle Genre update on POST.
exports.genre_update_post = [

  // Validate and sanitize fields.
  body("name", "Genre name required").trim().isLength({ min: 1 }).escape(),


  // Process request after validation and sanitization.
  async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a Book object with escaped/trimmed data and old id.
    const genre = new Genre({
      name: req.body.name,
      _id: req.params.id, //This is required, or a new ID will be assigned!
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages.

      res.render("genre_form", {
        title: "Update Genre",
        genre: genre,
        errors: errors.array(),
      });
      return;
    }

    // Data from form is valid. Update the record.
    const thegenre = await Genre.findByIdAndUpdate(req.params.id, genre, {});

    // Successful: redirect to book detail page.
    res.redirect(thegenre.url);
  },
];
