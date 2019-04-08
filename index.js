var fs = require('fs');

fs.readFile('test.html', 'utf8', function (err, rawHtml) {
  formattedHtml = formatHtml(rawHtml);
  fs.writeFile('test-formatted.html', formattedHtml, function (err) {
    if (err) {
      throw err;
    }
  });

  console.log(formattedHtml);
});

function formatHtml(rawHtml) {
  console.log(rawHtml.length);
  let result = rawHtml.replace(/\\"/g, '"');
  result = result.replace(/\\n/g, '\n');
  result = result.replace(/\\r/g, '');
  
  return result;
}
