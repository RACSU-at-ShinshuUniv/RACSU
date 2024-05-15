require("date-utils");
const axios = require('axios');
const { Timestamp } = require('@google-cloud/firestore');

const _ical = Symbol();
const _html = Symbol();
const _flex = Symbol();
const _json = Symbol();

const flexContent = {
  box: ({contents=[], layout="horizontal", margin="none", flex=1, paddingAll="none", cornerRadius="none", backgroundColor="#ffffff", action="none", actionData=""}) => {
    if (action == "message"){
      const res = {
        "type": "box",
        "layout": layout,
        "margin": margin,
        "contents": contents,
        "action": {
          "type": "message",
          "text": actionData
        },
        "flex": flex,
        "backgroundColor": backgroundColor,
        "paddingAll": paddingAll,
        "cornerRadius": cornerRadius
      };
      return res;

    } else if (action == "postback"){
      const res = {
        "type": "box",
        "layout": layout,
        "margin": margin,
        "contents": contents,
        "action": {
          "type": "postback",
          "data": actionData
        },
        "flex": flex,
        "backgroundColor": backgroundColor,
        "paddingAll": paddingAll,
        "cornerRadius": cornerRadius
      };
      return res;

    } else {
      const res = {
        "type": "box",
        "layout": layout,
        "margin": margin,
        "contents": contents,
        "flex": flex,
        "backgroundColor": backgroundColor,
        "paddingAll": paddingAll,
        "cornerRadius": cornerRadius
      };
      return res;
    }
  },

  text: ({text="", size="md", weight="regular", color="#bbbbbb", flex=0, margin="none"}) => {
    const content = {
      "type": "text",
      "text": text,
      "weight": weight,
      "size": size,
      "color": color,
      "flex": flex,
      "gravity": "center",
      "margin": margin
    };
    return content;
  },

  separator: ({margin="md"}) => {
    const content = {
      "type": "separator",
      "margin": margin
    };
    return content;
  },

  filler: () => {
    const content = {
      "type": "filler"
    };
    return content;
  }
}

const htmlContent = {
  title: ({color="#ffa500", text=""}) => {
    const content =
    `<tr>
        <td></td>
        <td colspan="4">
            <p style="margin:0;font-size:18px;font-weight:bold;color:${color};">${text}</p>
        </td>
        <td></td>
    </tr>`;
    return content;
  },

  separator: () => {
    const content =
    `<tr>
        <td colspan="6" height="3"></td>
    </tr>
    <tr>
        <td></td>
        <td colspan="4" height="1" bgcolor="#eeeeee"></td>
        <td></td>
    </tr>
    <tr>
        <td colspan="6" height="3"></td>
    </tr>`
    return content;
  },

  task: ({className="", taskName="", taskLimit_time=""}) => {
    const content =
    `<tr>
        <td></td>
        <td>
            <p style="margin:0;font-size:14px;color:#ff4500;">${taskLimit_time}</p>
        </td>
        <td style="color:#1c1c1c;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:0;">
            ${className}
        </td>
        <td></td>
        <td align="right" style="color:#1c1c1c;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:0;">
            ${taskName}
        </td>
    </tr>
    <tr><td colspan="6" height="6"></td></tr>
    <tr>
        <td></td>
        <td colspan="4" height="1" bgcolor="#eeeeee"></td>
        <td></td>
    </tr>
    <tr><td colspan="6" height="5"></td></tr>`;
    return content;
  }
}

