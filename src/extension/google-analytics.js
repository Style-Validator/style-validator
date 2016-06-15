"use strict";

(function() {

	if(!hasAnalyticsGoogle()) {
		(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
				(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
			m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
		})(window,document,'script','//www.google-analytics.com/analytics.js','ga');
	}

	ga('create', 'UA-53227157-5', 'auto', {'name': 'styleValidator'});

	var src = document.currentScript.src;
	var splitSrc = src.split('?');

	//Normal
	if(splitSrc.length <= 1) {

		ga('styleValidator.send', 'event', 'button', 'execute', 'validation', 1);

	//Other
	} else {

		var queryStrings = splitSrc.pop();
		var queryStringObj = parseQueryString(queryStrings);

		if(queryStringObj.error) {
			ga('styleValidator.send', 'event', 'error', 'execute', queryStringObj.error, location.href);
			ga('styleValidator.send', 'exception',{
				'exDescription': queryStringObj.error,
				'exFatal': true
			});
		}
	}

	function parseQueryString(path) {

		var queryStrings = path.split('?').pop();
		var queryStringArray = decodeURIComponent(queryStrings).split('&');
		var queryStringObj = {};

		for(var i = 0, len = queryStringArray.length; i < len; i++) {
			var queryString = queryStringArray[i].split('=');
			var key = queryString[0];
			var value = queryString[1];
			queryStringObj[key] = value;
		}

		return queryStringObj;
	}

	function hasAnalyticsGoogle(){
		var scripts = document.querySelectorAll('script');
		var len = scripts.length;
		for (var i = 0; i < len; i++) {
			var scriptSrc = scripts[i].src;
			if (scriptSrc.indexOf('google-analytics.com/analytics.js') > -1) {
				return true;
			}
		}
		return false;
	}
}());