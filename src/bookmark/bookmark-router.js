const express = require('express');
const xss = require('xss');
const path = require('path');
const BookmarksService = require('./bookmarks-service');
const bookmarkRouter = express.Router();
const bodyParser = express.json();

const serialize = bookmark => ({
  id: bookmark.id,
  title: xss(bookmark.title),
  url: bookmark.url,
  description: xss(bookmark.description),
  rating: Number(bookmark.rating)
});

bookmarkRouter
  .route('/bookmarks')
  .get((req, res, next) => {
    console.log('WE ARE NOW IN THIS ROUTE LOOK in get/api/bookmarks')
    BookmarksService.getAllBookmarks(req.app.get('db'))
      .then(bookmarks => {
        res.json(bookmarks.map(serialize));
      })
      .catch(next);
  })

  .post(bodyParser, (req, res, next) => {
    const { title, url, description, rating } = req.body;
    const newBookmark = { title, url, description, rating };

    for (const [key, value] of Object.entries(newBookmark))
      if (value == null)
        return res.status(400).json({
          error: { message: `Missing ${key} in request body` }
        });

    BookmarksService.insertBookmarks(req.app.get('db'), newBookmark)
      .then(bookmark => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${bookmark.id}`))
          .json(serialize(bookmark));
      })
      .catch(next);
  });

bookmarkRouter
  .route('/bookmarks/:id')
  .all((req, res, next) => {
    BookmarksService.getById(req.app.get('db'), req.params.id)
      .then(bookmark => {
        if (!bookmark) {
          return res.status(404).json({
            error: { message: `Bookmark doesn't exist` }
          });
        }
        res.bookmark = bookmark;
        next();
      })
      .catch(next);
  })
  .get((req, res, next) => {
    res.json(serialize(res.bookmark));
  })
  .delete((req, res, next) => {
    BookmarksService.deleteBookmark(req.app.get('db'), req.params.id)
      .then(numRowsAffected => {
        res.status(204).end();
      })
      .catch(next);
  })
  .patch(bodyParser, (req, res, next) => {
    const { title, url, description, rating } = req.body;
    const bookmarkToUpdate = { title, url, description, rating };
      console.log("PATTTTCH")
      console.dir(bookmarkToUpdate)
      console.log(req.params)
    //server validation

    const numberOfValues = Object.values(bookmarkToUpdate).filter(Boolean)
      .length;
    if (numberOfValues === 0) {
      return res.status(400).json({
        error: {
          message: `Request body must contain either title, url, description, rating`
        }
      });
    }

    if (bookmarkToUpdate.rating) {
      if (typeof bookmarkToUpdate.rating !== 'number') {
        return res.status(400).json({
          error: {
            message: `Rating must be a number between 0 and 5`
          }
        })
      }
      if(bookmarkToUpdate.rating > 5 || bookmarkToUpdate.rating < 0) {
        return res.status(400).json({
          error: {
            message: `Rating must be between 0 and 5`
          }
        })
      }
    }

    if (bookmarkToUpdate.url) {
      if (!bookmarkToUpdate.url.includes('http://')) {
        return res.status(400).json({
          error: {
            message: `'url' must be a valid URL`
          }
        })
      }
    }
    BookmarksService.updateBookmark(
      req.app.get('db'),
      req.params.id,
      bookmarkToUpdate
    )
      .then(numRowsAffected => {
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = bookmarkRouter;
