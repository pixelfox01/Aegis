chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.type !== 'POLICY_DETECTED') return;
  
    chrome.tabs.sendMessage(sender.tab.id, {
      type: 'SHOW_POLICY_POPUP',
      payload: message.payload
    });
  });
