//TODO: confirm which script is active

function hasAnalyticsGoogle(){

	var scripts = document.getElementsByTagName('script'),
		ga = false, ua = true, dc = false,
		i, len, s;

	len = scripts.length;

	if (ga || ua || dc) {
		for (i = 0; i < len; i += 1) {
			s = scripts[i].src;

			if (
				(ga && s.indexOf('google-analytics.com/ga.js')>-1) ||

				(ua && s.indexOf('google-analytics.com/analytics.js')>-1) ||

				(dc && s.indexOf('doubleclick.net/dc.js')>-1)
			) {
				return true;
			}
		}
	}
	return false;
}

function sendError(errorMessage, URL, lineNumber, columnNumber, errorObject) {
	ga('styleValidator.send', 'event', 'js-error', 'error', 'error-content', '' + errorMessage + ' / ' + URL + ' / ' + lineNumber + ' / ' + columnNumber );
}

if(!hasAnalyticsGoogle()) {

	(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
		(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
		m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
	})(window,document,'script','//www.google-analytics.com/analytics.js','ga');

}

ga('create', 'UA-53227157-5', 'auto', {'name': 'styleValidator'});
ga('styleValidator.send', 'event', 'button', 'click', 'executing validation', 1);

window.removeEventListener('error', sendError);
window.addEventListener('error', sendError, false);