const getClassName = async(code) => {
  code = code.slice(0, 8).replace("Q", "G");
  const department = code.slice(0,1);
  const term = new Date();
  term.setMonth(term.getMonth()-3);
  const syllabusUrl = `https://campus-3.shinshu-u.ac.jp/syllabusj/Display?NENDO=${term.getFullYear()}&BUKYOKU=${department}&CODE=${code}`;

  try{
    // 時間計測用トークン作成
    let token = "";
    for (let i=0; i<3; i++){
      token += Math.floor(Math.random()*10).toString();
    }

    console.time(`fetch time (code:${code}, token:${token})`);
    // const res = await axios.get(syllabusUrl, { timeout : 5000 });
    const syllabusContents = await axios.get(syllabusUrl);
    console.timeEnd(`fetch time (code:${code}, token:${token})`);

    const detectedClassName_A = syllabusContents.data.replace(/\n|\r\n|\t| /g, "").match(/授業名<\/td><tdcolspan="7">(?<name>.*?)<\/td>/);
    const detectedClassName_B = syllabusContents.data.replace(/\n|\r\n|\t| /g, "").match(/科目名<\/td><tdcolspan="1">(?<name>.*?)<\/td>/);

    const className = (() => {
      if (detectedClassName_A !== null && detectedClassName_A.groups.name !== undefined){
        return detectedClassName_A.groups.name;

      } else if (detectedClassName_B !== null && detectedClassName_B.groups.name !== undefined){
        return detectedClassName_B.groups.name;

      } else {
        return "不明な授業";
      }
    })();

    return Promise.resolve(className);

  } catch(e) {
    return Promise.reject(e);
  }
}

const getSortedKeys = (taskDataDict={}) => {
  const array = Object.keys(taskDataDict).map((k)=>({ key: k, value: taskDataDict[k] }));
  array.sort((a, b) => (a.value.taskLimit.toDate()) - (b.value.taskLimit.toDate()));
  return array.map((val) => val.key);
}

class IcalTask {
  constructor(ical){
    this[_ical] = ical;
  }

  async toJson(classNameDict){
    if (this[_ical] == undefined){
      return Error("Ical data not set.");
    }

    const icalKeys = Object.keys(this[_ical]);
    const taskDataDict = {};

    // 課題としての認識パターンインポート
    const regExpTaskPatterns = require("../data/regExpTaskPatterns.json");

    for (const icalKey of icalKeys){

      // vcalendarという項目が必ず1つずつ入ってくるので、それは除く
      if (icalKey == "vcalendar") continue;

      for (const taskPattern of regExpTaskPatterns){

        // 課題の認識パターンから正規表現オブジェクト作成
        const regexp = new RegExp(taskPattern);

        // カレンダーデータ内のsummaryの文字が、課題形式のパターンに一致しているか判定
        // summary自体がない場合・一致文字がない場合はnull
        const taskName = ("summary" in this[_ical][icalKey])
          ?(this[_ical][icalKey].summary).match(regexp)
          : null;


        // 一致パターンが見つからなかった場合は次のパターンへ
        if (taskName == null) continue;

        // 授業コードから授業名への変換
        const className = await (async() => {
          // 自分で追加した予定の場合はcategoriesがないので除く
          if ("categories" in this[_ical][icalKey]){
            if (classNameDict[(this[_ical][icalKey].categories)[0]] !== undefined){
              // classNameDictに授業コードが登録済みであれば、そこから取得
              return classNameDict[(this[_ical][icalKey].categories)[0]]

            } else {
              // データベースに存在しない場合は、シラバスから取得してclassNameDictに追記
              const classCode = (this[_ical][icalKey].categories)[0];
              console.log(`fetch ${classCode}`);
              try{
                const className = await getClassName(classCode);
                classNameDict[classCode] = className;
                console.log(`res: ${classCode} -> ${className}`);
                return className;

              } catch(e) {
                const className = "シラバスエラー";
                classNameDict[classCode] = className;
                console.log(`res: ${classCode} -> シラバスに接続できませんでした。(userID: ${devMessage})`, e);
                return className;
              }
            }

          // そもそもcategoriesが存在しないものは、ユーザーイベントとして登録
          } else {
            return "ユーザーイベント";
          }
        })();


        try{
          taskDataDict[(icalKey.split("@")[0])] = {
            className: className,
            taskName: taskName.groups.title,
            taskLimit: Timestamp.fromDate(this[_ical][icalKey].end),
            finish: false,
            display: true
          }

        } catch(e) {
          console.log(`taskDataパースエラー ${e} key:${icalKey} this[_ical][key]:${JSON.stringify(this[_ical][icalKey])}`);
          continue;
        }
      }
    }

    // シラバスへの接続でエラーが発生した場合は、一時的なものの可能性が高いのでclassNameDictから削除しておく
    Object.keys(classNameDict).forEach((key) => {
      if (classNameDict[key] == "シラバスエラー"){
        delete classNameDict[key];
      }
    })

    return new JsonTask(taskDataDict);
  }
}

