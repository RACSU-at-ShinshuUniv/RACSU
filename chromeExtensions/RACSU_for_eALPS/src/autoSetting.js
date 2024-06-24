const linkingMessage = `<div style="display: flex; background-color: #ffffff; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; justify-content: center; align-items: center; z-index: 999;">
  <p style="font-size: 20px; color: #1b5aad;">連携情報を取得中です...</p>
</div>
`;

const getAccountParams = (url) => {
  const urlParams = url.match(/https\:\/\/(.+?)\.shinshu-u\.ac\.jp\/(?<expiration>\d\d\d\d)\/(?<department>.)\/calendar\/export_execute\.php\?userid\=(?<userid>.+?)\&authtoken=(?<authtoken>.+?)\&.+/);

  if (urlParams == null){
    return {expiration: null, department: null, userid: null, authtoken: null};
  } else {
    return {expiration: urlParams.groups.expiration, department: urlParams.groups.department, userid: urlParams.groups.userid, authtoken: urlParams.groups.authtoken};
  }
}


const currentUrlDepartment = location.href.match(/https\:\/\/lms\.ealps\.shinshu-u\.ac\.jp\/\d\d\d\d\/(?<department>.)\/calendar\/export\.php/).groups.department;
const calendarUrl = document.querySelector("#calendarexporturl")?.value;
console.log(calendarUrl);

chrome.storage.sync.get(async(result) => {
  if (currentUrlDepartment.match(/[lejsmtaf]/) && result.accountStatus == "linking" && result.needToSetSpecific){
    document.body.insertAdjacentHTML("afterbegin", linkingMessage);
    if (calendarUrl !== undefined) {
      const {expiration, department, userid, authtoken} = getAccountParams(calendarUrl);
      chrome.storage.sync.set({
        needToSetSpecific: false,
        needToSetGeneral: true,
        userDepartment: department,
        moodleSpecificId: userid,
        moodleSpecificToken: authtoken,
        accountExpiration: expiration
      });
      window.location.href = `https://lms.ealps.shinshu-u.ac.jp/${expiration}/g/calendar/export.php`;

    } else {
      document.querySelector("#id_events_exportevents_all").checked = true;
      document.querySelector("#id_period_timeperiod_recentupcoming").checked = true;
      document.querySelector("#id_generateurl").click();
    }

  } else if (currentUrlDepartment == "g"&& result.accountStatus == "linking" && result.needToSetGeneral){
    document.body.insertAdjacentHTML("afterbegin", linkingMessage);
    if (calendarUrl !== undefined) {
      const {expiration, department, userid, authtoken} = getAccountParams(calendarUrl);
      chrome.storage.sync.set({
        needToSetGeneral: false,
        moodleGeneralId: userid,
        moodleGeneralToken: authtoken,
        accountStatus: "linked"
      });

      chrome.runtime.sendMessage({
        type: "setting",
        status: "complete"
      }).catch((e) => console.log(e));
      window.open('about:blank','_self').close();

    } else {
      document.querySelector("#id_events_exportevents_all").checked = true;
      document.querySelector("#id_period_timeperiod_recentupcoming").checked = true;
      document.querySelector("#id_generateurl").click();
    }
  }
});
