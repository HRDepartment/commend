# commend

Tiny & fast Markdown spin-off, better-suited for chats and comments. Fully configurable. Inspired by [mrkdwn](https://api.slack.com/messaging/composing/formatting).

![npm](https://badgen.net/npm/v/commend) ![MIT](https://badgen.net/npm/license/commend) ![types](https://badgen.net/npm/types/commend) ![minified](https://badgen.net/bundlephobia/min/commend) ![minzip](https://badgen.net/bundlephobia/minzip/commend)

## Features

- \*Text\* (Bold)
- \_Text\_ (Italics)
- ~Text~ (Strikethrough)
- \- Text (Unordered list - at the start of a line, and thus only one layer deep)
- \1. Text (Ordered list - at the start of a line, with consecutive numbers starting at 1, only one layer deep)
- ||Text|| (Spoiler)
- \<https://example.com|Text> (Links)
- @Text (Mention - ended by a space)
- \> Quotes
- nl2br
- \\ serves as an escape for \*, \_, ~, <, |, @, -, or >
- Input is HTML-escaped

If you need to linkify, it's recommended you do that separately beforehand by converting to the \<bracket\> syntax.

Check out [remarkable](https://github.com/jonschlinkert/remarkable) if you need a fully-featured Markdown parser, or [Snarkdown](https://github.com/developit/snarkdown) if you want a minimal one. commend is opinionated towards (short) messages (no tables or complicated link syntax) where non-technical (no code blocks) users can bring their point across with equal emphasis (no headings). Lists and quotes are included as they're essential for comment threads.

## Usage

```js
import commend from 'commend';

const msg = '*Hello World*!';
// text is fully escaped
const options = {
  '**': (text) => `<b>${text}</b>`,
  __: (text) => `<i>${text}</i>`,
  '~~': (text) => `<s>${text}</s>`,
  // Can be implemented with css:
  // .spoiler { background-color: #000; color: #000; } .spoiler:hover { color: #fff; }
  '||': (text) => `<span class="spoiler">${text}</span>`,
  '@': (text) => `<a href="/u/${text}">@${text}</a>`,
  // This function is called for every character after the @, in order to determine when to stop parsing mentions,
  // when it returns true. Newlines and other modifiers (such as *) always end the mention as well.
  // In this case, a newline ends the mention. You might want other characters to also end mentions, such as dots,
  // or if you want to potentially support spaces in mentions based on a list of valid mentions,
  // you can use the second argument, which is the full currently parsed mention text,
  // e.g. for @example, ['e', ''], ['x', 'e'], ['a', 'ex'], ...
  '@end': (char, mention) => char === ' ',
  '>': (text) => `<blockquote>${text}</blockquote>`,
  // Should a quote be continuous?
  // >> Line 1
  // >> Line 2
  // would be part of the same blockquote in this case, with a <br> newline.
  // If set to false, a new line will end the current quote. This is more desirable for greentexting.
  // Defaults to true.
  '>continuous': true,
  '<>': (href, text) =>
    // Text defaults to the href if the | part (<link|text>) is not specified
    href.startsWith('http')
      ? `<a href="${href}" rel="nofollow noreferrer noopener">${text}</a>`
      : // Literal < and > characters.
        `&lt;${href}&gt;`,
  '-': (items) => `<ul>${items.map((i) => `<li>${i}`).join('')}</ul>`,
  '.': (items) => `<ol>${items.map((i) => `<li>${i}`).join('')}</ol>`,
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

Of course, because commend's output is fully configurable, you can always change the meaning of any of the tags or disable them, and change the output (html tags/classes/attributes) at will.

## Benchmark

For fun I've included benchmarks against `commonmark`, `markdown-it`, `marked`, `remarkable`, and `snarkdown`, each run on 3 messages that are also valid commend syntax, all using their default settings. The libraries that do not sanitize their output (which commend does out of the box) also have an additional benchmark using `xss` (marked, snarkdown). `commonmark` is unsafe by default, but the `safe` option is actually faster so it's enabled in the benchmark. This benchmark only tests the throughput of the parser, excluding the time taken to initialize the library's parser.

On node v15.8.0, Linux 5.8.0, AMD Ryzen 7 2700X @ 4.00 GHz:

```
Running "Chat (200 messages, 22200 chars) converted to HTML" suite...
  commend v1.2.0:
    2 742 ops/s, ±1.21%   | fastest

  commonmark v0.29.3 ('safe' option):
    911 ops/s, ±1.18%     | 66.78% slower

  markdown-it v12.0.4:
    989 ops/s, ±0.87%     | 63.93% slower

  marked v2.0.0 [unsafe]:
    506 ops/s, ±3.36%     | 81.55% slower

  marked v2.0.0 (+ xss):
    361 ops/s, ±0.43%     | slowest, 86.83% slower

  remarkable v2.0.1:
    1 272 ops/s, ±0.74%   | 53.61% slower

  snarkdown v2.0.0 [unsafe]:
    1 536 ops/s, ±1.06%   | 43.98% slower

  snarkdown v2.0.0 (+ xss):
    877 ops/s, ±0.88%     | 68.02% slower

Finished 8 cases!
  Fastest: commend v1.2.0
  Slowest: marked v2.0.0 (+ xss)
```
