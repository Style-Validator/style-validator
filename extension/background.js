"use strict";

var connections = {};
var isValidated;
var isDevtoolsOpened;
var isDevtoolsOpenedAtFirst = {};
var isInsertedFiles = {};
var totalNumber = {};
var tabURLs = {};
var isHTTPorHTTPS = {};
var currentTabIndex = null;
var currentTabWinId = null;
var returnTabIndex = null;
var returnTabWinId = null;
var ruleId = '';
var isOptionsPageCreated = false;
var optionsPageTabId = null;

chrome.storage.local.get('isValidated', function(message) {

	if(message['isValidated']) {
		isValidated = message['isValidated'];
	} else {
		isValidated = {};
	}
});
chrome.storage.local.get('isDevtoolsOpened', function(message) {

	if(message['isDevtoolsOpened']) {
		isDevtoolsOpened = message['isDevtoolsOpened'];
	} else {
		isDevtoolsOpened = {};
	}
});

function toggleValidation() {

	chrome.tabs.query({active: true, currentWindow: true, windowType: 'normal'}, function(tabs) {

		if(tabs.length) {

			var tabId = tabs[0].id;

			//If extension is not opened
			if(!isValidated[tabId]) {

				//If connected to devtools
				if (tabId in connections) {
					connections[tabId].postMessage({name: 'executeWithInspect'});

				//If disconnected to devtools
				} else {
					chrome.tabs.executeScript(tabId, {
						code:
							"console.groupEnd();console.group('Style Validator: Executed by Chrome Extension from Background Page');" +
							"STYLEV.VALIDATOR.execute();"
					});
				}

				//Save state of extension
				isValidated[tabId] = true;
				chrome.storage.local.set({isValidated: isValidated});

			//If extension is opened
			} else {

				//Destroy extension
				chrome.tabs.executeScript(tabId, {
					code:
						"console.info('Style Validator: Removed from Background Page');" +
						"STYLEV.VALIDATOR.destroy();"
				});

				//Save state of extension
				isValidated[tabId] = false;
				chrome.storage.local.set({isValidated: isValidated});

			}

			//Pass state of extension to devtools page
			connections[tabId].postMessage({
				name: 'getIsValidated',
				isValidated: isValidated[tabId]
			});
		}

	});
}

//Inject files
function modifyAndInsertFiles2Tab(tabId) {

	//Do nothing if already inserted or not http(s)
	if(isInsertedFiles[tabId] || !isHTTPorHTTPS[tabId]) {
		return;
	}

	var promise = new Promise(function(resolve, reject) {

		chrome.tabs.executeScript(tabId, {

			file: "./devtools-detect.js"

		}, function(result) {

			//TODO: 何故resultがオブジェクトなのか調べる
			var result = (result + '') === 'true';

			resolve(result);
		});
	});

	promise = promise.then(function(result) {

		isDevtoolsOpenedAtFirst[tabId] = result;

		if(!!isValidated[tabId] || !!isDevtoolsOpened[tabId] || isDevtoolsOpenedAtFirst[tabId]) {

			chrome.tabs.duplicate(tabId, function(tab) {

				var newTabId = tab.id;

				chrome.tabs.insertCSS(newTabId, {
					allFrames: true,
					file: './style-validator-for-elements.css'
				});
				chrome.tabs.executeScript(newTabId, {
					allFrames: true,
					file: './style-validator.js'
				});

				chrome.tabs.remove(tabId);
			});

		} else {

			chrome.tabs.reload(tabId, function() {

				chrome.tabs.insertCSS(tabId, {
					allFrames: true,
					file: './style-validator-for-elements.css'
				});
				chrome.tabs.executeScript(tabId, {
					allFrames: true,
					file: './style-validator.js'
				});
			});
		}

		isInsertedFiles[tabId] = true;
	});

	return promise;
}

