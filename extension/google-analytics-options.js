"use strict";

(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

if(location.protocol === 'chrome-extension:') {
	ga('create', 'UA-53227157-5', 'auto');
	ga('set', 'checkProtocolTask', null);
} else {
	ga('create', 'UA-53227157-3', 'auto');
}

ga('send', 'pageview');

window.addEventListener('error', function(error) {

	var errorString = '';

	errorString += error.message || '';
	if(error.filename) {
		errorString += '(';
		errorString += error.filename || '';
		errorString += error.lineno ? ':' + error.lineno : '';
		errorString += error.colno ? ':' + error.colno : '';
		errorString += ')';
	}
	if(error.stack) {
		errorString += '(';
		errorString += error.stack;
		errorString += ')';
	}

	ga('send', 'event', 'error', 'execute', errorString, location.href);
	ga('send', 'exception', {
		'exDescription': errorString,
		'exFatal': true
	});
});