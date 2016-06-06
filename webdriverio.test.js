//var Xvfb = require('xvfb');
//var xvfb = new Xvfb();
//xvfb.startSync();
//console.log('start')

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
	.then(function() {
		console.log('init')
	})
	.url('http://www.google.com')
	.getTitle().then(function(title) {
		console.log('Title was: ' + title);
		console.log('stop')
		//xvfb.stopSync();
	})
	.end();