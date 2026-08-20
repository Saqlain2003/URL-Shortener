const ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const BASE = ALPHABET.length; // 62

//NOTE: Why this works the way it does: you're taking a plain incrementing integer (1, 2, 3...) and converting it to base-62 the same way you'd convert decimal to binary — repeatedly dividing by the base and reading remainders. This guarantees uniqueness for free, because every integer maps to exactly one Base62 string. No collision checks, no random retries.

export const encodeBase62 = (num) => {
  if (num === 0) return ALPHABET[0];

  let result = '';
  while (num > 0) {
    result = ALPHABET[num % BASE] + result;
    num = Math.floor(num / BASE);
  }
  return result;
};

export const decodeBase62 = (str) => {
  let num = 0;
  for (const char of str) {
    const index = ALPHABET.indexOf(char);
    if (index === -1) {
      throw new Error(`Invalid Base62 character: ${char}`);
    }
    num = num * BASE + index;
  }
  return num;
};

// Example usage:
// console.log(decodeBase62(encodeBase62(12345))); // should print 12345
// console.log(decodeBase62('dnh')); // should print 12345