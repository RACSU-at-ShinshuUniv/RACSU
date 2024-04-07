const regExpIcalSplitPattern = /(?=UID:)|(?=SUMMARY:)|(?=DESCRIPTION:)|(?=CLASS:)|(?=LAST-MODIFIED:)|(?=DTSTAMP:)|(?=DTSTART:)|(?=DTEND:)|(?=CATEGORIES:)/g;
const regExpIcalIndexPattern = /(?<index>UID|SUMMARY|DESCRIPTION|CLASS|DTEND|CATEGORIES):(?<data>.*)/;

const formatDate = (date) => {
  return `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}T${date.slice(9, 11)}:${date.slice(11, 13)}:00Z`
}

const icalParser = (icalText) => {
  const parsedIcalContents = {}
  String(icalText).replace(/\\n|\n|\t|\r| |　|\\|END:VEVENT|END:VCALENDAR/g, "").split("BEGIN:VEVENT").forEach(eachEvent => {
    const eventData = {};
    let uid = "";
    eachEvent.split(regExpIcalSplitPattern).forEach(eachEventDetail => {
      const eventDetail = eachEventDetail.match(regExpIcalIndexPattern);
      if (eventDetail !== null && eventDetail !== undefined){
        if (eventDetail.groups.index == "UID"){
          uid = eventDetail.groups.data.split("@")[0];
        } else if (eventDetail.groups.index == "DTEND"){
          eventData[eventDetail.groups.index] = formatDate(eventDetail.groups.data);
        } else {
          eventData[eventDetail.groups.index] = eventDetail.groups.data;
        }
      }
    });
    if (uid !== ""){
      parsedIcalContents[uid] = eventData;
    }
  });
  return parsedIcalContents;
}

export const getAccountParams = (url) => {
  const urlParams = url.match(/https\:\/\/(.+?)\.shinshu-u\.ac\.jp\/(?<expiration>\d\d\d\d)\/(?<department>.)\/calendar\/export_execute\.php\?userid\=(?<userid>.+?)\&authtoken=(?<authtoken>.+?)\&.+/);

  if (urlParams == null){
    return {expiration: null, department: null, userid: null, authtoken: null};
  } else {
    return {expiration: urlParams.groups.expiration, department: urlParams.groups.department, userid: urlParams.groups.userid, authtoken: urlParams.groups.authtoken};
  }
}

export class IcalClient {
  constructor(...urls){
    this.urls = urls;
    this.contents = {}
  }

  async getLatestContents(){
    const result = await Promise.all(this.urls.map(async(url) => {
      const res = (await fetch(url)).text();
      return res;
    }));

    return icalParser(result);
  }

  async isValidUrl(){
    const result = await Promise.all(this.urls.map(async(url) => {
      const res = await (await fetch(url)).text();
      return (res.includes("PRODID:-//Moodle Pty Ltd//"));
    }))

    return result.every(val => val);
  }
}