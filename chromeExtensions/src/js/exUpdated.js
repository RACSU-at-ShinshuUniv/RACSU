window.onload = () => {
  document.getElementById("start_init_setting").addEventListener("click", async () => {
    chrome.storage.sync.set({
      setGeneral: true,
      setSpecific: true
    });
    open("https://lms.ealps.shinshu-u.ac.jp/2023/t/calendar/export.php", "_blank", "width=500,height=800");
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (message.action == "finish_setting"){
      window.location.href = "options.html";
    }
  });
};