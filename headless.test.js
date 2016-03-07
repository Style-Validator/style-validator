var headless = require('headless');

headless(function(err, childProcess, servernum) {
	// childProcess is a ChildProcess, as returned from child_process.spawn()
	console.log('Xvfb running on server number', servernum);
	console.log('Xvfb pid', childProcess.pid);
	console.log('err should be null', err);
});