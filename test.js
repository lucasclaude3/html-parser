const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const htmlParser = require('./html-parser.js');

describe('Test parsing', () => {
  it('should return the exact same json', () => {
      const inputFile = 'test.html';
      const testFile = 'test-result.json';

      return htmlParser.loadAndParseHtml(inputFile)
        .then(function (parsedHtml) {
          return fs.readFileAsync(testFile, 'utf8')
            .then(function (expectedResult) {
              expect(JSON.parse(expectedResult)).toMatchObject(parsedHtml);
            });
        });
  });
});
