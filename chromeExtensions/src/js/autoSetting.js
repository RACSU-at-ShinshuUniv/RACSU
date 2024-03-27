const getAccount = (url) => {
  const urlParams = url.split(/[/=&?]/);

  // URLエラーチェック
  if (url.indexOf("https://lms.ealps.shinshu-u.ac.jp/") == -1 || urlParams[6] !== "export_execute.php" || urlParams.length !== 15){
    return {department: null, id: null, token: null};

  } else {
    const term = new Date();
    term.setMonth(term.getMonth()-3);
    const urlParamsDepartment = urlParams[urlParams.indexOf(term.getFullYear().toString())+1];
    const urlParamsId = urlParams[urlParams.indexOf("userid")+1];
    const urlParamsToken = urlParams[urlParams.indexOf("authtoken")+1];
    return {department: urlParamsDepartment, id: urlParamsId, token: urlParamsToken};
  }
}

window.onload = () => {
  const currentUrl = location.href;
  const currentUrlDepartment = currentUrl.match(/https\:\/\/lms\.ealps\.shinshu-u\.ac\.jp\/\d\d\d\d\/(?<department>.)\/calendar\/export\.php/).groups.department;
  const calendarUrl = document.querySelector(".calendarurl");

  chrome.storage.sync.get(async(result) => {
    if (currentUrlDepartment.match(/[lejsmtaf]/) && result.setSpecific){
      if (calendarUrl) {
        const {department, id, token} = getAccount(calendarUrl.textContent);
        chrome.storage.sync.set({
          setSpecific: false,
          userDepartment: department,
          moodleSpecificId: id,
          moodleSpecificToken: token,
        });
        window.location.href = "https://lms.ealps.shinshu-u.ac.jp/2023/g/calendar/export.php";

      } else {
        document.querySelector("#id_events_exportevents_all").checked = true;
        document.querySelector("#id_period_timeperiod_recentupcoming").checked = true;
        document.querySelector("#id_generateurl").click();
      }

    } else if (currentUrlDepartment == "g" && result.setGeneral){
      if (calendarUrl) {
        const {department, id, token} = getAccount(calendarUrl.textContent);
        chrome.storage.sync.set({
          setGeneral: false,
          moodleGeneralId: id,
          moodleGeneralToken: token,
        });

        chrome.runtime.sendMessage({ action: "finish_setting" });
        window.open('about:blank','_self').close();

      } else {
        document.querySelector("#id_events_exportevents_all").checked = true;
        document.querySelector("#id_period_timeperiod_recentupcoming").checked = true;
        document.querySelector("#id_generateurl").click();
      }
    }
  });
};
