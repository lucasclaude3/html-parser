const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const htmlParser = require('./html-parser.js');

describe('Test html-parser', () => {
  it('should return ok with the exact same json', () => {
    const inputFile = 'test.html';
    const testFile = 'test-result.json';

    return htmlParser.loadAndParseHtml(inputFile)
      .then(parsedHtml => fs.readFileAsync(testFile, 'utf8')
        .then((expectedResult) => {
          expect(parsedHtml).toMatchObject(JSON.parse(expectedResult));
        }));
  });

  it('should return ko if the parsing fails', () => {
    const inputFile = 'test-ko.html';
    const testFile = 'test-ko-result.json';

    return htmlParser.loadAndParseHtml(inputFile)
      .then(parsedHtml => fs.readFileAsync(testFile, 'utf8')
        .then((expectedResult) => {
          expect(parsedHtml).toMatchObject(JSON.parse(expectedResult));
        }));
  });
});
