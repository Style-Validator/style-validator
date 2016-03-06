var Xvfb = require('xvfb');
var xvfb = new Xvfb();
xvfb.start(function(err, xvfbProcess) {
	console.log(xvfbProcess);
	xvfb.stop(function(err) {
		console.error(err);
	});
});