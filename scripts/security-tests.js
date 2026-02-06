const assert = require('assert');

function getSafeUrl(value) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed, 'https://example.com');
    if (url.protocol === 'https:' || url.protocol === 'http:') {
      return url.href;
    }
  } catch (error) {
    return null;
  }
  return null;
}

const cases = [
  { input: 'https://example.com', expected: 'https://example.com/' },
  { input: 'http://example.com', expected: 'http://example.com/' },
  { input: 'javascript:alert(1)', expected: null },
  { input: 'data:text/html;base64,PHNjcmlwdD4=', expected: null },
  { input: '   https://example.com/path  ', expected: 'https://example.com/path' }
];

cases.forEach(({ input, expected }) => {
  assert.strictEqual(getSafeUrl(input), expected);
});

console.log('Security tests passed.');
