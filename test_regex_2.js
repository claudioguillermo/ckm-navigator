const fs = require('fs');
const source = fs.readFileSync('main.js', 'utf8');
const malformedTagRegex = /<\s+(div|h[1-6]|strong)\b/g;
const malformedDataAttrRegex = /data\s*-\s*args/g;
let match;
while ((match = malformedTagRegex.exec(source)) !== null) {
  console.log(`Tag match at index ${match.index}: ${match[0]}`);
  const context = source.substring(match.index - 20, match.index + 20);
  console.log(`Context: ${context}`);
}
while ((match = malformedDataAttrRegex.exec(source)) !== null) {
  console.log(`Attr match at index ${match.index}: ${match[0]}`);
  const context = source.substring(match.index - 20, match.index + 20);
  console.log(`Context: ${context}`);
}
