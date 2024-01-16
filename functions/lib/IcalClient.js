const ical = require('node-ical');
const _urls = Symbol();

class IcalClient{
  constructor(...urls){
    this[_urls] = urls;
  }

  async isValidUrl(){
    const result = await Promise.all(this[_urls].map(url => ical.async.fromURL(url).then(result => {
      if ("vcalendar" in result && "method" in result.vcalendar && result.vcalendar.method == "PUBLISH"){
        return true;
      } else {
        return false;
      }
    })));
    return result.every(val => val);
  }

  async getLatestData(){
    const result = await Promise.all(this[_urls].map(url => ical.async.fromURL(url).then(result => {
      return result;
    })));
    return Object.assign(...result);
  }
}

module.exports = IcalClient;