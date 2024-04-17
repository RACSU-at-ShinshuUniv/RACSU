export class SyllabusClient {
  constructor(initClassNameDict) {
    this.classNameDict = initClassNameDict;
  }

  getClassName = async(classCode) => {
    if (classCode in this.classNameDict){
      console.log(`ローカルデータから取得：${classCode}->${this.classNameDict[classCode]}`);
      return this.classNameDict[classCode];

    } else {
      const classCodeFixed = classCode.slice(0, 8).replace("Q", "G");
      const department = classCodeFixed.slice(0,1);
      const term = new Date();
      term.setMonth(term.getMonth()-3);
      const syllabusUrl = `https://campus-3.shinshu-u.ac.jp/syllabusj/Display?NENDO=${term.getFullYear()}&BUKYOKU=${department}&CODE=${classCodeFixed}`;

      const syllabusContents = await(await fetch(syllabusUrl)).text();
      const detectedClassName_A = syllabusContents.replace(/\n|\r\n|\t| /g, "").match(/授業名<\/td><tdcolspan="7">(?<name>.*?)<\/td>/);
      const detectedClassName_B = syllabusContents.replace(/\n|\r\n|\t| /g, "").match(/科目名<\/td><tdcolspan="1">(?<name>.*?)<\/td>/);

      const className = (() => {
        if (detectedClassName_A !== null && detectedClassName_A.groups.name !== undefined){
          return detectedClassName_A.groups.name;
        } else if (detectedClassName_B !== null && detectedClassName_B.groups.name !== undefined){
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

  overwriteIcalClassCode = async(icalData) => {
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