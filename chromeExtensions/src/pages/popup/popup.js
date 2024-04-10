import { SaveData, formatTimeCode, generateTaskLimit } from "../../common/js/modules/DataFormatter.js";
let cacheData = {};

const loadTaskListFrame = async() => {
  const userConfig = await chrome.storage.sync.get();

  // インストール直後のユーザーには案内表示
  if (userConfig.accountStatus == "installed"){
    const optionsPage = chrome.runtime.getURL("pages/options/options.html");
    document.querySelector("#options").setAttribute('href', optionsPage);
    document.querySelector("#options").setAttribute("target", "_blank");
    document.querySelector("#overlay_link_message_info").textContent = "RACSUをご利用いただくにはeALPSとの連携が必要です。";
    document.querySelector("#overlay_link_message").style.display = "flex";

  } else if (userConfig.accountStatus == "accountExpired"){
    document.querySelector("#options").addEventListener("click", async() => {
      document.querySelector("#overlay_link_message").style.display = "none";
      document.querySelector("#overlay_loading").style.display = "flex";
      const thisTerm = new Date();
      thisTerm.setMonth(thisTerm.getMonth()-3);
      await chrome.storage.sync.set({
        needToSetSpecific: true,
        accountStatus: "linking"
      });
      const userConfig = await chrome.storage.sync.get();
      open(`https://lms.ealps.shinshu-u.ac.jp/${thisTerm.getFullYear()}/${userConfig.userDepartment}/calendar/export.php`, "_blank", "width=500,height=700");
    })
    document.querySelector("#overlay_link_message_info").textContent = "年度変更によりeALPSとの再連携が必要です。";
    document.querySelector("#overlay_link_message").style.display = "flex";

  } else if (userConfig.accountStatus == "linked"){
    document.querySelector("#overlay_link_message").style.display = "none";

    // ローカルデータを取得
    const userLocalData = await chrome.storage.local.get(["userTask", "lastUpdate"]);

    // 保存された課題データを取得してHTML要素を生成
    console.log("getLocalTaskData", userLocalData.userTask);
    const saveData = new SaveData(userLocalData.userTask)
    const fragment = saveData.formatToHtml().get();

    // 現在表示されているリストを削除
    const taskList = document.querySelector(".task_list");
    while(taskList.firstChild){
      taskList.removeChild(taskList.firstChild);
    }

    // 生成したHTML要素を挿入
    document.querySelector(".task_list").appendChild(fragment);

    // すべてのチェックボックスにイベントリスナーを設定
    document.querySelectorAll("input[name=finish]").forEach(checkbox => {
      checkbox.addEventListener("input", async() => {
        if (checkbox.checked){
          checkbox.closest(".task_item").classList.add("finished");
          const res = (await chrome.storage.local.get(["userTask"])).userTask;
          res[checkbox.value].finish = true;
          chrome.storage.local.set({userTask: res});

        } else {
          checkbox.closest(".task_item").classList.remove("finished");
          const res = (await chrome.storage.local.get(["userTask"])).userTask;
          res[checkbox.value].finish = false;
          chrome.storage.local.set({userTask: res});
        }
        chrome.runtime.sendMessage({
          type: "update",
          status: "refresh"
        }).catch((e) => console.log(e));
      });
    });

    // 最終更新日時を設定
    const lastUpdate = formatTimeCode(userLocalData.lastUpdate)
    document.querySelector("#last_update").textContent = `${lastUpdate.date} ${lastUpdate.time}`;

    // ローディング画面を閉じる
    document.querySelector("#overlay_loading").style.display = "none";
  }
}

