const express = require('express');
const uuid = require('uuid/v4');
const logger = require('../logger');
const { isWebUri } = require('valid-url');
const BookmarksService = require('../bookmarks-service');

const bookmarkRouter = express.Router();
const bodyParser = express.json();

const serialize = bookmark => ({
  id: bookmark.id,
  title: bookmark.title,
  url: bookmark.url,
  description: bookmark.description,
  rating: Number(bookmark.rating)
});

bookmarkRouter
  .route('/bookmarks')
  .get((req, res, next) => {
    BookmarksService.getAllBookmarks(req.app.get('db'))
      .then(bookmarks => {
        res.json(bookmarks.map(serialize));
      })
      .catch(next);
  })

  .post(bodyParser, (req, res) => {
    const { title, url, description, rating } = req.body;

    //Per the bookmark app project instructions, Title and url are required, but description/rating are not
    if (!title) {
      logger.error(`Title is required`);
      return res.status(400).send('Invalid Data');
    }

    if (!url) {
      logger.error(`URL is required`);
      return res.status(400).send('Invalid Data');
    }

    //Validate url...
    if (!isWebUri(url)) {
      logger.error(`Invalid url ${url} provided`);
      return res.status(400).send('Please use a valid url');
    }

    //Validate rating if it is provided
    if (rating) {
      if (!Number.isInteger(rating) || rating > 5 || rating < 0) {
        logger.error(`Invalid rating: ${rating}`);
        return res.status(400).send('Ratings must be between 1 and 5');
      }
    }

    //Assign an id here
    const id = uuid();

    const bookmark = {
      id,
      title,
      url,
      description: !description ? null : description,
      rating: !rating ? null : rating
    };

    bookmarks.push(bookmark);

    res
      .status(201)
      .location(`http://localhost:8000/bookmarks/${id}`)
      .json(bookmark);
  });

bookmarkRouter
  .route('/bookmarks/:id')
  .get((req, res, next) => {
    const { id } = req.params;
    BookmarksService.getById(req.app.get('db'), id)
      .then(bookmark => {
        //if not found...
        if (!bookmark) {
          logger.error(`Bookmark with id ${id} not found.`);
          return res.status(404).json({
            error: { message: `Bookmark doesn't exist` }
          });
        }
        res.json(serialize(bookmark));
      })
      .catch(next);
  })


  .delete((req, res) => {
    const { id } = req.params;
    const bookMarkIndex = bookmarks.findIndex(b => b.id === id);

    if (bookMarkIndex === -1) {
      logger.error(`Bookmark with id ${id} not found`);
      return res.status(404).send('Bookmark not found');
    }

    bookmarks.splice(bookMarkIndex, 1);

    logger.info(`Card with id ${id} is deleted.`);

    res.status(204).end();
  });

module.exports = bookmarkRouter;