//Initialize by tab
function initializeByTab(tabs) {

	if(tabs.length) {

		var promiseFuncArray = [];

		for(var i = 0, len = tabs.length; i < len; i++) {

			var tab = tabs[i];
			var tabId = tab.id;
			var tabURL = tab.url;
			var tabActive = tab.active;

			tabURLs[tabId] = tabURL;
			isHTTPorHTTPS[tabId] = /^https?:\/\//i.test(tabURLs[tabId]);

			if(tabActive) {
				returnTabIndex = currentTabIndex;
				returnTabWinId = currentTabWinId;
			}

			promiseFuncArray.push(modifyAndInsertFiles2Tab(tabId));
		}

		Promise
			.all(promiseFuncArray)
			.then(function() {
				chrome.tabs.highlight({ windowId: returnTabWinId, tabs: returnTabIndex });
				chrome.storage.local.remove(['isValidated', 'isDevtoolsOpened']);
			});
	}
}

//When connected other page
chrome.runtime.onConnect.addListener(function (port) {

	//Options Page
	if(port.name === 'optionsPage') {
		port.postMessage({name: 'sendRuleId', ruleId: ruleId}, function() {
			ruleId = null;
		});
	}

	//Devtools Page
	if(port.name == "devtoolsPage") {

		//TODO: refactor function name
		var sendTabId = function (message, sender, sendResponse) {

			// The original connection event doesn't include the tab ID of the
			// DevTools page, so we need to send it explicitly.
			if (message.name == "sendTabId") {

				var tabId = message.tabId;

				//Save port with tabId
				connections[tabId] = port;

				//When devtools is opened
				if (!(!!isDevtoolsOpened[tabId])) {

					//Save state of devtools
					isDevtoolsOpened[tabId] = true;
					chrome.storage.local.set({isDevtoolsOpened: isDevtoolsOpened});

					setTimeout(function() {//Fix Timing Bug

						chrome.tabs.query({active: true, currentWindow: true, windowType: 'normal'}, function(tabs) {

							if(tabs.length) {

								var tabId = tabs[0].id;

								//If validated
								if(isValidated[tabId]) {

									//Modify text of indicator
									chrome.tabs.sendMessage(tabId, {isConnected2Devtools: true});

									//Execute from devtools page
									connections[tabId].postMessage({name: 'executeWithInspect'});
								}
							}
						});
					}, 0);
				}

				//When devtools is closed
				port.onDisconnect.addListener(function(port) {

					//Save state of devtools
					isDevtoolsOpened[tabId] = false;
					chrome.storage.local.set({isDevtoolsOpened: isDevtoolsOpened});

					//Remove listner
					port.onMessage.removeListener(sendTabId);

					//Delete tab data that is connected to devtools
					var tabs = Object.keys(connections);
					for (var i = 0, len = tabs.length; i < len; i++) {
						if (connections[tabs[i]] == port) {
							delete connections[tabs[i]];
							break;
						}
					}

					//Re-execute when devtools is closed if extension is opened
					chrome.tabs.query({active: true, currentWindow: true, windowType: 'normal'}, function(tabs) {

						if(tabs.length) {

							var tabId = tabs[0].id;

							//If extension is opened
							if(isValidated[tabId]) {

								//Execute from background page
								chrome.tabs.executeScript(tabId, {
									code:
									"console.groupEnd();console.group('Style Validator: Executed by Chrome Extension from Background Page');" +
									"STYLEV.VALIDATOR.execute();"
								});

								//Modify text of indicator
								chrome.tabs.sendMessage(tabId, {isConnected2Devtools: false});
							}
						}
					});
				});
			}
		};
		
		//When connected from DevTools
		port.onMessage.addListener(sendTabId);
	}
});