class JsonTask {
  constructor(json){
    this[_json] = json;
  }

  toFlex(){
    if (this[_json] == undefined){
      throw new Error("Json data not set.");
    }
    const today = new Date(), tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate()+1);

    const flexContents=[];
    let totalContentsCount=0, todayContentsCount=0, otherContentsCount=0, overflow=false;

    // -----------------データ整形--------------------
    // ソート済みキー配列取得
    const sortedKeys = getSortedKeys(this[_json]);

    // ソート済みキー配列を今日・その他に仕分け
    const todayTaskKeys=[], otherTaskKeys=[];
    sortedKeys.forEach(key => {
      const taskData = this[_json][key];

      // 翌0時→当日の24時の表記にするために、該当提出日時を一度23時59分55秒にセット
      if (taskData.taskLimit.toDate().toFormat("HH24:MI") == "00:00"){
        const overwrittenLimit = taskData.taskLimit.toDate();
        overwrittenLimit.setDate(overwrittenLimit.getDate()-1);
        overwrittenLimit.setHours(23);
        overwrittenLimit.setMinutes(59);
        overwrittenLimit.setSeconds(55);
        taskData.taskLimit = Timestamp.fromDate(overwrittenLimit);
      }

      if (taskData.taskLimit.toDate().toFormat("YYYYMMDD") == today.toFormat("YYYYMMDD") && taskData.display){
        todayTaskKeys.push(key);
      } else if (taskData.display){
        otherTaskKeys.push(key);
      }
    })


    // -----------------データ作成---------------------
    // 表題追加
    flexContents.push(
      flexContent.box({contents: [
        flexContent.text({text: `${today.toFormat("MM/DD")}現在 登録課題一覧`, size: "sm", weight: "bold", color: "#1DB446"})
      ]})
    );

    // セパレーター追加
    flexContents.push(flexContent.separator({}));


    // -------------------当日-------------------------
    if (todayTaskKeys.length !== 0){
      // 超過課題の表題追加
      flexContents.push(
        flexContent.box({contents: [
          flexContent.box({contents: [
            flexContent.text({text: `本日(${today.toFormat("MM/DD")})提出 ${todayTaskKeys.length}件`, size: "xl", weight: "bold", color: "#ffa500"})
          ]})
        ], layout: "vertical", margin: "xl"})
      );
      flexContents.push(flexContent.separator({}));

      todayTaskKeys.forEach((key) => {
        const taskLimit_time = (() => {
          if (this[_json][key].taskLimit.toDate().toFormat("HH24:MI:SS") == "23:59:55"){
            return "24:00"
          } else {
            return this[_json][key].taskLimit.toDate().toFormat("HH24:MI")
          }
        })();

        // 累計process.env.MAX_LIST_CONTENTS個以上の課題があった場合、それ以上はスキップ
        if (totalContentsCount > process.env.MAX_LIST_CONTENTS) {
          overflow = true;
        }

        if (!this[_json][key].finish && !overflow){
          flexContents.push(
            flexContent.box({contents: [
              flexContent.text({text: "☐", color: "#555555"}),
              flexContent.text({text: taskLimit_time, color: "#ff4500"}),
              flexContent.text({text: this[_json][key].className.substr(0, 10), size: "lg", color: "#555555", flex: 1, margin: "md"}),
              flexContent.text({text: this[_json][key].taskName.substr(0, 7), size: "sm", color: "#555555"})
            ], margin: "md", action: "message", actionData: `cmd@finish?key=${key}`})
          );
          todayContentsCount++;

        } else if (!overflow){
          flexContents.push(
            flexContent.box({contents: [
              flexContent.text({text: "☑", color: "#bbbbbb"}),
              flexContent.text({text: taskLimit_time, color: "#ff4500"}),
              flexContent.text({text: this[_json][key].className.substr(0, 10), size: "lg", color: "#bbbbbb", flex: 1, margin: "md"}),
              flexContent.text({text: this[_json][key].taskName.substr(0, 7), size: "sm", color: "#bbbbbb"})
            ], margin: "md", action: "message", actionData: `cmd@redo?key=${key}`})
          );
        }

        totalContentsCount++;
      });
    }


