const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const { JSDOM } = require('jsdom');
const moment = require('moment');

function formatHtml(rawHtml) {
  let result = rawHtml.replace(/\\"/g, '"');
  result = result.replace(/\\n/g, '\n');
  result = result.replace(/\\r/g, '');

  return result;
}

function writeFormattedHtml(formattedHtml, filename) {
  return fs.writeFileAsync(filename, formattedHtml)
    .then(() => formattedHtml);
}

function writeJsonFile(jsonObject, filename) {
  return fs.writeFileAsync(filename, JSON.stringify(jsonObject, null, 2))
    .then(() => jsonObject);
}

function getContentByQuerySelector(element, querySelector) {
  return element.querySelector(querySelector).innerHTML.trim();
}

function getProductPassengers(product) {
  const passengerElements = product.nextElementSibling.querySelectorAll('.typology');
  const passengers = Array.prototype.map.call(passengerElements, (passengerElement) => {
    const typology = passengerElement.innerHTML.trim().match(/(\(.*\))/)[0];
    const fareType = passengerElement.nextElementSibling.innerHTML.trim().match(/Billet (échangeable)/)[1];

    return { age: typology, type: fareType };
  });

  return passengers;
}

function getProductDate(document, product) {
  const day = getContentByQuerySelector(product.previousElementSibling, '.product-travel-date');
  const dateWithoutYear = moment.utc(day, 'DD MMMM', 'fr', false);
  const dateWithoutYearString = dateWithoutYear.format('DD/MM/([\\d*])');
  const dateWithoutYearRegex = new RegExp(dateWithoutYearString);
  const year = document.body.innerHTML.match(dateWithoutYearRegex);
  const date = dateWithoutYear.set('year', year[1]).toISOString().replace(/T/, ' ');

  return date;
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
        passengers,
      },
    ],
  };
}

function parseHtml(formattedHtml) {
  try {
    const dom = new JSDOM(formattedHtml);
    const { document } = dom.window;

    const code = document.querySelector('.link.aftersale-web').innerHTML.trim().match(/pnrRef=([^& ]*)/)[1];
    const name = getContentByQuerySelector(document, '.pnr-name .pnr-info');
    const price = parseFloat(getContentByQuerySelector(document, '.total-amount .very-important').replace(/[^\d,.]/g, '').replace(/,/g, '.'));

    const products = document.querySelectorAll('.product-details');
    const roundTrips = Array.prototype.map.call(products, productCallback.bind(null, document));

    const priceElements = document.querySelectorAll('.product-header>tbody>tr>td:last-child, .product-header>.amount');
    const prices = Array.prototype.map.call(priceElements, priceElement => ({ value: parseFloat(priceElement.innerHTML.trim().replace(/[^\d,]/, '').replace(/,/, '.')) }));

    return {
      status: 'ok',
      result: {
        trips: [
          {
            code,
            name,
            details: {
              price,
              roundTrips,
            },
          },
        ],
        custom: {
          prices,
        },
      },
    };
  } catch (error) {
    return {
      status: 'ko',
      errorMessage: error.message,
      errorStack: error.stack,
    };
  }
}

exports.loadAndParseHtml = filename => fs.readFileAsync(filename, 'utf8')
  .then((rawHtml) => {
    const formattedHtml = formatHtml(rawHtml);
    return writeFormattedHtml(formattedHtml, `formatted-${filename}`);
  })
  .then((formattedHtml) => {
    const parsedHtml = parseHtml(formattedHtml);
    return writeJsonFile(parsedHtml, `parsed-${filename.split('.').shift()}.json`);
  });
