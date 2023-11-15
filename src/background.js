let currentInterval = 15;
let active = false;
let activeWindowId = null;


chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  if (request.action === 'activateTabs') {
    activateTabs();
  } else if (request.action === 'scrollTabs') {
    scrollTabs(request);
  } else if (request.action === 'scrollActiveTab') {
    scrollActiveTab(request);
  } else if (request.type === 'updateInterval') {
    currentInterval = request.interval;
    sendResponse();
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

function scrollTabs(request) {
  chrome.tabs.query({ currentWindow: true }, (tabs) => {
    let delay = 0;

    tabs.forEach((tab) => {
      setTimeout(() => {
        chrome.tabs.update(tab.id, { active: true }, () => {
          executeScrollScript(tab.id, parseInt(request.scrollValue));
        });
      }, delay);
      delay += 1;
    });
  });
}

function scrollActiveTab(request) {
  chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
    const activeTab = tabs[0];
    executeScrollScript(activeTab.id, parseInt(request.scrollValue));
  });
}

function executeScrollScript(tabId, scrollValue) {
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

