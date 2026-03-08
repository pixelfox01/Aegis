// popup-router.js
// Checks if the user has completed onboarding and redirects to the
// appropriate popup page. This avoids a flash of wrong content.

chrome.storage.sync.get(['ONBOARDED', 'AUTH_TOKEN'], (result) => {
    const isOnboarded = result.ONBOARDED === true && !!result.AUTH_TOKEN;
  
    if (isOnboarded) {
      window.location.replace('interface/interface.html');
    } else {
      window.location.replace('onboarding/onboarding.html');
    }
  });
