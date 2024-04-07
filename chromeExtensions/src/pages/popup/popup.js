import { SaveData, formatTimeCode } from "../../common/js/modules/DataFormatter.js";

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
        });
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
    });
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
    });
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
    });
  });

  // 課題リストフレームを更新
  loadTaskListFrame();

  // メッセージリスナー登録
  chrome.runtime.onMessage.addListener((message) => {
    // アップデート完了時に課題リストフレームを更新
    if (message.type == "update" && message.status == "complete"){
      loadTaskListFrame();
    }
  });
}