require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const { NODE_ENV } = require('./config');
const bookmarkRouter = require('./bookmark/bookmark-router');
const errorHandler = require('./error-handler')

const app = express();

app.use(
  morgan(NODE_ENV === 'production' ? 'tiny' : 'common', {
    skip: () => NODE_ENV === 'test'
  })
);

app.use(helmet());
app.use(cors());

app.use('/api', bookmarkRouter);

app.use(errorHandler)

module.exports = app;
