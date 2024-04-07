import { IcalClient, getAccountParams } from "../../common/js/modules/IcalClient.js";

const loadSavedSetting = async() => {
  const userConfig = await chrome.storage.sync.get();
  document.querySelector("#display_list").checked = userConfig.displayList;
  if (userConfig.accountStatus == "linked"){
    const moodleURL_g = `https://lms.ealps.shinshu-u.ac.jp/${userConfig.accountExpiration}/g/calendar/export_execute.php?userid=${userConfig.moodleGeneralId}&authtoken=${userConfig.moodleGeneralToken}&preset_what=all&preset_time=recentupcoming`;
    const moodleURL_s = `https://lms.ealps.shinshu-u.ac.jp/${userConfig.accountExpiration}/${userConfig.userDepartment}/calendar/export_execute.php?userid=${userConfig.moodleSpecificId}&authtoken=${userConfig.moodleSpecificToken}&preset_what=all&preset_time=recentupcoming`;
    document.querySelector("#moodle_url_g").value = moodleURL_g;
    document.querySelector("#moodle_url_s").value = moodleURL_s;
  }
}

window.onload = () => {

  // インストール直後の場合に案内メッセージを表示
  chrome.storage.sync.get().then(userConfig => {
    if (userConfig.accountStatus == "installed"){
      document.querySelector("#overlay_conform_auto_setting").style.display = "flex";
      document.querySelector("#installed_message").style.display = "block";
      document.querySelector(".close").style.display = "none";
    }
  });

  // 各ボタンにイベントリスナー登録
  document.querySelector("#conform_auto_setting").addEventListener("click", () => {
    document.querySelector("#overlay_conform_auto_setting").style.display = "flex";
    document.querySelector("#installed_message").style.display = "none";
    document.querySelector(".close").style.display = "block";
  });
  document.querySelector("#edit_url").addEventListener("click", () => {
    if (document.querySelector("#moodle_url_g").disabled){
      document.querySelector("#moodle_url_g").disabled = false;
      document.querySelector("#moodle_url_s").disabled = false;
      document.querySelector("#edit_url").textContent = "変更を保存";

    } else {
      const moodleURL_g = document.querySelector("#moodle_url_g").value;
      const moodleURL_s = document.querySelector("#moodle_url_s").value;
      document.querySelector("#overlay_waiting").style.display = "flex";

      const icalClient_g = new IcalClient(moodleURL_g);
      const icalClient_s = new IcalClient(moodleURL_s);

      icalClient_g.isValidUrl().then(res => {
        if (res) {
          icalClient_s.isValidUrl().then(res => {
            if (res) {
              const account_g = getAccountParams(moodleURL_g);
              const account_s = getAccountParams(moodleURL_s);
              chrome.storage.sync.set({
                userDepartment: account_s.department,
                moodleGeneralId: account_g.userid,
                moodleGeneralToken: account_g.authtoken,
                moodleSpecificId: account_s.userid,
                moodleSpecificToken: account_s.authtoken,
                accountExpiration: account_g.expiration,
              });
              document.querySelector("#moodle_url_g").disabled = true;
              document.querySelector("#moodle_url_s").disabled = true;
              document.querySelector("#overlay_waiting").style.display = "none";
              document.querySelector("#warning_edit_url").style.display = "none";
              document.querySelector("#edit_url").textContent = "URLを編集";

            } else {
              document.querySelector("#overlay_waiting").style.display = "none";
              document.querySelector("#warning_edit_url").textContent = "※「専門教育URL」の有効性が確認できないため、保存できません。";
              document.querySelector("#warning_edit_url").style.display = "block";
            }
          })

        } else {
          document.querySelector("#overlay_waiting").style.display = "none";
          document.querySelector("#warning_edit_url").textContent = "※「共通教育URL」の有効性が確認できないため、保存できません。";
          document.querySelector("#warning_edit_url").style.display = "block";
        }
      });
    }
  });
  document.querySelector(".close").addEventListener("click", () => {
    document.querySelector("#overlay_conform_auto_setting").style.display = "none";
  });
  document.querySelector("#start_auto_setting").addEventListener("click", () => {
    const userDepartment = document.querySelector("#department").value;
    if (userDepartment == ""){
      document.querySelector("#warning_department").style.display = "block";
    } else {
      document.querySelector("#warning_department").style.display = "none";
      document.querySelector("#overlay_conform_auto_setting").style.display = "none";
      document.querySelector("#overlay_waiting").style.display = "flex";
      chrome.storage.sync.set({
        needToSetSpecific: true,
        accountStatus: "linking"
      });
      const thisTerm = new Date();
      thisTerm.setMonth(thisTerm.getMonth()-3);
      open(`https://lms.ealps.shinshu-u.ac.jp/${thisTerm.getFullYear()}/${userDepartment}/calendar/export.php`, "_blank", "width=500,height=700");
    }
  });
  document.querySelector("#display_list").addEventListener("click", () => {
    chrome.storage.sync.set({
      displayList: document.querySelector("#display_list").checked
    });
  });

  // メッセージリスナー登録
  chrome.runtime.onMessage.addListener((message) => {
    // 初期設定完了で待機画面を非表示
    if (message.type == "setting" && message.status == "complete"){
      loadSavedSetting().then(() => {
        document.querySelector("#overlay_waiting").style.display = "none";
        chrome.storage.sync.get().then(userConfig => {
          if (userConfig.displayList) {
            window.open("https://timetable.ealps.shinshu-u.ac.jp/portal/", "_blank");
          }
        })
      });
    }
  });

  // 保存済みユーザー設定内容を挿入
  loadSavedSetting();
}