//When sent messages
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {

	// Messages from content scripts should have sender.tab set
	if (sender.tab) {

		var tabId = sender.tab.id;

		if(message.name === 'setBadgeText') {

			//Show number on icon on browser header menu
			totalNumber[tabId] = message.badgeText + '';
			chrome.browserAction.setBadgeText({ text: totalNumber[tabId] });
		}

		if(message.name === 'requestVersion') {
			sendResponse({version: chrome.app.getDetails().version});
		}

		if(message.name === 'execute') {

			isValidated[tabId] = true;

			//If devtools is opening
			if (tabId in connections) {

				connections[tabId].postMessage({name: 'executeWithInspect'});

			//If devtools is closing
			} else {

				chrome.tabs.executeScript(tabId, {
					code:
						"console.groupEnd();console.group('Style Validator: Executed by Chrome Extension from Background Page');" +
						"STYLEV.VALIDATOR.execute();"
				});
			}
		}

		if(message.name === 'openOptionsPage') {

			//Save selected ruleId
			ruleId = message.hash;

			//Open Options Page
			//chrome.runtime.openOptionsPage();

			if(!isOptionsPageCreated) {
				chrome.tabs.create({
					url: chrome.runtime.getURL('options.html')
				}, function(tab) {
					isOptionsPageCreated = true;
					optionsPageTabId = tab.id;

					chrome.tabs.onRemoved.addListener(function(tabId) {
						if(tabId === optionsPageTabId) {
							isOptionsPageCreated = false;
							optionsPageTabId = null;
						}
					});
				});
			} else {
				chrome.tabs.update(optionsPageTabId, {selected: true});
			}

		}

		if(message.name === 'syncStatusIsValidated') {

			isValidated[tabId] = message.isValidated;
		}

		if(message.name === 'switchMode') {

			sendResponse({isConnected2Devtools: !!isDevtoolsOpened[tabId]});
		}
	}

	return false;
});

//When enabled
chrome.management.onEnabled.addListener(function () {

	chrome.storage.local.remove(['isValidated', 'isDevtoolsOpened']);

	//Reload all tab that is opened extension. Next, Re-Inject file of scripts and stylesheets
	chrome.tabs.query({windowType: 'normal'}, initializeByTab);
});


//When extension is installed or reloaded
chrome.runtime.onInstalled.addListener(function(details) {

	if(details.reason === 'install') {
		chrome.storage.local.remove(['isValidated', 'isDevtoolsOpened']);

	}

	//Reload all tab that is opened extension. Next, Re-Inject file of scripts and stylesheets
	chrome.tabs.query({windowType: 'normal'}, initializeByTab);

});

//Save Tag Index and Window ID
chrome.tabs.query({active: true, currentWindow: true, windowType: 'normal'}, function(tabs) {

	if(tabs.length) {

		var tab = tabs[0];
		var tabId = tab.id;
		var tabIndex = tab.index;
		var tabWinId = tab.windowId;

		currentTabIndex = tabIndex;
		currentTabWinId = tabWinId;
	}
});

//When moved another tab
chrome.tabs.onActivated.addListener(function(activeInfo) {

	chrome.tabs.query({active: true, currentWindow: true, windowType: 'normal'}, function(tabs) {

		if(tabs.length) {

			var tab = tabs[0];
			var tabId = tab.id;
			var tabIndex = tab.index;
			var tabWinId = tab.windowId;

			currentTabIndex = tabIndex;
			currentTabWinId = tabWinId;

			//Show number on icon on browser header menu
			totalNumber[tabId] = totalNumber[tabId] ? totalNumber[tabId] : '';
			chrome.browserAction.setBadgeText({ text: totalNumber[tabId] });

		}
	});
});

//When page is reloaded
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){

	var tabId = tab.id;
	var tabStatus = tab.status;

	if (tabStatus === 'complete') {

		//Initialize state of extension of tab
		isValidated[tabId] = false;

		//Initialize badge text
		chrome.browserAction.setBadgeText({ text: '' });
	}
});

//When click icon on browser header menu (If popup.html is not exist, it's enable)
chrome.browserAction.onClicked.addListener(toggleValidation);

//Define shortcut key
chrome.commands.onCommand.addListener(function(command) {
	if(command === 'toggle-validation') {
		toggleValidation();
	}
});