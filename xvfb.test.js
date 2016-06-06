var Xvfb = require('xvfb');
var xvfb = new Xvfb();
xvfb.startSync();

console.log('started');

// code that uses the virtual frame buffer here

xvfb.stopSync();
// the Xvfb is stopped

console.log('stopped');
