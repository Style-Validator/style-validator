//TODO: confirm which script is active

function hasAnalyticsGoogle(){
	var scripts = document.querySelectorAll('script');
	var len = scripts.length;
	for (var i = 0; i < len; i++) {
		var scriptSrc = scripts[i].src;

		if (scriptSrc.indexOf('google-analytics.com/analytics.js')>-1) {
			return true;
		}
	}
	return false;
}

if(!hasAnalyticsGoogle()) {

	(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
		(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
		m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
	})(window,document,'script','//www.google-analytics.com/analytics.js','ga');

}
ga('create', 'UA-53227157-5', 'auto', {'name': 'styleValidator'});
ga('styleValidator.send', 'event', 'button', 'click', 'executing validation', 1);