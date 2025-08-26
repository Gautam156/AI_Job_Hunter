
import { getPlan } from './storage.js';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    switch (message.type) {
      case 'AJH_GET_PLAN': {
        const plan = await getPlan();
        sendResponse({ ok: true, plan });
        break;
      }
      case 'AJH_APPLY_PAGE_DETECTED': {
        sendResponse({ ok: true });
        break;
      }
      default:
        sendResponse({ ok: false, error: 'Unknown message type' });
    }
  })();
  return true;
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'ajh-autofill',
    title: 'AI Job Hunter: Autofill this form',
    contexts: ['page', 'selection']
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'ajh-autofill' && tab?.id) {
    chrome.tabs.sendMessage(tab.id, { type: 'AJH_AUTOFILL_REQUEST' });
  }
});
