const toggleButton = document.getElementById('toggle');

// Restore values from chrome.storage when the page loads
chrome.storage.sync.get(['interval', 'scrollValue'], function(items) {
  if(items.interval) {
    document.getElementById('interval').value = items.interval;
  }

  if(items.scrollValue) {
    document.getElementById('scrollValue').value = items.scrollValue;
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const intervalInput = document.getElementById('interval');
  const scrollValueInput = document.getElementById('scrollValue');

  intervalInput.oninput = function() {
    chrome.storage.sync.set({'interval': this.value});
  }

  scrollValueInput.oninput = function() {
    chrome.storage.sync.set({'scrollValue': this.value});
  }

  const activateTabsButton = document.getElementById('activateTabs');
  activateTabsButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'activateTabs' });
    window.close();
  });

  const scrollTabsButton = document.getElementById('scrollTabs');
  scrollTabsButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'scrollTabs' });
    window.close();
  });

  const scrollActiveTabButton = document.getElementById('scrollActiveTab');
  scrollActiveTabButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'scrollActiveTab' });
    window.close();
  });

  toggleButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'toggle' }, (response) => {
      if (response?.active) {
        toggleButton.textContent = 'Disable';
      } else {
        toggleButton.textContent = 'Enable';
      }
      window.close();
    });
  });
});

chrome.runtime.sendMessage({ type: 'getActiveState' }, (response) => {
  if (response?.active) {
    toggleButton.textContent = 'Disable';
  } else {
    toggleButton.textContent = 'Enable';
  }
});