//TODO: create panel page
//chrome.devtools.panels.create(
//	"Style Validator",
//	"../img/style-validator.logo.png",
//	"panel.html",
//	function(panel) {
//		console.log("hello from callback");
//	}
//);

var port;
var isValidated = false;

var executionString =
	"var bindInspect = function(){" +
		"STYLEV.CHROME_DEVTOOLS.execute(function(targetElem) {" +
//			"inspect(targetElem || $0);" +chrome
			"inspect(targetElem);" +
		"});" +
	"};" +
	"STYLEV.VALIDATOR.updateOptions().then(function() {" +
		"console.groupEnd();" +
		"console.group('Style Validator: Executed by Chrome Extension from DevTools Page');" +
		"STYLEV.VALIDATOR.execute(bindInspect);" +
	"});";

var executionTimerString = 'STYLEV.VALIDATOR.setExecutionTimer();';

var scriptSetting = { useContentScriptContext: true };

var executeWithInspect = function() {
	chrome.devtools.inspectedWindow.eval(executionString, scriptSetting);
};

var executeWhenModified = function(resource) {

	//TODO: handle `resource` arguments?
	if(isValidated) {
		chrome.devtools.inspectedWindow.eval(executionTimerString, scriptSetting);
		console.log(resource.url);
	}
};

var connect2BackgroundPage = function() {

	port = chrome.runtime.connect({
		name: "devtoolsPage"
	});

	port.postMessage({
		name: 'sendTabId',
		tabId: chrome.devtools.inspectedWindow.tabId
	});
	
	port.onMessage.addListener(function(message) {
		if(message.name == "executeWithInspect") {
			executeWithInspect();
		}
		if(message.name == "getIsValidated") {
			isValidated = message.isValidated;
		}

	});
};

//Create connection to background page
connect2BackgroundPage();

//When reloaded
chrome.devtools.network.onNavigated.addListener(function(url) {

	connect2BackgroundPage();

	//When resources is modified
	chrome.devtools.inspectedWindow.onResourceContentCommitted.removeListener(executeWhenModified);
	chrome.devtools.inspectedWindow.onResourceContentCommitted.addListener(executeWhenModified);

	//When resources is added
	//chrome.devtools.inspectedWindow.onResourceAdded.removeListener(executeWhenModified);
	//chrome.devtools.inspectedWindow.onResourceAdded.addListener(executeWhenModified);
});

//When resources is modified
chrome.devtools.inspectedWindow.onResourceContentCommitted.addListener(executeWhenModified);

//When resources is added
//chrome.devtools.inspectedWindow.onResourceAdded.addListener(executeWhenModified);