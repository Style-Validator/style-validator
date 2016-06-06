//var Xvfb = require('xvfb');
//var xvfb = new Xvfb();
//xvfb.startSync();
//console.log('start')
var selenium = require('selenium-standalone');


selenium.install({
	drivers: {
		chrome: {
			version: '2.9',
			arch: process.arch,
			baseURL: 'https://chromedriver.storage.googleapis.com'
		}
	}
}, function() {
	console.log('Selenium is installed.');
	selenium.start(function() {
		console.log('Selenium is running.');

		var webdriverio = require('webdriverio');
		console.log('webdriverio')
		var options = {
			'browserName': 'google-chrome',
			'chromeOptions': {
				'binary': '/usr/bin/google-chrome'//AWS
			}
		};
		console.log('options')
		webdriverio
			.remote(options)
			.init()
			.url('http://www.google.com')
			.getTitle().then(function(title) {
				console.log('Title was: ' + title);
				console.log('stop')
				//xvfb.stopSync();
			})
			.end();
	});
});