    // -------------------その他-------------------------
    if (otherTaskKeys.length !== 0){
      flexContents.push(
        flexContent.box({contents: [
          flexContent.box({contents: [
            flexContent.text({text: `今後の提出予定 ${otherTaskKeys.length}件`, size: "xl", weight: "bold", color: "#1e90ff"})
          ]})
        ], layout: "vertical", margin: "xxl"})
      );
      flexContents.push(flexContent.separator({}));

      for (let i=0; ; i++){
        const taskLimit_thisLoop = this[_json][otherTaskKeys[i]].taskLimit.toDate().toFormat("MM/DD");
        const contents_thisLoop = [];

        // 以下、提出日が同日の間ループ
        for (; ; i++){
          const taskLimit_time= (() => {
            if (this[_json][otherTaskKeys[i]].taskLimit.toDate().toFormat("HH24:MI:SS") == "23:59:55"){
              return "24:00"
            } else {
              return this[_json][otherTaskKeys[i]].taskLimit.toDate().toFormat("HH24:MI")
            }
          })();

          if (!this[_json][otherTaskKeys[i]].finish && !overflow){
            contents_thisLoop.push(
              flexContent.box({contents: [
                flexContent.text({text: "☐", color: "#555555", margin: "md"}),
                flexContent.text({text: taskLimit_time, color: "#555555", margin: "sm"}),
                flexContent.text({text: this[_json][otherTaskKeys[i]].className.substr(0, 10), color: "#555555", flex: 1, margin: "md"}),
                flexContent.text({text: this[_json][otherTaskKeys[i]].taskName.substr(0, 7), size: "sm", color: "#555555", margin: "md"})
              ], action: "message", actionData: `cmd@finish?key=${otherTaskKeys[i]}`})
            );
            otherContentsCount++;

          } else if (!overflow){
            contents_thisLoop.push(
              flexContent.box({contents: [
                flexContent.text({text: "☑", color: "#bbbbbb", margin: "md"}),
                flexContent.text({text: taskLimit_time, color: "#bbbbbb", margin: "sm"}),
                flexContent.text({text: this[_json][otherTaskKeys[i]].className.substr(0, 10), color: "#bbbbbb", flex: 1, margin: "md"}),
                flexContent.text({text: this[_json][otherTaskKeys[i]].taskName.substr(0, 7), size: "sm", color: "#bbbbbb", margin: "md"})
              ], action: "message", actionData: `cmd@redo?key=${otherTaskKeys[i]}`})
            );
          }
          totalContentsCount++;

          // 累計process.env.MAX_LIST_CONTENTS個以上の課題があった場合、それ以上はスキップ
          if (totalContentsCount > process.env.MAX_LIST_CONTENTS) {
            overflow = true;
          }

          // 最後まで読み込んだ場合break
          if (i+1 == otherTaskKeys.length){
            break;
          };

          // 次の課題が別日の場合break
          if (this[_json][otherTaskKeys[i+1]].taskLimit.toDate().toFormat("MM/DD") !== taskLimit_thisLoop){
            break;
          };
        }


        // 同日課題をまとめて追加
        if (this[_json][otherTaskKeys[i]].taskLimit.toDate() < today){
          flexContents.push(
            flexContent.box({contents: [
              flexContent.box({contents: [
                flexContent.filler(),
                flexContent.box({contents: [
                  flexContent.text({text: "超過", weight: "bold", color: "#ffffff"}),
                ], flex: 0, paddingAll: "xs", backgroundColor: "#941f57"}),
                flexContent.filler()
              ], layout: "vertical", flex: 0}),
              flexContent.text({text: `${taskLimit_thisLoop}(${["日", "月", "火", "水", "木", "金", "土"][this[_json][otherTaskKeys[i]].taskLimit.toDate().getDay()]})`, size: "sm", color: "#555555", margin: "sm"}),
              flexContent.box({contents: contents_thisLoop, layout: "vertical"})
            ], margin: "md"})
          );

        } else if (this[_json][otherTaskKeys[i]].taskLimit.toDate().toFormat("YYYYMMDD") == tomorrow.toFormat("YYYYMMDD")){
          flexContents.push(
            flexContent.box({contents: [
              flexContent.box({contents: [
                flexContent.filler(),
                flexContent.box({contents: [
                  flexContent.text({text: "あす", weight: "bold", color: "#ffffff"}),
                ], flex: 0, paddingAll: "xs", backgroundColor: "#ffa500"}),
                flexContent.filler()
              ], layout: "vertical", flex: 0}),
              flexContent.text({text: `${taskLimit_thisLoop}(${["日", "月", "火", "水", "木", "金", "土"][this[_json][otherTaskKeys[i]].taskLimit.toDate().getDay()]})`, size: "sm", color: "#555555", margin: "sm"}),
              flexContent.box({contents: contents_thisLoop, layout: "vertical"})
            ], margin: "md"})
          );

        } else {
          flexContents.push(
            flexContent.box({contents: [
              flexContent.text({text: `${taskLimit_thisLoop}(${["日", "月", "火", "水", "木", "金", "土"][this[_json][otherTaskKeys[i]].taskLimit.toDate().getDay()]})`, size: "sm", color: "#555555", margin: "sm"}),
              flexContent.box({contents: contents_thisLoop, layout: "vertical"})
            ], margin: "md"})
          );
        }

        // セパレーター追加
        if (!overflow){
          flexContents.push(flexContent.separator({margin: "lg"}));
        }

        // 最後まで読み込んだ場合break
        if (i+1 == otherTaskKeys.length){
          break;
        }
      };
    }

