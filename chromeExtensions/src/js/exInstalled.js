window.onload = () => {
  document.getElementById("start_init_setting").addEventListener("click", async () => {
    chrome.storage.sync.set({
      setGeneral: true,
      setSpecific: true
    });
    window.location.href = "https://lms.ealps.shinshu-u.ac.jp/2023/t/calendar/export.php";
  });
};