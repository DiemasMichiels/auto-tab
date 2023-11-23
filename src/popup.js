const saveButton = document.getElementById('save');
const toggleButton = document.getElementById('toggle');

document.addEventListener('DOMContentLoaded', () => {
  const activateTabsButton = document.getElementById('activateTabs');
  activateTabsButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'activateTabs' });
    window.close();
  });

  const scrollTabsButton = document.getElementById('scrollTabs');
  scrollTabsButton.addEventListener('click', () => {
    const scrollValue = document.getElementById('scrollValue').value;
    chrome.runtime.sendMessage({ action: 'scrollTabs', scrollValue: scrollValue });
    window.close();
  });

  const scrollActiveTabButton = document.getElementById('scrollActiveTab');
  scrollActiveTabButton.addEventListener('click', () => {
    const scrollValue = document.getElementById('scrollValue').value;
    chrome.runtime.sendMessage({ action: 'scrollActiveTab', scrollValue: scrollValue });
    window.close();
  });

  saveButton.addEventListener('click', () => {
    const interval = document.getElementById('interval').value;
    chrome.runtime.sendMessage(
      { type: 'updateInterval', interval: interval },
      () => {
        alert('Interval saved!');
        window.close();
      }
    );
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