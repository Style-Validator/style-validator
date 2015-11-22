//TODO: 同じような処理をまとめる

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
var returnTab = null;

chrome.storage.local.get(isValidated, function(item) {

	if(item) {
		isValidated = item;
	} else {
		isValidated = {};
	}
});
chrome.storage.local.get(isDevtoolsOpened, function(item) {

	if(item) {
		isDevtoolsOpened = item;
	} else {
		isDevtoolsOpened = {};
	}
});

//検証したり止めたり
function toggleValidation() {

	//	実行したり破壊したりの処理
	chrome.tabs.query({active: true, currentWindow: true, windowType: 'normal'}, function(tabs) {

		//タブが1つも無い場合エラーを回避するために、存在判定
		if(tabs.length) {

			var tabId = tabs[0].id;

			//検証されていない場合、検証を発動
			if(!isValidated[tabId]) {

				//DevToolsと接続されているタブの場合
				if (tabId in connections) {
					connections[tabId].postMessage({name: 'executeWithInspect'});

				//DevToolsと接続されていない場合
				} else {
					chrome.tabs.executeScript(tabId, {
						code: "console.info('Executed from Background Page');STYLEV.VALIDATOR.execute();"
					});
				}

				//コンソールを開いたという情報を保存
				isValidated[tabId] = true;
				chrome.storage.local.set(isValidated);

			//検証されている場合は、検証を解除
			} else {

				//コンソールを削除
				chrome.tabs.executeScript(tabId, {
					code: "console.info('Validator has Removed.');STYLEV.VALIDATOR.destroy();"
				});

				//コンソールを開いたという情報を保存
				isValidated[tabId] = false;
				chrome.storage.local.set(isValidated);

			}

			//DevTools側に検証ステータスを渡す
			connections[tabId].postMessage({
				name: 'getIsValidated',
				isValidated: isValidated[tabId]
			});
		}

	});
}

//ファイルを挿入
function modifyAndInsertFiles2Tab(tabId) {

	//既に挿入済の場合か、HTTPかHTTPSプロトコルではない場合は何もしない
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
					file: './style-validator.css'
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
					file: './style-validator.css'
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

//タブ毎の初期化処理
function initByTabs(tabs) {

	//タブが1つも無い場合エラーを回避するために、存在判定
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
				chrome.storage.local.clear();
			});
	}
}

//DevToolsが開く度に実行
chrome.runtime.onConnect.addListener(function (port) {

	if (port.name == "devtools-page") {

		//DevToolsとの接続時の関数
		var sendTabIdFromDevToolsToBackground = function (message, sender, sendResponse) {

			// The original connection event doesn't include the tab ID of the
			// DevTools page, so we need to send it explicitly.
			if (message.name == "sendTabIdFromDevToolsToBackground") {

				var tabId = message.tabId;

				//portをTabIdに紐付けて保存
				connections[tabId] = port;

				//DevToolsを開いた時
				if (!(!!isDevtoolsOpened[tabId])) {

					//DevToolsの開閉状態
					isDevtoolsOpened[tabId] = true;
					chrome.storage.local.set(isDevtoolsOpened);

					setTimeout(function() {//Fix Timing Bug

						chrome.tabs.query({active: true, currentWindow: true, windowType: 'normal'}, function(tabs) {

							//タブが1つも無い場合エラーを回避するために、存在判定
							if(tabs.length) {

								var tabId = tabs[0].id;

								//バリデート済の場合
								if(isValidated[tabId]) {

									//モードテキストを変更
									chrome.tabs.sendMessage(tabId, {isConnected2Devtools: true});

									//DevTools Modeで実行
									connections[tabId].postMessage({name: 'executeWithInspect'});
								}
							}
						});
					}, 0);
				}

				//DevToolsを閉じた時
				port.onDisconnect.addListener(function(port) {

					//DevToolsの開閉状態
					isDevtoolsOpened[tabId] = false;
					chrome.storage.local.set(isDevtoolsOpened);

					//DevToolsとのメッセージがされた場合に発火するイベントを解除
					port.onMessage.removeListener(sendTabIdFromDevToolsToBackground);

					//タブの接続状態
					var tabs = Object.keys(connections);

					for (var i = 0, len = tabs.length; i < len; i++) {

						//保存している通信状態を
						if (connections[tabs[i]] == port) {

							//通信状態を削除
							delete connections[tabs[i]];
							break;
						}
					}

					//閉じた時に検証済の場合は、コンソールを塗り替える
					chrome.tabs.query({active: true, currentWindow: true, windowType: 'normal'}, function(tabs) {

						//タブが1つも無い場合エラーを回避するために、存在判定
						if(tabs.length) {

							var tabId = tabs[0].id;

							//バリデート済の場合
							if(isValidated[tabId]) {

								//Background Modeで実行
								chrome.tabs.executeScript(tabId, {
									code: "console.info('Executed from Background Page');STYLEV.VALIDATOR.execute();"
								});

								//モードテキストを変更
								chrome.tabs.sendMessage(tabId, {isConnected2Devtools: false});
							}
						}
					});

				});

			}

			// other message handling

		};

		// DevToolsから接続された時に発火する
		port.onMessage.addListener(sendTabIdFromDevToolsToBackground);

	}
});

