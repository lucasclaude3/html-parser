const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const htmlParser = require('./html-parser.js');

describe('Test parsing', () => {
  it('should return the exact same json', () => {
    const inputFile = 'test.html';
    const testFile = 'test-result.json';

    return htmlParser.loadAndParseHtml(inputFile)
      .then(parsedHtml => fs.readFileAsync(testFile, 'utf8')
        .then((expectedResult) => {
          expect(JSON.parse(expectedResult)).toMatchObject(parsedHtml);
        }));
  });
});
