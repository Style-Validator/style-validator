var Xvfb = require('xvfb');
var xvfb = new Xvfb();
xvfb.startSync();

var webdriverio = require('webdriverio');
var options = {
	'browserName': 'google-chrome',
	'chromeOptions': {
		'binary': '/usr/bin/google-chrome'//AWS
	}
};
webdriverio
	.remote(options)
	.init()
	.url('http://www.google.com')
	.getTitle().then(function(title) {
		console.log('Title was: ' + title);
		xvfb.stopSync();
	})
	.end();