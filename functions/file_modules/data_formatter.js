require("date-utils")
const {Timestamp} = require('firebase-admin/firestore');
const valid_task_patterns = require("../env_variables/valid_task_patterns.json")
const firestore_read = require("./firestore_read");

const flex_content = {
  box: ({contents=[], layout="horizontal", margin="none", flex=1, padding_all="none", background_color="#ffffff", action="none", action_data=""}) => {
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
        "paddingAll": padding_all
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
        "paddingAll": padding_all
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
        "paddingAll": padding_all
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

const get_sorted_keys = ({task_data={}}) => {
  const array = Object.keys(task_data).map((k)=>({ key: k, value: task_data[k] }));
  // console.log(array.map((val) => val.key))
  array.sort((a, b) => (a.value.task_limit.toDate()) - (b.value.task_limit.toDate()));
  return array.map((val) => val.key);
}

exports.ical_to_json = async({ical_data={}}) => {
  const ical_keys = Object.keys(ical_data);
  const class_name_dic = await firestore_read.get_data({
    collection: "overall",
    doc: "classes"
  });
  let task_data = {};

  ical_keys.forEach((key) => {
    if (key !== "vcalendar"){
      valid_task_patterns.forEach(task_pattern => {
        const regexp = new RegExp(task_pattern);
        const res = (ical_data[key].summary).match(regexp);
        if (res !== null){
          const class_name = (class_name_dic[(ical_data[key].categories)[0]] !== undefined)
          ? class_name_dic[(ical_data[key].categories)[0]]
          : "no name";

          task_data[(key.split("@")[0])] = {
            class_name: class_name,
            task_name: res.groups.title,
            task_limit: Timestamp.fromDate(ical_data[key].end),
            finish: false,
            display: true
          }
        }
      });
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
  let todays_task_count=0, other_task_count=0, task_data_json = [];

  console.log(today.toFormat("YYYYMMDD"));


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
      console.log("today")

    } else if (task.task_limit.toDate().toFormat("YYYYMMDD") == tomorrow.toFormat("YYYYMMDD") && task.display){
      keys_tomorrow.push(key)
      console.log("tomorrow")

    } else if (task.task_limit.toDate() < today && task.display){
      keys_past.push(key)
      console.log("past")

    } else if (task.display) {
      keys_after_tomorrow.push(key)
      console.log("after")

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

      if (!tasks[key].finish){
        task_data_json.push(
          flex_content.box({contents: [
            flex_content.text({text: "☐", color: "#555555"}),
            flex_content.text({text: limit, color: "#ff4500"}),
            flex_content.text({text: tasks[key].class_name.substr(0, 10), size: "lg", color: "#555555", flex: 1, margin: "md"}),
            flex_content.text({text: tasks[key].task_name.substr(0, 7), size: "sm", color: "#555555"})
          ], margin: "md", action: "message", action_data: `cmd@finish_${key}`})
        );
        todays_task_count++;

      } else {
        task_data_json.push(
          flex_content.box({contents: [
            flex_content.text({text: "☑", color: "#bbbbbb"}),
            flex_content.text({text: limit, color: "#ff4500"}),
            flex_content.text({text: tasks[key].class_name.substr(0, 10), size: "lg", color: "#bbbbbb", flex: 1, margin: "md"}),
            flex_content.text({text: tasks[key].task_name.substr(0, 7), size: "sm", color: "#bbbbbb"})
          ], margin: "md", action: "message", action_data: `cmd@redo_${key}`})
        );
      }
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
            ], action: "message", action_data: `cmd@finish_${keys_other[i]}`})
          );
          other_task_count++;

        } else {
          contents_temporary.push(
            flex_content.box({contents: [
              flex_content.text({text: "☑", color: "#555555", margin: "md"}),
              flex_content.text({text: limit, color: "#bbbbbb", margin: "sm"}),
              flex_content.text({text: tasks[keys_other[i]].class_name.substr(0, 10), color: "#bbbbbb", flex: 1, margin: "md"}),
              flex_content.text({text: tasks[keys_other[i]].task_name.substr(0, 7), size: "sm", color: "#bbbbbb", margin: "md"})
            ], action: "message", action_data: `cmd@redo_${keys_other[i]}`})
          );
        }

        // 最後まで読み込んだ場合break
        if (i+1 == keys_other.length){
          break;
        };

        // 次の課題が別日の場合break
        if (tasks[keys_other[i+1]].task_limit.toDate().toFormat("MM/DD") !== limit_day_add_this_loop){
          break;
        };
      }

      // 同日課題をまとめて追加
      if (tasks[keys_other[i]].task_limit.toDate() < today){
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

      } else if (tasks[keys_other[i]].task_limit.toDate().toFormat("YYYYMMDD") == tomorrow.toFormat("YYYYMMDD")){
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

      }else {
        task_data_json.push(
          flex_content.box({contents: [
            flex_content.text({text: `${limit_day_add_this_loop}(${["日", "月", "火", "水", "木", "金", "土"][tasks[keys_other[i]].task_limit.toDate().getDay()]})`, size: "sm", color: "#555555", margin: "sm"}),
            flex_content.box({contents: contents_temporary, layout: "vertical"})
          ], margin: "md"})
        );
      }

      // セパレーター追加
      task_data_json.push(flex_content.separator({margin: "lg"}));

      // 最後まで読み込んだ場合break
      if (i+1 == keys_other.length){
        break;
      }
    };
  }

  // フッター追加
  task_data_json.push(
    flex_content.box({contents: [
      flex_content.text({text: "該当講義名をタップで完了登録ができます。", size: "xs", color: "#aaaaaa"})
    ], margin: "md"})
  );

  const result = {
    "contents": task_data_json,
    "alt_text": `本日提出${todays_task_count}件 今後提出${other_task_count}件`
  }
  return result;
}

exports.json_to_mail_param = ({tasks = {}}) => {
  // 当日：当日の00時01分～24時00分（翌0時）
  // 翌日：翌日の00時01分～24時00分（翌0時）
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate()+1);
  console.log(today.toFormat("YYYYMMDD"));


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
      console.log("today")

    } else if (task.task_limit.toDate().toFormat("YYYYMMDD") == tomorrow.toFormat("YYYYMMDD") && task.display){
      keys_tomorrow.push(key)
      console.log("tomorrow")

    } else if (task.task_limit.toDate() < today && task.display){
      keys_past.push(key)
      console.log("past")

    } else if (task.display) {
      keys_after_tomorrow.push(key)
      console.log("after")

    }
  })

  const keys_other = [...keys_tomorrow, ...keys_past, ...keys_after_tomorrow];

  let tasks_today = {};
  keys_today.forEach((key) => {
    const limit = (() => {
      if (tasks[key].task_limit.toDate().toFormat("HH24:MI:SS") == "23:59:55"){
        return "24:00"
      } else {
        return tasks[key].task_limit.toDate().toFormat("HH24:MI")
      }
    })();
    tasks_today[key] = {
      task_name: tasks[key].task_name,
      task_limit_time: limit,
      class_name: tasks[key].class_name
    }
  });

  const res = {
    tasks_today: tasks_today,
    others: keys_other.length
  }

  return res;
}