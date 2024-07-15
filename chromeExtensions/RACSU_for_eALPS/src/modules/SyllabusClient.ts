import env from "../../env.json"

export class SyllabusClient {
  private classNameDict: {[classCode: string]: string}

  constructor(initClassNameDict: {[classCode: string]: string}) {
    this.classNameDict = initClassNameDict;
  }

  getClassName = async(classCode: string) => {
    if (classCode in this.classNameDict){
      console.log(`ローカルデータから取得：${classCode}->${this.classNameDict[classCode]}`);
      return this.classNameDict[classCode];

    } else {
      const classCodeFixed = (() => {
        // 授業コードが9文字以上の場合は8文字でスライスして末尾2桁を00に置き換え
        if (classCode.length >= 9) {
          return classCode.slice(0, 6) + "00";
        } else {
          return classCode.slice(0, 8)
        }
      })();
      const department = classCodeFixed.slice(0,1).replace("Q", "G");
      const term = new Date();
      term.setMonth(term.getMonth()-3);
      const syllabusUrl = env.syllabusURL.replace("$term", String(term.getFullYear())).replace("$department", department).replace("$classCode", classCodeFixed);

      const syllabusContents = await(await fetch(syllabusUrl)).text();
      const detectedClassName_A = syllabusContents.replace(/\n|\r\n|\t| /g, "").match(/授業名<\/td><tdcolspan="7">(?<name>.*?)<\/td>/);
      const detectedClassName_B = syllabusContents.replace(/\n|\r\n|\t| /g, "").match(/科目名<\/td><tdcolspan="1">(?<name>.*?)<\/td>/);

      const className = (() => {
        if (detectedClassName_A !== null && detectedClassName_A.groups !== undefined && detectedClassName_A.groups.name !== undefined){
          return detectedClassName_A.groups.name;
        } else if (detectedClassName_B !== null && detectedClassName_B.groups !== undefined && detectedClassName_B.groups.name !== undefined){
          return detectedClassName_B.groups.name;
        } else {
          return "シラバス未登録授業";
        }
      })();

      console.log(`シラバスから取得：${classCode}->${className}`);
      this.classNameDict[classCode] = className;
      return className;
    }
  }

  overwriteIcalClassCode = async(icalData: {[uid: string]: {[index: string]: string}}) => {
    const overwriteIcalData = await Promise.all(Object.keys(icalData).map(key => {
      if (icalData[key].CATEGORIES == undefined){
        return {[key]: {
          CATEGORIES: "ユーザー登録イベント",
          CLASS: icalData[key].CLASS,
          DESCRIPTION: icalData[key].DESCRIPTION,
          DTEND: icalData[key].DTEND,
          SUMMARY: icalData[key].SUMMARY
        }}

      } else {
        return (async() => {
          const className = await this.getClassName(icalData[key].CATEGORIES);
          return {[key]: {
            CATEGORIES: className,
            CLASS: icalData[key].CLASS,
            DESCRIPTION: icalData[key].DESCRIPTION,
            DTEND: icalData[key].DTEND,
            SUMMARY: icalData[key].SUMMARY
          }}
        })();
      }
    }));

    this.localDictUpdate();
    return Object.assign({}, ...overwriteIcalData);
  }

  localDictUpdate() {
    chrome.storage.local.set({
      classNameDict: this.classNameDict
    });
  }
}