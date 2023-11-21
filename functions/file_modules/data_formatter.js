require("date-utils")
const {Timestamp} = require('firebase-admin/firestore');

const flex_content = {
  box: ({contents=[], layout="horizontal", margin="none", flex=1, padding_all="none", cornerRadius="none", background_color="#ffffff", action="none", action_data=""}) => {
    if (action == "message"){
      const res = {
        "type": "box",
        "layout": layout,
        "margin": margin,
        "contents": contents,
        "action": {
          "type": "message",
          "text": action_data
        },
        "flex": flex,
        "backgroundColor": background_color,
        "paddingAll": padding_all,
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
          "data": action_data
        },
        "flex": flex,
        "backgroundColor": background_color,
        "paddingAll": padding_all,
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
        "backgroundColor": background_color,
        "paddingAll": padding_all,
        "cornerRadius": cornerRadius
      };
      return res;
    }
  },

  text: ({text="テキスト", size="md", weight="regular", color="#bbbbbb", flex=0, margin="none"}) => {
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

const html_content = {
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

  task: ({class_name="", task_name="", task_limit_time=""}) => {
    const content =
    `<tr>
        <td></td>
        <td>
            <p style="margin:0;font-size:14px;color:#ff4500;">${task_limit_time}</p>
        </td>
        <td style="color:#1c1c1c;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:0;">
            ${class_name}
        </td>
        <td></td>
        <td align="right" style="color:#1c1c1c;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:0;">
            ${task_name}
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

const get_sorted_keys = ({task_data={}}) => {
  const array = Object.keys(task_data).map((k)=>({ key: k, value: task_data[k] }));
  // console.log(array.map((val) => val.key))
  array.sort((a, b) => (a.value.task_limit.toDate()) - (b.value.task_limit.toDate()));
  return array.map((val) => val.key);
}

exports.ical_to_json = async({ical_data={}, class_name_dic={}, dev_msg=""}) => {
  const ical_keys = Object.keys(ical_data);
  let task_data = {};

  // 課題としての認識パターンインポート
  const valid_task_patterns = require("../data/regexp/valid_task_patterns.json");

  for (const key of ical_keys){

    // vcalendarという項目が必ず1つずつ入ってくるので、それは除く
    if (key !== "vcalendar"){
      for (const task_pattern of valid_task_patterns){

        // 課題の認識パターンから正規表現オブジェクト作成
        const regexp = new RegExp(task_pattern);

        // カレンダーデータ内のsummaryの文字が、課題形式のパターンに一致しているか判定
        // summary自体がない場合・一致文字がない場合はnull
        const res = ("summary" in ical_data[key])
        ?(ical_data[key].summary).match(regexp)
        : null;

        if (res == null){
          // 一致パターンが見つからなかった場合は次のパターンへ
          continue;

        } else {
          // 授業コードから授業名への変換
          let class_name = "";

          // 自分で追加した予定の場合はcategoriesがないので除く
          if ("categories" in ical_data[key]){
            if (class_name_dic[(ical_data[key].categories)[0]] !== undefined){
              // class_name_dicに授業コードが登録済みであれば、そこから取得
              class_name = class_name_dic[(ical_data[key].categories)[0]]

            } else {
              // データベースに存在しない場合は、シラバスから取得してclass_name_dicに追記
              const syllabus_fetch = require("../file_modules/syllabus_fetch");
              const class_code = (ical_data[key].categories)[0];
              console.log(`fetch ${class_code}`);
              try{
                class_name = await syllabus_fetch({
                  code: class_code
                })
                class_name_dic[class_code] = class_name;
                console.log(`res: ${class_code} -> ${class_name}`);

              } catch(e) {
                class_name = "シラバスエラー";
                class_name_dic[class_code] = class_name;
                console.log(`res: ${class_code} -> シラバスに接続できませんでした。(userID: ${dev_msg})`, e)
              }
            }

          } else {
            // そもそもcategoriesが存在しないものは、ユーザーイベントとして登録
            class_name = "ユーザーイベント"
          }

          try{
            task_data[(key.split("@")[0])] = {
              class_name: class_name,
              task_name: res.groups.title,
              task_limit: Timestamp.fromDate(ical_data[key].end),
              finish: false,
              display: true
            }

          } catch(e) {
            console.log(`task_dataパースエラー ${e} ID:${dev_msg} key:${key} ical_data[key]:${JSON.stringify(ical_data[key])}`);
            continue;
          }
        }
      }
    }
  }

  // シラバスへの接続でエラーが発生した場合は、一時的なものの可能性が高いのでclass_name_dicから削除しておく
  Object.keys(class_name_dic).forEach((key) => {
    if (class_name_dic[key] == "シラバスエラー"){
      delete class_name_dic[key];
    }
  })

  return task_data;
}

exports.json_to_flex = ({tasks={}}) => {
  // 当日：当日の00時01分～24時00分（翌0時）
  // 翌日：翌日の00時01分～24時00分（翌0時）
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate()+1);
  let contents_count=0, todays_task_count=0, other_task_count=0, task_data_json=[], overflow=false;

  // console.log(today.toFormat("YYYYMMDD"));


  // -----------------データ整形--------------------
  // ソート済みキー配列取得
  const keys_sorted = get_sorted_keys({
    task_data: tasks
  });

  // ソート済みキー配列を今日・明日・明日以降・過去に仕分け
  let keys_today=[], keys_tomorrow=[], keys_after_tomorrow=[], keys_past=[];
  keys_sorted.forEach(key => {
    const task = tasks[key];

    // 翌0時→当日の24時の表記にするために、該当提出日時を一度23時59分55秒にセット
    if (task.task_limit.toDate().toFormat("HH24:MI") == "00:00"){
      const overwrite_day = task.task_limit.toDate();
      overwrite_day.setDate(overwrite_day.getDate()-1);
      overwrite_day.setHours(23);
      overwrite_day.setMinutes(59);
      overwrite_day.setSeconds(55);
      task.task_limit = Timestamp.fromDate(overwrite_day);
    }


    if (task.task_limit.toDate().toFormat("YYYYMMDD") == today.toFormat("YYYYMMDD") && task.display){
      keys_today.push(key)
      // console.log("today")

    } else if (task.task_limit.toDate().toFormat("YYYYMMDD") == tomorrow.toFormat("YYYYMMDD") && task.display){
      keys_tomorrow.push(key)
      // console.log("tomorrow")

    } else if (task.task_limit.toDate() < today && task.display){
      keys_past.push(key)
      // console.log("past")

    } else if (task.display) {
      keys_after_tomorrow.push(key)
      // console.log("after")

    }
  })

  const keys_other = [...keys_tomorrow, ...keys_past, ...keys_after_tomorrow];



  // -----------------データ作成---------------------
  // 表題追加
  task_data_json.push(
    flex_content.box({contents: [
      flex_content.text({text: `${today.toFormat("MM/DD")}現在 登録課題一覧`, size: "sm", weight: "bold", color: "#1DB446"})
    ]})
  );

  // セパレーター追加
  task_data_json.push(flex_content.separator({}));


  // -------------------当日以降-------------------------
  if (keys_today.length !== 0){
    // 超過課題の表題追加
    task_data_json.push(
      flex_content.box({contents: [
        flex_content.box({contents: [
          flex_content.text({text: `本日(${today.toFormat("MM/DD")})提出 ${keys_today.length}件`, size: "xl", weight: "bold", color: "#ffa500"})
        ]})
      ], layout: "vertical", margin: "xl"})
    );
    task_data_json.push(flex_content.separator({}));

    keys_today.forEach((key) => {
      const limit = (() => {
        if (tasks[key].task_limit.toDate().toFormat("HH24:MI:SS") == "23:59:55"){
          return "24:00"
        } else {
          return tasks[key].task_limit.toDate().toFormat("HH24:MI")
        }
      })();

      // 累計25個以上の課題があった場合、それ以上はスキップ
      if (contents_count > 25) {
        overflow = true;
      }

      if (!tasks[key].finish && !overflow){
        task_data_json.push(
          flex_content.box({contents: [
            flex_content.text({text: "☐", color: "#555555"}),
            flex_content.text({text: limit, color: "#ff4500"}),
            flex_content.text({text: tasks[key].class_name.substr(0, 10), size: "lg", color: "#555555", flex: 1, margin: "md"}),
            flex_content.text({text: tasks[key].task_name.substr(0, 7), size: "sm", color: "#555555"})
          ], margin: "md", action: "message", action_data: `cmd@finish?key=${key}`})
        );
        todays_task_count++;

      } else if (overflow){
        task_data_json.push(
          flex_content.box({contents: [
            flex_content.text({text: "☑", color: "#bbbbbb"}),
            flex_content.text({text: limit, color: "#ff4500"}),
            flex_content.text({text: tasks[key].class_name.substr(0, 10), size: "lg", color: "#bbbbbb", flex: 1, margin: "md"}),
            flex_content.text({text: tasks[key].task_name.substr(0, 7), size: "sm", color: "#bbbbbb"})
          ], margin: "md", action: "message", action_data: `cmd@redo?key=${key}`})
        );
      }

      contents_count++;
    });
  }


  // -------------------その他-------------------------
  if (keys_other.length !== 0){
    task_data_json.push(
      flex_content.box({contents: [
        flex_content.box({contents: [
          flex_content.text({text: `今後の提出予定 ${keys_other.length}件`, size: "xl", weight: "bold", color: "#1e90ff"})
        ]})
      ], layout: "vertical", margin: "xxl"})
    );
    task_data_json.push(flex_content.separator({}));

    for (let i=0; ; i++){
      const limit_day_add_this_loop = tasks[keys_other[i]].task_limit.toDate().toFormat("MM/DD");
      let contents_temporary = [];

      // 以下、提出日が同日の間ループ
      for (; ; i++){
        const limit = (() => {
          if (tasks[keys_other[i]].task_limit.toDate().toFormat("HH24:MI:SS") == "23:59:55"){
            return "24:00"
          } else {
            return tasks[keys_other[i]].task_limit.toDate().toFormat("HH24:MI")
          }
        })();

        if (!tasks[keys_other[i]].finish){
          contents_temporary.push(
            flex_content.box({contents: [
              flex_content.text({text: "☐", color: "#555555", margin: "md"}),
              flex_content.text({text: limit, color: "#555555", margin: "sm"}),
              flex_content.text({text: tasks[keys_other[i]].class_name.substr(0, 10), color: "#555555", flex: 1, margin: "md"}),
              flex_content.text({text: tasks[keys_other[i]].task_name.substr(0, 7), size: "sm", color: "#555555", margin: "md"})
            ], action: "message", action_data: `cmd@finish?key=${keys_other[i]}`})
          );
          other_task_count++;

        } else {
          contents_temporary.push(
            flex_content.box({contents: [
              flex_content.text({text: "☑", color: "#bbbbbb", margin: "md"}),
              flex_content.text({text: limit, color: "#bbbbbb", margin: "sm"}),
              flex_content.text({text: tasks[keys_other[i]].class_name.substr(0, 10), color: "#bbbbbb", flex: 1, margin: "md"}),
              flex_content.text({text: tasks[keys_other[i]].task_name.substr(0, 7), size: "sm", color: "#bbbbbb", margin: "md"})
            ], action: "message", action_data: `cmd@redo?key=${keys_other[i]}`})
          );
        }
        contents_count++;

        // 最後まで読み込んだ場合break
        if (i+1 == keys_other.length){
          break;
        };

        // 次の課題が別日の場合break
        if (tasks[keys_other[i+1]].task_limit.toDate().toFormat("MM/DD") !== limit_day_add_this_loop){
          break;
        };
      }

      // 累計25個以上の課題があった場合、それ以上はスキップ
      if (contents_count > 25) {
        overflow = true;
      }

      // 同日課題をまとめて追加
      if (tasks[keys_other[i]].task_limit.toDate() < today && !overflow){
        task_data_json.push(
          flex_content.box({contents: [
            flex_content.box({contents: [
              flex_content.filler(),
              flex_content.box({contents: [
                flex_content.text({text: "超過", weight: "bold", color: "#ffffff"}),
              ], flex: 0, padding_all: "xs", background_color: "#941f57"}),
              flex_content.filler()
            ], layout: "vertical", flex: 0}),
            flex_content.text({text: `${limit_day_add_this_loop}(${["日", "月", "火", "水", "木", "金", "土"][tasks[keys_other[i]].task_limit.toDate().getDay()]})`, size: "sm", color: "#555555", margin: "sm"}),
            flex_content.box({contents: contents_temporary, layout: "vertical"})
          ], margin: "md"})
        );

      } else if (tasks[keys_other[i]].task_limit.toDate().toFormat("YYYYMMDD") == tomorrow.toFormat("YYYYMMDD") && !overflow){
        task_data_json.push(
          flex_content.box({contents: [
            flex_content.box({contents: [
              flex_content.filler(),
              flex_content.box({contents: [
                flex_content.text({text: "あす", weight: "bold", color: "#ffffff"}),
              ], flex: 0, padding_all: "xs", background_color: "#ffa500"}),
              flex_content.filler()
            ], layout: "vertical", flex: 0}),
            flex_content.text({text: `${limit_day_add_this_loop}(${["日", "月", "火", "水", "木", "金", "土"][tasks[keys_other[i]].task_limit.toDate().getDay()]})`, size: "sm", color: "#555555", margin: "sm"}),
            flex_content.box({contents: contents_temporary, layout: "vertical"})
          ], margin: "md"})
        );

      } else if (!overflow){
        task_data_json.push(
          flex_content.box({contents: [
            flex_content.text({text: `${limit_day_add_this_loop}(${["日", "月", "火", "水", "木", "金", "土"][tasks[keys_other[i]].task_limit.toDate().getDay()]})`, size: "sm", color: "#555555", margin: "sm"}),
            flex_content.box({contents: contents_temporary, layout: "vertical"})
          ], margin: "md"})
        );
      }

      // セパレーター追加
      if (!overflow){
        task_data_json.push(flex_content.separator({margin: "lg"}));
      }

      // 最後まで読み込んだ場合break
      if (i+1 == keys_other.length){
        break;
      }
    };
  }

  // ボタン追加
  task_data_json.push(
    flex_content.box({contents: [
      flex_content.box({contents: [
        flex_content.text({text: "完了済みを削除", size: "sm", color: "#ffffff"})
      ], cornerRadius: "md", flex: 0, background_color: "#1f90ff", padding_all: "md", action: "message", action_data: "cmd@delete?target=finish"}),
      flex_content.box({contents: [
        flex_content.text({text: "超過を削除", size: "sm", color: "#ffffff"})
      ], cornerRadius: "md", flex: 0, background_color: "#941f57", padding_all: "md", margin: "md", action: "message", action_data: "cmd@delete?target=past"})
    ], margin: "sm", layout: "horizontal"})
  )


  // フッター追加
  task_data_json.push(
    flex_content.box({contents: [
      flex_content.text({text: "該当講義名をタップで完了登録ができます。", size: "xs", color: "#aaaaaa"})
    ], margin: "md"})
  );

  if (overflow) {
    task_data_json.push(
      flex_content.box({contents: [
        flex_content.text({text: "※最大量超過により最後まで表示できていません。", size: "xs", color: "#ff0000"})
      ]})
    );
  }

  const result = {
    "contents": task_data_json,
    "alt_text": `本日提出${todays_task_count}件 今後提出${other_task_count}件`
  }

  // コンテンツデバック用
  // const fs = require("fs");
  // fs.writeFile('out.json', JSON.stringify(task_data_json), (err, data) => {
  //   if(err) console.log(err);
  //   else console.log('write end');
  // });

  return result;
}

exports.json_to_mail_param = ({tasks = {}}) => {
  // 当日：当日の00時01分～24時00分（翌0時）
  // 翌日：翌日の00時01分～24時00分（翌0時）
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate()+1);
  // console.log(today.toFormat("YYYYMMDD"));


  // -----------------データ整形--------------------
  // ソート済みキー配列取得
  const keys_sorted = get_sorted_keys({
    task_data: tasks
  });

  // ソート済みキー配列を今日・明日・明日以降・過去に仕分け
  let keys_today=[], keys_tomorrow=[], keys_after_tomorrow=[], keys_past=[];
  keys_sorted.forEach(key => {
    const task = tasks[key];

    // 翌0時→当日の24時の表記にするために、該当提出日時を一度23時59分55秒にセット
    if (task.task_limit.toDate().toFormat("HH24:MI") == "00:00"){
      const overwrite_day = task.task_limit.toDate();
      overwrite_day.setDate(overwrite_day.getDate()-1);
      overwrite_day.setHours(23);
      overwrite_day.setMinutes(59);
      overwrite_day.setSeconds(55);
      task.task_limit = Timestamp.fromDate(overwrite_day);
    }


    if (task.task_limit.toDate().toFormat("YYYYMMDD") == today.toFormat("YYYYMMDD") && task.display && !task.finish){
      keys_today.push(key);
      // console.log("today")

    } else if (task.task_limit.toDate().toFormat("YYYYMMDD") == tomorrow.toFormat("YYYYMMDD") && task.display && !task.finish){
      keys_tomorrow.push(key);
      // console.log("tomorrow")

    } else if (task.task_limit.toDate() < today && task.display && !task.finish){
      keys_past.push(key);
      // console.log("past")

    } else if (task.display && !task.finish) {
      keys_after_tomorrow.push(key);
      // console.log("after")

    }
  })

  let header_text = ""
  let contents_today = "";
  if (keys_today.length !== 0){
    header_text += `本日${keys_today.length}件`
    contents_today += html_content.title({
      color: "#ffa500",
      text: `本日（${today.toFormat("MM/DD")}）提出 ${keys_today.length}件`
    });
    contents_today += html_content.separator();
    keys_today.forEach((key) => {
      const limit = (() => {
        if (tasks[key].task_limit.toDate().toFormat("HH24:MI:SS") == "23:59:55"){
          return "24:00";
        } else {
          return tasks[key].task_limit.toDate().toFormat("HH24:MI");
        }
      })();
      contents_today += html_content.task({
        class_name: tasks[key].class_name,
        task_name: tasks[key].task_name,
        task_limit_time: limit
      });
    });
  }

  if (keys_today.length !== 0 && keys_tomorrow.length !== 0){
    header_text += " ";
  }

  let contents_tomorrow = "";
  if (keys_tomorrow.length !== 0){
    header_text += `あす${keys_tomorrow.length}件`
    contents_tomorrow += html_content.title({
      color: "#444ae3",
      text: `あす提出 ${keys_tomorrow.length}件`
    });
    contents_tomorrow += html_content.separator();
    keys_tomorrow.forEach((key) => {
      const limit = (() => {
        if (tasks[key].task_limit.toDate().toFormat("HH24:MI:SS") == "23:59:55"){
          return "24:00";
        } else {
          return tasks[key].task_limit.toDate().toFormat("HH24:MI");
        }
      })();
      contents_tomorrow += html_content.task({
        class_name: tasks[key].class_name,
        task_name: tasks[key].task_name,
        task_limit_time: limit
      });
    });
  }

  header_text += "の";

  let footer_text = ""
  const counts_other = [...keys_past, ...keys_after_tomorrow].length;
  if (counts_other !== 0){
    footer_text = `その他の未完了課題も${counts_other}件あります。<br>`
  }

  const res = {
    contents_today: contents_today,
    contents_tomorrow: contents_tomorrow,
    header_text: header_text,
    footer_text: footer_text,
    today: today.toFormat("MM/DD"),
    title: `${header_text}提出課題があります！`,
    do_notify: (() => {
      if (header_text == "の"){
        return false
      } else {
        return true
      }})()
  };

  return res;
}