var Xvfb = require('xvfb');
var selenium = require('selenium-standalone');
var xvfb = new Xvfb();
xvfb.startSync();

selenium.install({
	version: '2.53.0',
	baseURL: 'https://selenium-release.storage.googleapis.com',
	drivers: {
		chrome: {
			version: '2.22',
			arch: process.arch,
			baseURL: 'https://chromedriver.storage.googleapis.com'
		}
	}
}, function() {
	console.log('Selenium is installed.');

	selenium.start(function() {

		console.log('Selenium is running.');

		var webdriverio = require('webdriverio');
		var options = {
			desiredCapabilities: {
				browserName: 'chrome',
				chromeOptions: {
					'binary': '/usr/bin/google-chrome'
				}

			}
		};
		var client = webdriverio.remote(options);

		client
			.init()
			.url('https://www.google.com/')
			.getTitle()
			.then(function (title) {
				console.log('Title is: ' + title);
				// outputs: "Title is: WebdriverIO (Software) at DuckDuckGo"
				Xvfb.stopSync();
			})
			.end();
	})
});


