const md = require('../index')();
const texts = require('./3texts.json');
for (let i = 0; i < 1e5; i += 1) {
  texts.forEach(md);
}
