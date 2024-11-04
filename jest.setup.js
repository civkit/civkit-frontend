require('@testing-library/jest-dom');

// Polyfill TextEncoder and TextDecoder for Node.js environment
if (typeof TextEncoder === 'undefined') {
  global.TextEncoder = require('util').TextEncoder;
}

if (typeof TextDecoder === 'undefined') {
  global.TextDecoder = require('util').TextDecoder;
}
