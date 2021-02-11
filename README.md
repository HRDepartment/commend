# commend

Fast 1.1kB (gzipped) Markdown spin-off, better-suited for chats and comments. Fully configurable. Inspired by [mrkdwn](https://api.slack.com/messaging/composing/formatting).

![npm](https://badgen.net/npm/v/commend) ![MIT](https://badgen.net/npm/license/commend) ![types](https://badgen.net/npm/types/commend) ![minified](https://badgen.net/bundlephobia/min/commend) ![minzip](https://badgen.net/bundlephobia/minzip/commend)

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
// text is fully escaped
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
// Commend wraps your options and ensures all types are set
const md = commend(options);
// commend ensures the message is HTML-escaped
const html = md(msg);
// -> <b>Hello World</b>!
```

Of course, because commend is fully configurable, you can always change the meaning of any of the tags or disable them, and change the output (html tags/classes/attributes) at will.

## Benchmark

For fun I've included benchmarks against `commonmark`, `markdown-it`, `marked`, `remarkable`, and `snarkdown`, each run on 3 messages that are also valid commend syntax, all using their default settings. The libraries that do not sanitize their output (which commend does out of the box) also have an additional benchmark using their 'safe' option (commonmark) and/or `xss` (commonmark, marked, snarkdown).

## License

MIT
