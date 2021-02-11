const test = require('ava');
const commend = require('../index');
const blns = require('big-list-of-naughty-strings/blns.json');
const xss = require('xss');

const options = {
  '**': (text) => `<b>${text}</b>`,
  __: (text) => `<i>${text}</i>`,
  '~~': (text) => `<s>${text}</s>`,
  '-': (items) => `<ul>${items.map((i) => `<li>${i}`).join('')}</ul>`,
  '.': (items) => `<ol>${items.map((i) => `<li>${i}`).join('')}</ol>`,
  // Can be implemented with css:
  // .spoiler { background-color: #000; color: #000; } .spoiler:hover { color: #fff; }
  '||': (text) => `<span class="spoiler">${text}</span>`,
  '<>': (href, text) =>
    // Text defaults to the href if the | part (<link|text>) is not specified
    href.startsWith('http')
      ? `<a href="${href}" rel="nofollow noreferrer noopener">${text}</a>`
      : // Literal < and > characters.
        `&lt;${href}&gt;`,
  '@': (text) => `<a href="/u/${text}">@${text}</a>`,
  '>': (text) => `<blockquote>${text}</blockquote>`,
  // Should a quote be continuous?
  // >> Line 1
  // >> Line 2
  // would be part of the same blockquote in this case, with a <br> newline.
  // If set to false, a new line will end the current quote. This is more desirable for greentexting.
  // Defaults to true.
  '>continuous': true,
  '\n': '<br>\n',
  // You can return '' to hide the text, or not specify the option to not perform that transform
  // E.g. if you don't specify -, it will render as the user typed it.
};

const md = commend(options);
const mdUncontinous = commend({ ...options, '>continuous': false });

const LOREM = {
  [`*Lorem* _ipsum_ ~dolor~ @sit ||amet||, <https://example.com|consectetur adipiscing elit>. <https://example.com>

- Donec vestibulum tristique augue,
- sodales convallis lectus mattis sed.
- Mauris vel elementum nisl.

1. Morbi hendrerit diam lorem,
2. a sagittis nunc viverra vel.
3. Fusce ligula felis, tincidunt nec lacinia ac, luctus vel turpis.

> Phasellus tristique
> ut mauris quis vulputate.

6. ~_*Aenean molestie sit amet*_~
\\*ex nec pellentesque.\\*`]: `<b>Lorem</b> <i>ipsum</i> <s>dolor</s> <a href="/u/sit">@sit</a> <span class="spoiler">amet</span>, <a href="https://example.com" rel="nofollow noreferrer noopener">consectetur adipiscing elit</a>. <a href="https://example.com" rel="nofollow noreferrer noopener">https://example.com</a><br>
<br>
<ul><li> Donec vestibulum tristique augue,<li> sodales convallis lectus mattis sed.<li> Mauris vel elementum nisl.</ul><ol><li> Morbi hendrerit diam lorem,<li> a sagittis nunc viverra vel.<li> Fusce ligula felis, tincidunt nec lacinia ac, luctus vel turpis.</ol><blockquote> Phasellus tristique<br>
 ut mauris quis vulputate.</blockquote><br>
<br>
6. <s><i><b>Aenean molestie sit amet</b></i></s><br>
*ex nec pellentesque.*`,
  [`Lorem _ipsum_ dolor sit amet, _consectetur adipiscing_ *el*it.

1. Proin id massa ut dui sollicitudin *consectetur* eget vitae turpis.
2. Praesent <example.com|scelerisque> auctor tempor.

Viv_amus _fringilla _aliquam risus vitae_ ultricies.

- Duis et rhoncus mauris, id elementum urna. <img src=x onerror=alert(0)>

*Pellentesque habitant *morb*i tristique senectus et* netus et malesuada _fames_ ac turpis egestas.
> Nunc lobortis justo et ligula pulvinar _donec_.`]: `Lorem <i>ipsum</i> dolor sit amet, <i>consectetur adipiscing</i> <b>el</b>it.<br>
<br>
<ol><li> Proin id massa ut dui sollicitudin <b>consectetur</b> eget vitae turpis.<li> Praesent &lt;example.com&gt; auctor tempor.</ol><br>
Viv<i>amus </i>fringilla <i>aliquam risus vitae</i> ultricies.<br>
<br>
<ul><li> Duis et rhoncus mauris, id elementum urna. &lt;img src=x onerror=alert(0)&gt;</ul><br>
<b>Pellentesque habitant </b>morb<b>i tristique senectus et</b> netus et malesuada <i>fames</i> ac turpis egestas.<br>
<blockquote> Nunc lobortis justo et ligula pulvinar <i>donec</i>.</blockquote>`,
};

