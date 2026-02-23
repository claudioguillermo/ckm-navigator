const fs = require('fs');
const source = fs.readFileSync('main.js', 'utf8');

const malformedTagRegex = /<\s+(div|h[1-6]|strong)\b/g;
const malformedDataAttrRegex = /data\s*-\s*args/g;

let m;
while ((m = malformedTagRegex.exec(source)) !== null) {
  console.log(`Tag match: ${m[0]} at ${m.index}`);
}
while ((m = malformedDataAttrRegex.exec(source)) !== null) {
  if (m[0] !== 'data-args') {
    console.log(`Attr match: '${m[0]}' at ${m.index}`);
  }
}
