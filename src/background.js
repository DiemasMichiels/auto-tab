let currentInterval = 15;
let active = false;
let activeWindowId = null;
let scrollValue = 200;

chrome.action.onClicked.addListener(async () => {
  let { interval, scrollValue } = await chrome.storage.sync.get(['interval', 'scrollValue']);
  currentInterval = interval || currentInterval;
  scrollValue = scrollValue || scrollValue;
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync') {
    if (changes.interval?.newValue) {
      currentInterval = changes.interval.newValue;
    }

    if (changes.scrollValue?.newValue) {
      scrollValue = changes.scrollValue.newValue;
    }
  }
});

chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  if (request.action === 'activateTabs') {
    activateTabs();
  } else if (request.action === 'scrollTabs') {
    scrollTabs();
  } else if (request.action === 'scrollActiveTab') {
    scrollActiveTab();
  } else if (request.type === 'toggle') {
    active = !active;

    if (active) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        activeWindowId = tabs[0].windowId;
      });
    } else {
      activeWindowId = null;
    }

    sendResponse({ active: active });
  } else if (request.type === 'getActiveState') {
    sendResponse({ active: active });
  }
});

function activateTabs() {
  chrome.tabs.query({ currentWindow: true }, (tabs) => {
    let delay = 0;
    const interval = 200; // 1 second between switching tabs

    tabs.forEach((tab) => {
      setTimeout(() => {
        chrome.tabs.update(tab.id, { active: true });
      }, delay);
      delay += interval;
    });
  });
}

function scrollTabs() {
  chrome.tabs.query({ currentWindow: true }, (tabs) => {
    let delay = 0;

    tabs.forEach((tab) => {
      setTimeout(() => {
        chrome.tabs.update(tab.id, { active: true }, () => {
          executeScrollScript(tab.id);
        });
      }, delay);
      delay += 10;
    });
  });
}

function scrollActiveTab() {
  chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
    const activeTab = tabs[0];
    executeScrollScript(activeTab.id);
  });
}

function executeScrollScript(tabId) {
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    func: function scroll(scrollValue) { window.scrollTo(0, scrollValue) },
    args: [scrollValue],
  });
}

function switchTab() {
  if (active) {
    chrome.tabs.query({ active: true, windowId: activeWindowId }, (tabs) => {
      const currentIndex = tabs[0].index;
      chrome.tabs.query({ windowId: activeWindowId }, (tabs) => {
        const nextIndex = (currentIndex + 1) % tabs.length;
        chrome.tabs.update(tabs[nextIndex].id, { active: true });
      });
    });
  }
  setTimeout(switchTab, currentInterval * 1000);
}

setTimeout(switchTab, currentInterval * 1000);

