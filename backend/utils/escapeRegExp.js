'use strict';

/**
 * Escape all regex metacharacters in a string so it can be safely passed to
 * new RegExp() and treated as a literal pattern. Without escaping, user-supplied
 * input containing characters like ( ) . * + ? [ ] ^ $ { } | \ can throw
 * SyntaxError or match unintended strings.
 *
 * Complies with TC39 proposal-regex-escaping (the same set MDN documents).
 */
function escapeRegExp(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = { escapeRegExp };
