var headless = require('headless');
var webdriverio = require('webdriverio');
var selenium = require('selenium-standalone');

selenium.install(function() {
	console.log('Selenium is installed.');
	selenium.start(function() {
		console.log('Selenium is running.');
		headless(function(err, childProcess, servernum) {
			// childProcess is a ChildProcess, as returned from child_process.spawn()
			console.log('Xvfb running on server number', servernum);
			console.log('Xvfb pid', childProcess.pid);
			console.log('err should be null', err);

			webdriverio
				.remote({
					host: '127.0.0.1',
					port: '4444',
					path: '/wd/hub',
					desiredCapabilities: {
						'browserName': 'google-chrome',
						'chromeOptions': {
							'binary': '/usr/bin/google-chrome',
							"args": [
								"window-size=1366,768",
								"no-proxy-server",
								"no-default-browser-check",
								"no-first-run",
								"disable-boot-animation",
								"disable-default-apps",
								"disable-extensions",
								"disable-translate"
							]
						}
					}
				})
				.init()
				.url('https://style-validator.herokuapp.com/')
				.then(function() {
					console.log('quit');
				})
				.end();

			console.log('passed');

		});
	});
});
