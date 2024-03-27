document.getElementById("btn").addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  console.log("hello from my ex.")

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: onRun,
  });
});

document.getElementById("show").addEventListener("click", async () => {
  chrome.storage.sync.get('url', function(result) {
    var value = result.url;
    console.log('取得した値:', value);
  });
});

document.getElementById("del").addEventListener("click", async () => {
  chrome.storage.sync.remove('url', function(result) {
    console.log("削除しました");
  });
});

function onRun() {
  const calendarUrl = document.querySelector(".calendarurl");
  if (calendarUrl){
    chrome.storage.sync.set({
      "url": calendarUrl.textContent
    });
    console.log(calendarUrl.textContent);
    window.location.href = "https://lms.ealps.shinshu-u.ac.jp/2023/t/calendar/export.php";

  } else {
    document.querySelector("#id_events_exportevents_all").checked = true;
    document.querySelector("#id_period_timeperiod_recentupcoming").checked = true;
    document.querySelector("#id_generateurl").click();
  }
}