    // ボタン追加
    flexContents.push(
      flexContent.box({contents: [
        flexContent.box({contents: [
          flexContent.text({text: "完了済みを削除", size: "sm", color: "#ffffff"})
        ], cornerRadius: "md", flex: 0, backgroundColor: "#1f90ff", paddingAll: "md", action: "message", actionData: "cmd@delete?target=finish"}),
        flexContent.box({contents: [
          flexContent.text({text: "超過を削除", size: "sm", color: "#ffffff"})
        ], cornerRadius: "md", flex: 0, backgroundColor: "#941f57", paddingAll: "md", margin: "md", action: "message", actionData: "cmd@delete?target=past"}),
        flexContent.box({contents: [
          flexContent.text({text: "表示を更新", size: "sm", color: "#ffffff"})
        ], cornerRadius: "md", flex: 0, backgroundColor: "#1b5aad", paddingAll: "md", margin: "md", action: "message", actionData: "登録済みの課題を表示"})
      ], margin: "sm", layout: "horizontal"})
    )


    // フッター追加
    flexContents.push(
      flexContent.box({contents: [
        flexContent.text({text: "該当講義名をタップで完了登録ができます。", size: "xs", color: "#aaaaaa"})
      ], margin: "md"})
    );

    if (overflow) {
      flexContents.push(
        flexContent.box({contents: [
          flexContent.text({text: "※最大量超過により最後まで表示できていません。", size: "xs", color: "#ff0000"})
        ]})
      );
    }

    const result = {
      contents: {
        "type": "bubble",
        "size": "giga",
        "body": {
          "type": "box",
          "layout": "vertical",
          "contents": flexContents,
          "paddingAll": "xl"
        }
      },
      altText: `本日提出${todayContentsCount}件 今後提出${otherContentsCount}件`
    }

    // コンテンツデバック用
    // const fs = require("fs");
    // fs.writeFile('out.json', JSON.stringify(flexContents), (err, data) => {
    //   if(err) console.log(err);
    //   else console.log('write end');
    // });

