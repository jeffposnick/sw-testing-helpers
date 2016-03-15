/*
  Copyright 2016 Google Inc. All Rights Reserved.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

'use strict';

const which = require('which');
const chromeOptions = require('selenium-webdriver/chrome');
const firefoxOptions = require('selenium-webdriver/firefox');
const webdriver = require('selenium-webdriver');

class AutomatedBrowserTesting {
  constructor() {

  }

  getAutomatedBrowsers() {
    const browserExecutables = [
      {
        prettyName: 'Google Chrome',
        executableName: 'google-chrome',
        seleniumBrowserId: 'chrome',
        seleniumOptions: new chromeOptions.Options()
      },
      {
        prettyName: 'Google Chrome Beta',
        executableName: 'google-chrome-beta',
        seleniumBrowserId: 'chrome',
        seleniumOptions: new chromeOptions.Options()
      },
      {
        prettyName: 'Google Chrome Dev',
        executableName: 'google-chrome-unstable',
        seleniumBrowserId: 'chrome',
        seleniumOptions: new chromeOptions.Options()
      },
      {
        prettyName: 'Firefox',
        executableName: 'firefox',
        seleniumBrowserId: 'firefox',
        seleniumOptions: new firefoxOptions.Options()
      }
    ];

    const discoverableBrowsers = [];
    browserExecutables.forEach(browserInfo => {
      try {
        const executablePath = which.sync(browserInfo.executableName);
        const seleniumOptions = browserInfo.seleniumOptions;

        if (seleniumOptions.setChromeBinaryPath) {
          seleniumOptions.setChromeBinaryPath(executablePath);
        } else if(seleniumOptions.setBinary) {
          seleniumOptions.setBinary(executablePath);
        } else {
          throw new Error('Unknown selenium options object');
        }

        browserInfo.getSeleniumDriver = () => {
          return new webdriver
            .Builder()
            .forBrowser(browserInfo.seleniumBrowserId)
            .setChromeOptions(browserInfo.seleniumOptions)
            .setFirefoxOptions(browserInfo.seleniumOptions)
            .build()
        };

        discoverableBrowsers.push(browserInfo);
      } catch (err) {
        // Unable to find the browser - chances are this isn't an error
        // but instead the browser is just not installed
      }
    });

    // Add on firefox beta if environment variable is set
    if (process.env.FF_BETA_PATH) {
      try {
        const seleniumOptions = new firefoxOptions.Options();
        seleniumOptions.setBinary(process.env.FF_BETA_PATH);
        const ffBetaBrowserInfo = {
          prettyName: 'Firefox Beta',
          executableName: 'firefox',
          seleniumBrowserId: 'firefox',
          seleniumOptions: seleniumOptions,
        };
        ffBetaBrowserInfo.getSeleniumDriver = () => {
          return new webdriver
            .Builder()
            .forBrowser(ffBetaBrowserInfo.seleniumBrowserId)
            .setChromeOptions(ffBetaBrowserInfo.seleniumOptions)
            .setFirefoxOptions(ffBetaBrowserInfo.seleniumOptions)
            .build()
        }
        discoverableBrowsers.push(ffBetaBrowserInfo);
      } catch (err) {
        console.error(`Unable to find executable defined via FF_BETA_PATH. [${process.env.FF_BETA_PATH}]`);
      }
    }

    return discoverableBrowsers;
  }

  runMochaTests(browserName, driver, url) {
    // The driver methods are wrapped in a new promise because the
    // selenium-webdriver API seems to using some custom promise
    // implementation that has slight behaviour differences.
    return new Promise((resolve, reject) => {
      driver.get(url)
      .then(() => {
        return driver.executeScript('return window.navigator.userAgent;');
      })
      .then(userAgent => {
        // This is just to help with debugging so we can get the browser version
        console.log('        [' + browserName + ' UA]: ' + userAgent);
      })
      .then(() => {
        // We get webdriver to wait until window.testsuite.testResults is defined.
        // This is set in the in browser mocha tests when the tests have finished
        // successfully
        return driver.wait(function() {
          return driver.executeScript('return ((typeof window.testsuite !== \'undefined\') && window.testsuite.testResults !== \'undefined\');');
        });
      })
      .then(() => {
        // This simply retrieves the test results from the inbrowser mocha tests
        return driver.executeScript('return window.testsuite.testResults;');
      })
      .then(testResults => {
        // Resolve the outer promise to get out of the webdriver promise chain
        resolve(testResults);
      })
      .thenCatch(reject);
    });
  }

  manageTestResults(testResults) {
    // Print test failues
    if (testResults.failed.length > 0) {
      const failedTests = testResults.failed;
      let errorMessage = 'Issues in ' + browserName + '.\n\n' + browserName + ' had ' + testResults.failed.length + ' test failures.\n';
      errorMessage += '------------------------------------------------\n';
      errorMessage += failedTests.map((failedTest, i) => {
        return `[Failed Test ${i + 1}]\n    ${failedTest.title}\n`;
      }).join('\n');
      errorMessage += '------------------------------------------------\n';
      throw new Error(errorMessage);
    }
  }

  killWebDriver(driver) {
    return new Promise(resolve => {
      // Suggested as fix to 'chrome not reachable'
      // http://stackoverflow.com/questions/23014220/webdriver-randomly-produces-chrome-not-reachable-on-linux-tests
      const timeoutGapCb = function() {
        setTimeout(resolve, 2000);
      };

      if (driver === null) {
        return timeoutGapCb();
      }

      driver.quit()
      .then(() => {
        timeoutGapCb();
      })
      .thenCatch(() => {
        timeoutGapCb();
      });
    });
  }
}

module.exports = AutomatedBrowserTesting;
