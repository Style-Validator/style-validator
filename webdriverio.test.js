var Xvfb = require('xvfb');
var selenium = require('selenium-standalone');

selenium.start(function() {
	console.log('Selenium is running.');

	var xvfb = new Xvfb();
	xvfb.startSync();

	var webdriverio = require('webdriverio');
	var options = { desiredCapabilities: {
		browserName: 'chrome',
		chromeOptions: {
			'binary': '/usr/bin/google-chrome'
		}

	} };
	var client = webdriverio.remote(options);

	client
		.init()
		.url('https://www.google.com/')
		.getTitle()
		.then(function(title) {
			console.log('Title is: ' + title);
			// outputs: "Title is: WebdriverIO (Software) at DuckDuckGo"
			Xvfb.stopSync();
		})
		.end();
});


