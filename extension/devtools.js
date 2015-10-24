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

//TODO: targetElemの存在判定を固くするか検討
var executeWithInspect = function() {
	chrome.devtools.inspectedWindow.eval(
		"var bindInspect = function(){" +
			"STYLEV.chromeExtension.bind2DevToolsInspect.execute(function(targetElem) {" +
				"inspect(targetElem || $0);" +
			"});" +
		"};" +
		"STYLEV.VALIDATOR.updateOptions().then(function() {" +
			"console.info('Executed from DevTools Page');" +
			"STYLEV.VALIDATOR.execute(bindInspect);" +
		"});"
		,
		{ useContentScriptContext: true }
	);
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

//Backgroundとの接続をつくる
createConnection();

//DevToolsを開いた状態で更新した時の処理
chrome.devtools.network.onNavigated.addListener(function(url) {
	//Backgroundとの接続をつくる
	createConnection();
});

//リソースに変更があった場合
chrome.devtools.inspectedWindow.onResourceContentCommitted.addListener(function(event) {

	//TODO: オプションを精査する

	if(isValidated) {

		executeWithInspect();

		event.getContent(function(content) {
			console.info(content + ' is modified.');
		});
	}
});