window.onload = () => {

  // ヘッダーのボタンにイベントリスナー登録
  document.querySelector("#update").addEventListener("click", () => {
    document.querySelector("#overlay_loading").style.display = "flex";
    chrome.runtime.sendMessage({
      type: "update",
      status: "start"
    }).catch((e) => console.log(e));
  });
  document.querySelector("#setting").addEventListener("click", () => {
    const optionsPage = chrome.runtime.getURL("pages/options/options.html");
    window.open(optionsPage, "_blank");
  });

  // フッダーのボタンにイベントリスナー登録
  document.querySelector("#conform_delete_finish").addEventListener("click", () => {
    document.querySelector("#overlay_conform_delete_finish").style.display = "flex";
  });
  document.querySelector("#conform_delete_past").addEventListener("click", () => {
    document.querySelector("#overlay_conform_delete_past").style.display = "flex";
  });
  document.querySelector("#cancel_delete_finish").addEventListener("click", () => {
    document.querySelector("#overlay_conform_delete_finish").style.display = "none";
  });
  document.querySelector("#cancel_delete_past").addEventListener("click", () => {
    document.querySelector("#overlay_conform_delete_past").style.display = "none";
  });
  document.querySelector("#delete_finish").addEventListener("click", async() => {
    document.querySelector("#overlay_conform_delete_finish").style.display = "none";
    document.querySelector("#overlay_loading").style.display = "flex";

    const saveData = (await chrome.storage.local.get(["userTask"])).userTask;
    const finishedCheckbox = document.querySelectorAll("input[name=finish]:checked");
    finishedCheckbox.forEach(checkbox => {
      saveData[checkbox.value].display = false;
    })
    chrome.storage.local.set({userTask: saveData});
    loadTaskListFrame();
    chrome.runtime.sendMessage({
      type: "update",
      status: "refresh"
    }).catch((e) => console.log(e));
  });
  document.querySelector("#delete_past").addEventListener("click", async() => {
    document.querySelector("#overlay_conform_delete_past").style.display = "none";
    document.querySelector("#overlay_loading").style.display = "flex";
    const saveData = (await chrome.storage.local.get(["userTask"])).userTask;
    document.querySelectorAll('.past').forEach(pastTask => {
      pastTask.querySelectorAll("input[name=finish]").forEach(pastCheckbox => {
        saveData[pastCheckbox.value].display = false;
      })
    })
    chrome.storage.local.set({userTask: saveData});
    loadTaskListFrame();
    chrome.runtime.sendMessage({
      type: "update",
      status: "refresh"
    }).catch((e) => console.log(e));
  });
  document.querySelectorAll(".close").forEach(close => {
    close.addEventListener("click", () => {
      close.closest(".overlay").style.display = "none";
    })
  });
  document.querySelector("#add").addEventListener("click", () => {
    document.querySelector("#add_task").style.display = "flex";
  });
  document.querySelector("#send_task").addEventListener("click", () => {
    const className = document.querySelector("#class_name").value;
    const taskName = document.querySelector("#task_name").value;
    const taskLimit = document.querySelector("#task_limit").value;
    const repeat = document.querySelector("#repeat_task").checked;
    if (!className) {
      document.querySelector("#task_info_error").textContent = "※講義名を入力してください";
      document.querySelector("#task_info_error").style.display = "block";
    } else if (!taskName) {
      document.querySelector("#task_info_error").textContent = "※課題名を入力してください";
      document.querySelector("#task_info_error").style.display = "block";
    } else if (!taskLimit) {
      document.querySelector("#task_info_error").textContent = "※提出期限を入力してください";
      document.querySelector("#task_info_error").style.display = "block";
    } else {
      document.querySelector("#task_info_error").style.display = "none";

      document.querySelector("#class_name_confirm").textContent = className;
      document.querySelector("#task_name_confirm").textContent = taskName;

      const {fragment, limitList} = generateTaskLimit(taskLimit, repeat);
      const taskLimitList = document.querySelector("#task_limit_confirm");
      while(taskLimitList.firstChild){
        taskLimitList.removeChild(taskLimitList.firstChild);
      }
      document.querySelector("#task_limit_confirm").appendChild(fragment);
      cacheData = {
        className: className,
        taskName: taskName,
        limitList: limitList
      };

      document.querySelector("#add_task").style.display = "none";
      document.querySelector("#add_task_confirm").style.display = "flex";
    }
  });
  document.querySelector("#save_task").addEventListener("click", () => {
    const rawSaveData = {}
    cacheData.limitList.forEach(limit => {
      let uid = "9";
      for (let i=0; i<5; i++){
        uid += Math.floor(Math.random()*10).toString();
      }
      rawSaveData[uid] = {
        className: cacheData.className,
        taskName: cacheData.taskName,
        taskLimit: limit,
        finish: false,
        display: true
      }
    });

    chrome.storage.local.get(["userTask"]).then(async(userLocalData) => {
      const saveData = (new SaveData(rawSaveData)).margeWith(userLocalData.userTask).get();

      await chrome.storage.local.set({
        userTask: saveData,
      });
      chrome.runtime.sendMessage({
        type: "update",
        status: "complete"
      }).catch((e) => console.log(e));
      document.querySelector("#class_name").value = "";
      document.querySelector("#task_name").value = "";
      document.querySelector("#task_limit").value = "";
      document.querySelector("#add_task_confirm").style.display = "none";
      loadTaskListFrame();
    });
  });


  // 課題リストフレームを更新
  loadTaskListFrame();

  // メッセージリスナー登録
  chrome.runtime.onMessage.addListener((message) => {
    // アップデート完了時に課題リストフレームを更新
    if (message.type == "update"){
      if (message.status == "complete") {
        document.querySelector("#net_error").style.display = "none";
        loadTaskListFrame();

      } else if (message.status == "error") {
        document.querySelector("#net_error").style.display = "block";
        document.querySelector("#overlay_loading").style.display = "none";
      }
    }
  });
}