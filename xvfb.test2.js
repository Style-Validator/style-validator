var Xvfb = require('xvfb');
var xvfb = new Xvfb();
xvfb.start(function(err, xvfbProcess) {
	console.log('err: ' + err);
	console.log('xvfbProcess: ' + xvfbProcess);
	xvfb.stop(function(err) {
		console.error('err: ' + err);
	});
});
