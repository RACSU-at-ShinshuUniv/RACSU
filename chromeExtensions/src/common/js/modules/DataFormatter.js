const regExpValidEvent = /「(.*)」の提出期限が近づいています|「(.*)」の提出期限|(.*)の受験可能期間の終了|「(.*)」終了|(.*)要完了/;

class GenerateHtmlObject {
  constructor(){}

  addTags = (object, ...tags) => {
    tags.forEach(tag => {
      if (tag.match(/^\..+/)){
        object.classList.add(tag.replace(/\.|\#/g, ""));
      } else if (tag.match(/^\#.+/)){
        object.id = tag.replace(/\.|\#/g, "");
      }
    });
    return object;
  }

  fragment = () => {
    const fragment = document.createDocumentFragment();
    return fragment;
  }

  div = (...tags) => {
    const div = document.createElement('div');
    const div_ = this.addTags(div, ...tags)
    return div_;
  }

  p = (text, ...tags) => {
    const p = document.createElement('p');
    const p_ = this.addTags(p, ...tags);
    p_.textContent = text;
    return p_;
  }

  checkbox = (name, value, checked=false, ...tags) => {
    const checkbox = document.createElement('input');
    const checkbox_ = this.addTags(checkbox, ...tags);
    checkbox_.type = "checkbox";
    checkbox_.name = name;
    checkbox_.value = value;
    checkbox_.checked = checked;
    return checkbox_;
  }

  ul = (...tags) => {
    const ul = document.createElement('ul');
    const ul_ = this.addTags(ul, ...tags);
    return ul_;
  }

  li = (text, ...tags) => {
    const li = document.createElement('li');
    const li_ = this.addTags(li, ...tags);
    li_.textContent = text;
    return li_
  }
}

const getSortedKeys = (taskData={}) => {
  const array = Object.keys(taskData).map((k)=>({ key: k, value: taskData[k] }));
  array.sort((a, b) => (new Date(a.value.taskLimit.source)) - (new Date(b.value.taskLimit.source)));
  return array.map((val) => val.key);
}

export const formatTimeCode = (timeCode) => {
  const limit = new Date(timeCode);
  const hour = limit.toLocaleString("ja-JP", {
    "hour12": false,
    "hourCycle": "h24",
    "hour": "2-digit"
  }).replace("時", "");

  if (hour !== "00"){
    const year = limit.toLocaleString("ja-JP", {
      "hour12": false,
      "hourCycle": "h24",
      "year": "numeric"
    }).replace("年", "");
    const date = limit.toLocaleString("ja-JP", {
      "hour12": false,
      "hourCycle": "h24",
      "month": "2-digit",
      "day": "2-digit"
    });
    const time = limit.toLocaleString("ja-JP", {
      "hour12": false,
      "hourCycle": "h24",
      "hour": "2-digit",
      "minute": "2-digit"
    });
    const weekDay = limit.toLocaleString("ja-JP", {
      "hour12": false,
      "hourCycle": "h24",
      "weekday": "short"
    });

    return {
      year: year,
      date: date,
      time: time,
      weekDay: weekDay,
      fullDate: `${year}/${date}`,
      source: timeCode
    }

  } else {
    limit.setDate(limit.getDate()-1);
    const year = limit.toLocaleString("ja-JP", {
      "hour12": false,
      "hourCycle": "h24",
      "year": "numeric"
    }).replace("年", "");
    const date = limit.toLocaleString("ja-JP", {
      "hour12": false,
      "hourCycle": "h24",
      "month": "2-digit",
      "day": "2-digit"
    });
    const time = limit.toLocaleString("ja-JP", {
      "hour12": false,
      "hourCycle": "h24",
      "hour": "2-digit",
      "minute": "2-digit"
    });
    const weekDay = limit.toLocaleString("ja-JP", {
      "hour12": false,
      "hourCycle": "h24",
      "weekday": "short"
    });

    return {
      year: year,
      date: date,
      time: `24:${time.split(":")[1]}`,
      weekDay: weekDay,
      fullDate: `${year}/${date}`,
      source: timeCode
    }
  }
}

const detectLimitType = (timeCode) => {
  const diff = ((new Date(timeCode)) - (new Date())) / 86400000;
  if (diff < 0){
    return "past";
  } else if (0 <= diff && diff < 1){
    return "today";
  } else if (1 <= diff && diff < 2){
    return "tomorrow";
  } else {
    return "other";
  }
}

export class IcalData {
  constructor(icalData){
    this.icalEvent = icalData;
  }

  removeInvalidEvent() {
    const today = new Date();
    const validIcalData = Object.entries(this.icalEvent).map(([key, value]) => ({[key]: value})).filter(value => {
      const key = Object.keys(value)[0];
      const isUserEvent = (value[key]?.CATEGORIES !== undefined && value[key].CATEGORIES == "ユーザー登録イベント");
      const isValidSummary = (value[key]?.SUMMARY !== undefined && value[key].SUMMARY.match(regExpValidEvent) !== null);
      const isValidLimit = (value[key]?.DTEND !== undefined && (((new Date(value[key].DTEND)) - today) / 86400000) > -3);
      return ((isUserEvent || isValidSummary) && isValidLimit);
    });

    this.validIcalEvent = Object.assign({}, ...validIcalData);
    return this;
  }

  formatToSaveData(){
    const formattedData = {};
    const sourceData = (() => {
      if (this.validIcalEvent !== undefined){
        return this.validIcalEvent;
      } else if (this.icalEvent !== undefined){
        return this.icalEvent;
      } else {
        return {};
      }
    })();


    Object.keys(sourceData).forEach(key => {
      const matchedTaskName = sourceData[key].SUMMARY.match(regExpValidEvent);

      if (matchedTaskName !== null){
        const taskName = matchedTaskName
          .filter(item => matchedTaskName.indexOf(item) !== 0)
          .filter(item => item !== undefined)[0];
        formattedData[key] = {
          className: sourceData[key].CATEGORIES,
          taskName: taskName,
          taskLimit: formatTimeCode(sourceData[key].DTEND),
          finish: false,
          display: true
        };
      }
    });

    return new SaveData(formattedData);
  }
}

export class SaveData {
  constructor(saveData){
    this.saveData = saveData;
  }

  get(){
    return this.saveData;
  }

  margeWith(sourceData){
    const today = new Date();

    // データベースにのみ存在し、displayがtrueの課題の課題をマージ
    // ealps上から削除され、displayがfalseな課題はここでなくなる
    Object.keys(sourceData).forEach((key) => {
      if (!(key in this.saveData) && sourceData[key].display){
        this.saveData[key] = sourceData[key];
      }
    })

    Object.keys(this.saveData).forEach((key) => {
      // すでにデータベースに登録済みの課題は、登録されているdisplayとfinishの値をもってくる
      if (key in sourceData){
        this.saveData[key].finish = sourceData[key].finish;
        this.saveData[key].display = sourceData[key].display;
      }

      // 過去の課題かつ完了フラグが立っているもののdisplayをfalseに設定
      if (((new Date(this.saveData[key].taskLimit)) - today) < 0 && this.saveData[key].finish){
        this.saveData[key].display = false;
      }

      // 期限より3日以上過ぎた課題は非表示にする
      if ((((new Date(this.saveData[key].taskLimit)) - today) / 86400000) < -3){
        this.saveData[key].display = false;
      }
    });

    return this;
  }

  formatToHtml(){
    const today = formatTimeCode(new Date());
    const html = new GenerateHtmlObject();

    // 各課題の数保存変数
    let todayTaskCount = 0, otherTaskCount = 0;

    // ソート済みキー配列取得
    const sortedKeys = getSortedKeys(this.saveData);

    // ソート済みキー配列を今日・その他に仕分け
    const todayTaskKeys = [], otherTaskKeys = [];
    sortedKeys.forEach(key => {
      const task = this.saveData[key];
      if (task.taskLimit.fullDate == today.fullDate && task.display){
        todayTaskKeys.push(key);
      } else if (task.display){
        otherTaskKeys.push(key);
      }
    })

    // 挿入するコンテンツフラグメント作成
    const fragment = html.fragment();

    // 当日分作成
    if (todayTaskKeys.length !== 0){
      const contentToday = html.div(".content", ".today");
      const limitDay = html.div(".limit_day")
      limitDay.appendChild(html.p(today.date))
      contentToday.appendChild(limitDay);

      const taskDetails = html.div(".task_details");
      for (const key of todayTaskKeys){
        const taskItem = html.div(".task_item");
        const taskUl = html.ul();
        taskUl.appendChild(html.li(this.saveData[key].taskLimit.time, ".limit_time"));
        taskUl.appendChild(html.li(this.saveData[key].className, ".class_name"));
        taskUl.appendChild(html.li(this.saveData[key].taskName, ".task_name"));

        if (this.saveData[key].finish){
          taskItem.classList.add("finished");
          taskItem.appendChild(html.checkbox("finish", key, true));
        } else {
          todayTaskCount++;
          taskItem.appendChild(html.checkbox("finish", key, false));
        }
        taskItem.appendChild(taskUl);
        taskDetails.appendChild(taskItem);
      }
      contentToday.appendChild(taskDetails);

      const taskListToday = html.div(".task_list_today");
      taskListToday.appendChild(html.p(`本日提出 ${todayTaskCount}件`));
      taskListToday.appendChild(contentToday);
      fragment.appendChild(taskListToday);
    }

    // その他の日分作成
    if (otherTaskKeys.length !== 0){
      const contentFragment = html.fragment();

      for (let i=0; ; i++){
        const taskLimit_thisLoop = this.saveData[otherTaskKeys[i]].taskLimit.date;
        const taskDetails = html.div(".task_details");

        // 以下、提出日が同日の間ループ
        for (; ; i++){
          const taskItem = html.div(".task_item");
          const taskUl = html.ul();
          taskUl.appendChild(html.li(this.saveData[otherTaskKeys[i]].taskLimit.time, ".limit_time"));
          taskUl.appendChild(html.li(this.saveData[otherTaskKeys[i]].className, ".class_name"));
          taskUl.appendChild(html.li(this.saveData[otherTaskKeys[i]].taskName, ".task_name"));

          if (this.saveData[otherTaskKeys[i]].finish){
            taskItem.classList.add("finished");
            taskItem.appendChild(html.checkbox("finish", otherTaskKeys[i], true));
          } else {
            otherTaskCount++;
            taskItem.appendChild(html.checkbox("finish", otherTaskKeys[i], false));
          }
          taskItem.appendChild(taskUl);
          taskDetails.appendChild(taskItem);

          // 最後まで読み込んだ場合break
          if (i+1 == otherTaskKeys.length){
            break;
          };

          // 次の課題が別日の場合break
          if (this.saveData[otherTaskKeys[i+1]].taskLimit.date !== taskLimit_thisLoop){
            break;
          };
        }

        switch(detectLimitType(this.saveData[otherTaskKeys[i]].taskLimit.source)){
          case "past": {
            const contentPast = html.div(".content", ".past");
            const limitDay = html.div(".limit_day")
            limitDay.appendChild(html.p(this.saveData[otherTaskKeys[i]].taskLimit.date))
            contentPast.appendChild(limitDay);
            contentPast.appendChild(taskDetails);
            contentFragment.appendChild(contentPast);
            break;
          }

          case "tomorrow": {
            const contentTomorrow = html.div(".content", ".tomorrow");
            const limitDay = html.div(".limit_day")
            limitDay.appendChild(html.p(this.saveData[otherTaskKeys[i]].taskLimit.date))
            contentTomorrow.appendChild(limitDay);
            contentTomorrow.appendChild(taskDetails);
            contentFragment.appendChild(contentTomorrow);
            break;
          }

          case "other": {
            const contentOther = html.div(".content", ".other");
            const limitDay = html.div(".limit_day")
            limitDay.appendChild(html.p(this.saveData[otherTaskKeys[i]].taskLimit.date))
            contentOther.appendChild(limitDay);
            contentOther.appendChild(taskDetails);
            contentFragment.appendChild(contentOther);
            break;
          }
        }

        // 最後まで読み込んだ場合break
        if (i+1 == otherTaskKeys.length){
          break;
        }
      }
      const taskListOther = html.div(".task_list_other");
      taskListOther.appendChild(html.p(`今後の提出予定 ${otherTaskCount}件`));
      taskListOther.appendChild(contentFragment);
      fragment.appendChild(taskListOther);
    }

    if (fragment.childElementCount !== 0){
      return new HtmlData(fragment);

    } else {
      fragment.appendChild(html.p("取得可能期間内の未完了課題はありません。", "#no_task"));
      return new HtmlData(fragment);
    }
  }
}

export class HtmlData {
  constructor(htmlData){
    this.htmlData = htmlData;
  }

  get(){
    return this.htmlData;
  }
}