test('Full example', (t) => {
  for (const lorem in LOREM) {
    t.is(md(lorem), LOREM[lorem]);
  }
});

test('XSS', (t) => {
  t.is(
    md(`<script>alert(1)</script><p><script> @"xss <" onhover="alert(1)">`),
    '&lt;script&gt;alert(1)&lt;/script&gt;&lt;p&gt;&lt;script&gt; <a href="/u/&quot;xss">@&quot;xss</a> &lt;&quot; onhover=&quot;alert(1)&quot;&gt;'
  );
  for (const string of blns) {
    const formatted = md(string);
    t.is(formatted, xss(formatted));
  }
});

test('Single characters', (t) => {
  t.is(md('*'), '*');
  t.is(md('_'), '_');
  t.is(md('~'), '~');
  t.is(md('||'), '||');
  t.is(md('<stuff'), '&lt;stuff');
  t.is(md('@'), '@');
  t.is(md('>'), '<blockquote></blockquote>');
  t.is(md('-'), '-');
  t.is(md('1.'), '<ol><li></ol>');
});

test('Unfinished modifiers across lines', (t) => {
  t.is(md(`>test`), '<blockquote>test</blockquote>');
  t.is(md('10 < 20\nnewline'), '10 &lt; 20<br>\nnewline');
  t.is(md('10 || 20\nnewline'), '10 || 20<br>\nnewline');
  t.is(md('10 || 20 **\nnewline'), '10 || 20 **<br>\nnewline');
});

test('List edge cases', (t) => {
  t.is(md('--> Text'), '<ul><li>-&gt; Text</ul>');
  t.is(
    md(`- start1\nend\n-start2`),
    '<ul><li> start1</ul><br>\nend<br>\n<ul><li>start2</ul>'
  );
  t.is(md(`- *test*`), '<ul><li> <b>test</b></ul>');
  t.is(md(`- **test**`), '<ul><li> **test**</ul>');
  t.is(
    md(`--><script>alert(123)</script>`),
    '<ul><li>-&gt;&lt;script&gt;alert(123)&lt;/script&gt;</ul>'
  );
});

test('Escape character', (t) => {
  t.is(md('\\'), '');
  t.is(md('\\\\'), '\\\\');
  t.is(md('\\a'), '\\a');
  t.is(md('\\-'), '-');
  t.is(md('line1\n\\-'), 'line1<br>\n-');
  t.is(md('\\>'), '&gt;');
});

test('Empty content implicit escape', (t) => {
  t.is(md(`**test**`), '**test**');
  t.is(md(`__test__`), '__test__');
  t.is(md(`~~test~~`), '~~test~~');
  t.is(md(`||||test||||`), '||||test||||');
  t.is(md(`***test***`), '**<b>test</b>**');
});

test('Uncontinous quotes', (t) => {
  t.is(mdUncontinous(`>test`), '<blockquote>test</blockquote>');
  t.is(
    mdUncontinous(`>test\n>test2`),
    '<blockquote>test</blockquote><br>\n<blockquote>test2</blockquote>'
  );
  t.is(mdUncontinous(`>test\nnormal`), '<blockquote>test</blockquote><br>\nnormal');
});
