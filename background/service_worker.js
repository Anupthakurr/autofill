// JobFill — Background Service Worker
// Handles badge updates and cross-context messaging

chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') {
    console.log('JobFill installed! Opening profile setup...');
  }
});

// Relay messages between popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'UPDATE_BADGE') {
    if (sender.tab?.id) {
      chrome.action.setBadgeText({
        text: message.count > 0 ? String(message.count) : '',
        tabId: sender.tab.id,
      });
      chrome.action.setBadgeBackgroundColor({
        color: '#6366f1',
        tabId: sender.tab.id,
      });
    }
  }
  return false;
});
