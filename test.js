const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const moment = require('moment');

describe('Test parsing', () => {
  it('should return the exact same json', () => {
    fs.readFile('test.html', 'utf8', function (err, rawHtml) {
      formattedHtml = formatHtml(rawHtml);
      fs.writeFile('test-formatted.html', formattedHtml, function (err) {
        if (err) {
          throw err;
        }
      });
      parsedHtml = parseHtml(formattedHtml);
      fs.writeFile('result.json', JSON.stringify(parsedHtml, null, 2), function (err) {
        if (err) {
          throw err;
        }
      });
      fs.readFile('test-result.json', 'utf8', function (err, rawData) {
        json = JSON.parse(rawData);
        expect(parsedHtml).toMatchObject(json);
      })
    });
  });
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

  const code = document.querySelector('.link.aftersale-web').innerHTML.trim().match(/pnrRef=([^\& ]*)/)[1];
  const name = getContentByQuerySelector(document, '.pnr-name .pnr-info');
  const price = parseFloat(getContentByQuerySelector(document, '.total-amount .very-important').replace(/[^\d,.]/g, '').replace(/,/g, '.'));

  const products = document.getElementsByClassName('product-details');

  const callback = (document, product) => {
    const day = getContentByQuerySelector(product.previousElementSibling, '.product-travel-date');
    const dateWithoutYear = moment.utc(day, "DD MMMM", "fr", false);

    const dateWithoutYearString = dateWithoutYear.format('[\]DD[\/]MM[\/]([\\d*])');
    const dateWithoutYearRegex = new RegExp(dateWithoutYearString);
    const year = document.body.innerHTML.match(dateWithoutYearRegex);
    const date = dateWithoutYear.set('year', year[1]).toISOString().replace(/T/, ' ');

    const travelWay = getContentByQuerySelector(product, '.travel-way');
    const departureTime = getContentByQuerySelector(product, '.origin-destination-hour.segment-departure').replace(/h/, ':');

    const departureStationElement = product.querySelector('.origin-destination-station.segment-departure');

    const departureStation = departureStationElement.innerHTML.trim();
    const travelType = departureStationElement.nextElementSibling.innerHTML.trim();
    const number = departureStationElement.nextElementSibling.nextElementSibling.innerHTML.trim();

    const arrivalTime = getContentByQuerySelector(product, '.origin-destination-hour.segment-arrival').replace(/h/, ':');
    const arrivalStation = getContentByQuerySelector(product, '.origin-destination-station.segment-arrival');

    const passengerTypologyElements = product.nextElementSibling.getElementsByClassName('typology');
    const passengers = Array.prototype.map.call(passengerTypologyElements, passengerTypologyElement => {
      const typology = passengerTypologyElement.innerHTML.trim().match(/(\(.*\))/)[0];
      const fareType = passengerTypologyElement.nextElementSibling.innerHTML.trim().match(/Billet (échangeable)/)[1];
      return { age: typology, type: fareType };
    });

    return {
      type: travelWay,
      date: date,
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

  const roundTrips = Array.prototype.map.call(products, callback.bind(null, document));

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

function getContentByQuerySelector(element, querySelector) {
  return element.querySelector(querySelector).innerHTML.trim();
}
