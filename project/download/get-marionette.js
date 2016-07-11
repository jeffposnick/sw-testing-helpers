'use strict';

const fs = require('fs');
const got = require('got');
const tar = require('tar');
const zlib = require('zlib');

const releaseUrl = 'https://api.github.com/repos/mozilla/geckodriver/releases';
const platformToFile = {
  darwin: 'mac',
  win32: 'win32',
  win64: 'win64',
  linux: 'linux64'
};
const outputFile = 'wires';
const fileDownloadIdentifier = platformToFile[process.platform];

got(releaseUrl, {json: true}).then(response => {
  if (!fileDownloadIdentifier) {
    throw `Your current platform, "${process.platform}", is not recognized by this script.`;
  }

  return response.body[0].assets.map(asset => asset.name.includes(fileDownloadIdentifier) ? asset.browser_download_url : null);
}).then(urls => {
  return urls.filter(url => Boolean(url));
}).then(filteredUrls => {
  if (filteredUrls.length === 0) {
    throw `Unable to find a download for your current platform, "${process.platform}".`;
  }

  console.log(`Starting download of ${filteredUrls[0]}...`);
  return got.stream(filteredUrls[0]);
}).then(downloadStream => {
  let gunzip = zlib.createGunzip();
  let tarExtractor = tar.Extract({path: './', mode: 0o755});

  downloadStream.pipe(gunzip).pipe(tarExtractor).on('close', () => {
    console.log(`Download of ${outputFile} for ${process.platform} is complete.`);
  }).on('error', error => {
    throw error;
  });
}).catch(error => {
  console.error(error);
  process.exit(1);
});