// メッセージ送信される度実行
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {

	// Messages from content scripts should have sender.tab set
	if (sender.tab) {

		var tabId = sender.tab.id;

		if(message.setBadgeText !== undefined) {

			//アイコンの数字を設定
			totalNumber[tabId] = message.setBadgeText + '';
			chrome.browserAction.setBadgeText({ text: totalNumber[tabId] });
		}

		if(message.name === 'execute') {

			isValidated[tabId] = true;

			//DevToolsが開いている時
			if (tabId in connections) {

				connections[tabId].postMessage({name: 'executeWithInspect'});

			//DevToolsが閉じている時
			} else {

				chrome.tabs.executeScript(tabId, {
					code: "console.info('Executed from Background Page');STYLEV.VALIDATOR.execute();"
				});
			}
		}

		if(message.name === 'validatedStatus2False') {

			isValidated[tabId] = false;
		}

		if(message.name === 'switchMode') {

			sendResponse({isConnected2Devtools: !!isDevtoolsOpened[tabId]});
		}

		if(message.name === 'detectDevToolsOpened') {

//			isDevtoolsOpened[tabId] = message.isDevtoolsOpened;
//			chrome.storage.local.set(isDevtoolsOpened);
		}

	}

	return false;
});

//有効に切り替えた時
chrome.management.onEnabled.addListener(function () {

	chrome.storage.local.clear();

	//検証済のタブ全てにリロードをかけ（検証済のタブは置換）その後、再度ファイルをインジェクト
	chrome.tabs.query({windowType: 'normal'}, initByTabs);
});


//インストール時とアップデート時に実行
chrome.runtime.onInstalled.addListener(function(details) {

	if(details.reason === 'install') {
		chrome.storage.local.clear();

	}

	//検証済のタブ全てにリロードをかけ（検証済のタブは置換）その後、再度ファイルをインジェクト
	chrome.tabs.query({windowType: 'normal'}, initByTabs);

});

chrome.tabs.query({active: true, currentWindow: true, windowType: 'normal'}, function(tabs) {

	//タブが1つも無い場合エラーを回避するために、存在判定
	if(tabs.length) {

		var tab = tabs[0];
		var tabId = tab.id;
		var tabIndex = tab.index;
		var tabWinId = tab.windowId;

		currentTabIndex = tabIndex;
		currentTabWinId = tabWinId;
	}
});

//タブが切り替わるタイミングで実行
chrome.tabs.onActivated.addListener(function(activeInfo) {

	chrome.tabs.query({active: true, currentWindow: true, windowType: 'normal'}, function(tabs) {

		//タブが1つも無い場合エラーを回避するために、存在判定
		if(tabs.length) {

			var tab = tabs[0];
			var tabId = tab.id;
			var tabIndex = tab.index;
			var tabWinId = tab.windowId;

			currentTabIndex = tabIndex;
			currentTabWinId = tabWinId;

			//アイコンの数字を設定
			totalNumber[tabId] = totalNumber[tabId] ? totalNumber[tabId] : '';
			chrome.browserAction.setBadgeText({ text: totalNumber[tabId] });

		}
	});
});

//リロードする度
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){

	var tabId = tab.id;
	var tabStatus = tab.status;

	//タブ毎の検証ステータスを初期化
	if (tabStatus === 'complete') {
		isValidated[tabId] = false;
		//reset
		chrome.browserAction.setBadgeText({ text: '' });
	}
});

//popup.htmlがない場合
// Execution from Icon
chrome.browserAction.onClicked.addListener(toggleValidation);

//ショートカットキーを押した場合
chrome.commands.onCommand.addListener(function(command) {
	if(command === 'toggle-validation') {
		toggleValidation();
	}
});