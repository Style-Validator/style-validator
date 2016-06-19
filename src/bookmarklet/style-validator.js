(function(document) {
	var sv = document.createElement('script');
	sv.src = '//style-validator.io/extension/style-validator.js?mode=manual';
	//sv.src = 'http://localhost:8080/extension/style-validator.js?mode=manual';
	sv.addEventListener('load', function() {
		console.groupEnd();
		console.group('Style Validator: Executed by ' + STYLEV.caller + '.');
		STYLEV.VALIDATOR.execute();
	});
	document.head.appendChild(sv);
}(document));