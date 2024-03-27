chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason == "install"){
    // インストール直後
    chrome.storage.sync.clear();
    chrome.storage.sync.set({
      setGeneral: false,
      setSpecific: false,
      userDepartment: "",
      moodleGeneralId: "",
      moodleGeneralToken: "",
      moodleSpecificId: "",
      moodleSpecificToken: "",
      runtimeId: chrome.runtime.id
    });
    chrome.tabs.create({
      url: "chrome-extension://" + chrome.runtime.id + "/installed.html"
    });

  } else if (details.reason == "update") {
    // アップデート直後
    chrome.storage.sync.clear();
    chrome.storage.sync.set({
      setGeneral: false,
      setSpecific: false,
      userDepartment: "",
      moodleGeneralId: "",
      moodleGeneralToken: "",
      moodleSpecificId: "",
      moodleSpecificToken: "",
      runtimeId: chrome.runtime.id
    });
    chrome.tabs.create({
      url: "chrome-extension://" + chrome.runtime.id + "/updated.html"
    });
  }
});