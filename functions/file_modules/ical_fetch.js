const ical = require('node-ical');

exports.is_valid_url = async({url=""}) => {
  const data = await ical.async.fromURL(url);
  if ("vcalendar" in data && "method" in data.vcalendar && data.vcalendar.method == "PUBLISH"){
    return true;
  } else {
    return false;
  }
}

exports.get_contents = async({url=""}) => {
  const data = await ical.async.fromURL(url);
  return data;
}