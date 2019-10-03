const { expect } = require('chai');
const knex = require('knex');
const app = require('../src/app');
const { makeBookmarksArray } = require('./bookmarks.fixtures');

describe(`Bookmarks Endpoints`, function() {
  let db;

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL
    });
    app.set('db', db);
  });

  after('disconnect from db', () => db.destroy());

  before('clean it up', () => db('bookmarks').truncate());

  afterEach('Clean up', () => db('bookmarks').truncate());

  describe('Get /bookmarks', () => {
    context('There are no bookmarks', () => {
      it('Will send a 200 and empty array', () => {
        return supertest(app)
          .get('/bookmarks')
          .expect(200, []);
      });
    });

    context('There be bookmarks here...', () => {
      const testBookmarks = makeBookmarksArray();

      beforeEach('insert bookmarks', () => {
        return db.into('bookmarks').insert(testBookmarks);
      });

      it('Get /bookmarks responds with 200 and all of the bookmarks', () => {
        return supertest(app)
          .get('/bookmarks')
          .expect(200);
      });
    });
  });

  describe('Get /bookmarks/:bookmark_id', () => {
    context('No bookmarks here', () => {
      it('gives a 404', () => {
        const bookmarkId = 654;
        return supertest(app)
          .get(`/bookmarks/${bookmarkId}`)
          .expect(404, { error: { message: `Bookmark doesn't exist` } });
      });
    });

    context('There be bookmarks afoot', () => {
      const testBookmarks = makeBookmarksArray();

      beforeEach('insert bookmarks', () => {
        return db.into('bookmarks').insert(testBookmarks);
      });

      it('returns the bookmark with the appropriate id', () => {
        const bookmarkId = 3;
        const expected = testBookmarks[bookmarkId - 1];
        return supertest(app)
          .get(`/bookmarks/${bookmarkId}`)
          .expect(200, expected);
      });
    });
  });
});
