import formatTimeCode, { formattedTimeCodeProps } from "./formatTimeCode";

const regExpValidEvent = /「(.*)」の提出期限が近づいています|「(.*)」の提出期限|(.*)の受験可能期間の終了|「(.*)」終了|(.*)要完了|(.*)が期限です。/;

export type saveDataProps = {
  [id: string]: {
    className: string,
    taskName: string,
    display: boolean,
    finish: boolean,
    taskLimit: formattedTimeCodeProps
  }
};


export class IcalData {
  private icalEvent: {[uid: string]: {[index: string]: string}};

  constructor(icalData: {[uid: string]: {[index: string]: string}}){
    this.icalEvent = icalData;
  }

  removeInvalidEvent() {
    const today = new Date();
    const validIcalData = Object.entries(this.icalEvent).map(([key, value]) => ({[key]: value})).filter(icalData => {
      const uid = Object.keys(icalData)[0];
      const isUserEvent = (icalData[uid]?.CATEGORIES !== undefined && icalData[uid].CATEGORIES == "ユーザー登録イベント");
      const isValidSummary = (icalData[uid]?.SUMMARY !== undefined && icalData[uid].SUMMARY.match(regExpValidEvent) !== null);
      const isValidLimit = (icalData[uid]?.DTEND !== undefined && (((new Date(icalData[uid].DTEND)).getTime() - today.getTime()) / 86400000) > -3);
      return ((isUserEvent || isValidSummary) && isValidLimit);
    });

    this.icalEvent = Object.assign({}, ...validIcalData);
    return this;
  }

  formatToSaveData(){
    const formattedData: saveDataProps = {};
    const sourceData = this.icalEvent;

    Object.keys(sourceData).forEach(uid => {
      const matchedTaskName = sourceData[uid].SUMMARY.match(regExpValidEvent);

      if (matchedTaskName !== null){
        const taskName = matchedTaskName
          .filter(item => matchedTaskName.indexOf(item) !== 0)
          .filter(item => item !== undefined)[0];
        formattedData[uid] = {
          className: sourceData[uid].CATEGORIES,
          taskName: taskName,
          taskLimit: formatTimeCode(sourceData[uid].DTEND),
          finish: false,
          display: true
        };
      }
    });

    return new SaveData(formattedData);
  }
}

export class SaveData {
  private saveData: saveDataProps;

  constructor(saveData: saveDataProps){
    this.saveData = saveData;
  }

  margeWith(existedData: saveDataProps){
    const today = new Date();

    // データベースにのみ存在し、displayがtrueの課題の課題をマージ
    // ealps上から削除され、displayがfalseな課題はここでなくなる
    Object.keys(existedData).forEach(id => {
      if (!(id in this.saveData) && existedData[id].display){
        this.saveData[id] = existedData[id];
      }
    });

    Object.keys(this.saveData).forEach(id => {
      // すでにデータベースに登録済みの課題は、登録されているdisplayとfinishの値をもってくる
      if (id in existedData){
        this.saveData[id].finish = existedData[id].finish;
        this.saveData[id].display = existedData[id].display;
      }

      // 過去の課題かつ完了フラグが立っているもののdisplayをfalseに設定
      if (((new Date(this.saveData[id].taskLimit.source)).getTime() - today.getTime()) < 0 && this.saveData[id].finish){
        this.saveData[id].display = false;
      }

      // 期限より3日以上過ぎた課題は非表示にする
      if ((((new Date(this.saveData[id].taskLimit.source)).getTime() - today.getTime()) / 86400000) < -3){
        this.saveData[id].display = false;
      }
    });

    return this;
  }

  get(){
    return this.saveData;
  }
}