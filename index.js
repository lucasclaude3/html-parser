const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

fs.readFile('test.html', 'utf8', function (err, rawHtml) {
  formattedHtml = formatHtml(rawHtml);
  fs.writeFile('test-formatted.html', formattedHtml, function (err) {
    if (err) {
      throw err;
    }
  });
  parsedHtml = parseHtml(formattedHtml);
  console.log(parsedHtml.documentElement.innerHTML);
});

function formatHtml(rawHtml) {
  let result = rawHtml.replace(/\\"/g, '"');
  result = result.replace(/\\n/g, '\n');
  result = result.replace(/\\r/g, '');
  
  return result;
}

function parseHtml(formattedHtml) {
  const dom = new JSDOM(formattedHtml);
  const document = dom.window.document;

  return document;
}
