const fs = require('fs');
const source = fs.readFileSync('main.js', 'utf8');
const malformedTagRegex = /<\s+(div|h[1-6]|strong)\b/;
const malformedDataAttrRegex = /data\s*-\s*args/;
console.log('Tag match:', malformedTagRegex.exec(source));
console.log('Attr match:', malformedDataAttrRegex.exec(source));
