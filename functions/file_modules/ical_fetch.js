const ical = require('node-ical');

exports.is_valid_url = async({url=""}) => {
  console.time(`fetch to ${url}`);
  const data = await ical.async.fromURL(url);
  console.timeEnd(`fetch to ${url}`);

  if ("vcalendar" in data && "method" in data.vcalendar && data.vcalendar.method == "PUBLISH"){
    return true;
  } else {
    return false;
  }
}

exports.get_contents = async({url=""}) => {
  console.time(`fetch to ${url}`);
  const data = await ical.async.fromURL(url);
  console.timeEnd(`fetch to ${url}`);

  return data;
}