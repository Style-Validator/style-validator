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

var executionSetting = { useContentScriptContext: true };

var executeWithInspect = function() {
	chrome.devtools.inspectedWindow.eval(executionString, executionSetting);
};

var executionWhenModified = function(resource) {

	//TODO: handle resource?
	if(isValidated) {
		chrome.devtools.inspectedWindow.eval(executionTimerString, executionSetting);
		console.log(resource.url);
	}
};

var createConnection = function() {

	// Backgroundページとの接続
	port = chrome.runtime.connect({
		name: "devtools-page"
	});

	port.postMessage({
		name: 'sendTabIdFromDevToolsToBackground',
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
createConnection();

//If reloaded
chrome.devtools.network.onNavigated.addListener(function(url) {
	createConnection();

	//If resources is modified
	chrome.devtools.inspectedWindow.onResourceContentCommitted.removeListener(executionWhenModified);
	chrome.devtools.inspectedWindow.onResourceContentCommitted.addListener(executionWhenModified);

	//If resources is added
	//chrome.devtools.inspectedWindow.onResourceAdded.removeListener(executionWhenModified);
	//chrome.devtools.inspectedWindow.onResourceAdded.addListener(executionWhenModified);
});

//If resources is modified
chrome.devtools.inspectedWindow.onResourceContentCommitted.addListener(executionWhenModified);