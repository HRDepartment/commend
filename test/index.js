import test from 'ava';
import commend from '../index';

const options = {
  '**': text => `<b>${text}</b>`,
  __: text => `<i>${text}</i>`,
  '~~': text => `<s>${text}</s>`,
  '-': items => `<ul>${items.map(i => `<li>${i}`).join('')}</ul>`,
  '.': items => `<ol>${items.map(i => `<li>${i}`).join('')}</ol>`,
  // Can be implemented with css:
  // .spoiler { background-color: #000; color: #000; } .spoiler:hover { color: #fff; }
  '||': text => `<span class="spoiler">${text}</span>`,
  '<>': (href, text) =>
    // Text defaults to href if the | part is not specified
    href.startsWith('http')
      ? `<a href="${href}" rel="nofollow noreferrer noopener">${text}</a>`
      : // If you didn't escape this here, you would more or less be allowing HTML through (very unlikely to be desirable, unless you use a whitelist)
        `&lt;${href}&gt;`,
  '@': text => `<a href="/u/${text}">@${text}</a>`,
  '>': text => `<blockquote>${text}</blockquote>`,
  '\n': '<br>',
  // You can return '' to hide the text, or not specify the option to not perform that transform
  // E.g. if you don't specify -, it will render as the user typed it.
};

const md = commend(options);

const LOREM_RAW = `
*Lorem* _ipsum_ ~dolor~ @sit ||amet||, <https://example.com|consectetur adipiscing elit>. <https://example.com>

- Donec vestibulum tristique augue,
- sodales convallis lectus mattis sed.
- Mauris vel elementum nisl.

1. Morbi hendrerit diam lorem,
2. a sagittis nunc viverra vel.
3. Fusce ligula felis, tincidunt nec lacinia ac, luctus vel turpis.

> Phasellus tristique ut mauris quis vulputate.

6. ~_*Aenean molestie sit amet*_~
\\*ex nec pellentesque.\\*
`;

test('Options', t => {
  t.is(
    md(LOREM_RAW),
    '<br><b>Lorem</b> <i>ipsum</i> <s>dolor</s> <a href="/u/sit">@sit</a> <span class="spoiler">amet</span>, <a href="https://example.com" rel="nofollow noreferrer noopener">consectetur adipiscing elit</a>. <a href="https://example.com" rel="nofollow noreferrer noopener">https://example.com</a><br><br><ul><li> Donec vestibulum tristique augue,<li> sodales convallis lectus mattis sed.<li> Mauris vel elementum nisl.</ul><ol><li> Morbi hendrerit diam lorem,<li> a sagittis nunc viverra vel.<li> Fusce ligula felis, tincidunt nec lacinia ac, luctus vel turpis.</ol><blockquote> Phasellus tristique ut mauris quis vulputate.</blockquote><br><br>6. <s><i><b>Aenean molestie sit amet</b></i></s><br>*ex nec pellentesque.*<br>'
  );
});

test('XSS', t => {
  t.is(
    md(`<script>alert(1)</script><p><script> @"xss <" onhover="alert(1)">`),
    '&lt;script&gt;alert(1)&lt;/script&gt;&lt;p&gt;&lt;script&gt; <a href="/u/&quot;xss">@&quot;xss</a> &lt;&quot; onhover=&quot;alert(1)&quot;&gt;'
  );
});

test('Single characters', t => {
  t.is(md('*'), '<b></b>');
  t.is(md('_'), '<i></i>');
  t.is(md('~'), '<s></s>');
  t.is(md('||'), '<span class="spoiler"></span>');
  t.is(md('<stuff'), '&lt;stuff&gt;');
  t.is(md('@'), '<a href="/u/">@</a>');
  t.is(md('>'), '<blockquote></blockquote>');
  t.is(md('-'), '<ul><li></ul>');
  t.is(md('1.'), '<ol><li></ol>');
});

test('Escape character', t => {
  t.is(md('\\'), '');
  t.is(md('\\\\'), '\\\\');
  t.is(md('\\a'), '\\a');
  t.is(md('\\-'), '-');
  t.is(md('\\>'), '&gt;');
});
