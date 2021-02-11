/** @license MIT */
// Written in ES5 in order to not have a compile step

'use strict';

var isdigit = /\d/;

var htmlMap = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#039;',
};

function escapeChar(char) {
  return htmlMap.hasOwnProperty(char) ? htmlMap[char] : char;
}

/** @example <https://github.com/caresx/commend#readme> */
function commend(str, options) {
  if (typeof str !== 'string') {
    str = '' + str;
  }

  options = options || {};
  // Newline to be used
  var newline = options['\n'];
  // default: true
  var continuousquotes = options['>continuous'] !== false;
  // Current character
  var c = 0;
  // Output (stack)
  var out = [''];
  // Modifiers
  var modifiers = [];
  // Optimization: last modifier used ('' if none)
  var lastmod = '';
  // In an escape sequence?
  var escape = false;
  // Start of a new line? Start of document counts too
  var linestart = true;
  // Type of list, if not then we're in a list
  var listtype = ''; // '.' or '-'
  // Number of items in this list
  var listitems = 0;

  function pushmod(mod) {
    if (islistmod(mod)) {
      // Verify that the list type matches; if not, pop that list (and continue pushing the current one)
      if (listtype && listtype !== mod) {
        poplist();
      }
      listtype = mod;
      listitems += 1;
    } else if (lastmod === mod) {
      // Matched the previous modifier (e.g. prev modifier * and current modifier * is a ** span)
      popmod();
      return;
    } else if (listtype && mod === '>') {
      // Start-of-line modifiers (quote) ends the current list; need to pop an existing list if it exists
      poplist();
    }

    modifiers.push((lastmod = mod));
    out.push('');
  }

  function decoratemod(mod, stack) {
    var decorator = options[mod];
    if (mod === '<>') {
      // <https://example.com|example text>
      var parts = stack.split('|');
      var href = parts[0];
      var text = parts.length > 1 ? parts.slice(1).join('|') : href;
      return decorator(href, text);
    }
    return decorator(stack);
  }

  function poplist() {
    var items = [];
    while (listitems) {
      // Pop all modifiers until we reach the list item
      if (lastmod !== listtype) {
        popmod();
      } else if (lastmod === listtype) {
        items.push(popout());
      }
      listitems -= 1;
    }
    // Convert LIFO (stack) to FIFO (list) - without this the order will always be reverse of the input
    items.reverse();

    var stack = decoratemod(listtype, items);
    emit(stack);
    listtype = '';
  }

  function popmod() {
    var stack = decoratemod(lastmod, popout());
    emit(stack);
  }

  function popunfinished() {
    // the first character of the modifier is sufficient except for spoilers (||)
    // need to escape <
    var halfmod = lastmod === '||' ? lastmod : escapeChar(lastmod[0]);
    emit(halfmod + popout());
  }

  // Remove the current modifier, update lastmod, and return the modifier's value on the stack
  function popout() {
    modifiers.pop();
    lastmod = modifiers.length ? modifiers[modifiers.length - 1] : '';
    return out.pop();
  }

  function islistmod(mod) {
    return mod === '.' || mod === '-';
  }

  // Modifier that affects the entire line
  function islinemod(mod) {
    return islistmod(mod) || mod === '>';
  }

  function canpeek(by) {
    return str.length > c + by;
  }

  function peek(by) {
    // Don't go out of bounds, this causes deoptimizations
    return canpeek(by) ? str[c + by] : '';
  }

  function emit(character) {
    out[out.length - 1] += character;
  }

  while (c < str.length) {
    var chr = str[c];

    var isnewline = chr === '\n';
    var isescape = chr === '\\';
    if (isnewline) {
      // Pop all unfinished existing modifiers when a newline is encountered
      // eslint-disable-next-line
      while (lastmod && !islinemod(lastmod)) {
        popunfinished();
      }
      // Qquotes should be ended on a newline unless continous quotes are enabled and the next line is also a quote
      if (lastmod === '>' && (!continuousquotes || (canpeek(1) && peek(1) !== '>'))) {
        popmod();
      }
      if (!listtype) emit(newline);
    } else if (isescape) {
      // Already escaping. Emit two \
      if (escape) {
        emit('\\\\');
      }
    } else {
      var linestartmatch = false;
      if (linestart) {
        if (chr === '-') {
          // Only become a list if there are more characters on this line
          if (canpeek(1) && peek(1) !== '\n') {
            pushmod(chr);
            linestartmatch = true;
          }
        } else if (chr === '>') {
          // Ordered list or quote, except if continuous quotes is enabled and when we're already in a quote in which case it should be appended
          if (!continuousquotes || lastmod !== '>') {
            pushmod(chr);
          }
          // Linestartmatch should be enabled for either case (don't show > when continuing quotes)
          linestartmatch = true;
        } else if (isdigit.test(chr)) {
          // pushmod('.') will close an unordered list but we might still be parsing as if we're in one, so only trust listitems if we're in an ordered list
          var olcurrent = (listtype === '.' ? listitems : 0) + 1;
          // Unordered list
          // Get the number of digits to parse (1: 1, 10: 2, 1000: 4)
          var digits = Math.floor(Math.log10(olcurrent)) + 1;
          // Must have sufficient remaining characters
          if (str.length - c >= digits) {
            var number = Number(str.substr(c, digits));
            // If the digits match what we expect + a dot, this is a list
            if (number === olcurrent && str[c + digits] === '.') {
              pushmod('.');
              linestartmatch = true;
              // Advance by that many (digits - 1) (will be incremented below) + 1 (to compensate for the dot)
              // this brings c to the dot; c will be incremented one more at the end of the loop body
              c += digits;
            }
          }
        }

        if (!linestartmatch && listtype) {
          // Currently in a list but the next line isn't one; pop it
          poplist();
          emit(newline);
        }
      }

      if (!linestartmatch) {
        var ismod = false;
        if (
          lastmod !== '<>' &&
          (chr === '*' || chr === '_' || chr === '~' || (chr === '|' && peek(1) === '|'))
        ) {
          ismod = true;
          if (!escape) {
            if (lastmod === '@') popmod();
            // *, _, ~, ||
            const newmod = chr + chr;
            // Modifiers with no content should be treated as text
            // eg ** should become ** and not an empty b tag
            if (newmod === lastmod && out[out.length - 1] === '') {
              popout();
              emit(newmod);
              if (chr === '|') emit(newmod);
            } else {
              pushmod(newmod);
            }
            // Skip the next | too
            if (chr === '|') {
              c += 1;
            }
          }
        } else if (chr === '@') {
          // Mention
          ismod = true;
          if (!escape) pushmod('@');
        } else if (chr === '<' || (lastmod === '<>' && chr === '>')) {
          // Link
          ismod = true;
          if (!escape) pushmod('<>');
        }

        if (!ismod || escape) {
          // A space character ends @
          if (lastmod === '@' && chr === ' ') {
            popmod();
          }

          // - and > at the start of a line can be escaped; the backslash should not be shown
          if (
            escape &&
            (chr === '-' || chr === '>') &&
            (!canpeek(2) || peek(2) === '\n')
          ) {
            escape = false;
          }

          // Regular character (HTML escape)
          var escaped = escapeChar(chr);
          // Emit a literal \ if this character was not a modifier, otherwise just emit the modifier
          // E.g. \* -> *; \\ -> \\; \a -> \a
          emit(escape && !ismod ? '\\' + escaped : escaped);
        }
      }
    }

    c += 1;
    escape = isescape;
    linestart = isnewline;
  }

  // Cleanup if EOF is reached
  if (listtype) poplist();
  while (lastmod) {
    if (islinemod(lastmod)) {
      popmod();
    } else {
      popunfinished();
    }
  }

  return out[0];
}

function spanDecorator(str) {
  return function (text) {
    return str + text + str;
  };
}

function inlineDecorator(str) {
  return function (text) {
    return str + text;
  };
}

var defaults = {
  '**': spanDecorator('*'),
  __: spanDecorator('_'),
  '~~': spanDecorator('~'),
  '||': spanDecorator('||'),
  '@': inlineDecorator('@'),
  '>': inlineDecorator('>'),
  '>continuous': true,
  '<>': function (href, text) {
    return '&lt;' + href + (text === href ? '' : '|' + text) + '&gt;';
  },
  '-': function (items) {
    return items
      .map(function (i) {
        return '-' + i;
      })
      .join('\n');
  },
  '.': function (items) {
    return items
      .map(function (i, n) {
        return n + '.' + i;
      })
      .join('\n');
  },
  '\n': '\n',
};

module.exports = function (options) {
  var opts = {};
  if (options) {
    for (var def in defaults) {
      opts[def] =
        typeof options[def] === (def === '\n' ? 'string' : 'function')
          ? options[def]
          : defaults[def];
    }
  } else {
    opts = defaults;
  }
  return function (str) {
    return commend(str, opts);
  };
};
