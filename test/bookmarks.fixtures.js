function makeBookmarksArray() {
  return [
    {
      id: 1,
      title: 'Arsène Lupin',
      url: 'https://taobao.com',
      description:
        'Mauris enim leo, rhoncus sed, vestibulum sit amet, cursus id, turpis. Integer aliquet, massa id lobortis convallis, tortor risus dapibus augue, vel accumsan tellus nisi eu orci. Mauris lacinia sapien quis libero.',
      rating: 3
    },
    {
      id: 2,
      title: 'Bulworth',
      url: 'http://paypal.com',
      description:
        'In hac habitasse platea dictumst. Etiam faucibus cursus urna. Ut tellus.',
      rating: 5
    },
    {
      id: 3,
      title: 'Pearl, The (La perla)',
      url: 'http://bizjournals.com',
      description:
        'Nullam sit amet turpis elementum ligula vehicula consequat. Morbi a ipsum. Integer a nibh.',
      rating: 4
    },
    {
      id: 4,
      title: 'Amazing Grace and Chuck',
      url: 'https://hostgator.com',
      description:
        'Quisque id justo sit amet sapien dignissim vestibulum. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Nulla dapibus dolor vel est. Donec odio justo, sollicitudin ut, suscipit a, feugiat et, eros.',
      rating: 1
    },
    {
      id: 5,
      title: 'Thirteen Ghosts (a.k.a. Thir13en Ghosts)',
      url: 'https://bandcamp.com',
      description:
        'Curabitur in libero ut massa volutpat convallis. Morbi odio odio, elementum eu, interdum eu, tincidunt in, leo. Maecenas pulvinar lobortis est.',
      rating: 2
    }
  ];
}


function makeMaliciousBookmark() {
  const maliciousBookmark = {
    id: 666,
    title: 'Naughty naughty very naughty <script>alert("xss");</script>',
    url: 'www.twitter.com', 
    description: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
    rating: 2
  }
  const expectedBookmark = {
    ...maliciousBookmark,
    title: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
    description: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`
  }
  return {
    maliciousBookmark,
    expectedBookmark,
  }
}

module.exports = {
  makeBookmarksArray,
  makeMaliciousBookmark,
}

