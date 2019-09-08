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
  // Ordered list current number
  var olcurrent = 1;
  // In a list? How many items of the stack are part of this list?
  var liststack = 0;

  function pushmod(mod) {
    var islist = mod === '.' || mod === '-';
    if (islist) {
      // Verify that the list type matches; if not, pop that list (and continue pushing the current one)
      if (liststack && modifiers[modifiers.length - liststack] !== mod) {
        poplist();
      }
    } else if (lastmod === mod) {
      // Matched the previous modifier (e.g. prev modifier * and current modifier * is a ** span)
      popmod();
      return;
    } else if (liststack && mod === '>') {
      // Line start non-list modifiers; need to pop an existing list if it exists (liststack)
      poplist();
    }

    // Push the new modifier on top of the stack and prepare a span
    if (islist || liststack) {
      // If in a list, note that we are adding one item to the list stack (which includes the initial - or .)
      liststack += 1;
    }

    modifiers.push((lastmod = mod));
    out.push('');
  }

  function decoratemod(mod, stack) {
    var decorator = options[mod];
    if (mod === '<>') {
      var parts = stack.split('|');
      var href = parts[0];
      var text = parts.length > 1 ? parts.slice(1).join('|') : href;
      return decorator(href, text);
    }
    return decorator(stack);
  }

  function poplist() {
    var items = [];
    var listtype = modifiers[modifiers.length - liststack];
    while (liststack) {
      if (lastmod === '.' || lastmod === '-') {
        items.push(popout());
      } else {
        popmod();
      }
      liststack -= 1;
    }
    // Convert LIFO (stack) to FIFO (list) - without this the order will always be reverse of the input
    items.reverse();
    var stack = decoratemod(listtype, items);
    emit(stack);
    olcurrent = 1;
  }

  function popmod() {
    var stack = decoratemod(lastmod, popout());
    emit(stack);
  }

  function popout() {
    modifiers.pop();
    lastmod = modifiers.length ? modifiers[modifiers.length - 1] : '';
    return out.pop();
  }

  function emit(character) {
    out[out.length - 1] += character;
  }

  while (c < str.length) {
    var chr = str[c];

    var isnewline = chr === '\n';
    var isescape = chr === '\\';
    if (isnewline) {
      // Pop all existing modifiers when a newline is encountered
      // eslint-disable-next-line
      while (lastmod && lastmod !== '.' && lastmod !== '-') {
        popmod();
      }
      if (!liststack) emit(newline);
    } else if (isescape) {
      // Already escaping. Emit two \
      if (escape) emit('\\\\');
    } else {
      var linestartmatch = false;
      if (linestart) {
        if (chr === '-' || chr === '>') {
          // Ordered list or quote
          pushmod(chr);
          linestartmatch = true;
        } else if (isdigit.test(chr)) {
          // Unordered list
          // Get the number of digits to parse (1: 1, 10: 2, 1000: 4)
          var digits = Math.floor(Math.log10(olcurrent)) + 1;
          // Must have sufficient remaining characters
          if (str.length - c >= digits) {
            var digitstr = str.substr(c, digits);
            var number = Number(digitstr);
            // If the digits match what we expect + a dot, this is a list
            if (number === olcurrent && str[c + digits] === '.') {
              pushmod('.');
              olcurrent += 1;
              linestartmatch = true;
              // Advance by that many digits - 1 (will be incremented below) + 1 (the dot)
              c += digits;
            }
          }
        }

        if (!linestartmatch && liststack) {
          // Currently in a list but the next line isn't one; pop it
          poplist();
        }
      }

      if (!linestartmatch) {
        // \- -> -; \> -> >
        var ismod = chr === '-' || chr === '>';
        if (
          lastmod !== '<>' &&
          (chr === '*' ||
            chr === '_' ||
            chr === '~' ||
            (chr === '|' && str[c + 1] === '|'))
        ) {
          ismod = true;
          if (!escape) {
            if (lastmod === '@') popmod();
            // *, _, ~, ||
            pushmod(chr + chr);
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
          if (lastmod === '@' && chr === ' ') {
            popmod();
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
  if (liststack) poplist();
  while (modifiers.length) popmod();

  return out[0];
}

function spanDecorator(str) {
  return function(text) {
    return str + text + str;
  };
}

function inlineDecorator(str) {
  return function(text) {
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
  '<>': function(href, text) {
    return '&lt;' + href + (text === href ? '' : '|' + text) + '&gt;';
  },
  '-': function(items) {
    return items
      .map(function(i) {
        return '-' + i;
      })
      .join('\n');
  },
  '.': function(items) {
    return items
      .map(function(i, n) {
        return n + '.' + i;
      })
      .join('\n');
  },
  '\n': '\n',
};

module.exports = function(options) {
  var opts = {};
  for (var def in defaults) {
    opts[def] =
      typeof options[def] === (def === '\n' ? 'string' : 'function')
        ? options[def]
        : defaults[def];
  }
  return function(str) {
    return commend(str, options);
  };
};
