import env from "../../env.json"

export type icalDataProps = {
  [id: string]: {
    SUMMARY: string,
    DESCRIPTION: string,
    CLASS: string,
    DTEND: string,
    CATEGORIES: string
  }
};

const formatDate = (date: string) => {
  return `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}T${date.slice(9, 11)}:${date.slice(11, 13)}:00Z`
}

const icalParser = (icalText: string) => {
  const parsedIcalContents: {[uid: string]: {[index: string]: string}} = {};
  icalText.replace(/\\n|\n|\t|\r| |　|\\|END:VEVENT|END:VCALENDAR/g, "").split("BEGIN:VEVENT").forEach(eachEvent => {
    const eventData: {[index: string]: string} = {};
    let uid = "";
    eachEvent.split(new RegExp(env.regExpIcalSplitPattern, "g")).forEach(eachEventDetail => {
      const eventDetail = eachEventDetail.match(new RegExp(env.regExpIcalIndexPattern));
      if (eventDetail !== null && eventDetail.groups !== undefined){
        if (eventDetail.groups.index == "UID"){
          // UIDは後で使うので一時保存
          uid = eventDetail.groups.data.split("@")[0];

        } else if (eventDetail.groups.index == "DTEND"){
          // 日付データDTENDはフォーマットしてから追加
          eventData[eventDetail.groups.index] = formatDate(eventDetail.groups.data);

        } else {
          // その他データは対応するインデックスと一緒に追加
          eventData[eventDetail.groups.index] = eventDetail.groups.data;
        }
      }
    });

    // 1つの課題すべてのパラメータが揃ったらパース済みの課題として追加
    if (uid !== ""){
      parsedIcalContents[uid] = eventData;
    }
  });
  return parsedIcalContents;
}

export const getAccountParams = (url: string) => {
  const urlParams = url.match(/https\:\/\/(.+?)\.shinshu-u\.ac\.jp\/(?<expiration>\d\d\d\d)\/(?<department>.)\/calendar\/export_execute\.php\?userid\=(?<userid>.+?)\&authtoken=(?<authtoken>.+?)\&.+/);

  if (urlParams == null || urlParams.groups == undefined){
    return {expiration: null, department: null, userid: null, authtoken: null};
  } else {
    return {expiration: urlParams.groups.expiration, department: urlParams.groups.department, userid: urlParams.groups.userid, authtoken: urlParams.groups.authtoken};
  }
}

export const getMoodleURL = ({accountExpiration, userDepartment, moodleId, moodleToken}: {accountExpiration: string, userDepartment: string, moodleId: string, moodleToken: string}) => {
  return env.moodleURL.replace("$accountExpiration", accountExpiration).replace("$department", userDepartment).replace("$moodleId", moodleId).replace("$moodleToken", moodleToken);
}

export class IcalClient {
  private urls: string[];

  constructor(...urls: string[]){
    this.urls = urls;
  }

  async getLatestContents(){
    try{
      const rawData = await Promise.all(this.urls.map(async(url) => {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 3000);
        const res = (await fetch(url, { signal: controller.signal })).text();
        return res;
      }));

      const result = {};
      rawData.forEach(d => {
        Object.assign(result, icalParser(d));
      })
      return Promise.resolve(result);

    } catch(e: any) {
      if (e.name == "AbortError"){
        return Promise.reject(new Error("接続がタイムアウトしました。"))
      } else {
        return Promise.reject(new Error("インターネットの接続を確認してください。"))
      }
    }
  }

  async isValidUrl(){
    const result = await Promise.all(this.urls.map(async(url) => {
      const res = await (await fetch(url)).text();
      return (res.includes("PRODID:-//Moodle Pty Ltd//"));
    }))

    return result.every(val => val);
  }
}