window.onload = () => {
  chrome.storage.sync.get().then(userConfig => {
    if (userConfig.displayList) {
      const iframe = document.createElement("iframe");
      iframe.src = chrome.runtime.getURL("pages/portal/index.html");
      iframe.style.width = "100%";
      iframe.style.height = "357px";
      iframe.style.border = "1px solid rgba(0, 0, 0, 0.125)";
      document.querySelector(".area-wrapper").insertBefore(iframe, document.querySelector(".schedule-area"));
    }
  })
};