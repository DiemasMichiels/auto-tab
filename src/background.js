let currentInterval = 15;
let scrollValue = 200;
let activeWindows = new Map(); // Track active state per window
let windowTimers = new Map(); // Track timers per window

chrome.action.onClicked.addListener(async () => {
  let { interval, scrollValue } = await chrome.storage.sync.get([
    "interval",
    "scrollValue",
  ]);
  currentInterval = interval || currentInterval;
  scrollValue = scrollValue || scrollValue;
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync") {
    if (changes.interval?.newValue) {
      currentInterval = changes.interval.newValue;
      // Update all active windows with new interval
      activeWindows.forEach((_, windowId) => {
        if (activeWindows.get(windowId)) {
          restartWindowTimer(windowId);
        }
      });
    }

    if (changes.scrollValue?.newValue) {
      scrollValue = changes.scrollValue.newValue;
    }
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "activateTabs") {
    activateTabs();
  } else if (request.action === "scrollTabs") {
    scrollTabs();
  } else if (request.action === "scrollActiveTab") {
    scrollActiveTab();
  } else if (request.type === "toggle") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const windowId = tabs[0].windowId;
      const isActive = activeWindows.get(windowId) || false;

      activeWindows.set(windowId, !isActive);

      if (!isActive) {
        startWindowTimer(windowId);
      } else {
        stopWindowTimer(windowId);
      }

      sendResponse({ active: !isActive });
    });
  } else if (request.type === "getActiveState") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const windowId = tabs[0].windowId;
      const isActive = activeWindows.get(windowId) || false;
      sendResponse({ active: isActive });
    });
  }
  return true; // Keep message channel open for async response
});

// Clean up when window is closed
chrome.windows.onRemoved.addListener((windowId) => {
  activeWindows.delete(windowId);
  stopWindowTimer(windowId);
});

function activateTabs() {
  chrome.tabs.query({ currentWindow: true }, (tabs) => {
    let delay = 0;
    const interval = 200;

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
    func: function scroll(scrollValue) {
      window.scrollTo(0, scrollValue);
    },
    args: [scrollValue],
  });
}

function startWindowTimer(windowId) {
  stopWindowTimer(windowId); // Clear any existing timer

  const timer = setInterval(() => {
    switchTabInWindow(windowId);
  }, currentInterval * 1000);

  windowTimers.set(windowId, timer);
}

function stopWindowTimer(windowId) {
  const timer = windowTimers.get(windowId);
  if (timer) {
    clearInterval(timer);
    windowTimers.delete(windowId);
  }
}

function restartWindowTimer(windowId) {
  if (activeWindows.get(windowId)) {
    startWindowTimer(windowId);
  }
}

function switchTabInWindow(windowId) {
  if (!activeWindows.get(windowId)) {
    stopWindowTimer(windowId);
    return;
  }

  chrome.tabs.query({ active: true, windowId: windowId }, (tabs) => {
    if (tabs.length === 0) return;

    const currentIndex = tabs[0].index;
    chrome.tabs.query({ windowId: windowId }, (allTabs) => {
      if (allTabs.length <= 1) return;

      const nextIndex = (currentIndex + 1) % allTabs.length;
      chrome.tabs.update(allTabs[nextIndex].id, { active: true });
    });
  });
}
