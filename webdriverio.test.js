var webdriverio = require('webdriverio');
console.log('webdriverio')
var options = {
	'browserName': 'chrome'
};
try {
	webdriverio
		.remote(options)
		.init()
		.url('http://www.google.com')
		.getTitle()
		.then(function(title) {
			console.log('Title was: ' + title);
		})
		.end();
} catch(e) {
	console.log(e);
}
