const seleniumAssistant = require('selenium-assistant');

Promise.all([
  seleniumAssistant.downloadFirefoxDriver(),
  seleniumAssistant.downloadBrowser('chrome', 'stable'),
  seleniumAssistant.downloadBrowser('chrome', 'beta'),
  seleniumAssistant.downloadBrowser('chrome', 'unstable'),
  seleniumAssistant.downloadBrowser('firefox', 'stable'),
  seleniumAssistant.downloadBrowser('firefox', 'beta'),
  seleniumAssistant.downloadBrowser('firefox', 'unstable'),
  seleniumAssistant.downloadBrowser('opera', 'stable'),
  seleniumAssistant.downloadBrowser('opera', 'beta'),
  seleniumAssistant.downloadBrowser('opera', 'unstable'),
])
.then(() => {
  console.log('Browser download complete.');
});
