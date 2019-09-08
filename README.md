# commend

Fast 1.0kB (gzipped) Markdown spin-off, better-suited for chats and comments. Fully configurable. Inspired by [mrkdwn](https://api.slack.com/messaging/composing/formatting).

![npm](https://img.shields.io/npm/v/commend)

## Features

- \*Text\* (Bold)
- \_Text\_ (Italics)
- ~Text~ (Strikethrough)
- \- Text (Unordered list - at the start of a line, and thus only one layer deep)
- \1. Text (Ordered list - at the start of a line, with consecutive numbers starting at 1, only one layer deep)
- ||Text|| (Spoiler)
- \<https://example.com|Text\> (Links)
- @Text (Mention - ended by a space)
- \> Quotes
- nl2br
- \\ serves as an escape for \*, \_, ~, <, |, @, -, or >
- Input is HTML-escaped

If you need to linkify, it's recommended you do that separately beforehand by converting to the \<bracket\> syntax.

Check out [Snarkdown](https://github.com/developit/snarkdown) if you need to use a more fully-featured Markdown parser. commend is opinionated towards (short) messages (no tables or complicated link syntax) where non-technical (no code blocks) users can bring their point across with equal emphasis (no headings). Lists are included as they can be essential for types of threaded comments.

## Usage

```js
import commend from 'commend';

const msg = '*Hello World*!';
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
// Commend wraps your options and ensures all types are set
const md = commend(options);
// commend ensures the message is HTML-escaped
const html = md(msg);
// -> <b>Hello World</b>!
```

Of course, because commend is fully configurable, you can always change the meaning of any of the tags or disable them, and change the output (html tags/classes/attributes) at will.

## License

MIT
