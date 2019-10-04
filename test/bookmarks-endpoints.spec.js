const { expect } = require('chai');
const knex = require('knex');
const app = require('../src/app');
const { makeBookmarksArray, makeMaliciousBookmark } = require('./bookmarks.fixtures');

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

  describe(`POST /bookmarks`, () => {
    it('add a bookmark, responding with 201 and the new bookmark', () => {
      (function() {
        const newBookmark = {
          title: 'New title',
          url: 'new url',
          description: 'new description',
          rating: 3
        };
        return supertest(app)
          .post('/bookmarks')
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
          .post('/bookmarks')
          .send(newBookmark)
          .expect(400, {
            error: { message: `Missing ${field} in request body` }
          });
      });
    });

    it('removes xss attack content from response', () => {
      const {maliciousBookmark, expectedBookmark} = makeMaliciousBookmark()
      return supertest(app)
        .post('/bookmarks')
        .send(maliciousBookmark)
        .expect(201)
        .expect(res=> {
          expect(res.body.title).to.eql(expectedBookmark.title)
          expect(res.body.description).to.eql(expectedBookmark.description)
        })
    })
  });


  describe(`DELETE /bookmarks/:bookmark_id`, () => {
    context(`Given no bookmarks`, () => {
      it(`responds with 404`, () => {
        const bookmarkId = 123456
        return supertest(app)
          .delete(`/bookmarks/${bookmarkId}`)
          .expect(404, { error: { message: `Bookmark doesn't exist` } })
      })
    })

    context('Given there are bookmarks in the database', () => {
      const testbookmarks = makeBookmarksArray()

      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmarks')
          .insert(testbookmarks)
      })

      it('responds with 204 and removes the bookmark', () => {
        const idToRemove = 2
        const expectedbookmarks = testbookmarks.filter(bookmark => bookmark.id !== idToRemove)
        return supertest(app)
          .delete(`/bookmarks/${idToRemove}`)
          .expect(204)
          .then(() =>
            supertest(app)
              .get(`/bookmarks`)
              .expect(expectedbookmarks)
          )
      })
    })
  })

});
