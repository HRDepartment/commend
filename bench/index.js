const b = require('benny');
const md = require('../index')();
const commonmark = require('commonmark');
const cmReader = new commonmark.Parser();
const cmWriter = new commonmark.HtmlRenderer();
const markdownIt = require('markdown-it')();
const marked = require('marked');
const { Remarkable } = require('remarkable');
const remarkable = new Remarkable();
const snarkdown = require('snarkdown');
const xss = require('xss');
const pkgvs = require('../package-lock.json');

function pkgv(pkg) {
  return pkgvs.dependencies[pkg].version;
}

const sourceTexts = require('./texts.json');
let texts = [];
for (let i = 0; i < 10; i += 1) {
  texts = texts.concat(sourceTexts);
}

b.suite(
  `Chat (${texts.length} lines, ${texts.reduce(
    (len, t) => len + t.length,
    0
  )} chars) converted to HTML`,

  b.add(`commend v${pkgvs.version}`, () => {
    texts.forEach(md);
  }),

  b.add(`commonmark v${pkgv('commonmark')} [unsafe]`, () => {
    texts.forEach((t) => cmWriter.render(cmReader.parse(t)));
  }),

  b.add(`commonmark v${pkgv('commonmark')} ('safe' option)`, () => {
    texts.forEach((t) => cmWriter.render(cmReader.parse(t), { safe: true }));
  }),

  b.add(`markdown-it v${pkgv('markdown-it')}`, () => {
    texts.forEach((t) => markdownIt.render(t));
  }),

  b.add(`marked v${pkgv('marked')} [unsafe]`, () => {
    texts.forEach((t) => marked(t));
  }),

  b.add(`marked v${pkgv('marked')} (+ xss)`, () => {
    texts.forEach((t) => xss(marked(t)));
  }),

  b.add(`remarkable v${pkgv('remarkable')}`, () => {
    texts.forEach((t) => remarkable.render(t));
  }),

  b.add(`snarkdown v${pkgv('snarkdown')} [unsafe]`, () => {
    texts.forEach(snarkdown);
  }),
  b.add(`snarkdown v${pkgv('snarkdown')} (+ xss)`, () => {
    texts.forEach((t) => xss(snarkdown(t)));
  }),

  b.cycle(),
  b.complete()
);
