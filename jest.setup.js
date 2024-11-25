require('@testing-library/jest-dom');

// Mock TextEncoder/TextDecoder
class TextEncoderMock {
  encode(str) {
    if (typeof str !== 'string') {
      str = String(str);
    }
    return new Uint8Array(str.split('').map(c => c.charCodeAt(0)));
  }
}

class TextDecoderMock {
  decode(arr) {
    return String.fromCharCode(...arr);
  }
}

global.TextEncoder = TextEncoderMock;
global.TextDecoder = TextDecoderMock;

// Mock window.nostr if needed
global.window.nostr = {
  getPublicKey: jest.fn(),
  signEvent: jest.fn(),
};
