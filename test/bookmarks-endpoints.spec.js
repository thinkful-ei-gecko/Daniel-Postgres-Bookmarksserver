const { expect } = require('chai');
const knex = require('knex');
const app = require('../src/app');
const {
  makeBookmarksArray,
  makeMaliciousBookmark
} = require('./bookmarks.fixtures');

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

  describe('Get /api/bookmarks', () => {
    context('There are no bookmarks', () => {
      it('Will send a 200 and empty array', () => {
        return supertest(app)
          .get('/api/bookmarks')
          .expect(200, []);
      });
    });

    context('There be bookmarks here...', () => {
      const testBookmarks = makeBookmarksArray();

      beforeEach('insert bookmarks', () => {
        return db.into('bookmarks').insert(testBookmarks);
      });

      it('Get /api/bookmarks responds with 200 and all of the bookmarks', () => {
        return supertest(app)
          .get('/api/bookmarks')
          .expect(200);
      });
    });
  });

  describe('Get /api/bookmarks/:id', () => {
    context('No bookmarks here', () => {
      it('gives a 404', () => {
        const bookmarkId = 654;
        return supertest(app)
          .get(`/api/bookmarks/${bookmarkId}`)
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
          .get(`/api/bookmarks/${bookmarkId}`)
          .expect(200, expected);
      });
    });
  });

  describe(`POST /api/bookmarks`, () => {
    it('add a bookmark, responding with 201 and the new bookmark', () => {
      (function() {
        const newBookmark = {
          title: 'New title',
          url: 'new url',
          description: 'new description',
          rating: 3
        };
        return supertest(app)
          .post('/api/bookmarks')
          .send(newBookmark)
          .expect(res => {
            expect(res.body.title).to.eql(newBookmark.title);
            expect(res.body.url).to.eql(newBookmark.url);
            expect(res.body.description).to.eq(newBookmark.description);
            expect(res.body.rating).to.eql(newBookmark.rating);
          })
          .then(res =>
            supertest(app)
              .get(`bookmarks/${res.body.id}`)
              .expect(res.body)
          );
      });
    });

    const requiredFields = ['title', 'url', 'description', 'rating'];
    requiredFields.forEach(field => {
      const newBookmark = {
        title: 'new title',
        url: 'new url',
        description: 'new description',
        rating: 2
      };

      it(`responds with 400 and an error when the ${field} is missing`, () => {
        delete newBookmark[field];

        return supertest(app)
          .post('/api/bookmarks')
          .send(newBookmark)
          .expect(400, {
            error: { message: `Missing ${field} in request body` }
          });
      });
    });

    it('removes xss attack content from response', () => {
      const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark();
      return supertest(app)
        .post('/api/bookmarks')
        .send(maliciousBookmark)
        .expect(201)
        .expect(res => {
          expect(res.body.title).to.eql(expectedBookmark.title);
          expect(res.body.description).to.eql(expectedBookmark.description);
        });
    });
  });

  describe(`DELETE /api/bookmarks/:id`, () => {
    context(`Given no bookmarks`, () => {
      it(`responds with 404`, () => {
        const bookmarkId = 123456;
        return supertest(app)
          .delete(`/api/bookmarks/${bookmarkId}`)
          .expect(404, { error: { message: `Bookmark doesn't exist` } });
      });
    });

    context('Given there are bookmarks in the database', () => {
      const testbookmarks = makeBookmarksArray();

      beforeEach('insert bookmarks', () => {
        return db.into('bookmarks').insert(testbookmarks);
      });

      it('responds with 204 and removes the bookmark', () => {
        const idToRemove = 2;
        const expectedbookmarks = testbookmarks.filter(
          bookmark => bookmark.id !== idToRemove
        );
        return supertest(app)
          .delete(`/api/bookmarks/${idToRemove}`)
          .expect(204)
          .then(() =>
            supertest(app)
              .get(`/api/bookmarks`)
              .expect(expectedbookmarks)
          );
      });
    });
  });

  describe(`PATCH /api/bookmarks/:id`, () => {
    context(`Given no bookmarks`, () => {
      it(`responds with a 404`, () => {
        const bookmarkId = 654321;
        return supertest(app)
          .patch(`/api/bookmarks/${bookmarkId}`)
          .expect(404, { error: { message: `Bookmark doesn't exist` } });
      });
    });

    context(`Given there are bookmarks in the database`, () => {
      const testBookmarks = makeBookmarksArray()

      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks)
      })

      it('responds with 204 and updates the bookmark', () => {
        const idToUpdate = 2
        const updateBookmark = {
          title: 'updated title', 
          url: 'http://www.google.com',
          description: 'updated description', 
          rating: 2,
        }
        const expectedArticle = {
          ...testBookmarks[idToUpdate -1],
          ...updateBookmark
        }
        return supertest(app)
          .patch(`/api/bookmarks/${idToUpdate}`)
          .send(updateBookmark)
          .expect(204)
          .then(res => 
            supertest(app)
            .get(`/api/bookmarks/${idToUpdate}`)
            .expect(expectedArticle)
          )
      })

      it(`responds with 400 when no required fields given`, () => {
        const idToUpdate = 2
        return supertest(app)
          .patch(`/api/bookmarks/${idToUpdate}`)
          .send({irrelevantField: 'foo'})
          .expect(400, {
            error: {
              message: `Request body must contain either title, url, description, rating`
            }
          })
      })

      it(`responds with 204 when updating only a subset of fields`, () => {
        const idToUpdate = 2
        const updateBookmark = {
          title: 'updated bookmark title',
        }
        const expectedBookmark = {

          TEST BOOKMARKS NEEDS TO BE DEFINED
          // ...testBookmarks[idToUpdate - 1],
          // ...updateBookmark
          title: updateBookmark.title,
          url: testbookmarks[idToUpdate-1].url
        }

        return supertest(app)
          .patch(`/api/bookmarks/${idToUpdate}`)
          .send({
            ...updateBookmark,
            fieldToIgnore: 'should not be in GET response'
          })
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/bookmarks/${idToUpdate}`)
              .expect(expectedBookmark)
          )
      })

      it(`responds with 400 if rating is not between 0 and 5`, () => {
        const idToUpdate = 2
        const updateInvalidRating = {
          rating: 'invalid',
        }
        return supertest(app)
          .patch(`/api/bookmarks/${idToUpdate}`)
          .send(updateInvalidRating)
          .expect(400, {
            error: {
              message: `Rating must be a number between 0 and 5`
            }
          })
      })

      it(`responds with 400 invalid 'url' if not a valid URL`, () => {
        const idToUpdate = 2
        const updateInvalidUrl = {
          url: 'htp://invalid-url',
        }
        return supertest(app)
          .patch(`/api/bookmarks/${idToUpdate}`)
          .send(updateInvalidUrl)
          .expect(400, {
            error: {
              message: `'url' must be a valid URL`
            }
          })
      })
    })
  });
});