    return new FlexTask(result);
  }

  toHtml(){
    if (this[_json] == undefined){
      return Error("Json data not set.");
    }
    const today = new Date(), tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate()+1);

    // -----------------データ整形--------------------
    // ソート済みキー配列取得
    const sortedKeys = getSortedKeys(this[_json]);

    // ソート済みキー配列を今日・明日・明日以降・過去に仕分け
    const todayTaskKeys=[], tomorrowTaskKeys=[], otherTaskKeys=[];
    sortedKeys.forEach(key => {
      const task = this[_json][key];

      // 翌0時→当日の24時の表記にするために、該当提出日時を一度23時59分55秒にセット
      if (task.taskLimit.toDate().toFormat("HH24:MI") == "00:00"){
        const overwrittenLimit = task.taskLimit.toDate();
        overwrittenLimit.setDate(overwrittenLimit.getDate()-1);
        overwrittenLimit.setHours(23);
        overwrittenLimit.setMinutes(59);
        overwrittenLimit.setSeconds(55);
        task.taskLimit = Timestamp.fromDate(overwrittenLimit);
      }

      if (task.taskLimit.toDate().toFormat("YYYYMMDD") == today.toFormat("YYYYMMDD") && task.display && !task.finish){
        todayTaskKeys.push(key);
      } else if (task.taskLimit.toDate().toFormat("YYYYMMDD") == tomorrow.toFormat("YYYYMMDD") && task.display && !task.finish){
        tomorrowTaskKeys.push(key);
      } else if (task.display && !task.finish) {
        otherTaskKeys.push(key);
      }
    });

    let headerText = "", htmlContents_today = "", htmlContents_tomorrow = "";
    if (todayTaskKeys.length !== 0){
      headerText += `本日${todayTaskKeys.length}件`
      htmlContents_today += htmlContent.title({
        color: "#ffa500",
        text: `本日（${today.toFormat("MM/DD")}）提出 ${todayTaskKeys.length}件`
      });
      htmlContents_today += htmlContent.separator();
      todayTaskKeys.forEach((key) => {
        const taskLimit_time = (() => {
          if (this[_json][key].taskLimit.toDate().toFormat("HH24:MI:SS") == "23:59:55"){
            return "24:00";
          } else {
            return this[_json][key].taskLimit.toDate().toFormat("HH24:MI");
          }
        })();
        htmlContents_today += htmlContent.task({
          className: this[_json][key].className,
          taskName: this[_json][key].taskName,
          taskLimit_time: taskLimit_time
        });
      });
    }

    if (todayTaskKeys.length !== 0 && tomorrowTaskKeys.length !== 0){
      headerText += " ";
    }

    if (tomorrowTaskKeys.length !== 0){
      headerText += `あす${tomorrowTaskKeys.length}件`
      htmlContents_tomorrow += htmlContent.title({
        color: "#444ae3",
        text: `あす提出 ${tomorrowTaskKeys.length}件`
      });
      htmlContents_tomorrow += htmlContent.separator();
      tomorrowTaskKeys.forEach((key) => {
        const taskLimit_time = (() => {
          if (this[_json][key].taskLimit.toDate().toFormat("HH24:MI:SS") == "23:59:55"){
            return "24:00";
          } else {
            return this[_json][key].taskLimit.toDate().toFormat("HH24:MI");
          }
        })();
        htmlContents_tomorrow += htmlContent.task({
          className: this[_json][key].className,
          taskName: this[_json][key].taskName,
          taskLimit_time: taskLimit_time
        });
      });
    }

    headerText += "の";

    let footerText = ""
    if (otherTaskKeys.length !== 0){
      footerText = `その他の未完了課題も${otherTaskKeys.length}件あります。<br>`
    }

    const mailParam = {
      html: {
        today: htmlContents_today,
        tomorrow: htmlContents_tomorrow
      },
      headerText: headerText,
      footerText: footerText,
      today: today.toFormat("MM/DD"),
      title: `${headerText}提出課題があります！`,
      doNotify: (() => {
        if (headerText == "の"){
          return false
        } else {
          return true
        }})()
    };

    return new HtmlTask(mailParam);
  }

  get(){
    return this[_json];
  }
}

class FlexTask {
  constructor(flex){
    this[_flex] = flex;
  }

  get(){
    return this[_flex];
  }
}

class HtmlTask {
  constructor(html){
    this[_html] = html;
  }

  get(){
    return this[_html];
  }
}

module.exports = {
  IcalTask: IcalTask,
  JsonTask: JsonTask
}