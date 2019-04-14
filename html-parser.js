const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const moment = require('moment');

exports.loadAndParseHtml = function (filename) {
  return fs.readFileAsync(filename, 'utf8')
    .then(function (rawHtml) {
      formattedHtml = formatHtml(rawHtml);
      return writeFormattedHtml(formattedHtml, 'formatted-' + filename);
    })
    .then(function (formattedHtml) {
      parsedHtml = parseHtml(formattedHtml);
      return writeJsonFile(parsedHtml, 'parsed-' + filename.split('.').shift() + '.json');
    });
}

function writeFormattedHtml(formattedHtml, filename) {
  return fs.writeFileAsync(filename, formattedHtml)
    .then(() => formattedHtml);
}

function writeJsonFile(jsonObject, filename) {
  return fs.writeFileAsync(filename, JSON.stringify(jsonObject, null, 2))
    .then(() => jsonObject);
}

function formatHtml(rawHtml) {
  let result = rawHtml.replace(/\\"/g, '"');
  result = result.replace(/\\n/g, '\n');
  result = result.replace(/\\r/g, '');
  
  return result;
}

function parseHtml(formattedHtml) {
  const dom = new JSDOM(formattedHtml);
  const document = dom.window.document;

  const code = document.querySelector('.link.aftersale-web').innerHTML.trim().match(/pnrRef=([^\& ]*)/)[1];
  const name = getContentByQuerySelector(document, '.pnr-name .pnr-info');
  const price = parseFloat(getContentByQuerySelector(document, '.total-amount .very-important').replace(/[^\d,.]/g, '').replace(/,/g, '.'));
  
  const products = document.querySelectorAll('.product-details');
  const roundTrips = Array.prototype.map.call(products, productCallback.bind(null, document));

  const priceElements = document.querySelectorAll('.product-header>tbody>tr>td:last-child, .product-header>.amount');
  const prices = Array.prototype.map.call(priceElements, function (priceElement) {
    return { value: parseFloat(priceElement.innerHTML.trim().replace(/[^\d,]/, '').replace(/,/, '.')) };
  });

  const result = {
    status: "ok",
    result: {
      trips: [
        { code,
          name,
          details: {
            price,
            roundTrips,
          }
        }
      ],
      custom: {
        prices,
      }
    }
  }

  return result;
}

function productCallback(document, product) {
  const travelWay = getContentByQuerySelector(product, '.travel-way');
  const departureTime = getContentByQuerySelector(product, '.origin-destination-hour.segment-departure').replace(/h/, ':');
  const departureStationElement = product.querySelector('.origin-destination-station.segment-departure');
  const departureStation = departureStationElement.innerHTML.trim();
  const travelType = departureStationElement.nextElementSibling.innerHTML.trim();
  const number = departureStationElement.nextElementSibling.nextElementSibling.innerHTML.trim();
  const arrivalTime = getContentByQuerySelector(product, '.origin-destination-hour.segment-arrival').replace(/h/, ':');
  const arrivalStation = getContentByQuerySelector(product, '.origin-destination-station.segment-arrival');
  const passengers = getProductPassengers(product);
  const date = getProductDate(document, product);

  return {
    type: travelWay,
    date,
    trains: [
      {
        departureTime,
        departureStation,
        arrivalTime,
        arrivalStation,
        type: travelType,
        number,
        passengers
      }
    ]
  }
}

function getProductPassengers(product) {
  const passengerTypologyElements = product.nextElementSibling.querySelectorAll('.typology');
  const passengers = Array.prototype.map.call(passengerTypologyElements, passengerTypologyElement => {
    const typology = passengerTypologyElement.innerHTML.trim().match(/(\(.*\))/)[0];
    const fareType = passengerTypologyElement.nextElementSibling.innerHTML.trim().match(/Billet (échangeable)/)[1];
    
    return { age: typology, type: fareType };
  });

  return passengers
}

function getProductDate(document, product) {
  const day = getContentByQuerySelector(product.previousElementSibling, '.product-travel-date');
  const dateWithoutYear = moment.utc(day, "DD MMMM", "fr", false);
  const dateWithoutYearString = dateWithoutYear.format('[\]DD[\/]MM[\/]([\\d*])');
  const dateWithoutYearRegex = new RegExp(dateWithoutYearString);
  const year = document.body.innerHTML.match(dateWithoutYearRegex);
  const date = dateWithoutYear.set('year', year[1]).toISOString().replace(/T/, ' ');

  return date;
}

function getContentByQuerySelector(element, querySelector) {
  return element.querySelector(querySelector).innerHTML.trim();
}