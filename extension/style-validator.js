/*!
 Style Validator

 Description": Style Validator is CSS Validator that can detect `Risky Style` that might break layout after JavaScript or CSS Media Queries.
 URL: https://style-validator.herokuapp.com/
 Author: Igari Takeharu
 License: MIT License
 */

'use strict';

//Create Namespace
var STYLEV = STYLEV || {};

//General Methods
STYLEV.METHODS = {

	each: function(target, fn) {

		var isCorrectParameters = target && typeof target === 'object' && typeof fn === 'function';
		var returnedValue;
		var i = 0;

		if(!isCorrectParameters) {
			return;
		}

		function loopArray(length) {
			for(; i < length; i = (i+1)|0) {

				var data = target[i];

				returnedValue = fn(data, i);

				if(returnedValue === 'continue') {
					continue;
				}
				if(returnedValue === 'break') {
					break;
				}
			}
		}

		function loopObject() {
			for(var key in target) {
				if(target.hasOwnProperty(key)) {

					var value = target[key];

					returnedValue = fn(key, value, (i+1)|0);

					if(returnedValue === 'continue') {
						continue;
					}
					if(returnedValue === 'break') {
						break;
					}
				}
			}
		}

		if('length' in target) {
			var length = target.length || null;
			if(length) {
				loopArray(length);
			} else if(!(target instanceof Array)) {
				loopObject();
			}

		} else if(!(target instanceof Array)) {
			loopObject();
		}
	},

	//TODO: refactor
	isHidden: function(target) {

		if(target.tagName.toLowerCase() !== 'svg' || target.ownerSVGElement) {

			if(target.offsetParent === null) {

				//common
				if(target.tagName.toLowerCase() !== 'html') {
					var position = STYLEV.VALIDATOR.getComputedStyleAndCache(target, 'position', '');
					if(position === 'fixed') {
						var display = STYLEV.VALIDATOR.getComputedStyleAndCache(target, 'display', '');
						return display === 'none';
					} else {
						return true;
					}
				} else {
					return false;
				}
			} else {
				return false;
			}
		} else {

			//common
			if(target.tagName.toLowerCase() !== 'html') {
				var position = STYLEV.VALIDATOR.getComputedStyleAndCache(target, 'position', '');
				if(position === 'fixed') {
					var display = STYLEV.VALIDATOR.getComputedStyleAndCache(target, 'display', '');
					return display === 'none';
				} else {
					return true;
				}
			} else {
				return false;
			}
		}

	},

	parseQueryString: function(path) {

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
};

//Detecting External Script
STYLEV.currentScript = document.currentScript;
STYLEV.isExternalScript = STYLEV.currentScript !== null;
STYLEV.src = STYLEV.isExternalScript ? STYLEV.currentScript.src : null;
STYLEV.exeMode = STYLEV.isExternalScript ? STYLEV.METHODS.parseQueryString(STYLEV.src).exeMode : 'auto';
STYLEV.isManualMode = STYLEV.exeMode === 'manual';
STYLEV.isAutoMode = STYLEV.exeMode === 'auto';

//Detecting Chrome Extension
STYLEV.isChromeExtension = (function() {
	try {
		chrome.runtime.onMessage.addListener(function() {} );
		return true;
	} catch(error) {
		return false;
	}
}());

//Detecting Bookmarklet
STYLEV.isBookmarklet = !STYLEV.isExternalScript && !STYLEV.isChromeExtension;

//Detecting caller
STYLEV.caller = (function() {
	if(STYLEV.isChromeExtension) {
		return 'Chrome Extension';
	}
	if(STYLEV.isBookmarklet) {
		return 'JavaScript Bookmarklet';
	}
	if(STYLEV.isExternalScript) {
		return 'Embedded Script';
	}
}());

//Detecting if has been reloaded
STYLEV.isReloaded = STYLEV.VALIDATOR !== undefined;

//Detecting if has been loaded at first
STYLEV.isLoaded = !STYLEV.isReloaded;

//Detecting if has been Executed at first
STYLEV.isFirstExecution = true;

//Detecting if has been validated
STYLEV.isValidated = STYLEV.isValidated || false;

//Options
STYLEV.options = {

	ENABLE_MUTATION_OBSERVER: true,
	ENABLE_AUTO_EXECUTION: false,
	ENABLE_ANIMATION: false,
	SCOPE_SELECTORS: false,
	SCOPE_SELECTORS_TEXT: '',
	IGNORE_SELECTORS: false,
	IGNORE_SELECTORS_TEXT: '',
	URL_FILTERS: []
};

//TODO: Need to test again the fallowing
//Properties for Observing. Need to ignore elements that has been modified many times so fast for avoiding memory leak.
STYLEV.modifiedTargetsArray = STYLEV.modifiedTargetsArray || [];
STYLEV.ignoreTargetsArray = STYLEV.ignoreTargetsArray || [];
STYLEV.sameElemCount = STYLEV.sameElemCount || 0;
STYLEV.mutationOvserberID = STYLEV.mutationOvserberID || 0;

//Keeping condition of console
STYLEV.consoleWrapperDynamicHeight = STYLEV.consoleWrapperDynamicHeight || 0;
STYLEV.consoleScrollTop = STYLEV.consoleScrollTop || 0;
STYLEV.selectedConsoleLine = STYLEV.selectedConsoleLine || null;
STYLEV.scaleMode = STYLEV.scaleMode || 'normal';

//TODO: implement
STYLEV.isPassedURLFilters = (function() {
	var isPassedURLFilters = true;
	STYLEV.METHODS.each(STYLEV.options.URL_FILTERS, function(url) {
		if(location.href.indexOf(url) > -1) {
			isPassedURLFilters = false;
			return 'break';
		}
	});
	return isPassedURLFilters;
}());

//Main object of Validator
STYLEV.VALIDATOR = STYLEV.VALIDATOR || {

		execute: function(callback) {
			var that = STYLEV.VALIDATOR;
	
			try {
	
				that.startTime = new Date();
	
				if(STYLEV.isFirstExecution) {
					that.setParameters();
					that.bindEvents();
	
					//Getting Data and Inserting JS Libraries
					Promise
						.all(that.getAllData())
						.then(that.getRulesData)
						.then(that.setParametersViaAJAX)
						.then(that.updateOptions)
						.then(that.firstValidate(callback));
	
				} else {
	
					that.getRulesData()
						.then(that.validate.bind(null, callback));
				}
	
			} catch(error) {
				that.throwError(error);
			}
	
		},
	
		setParameters: function() {
	
			var that = STYLEV.VALIDATOR;
	
			//Elements
			that.html = document.documentElement;
			that.head = that.html.querySelector('head');
			that.body = that.html.querySelector('body');
	
			//Padding with Border bottom that is equal with console height.
			that.htmlDefaultBorderBottomWidth = that.html.style.borderBottomWidth === '' ? null : that.html.style.borderBottomWidth;
	
			that.RESOURCE_ROOT = that.RESOURCE_ROOT || 'https://style-validator.herokuapp.com/extension/';
	
			//Initialize Observing Flag
			that.isObserving = false;
	
			that.settings = {
	
				OBSERVATION_INTERVAL: 3000,
				COUNTDOWN_INTERVAL: 1000,
				IGNORING_ELEM_ARRAY_RESET_INTERVAL: 10000 * 10000,
	
				CONSOLE_WRAPPER_ID:	'stylev-console-wrapper',
				CONSOLE_LIST_ID:	'stylev-console-list',
				STYLESHEET_ID:		'stylev-styleSheet',
	
				CONSOLE_WRAPPER_DEFAULT_HEIGHT:	200,
				CONSOLE_HEADING_TEXT:			'Style Validator',
				CONGRATULATION_MESSAGE_TEXT:	'Perfect!',
	
				GA_PATH: that.RESOURCE_ROOT + 'google-analytics.js',
	
				ICON_RESPONSIVE_PATH:		that.RESOURCE_ROOT + 'iconmonstr-responsive.svg',
				ICON_REFRESH_PATH:			that.RESOURCE_ROOT + 'iconmonstr-refresh-3-icon.svg',
				ICON_REFRESH_ACTIVE_PATH:	that.RESOURCE_ROOT + 'iconmonstr-refresh-3-icon-active.svg',
				ICON_CLOSE_PATH:			that.RESOURCE_ROOT + 'iconmonstr-x-mark-icon.svg',
				ICON_MINIMIZE_PATH:			that.RESOURCE_ROOT + 'iconmonstr-minus-2-icon.svg',
				ICON_NORMALIZE_PATH:		that.RESOURCE_ROOT + 'iconmonstr-plus-2-icon.svg',
				ICON_CONNECTED_PATH:		that.RESOURCE_ROOT + 'iconmonstr-link-4-icon.svg',
				ICON_DISCONNECTED_PATH:		that.RESOURCE_ROOT + 'iconmonstr-link-5-icon.svg',
				ICON_LOGO_PATH:				that.RESOURCE_ROOT + 'style-validator.logo.black.svg',
	
				CONNECTED_2_DEVTOOLS_MESSAGE:		'Connected to DevTools',
				DISCONNECTED_2_DEVTOOLS_MESSAGE:	'Disconnected to DevTools',
				CONNECTED_2_DEVTOOLS_CLASS:			'stylev-console-mode-devtools-connected',
				DISCONNECTED_2_DEVTOOLS_CLASS:		'stylev-console-mode-devtools-disconnected'
			};
	
			//Pathes
	
			that.CSS_PATHES = [
				that.RESOURCE_ROOT + 'style-validator-for-elements.css'
			];
	
			that.JS_PATHES = [
				that.RESOURCE_ROOT + 'specificity.js'
			];
	
			that.DATA_PATHES = [
				that.RESOURCE_ROOT + 'data/rules.json',
				that.RESOURCE_ROOT + 'data/tags-all.json',
				that.RESOURCE_ROOT + 'data/tags-empty.json',
				that.RESOURCE_ROOT + 'data/tags-replaced-element.json',
				that.RESOURCE_ROOT + 'data/tags-filter.json',
				that.RESOURCE_ROOT + 'data/special-kw-vals.json'
			];
		},
	
		bindEvents: function() {
			var that = STYLEV.VALIDATOR;
	
			//remove?
	
		},
	
		getAllData: function() {
			var that = STYLEV.VALIDATOR;
			try {
	
				var promiseArray = [];
	
				STYLEV.METHODS.each(that.DATA_PATHES, function(path) {
					promiseArray.push(that.getData(path).then(JSON.parse))
				});
	
				//Insert CSS file TODO: if save once, keep it
				promiseArray.push(that.getConsoleStyle());
	
				//Insert JavaScript file
				promiseArray = promiseArray.concat(that.insertJS4Bookmarklet());
	
				return promiseArray;
	
			} catch(error) {
				that.throwError(error);
			}
		},
	
		getRulesData: function(dataArrayViaAJAX) {
			var that = STYLEV.VALIDATOR;
	
			return new Promise(function(resolve, reject) {
				try {
					//TODO: refactor
					if(STYLEV.isChromeExtension) {
						chrome.storage.local.get('selectedPresetsName', function(message) {
							var selectedPresetsName = message['selectedPresetsName'];
							if(selectedPresetsName) {
								chrome.storage.local.get(selectedPresetsName, function(message) {
									var rulesData = message[selectedPresetsName];
									if(rulesData) {
										that.setRuleDataViaChromeStorage(rulesData, dataArrayViaAJAX, resolve);
									} else {
										that.setRuleDataViaAJAX(dataArrayViaAJAX, resolve);
									}
								});
							} else {
								that.setRuleDataViaAJAX(dataArrayViaAJAX, resolve);
							}
						});
					} else {
						that.setRuleDataViaAJAX(dataArrayViaAJAX, resolve);
					}
				} catch(error) {
					that.throwError(error);
				}
			});
		},
	
		throwError: function(error) {
			var that = STYLEV.VALIDATOR;
			that.send2GA(error);
			throw new Error(error);
		},
	
		setRuleDataViaChromeStorage: function (rulesData, dataArrayViaAJAX, resolve) {
			var that = STYLEV.VALIDATOR;
			that.rulesData = rulesData;
			if(dataArrayViaAJAX) {
				resolve(dataArrayViaAJAX);
			} else {
				resolve();
			}
		},
	
		setRuleDataViaAJAX: function (dataArrayViaAJAX, resolve) {
			var that = STYLEV.VALIDATOR;
			if(dataArrayViaAJAX) {
				that.rulesData = dataArrayViaAJAX[0];
				resolve(dataArrayViaAJAX);
			} else {
				resolve();
			}
		},
	
		setParametersViaAJAX: function(dataArray) {
			var that = STYLEV.VALIDATOR;
			return new Promise(function(resolve, reject) {
				try {
	
					//Set html tags data
					that.tagsAllData = dataArray[1];
					that.tagsEmptyData = dataArray[2];
					that.tagsReplacedElementData = dataArray[3];
					that.tagsFilter = dataArray[4];
					that.specialKwVals = dataArray[5];
	
					//Set regex for detecting html tags TODO: remove above all
					that.regexAllHTMLTag = new RegExp('^( ' + that.tagsAllData.join(' | ') + ' )');
					that.regexEmptyElem = new RegExp('^( ' + that.tagsEmptyData.join(' | ') + ' )');
					that.regexReplacedElem = new RegExp('^( ' + that.tagsReplacedElementData.join(' | ') + ' )');
					that.regexTagsFilter = new RegExp('^( ' + that.tagsFilter.join(' | ') + ' )');
	
					resolve();
	
				} catch(error) {
					that.throwError(error);
				}
			});
		},
	
		getConsoleStyle: function() {
			var that = STYLEV.VALIDATOR;
			return new Promise(function(resolve, reject) {
				that.getData(that.RESOURCE_ROOT + 'style-validator-for-console.css')
					.then(function(consoleStyleText) {
						that.consoleStyleText = consoleStyleText;
						resolve();
					});
			});
		},
	
		firstValidate: function(callback) {
			var that = STYLEV.VALIDATOR;
			return function() {
				try {
					//Set up Mutation Observer
					that.moManager = that.setupMutationObserver();
	
					//Start Validate
					that.validate(callback);
	
					STYLEV.isFirstExecution = false;
	
				} catch(error) {
					that.throwError(error);
				}
			}
		},
	
		getData: function(url) {
	
			return new Promise(function (resolve, reject) {
				var req = new XMLHttpRequest();
				req.open('GET', url, true);
				req.onload = function () {
					if (req.status === 200) {
						resolve(req.responseText);
					} else {
						reject(new Error(req.statusText));
					}
				};
				req.onerror = function () {
					reject(new Error(req.statusText));
				};
				req.send();
			});
		},
	
		getScript: function(path, docFlag) {
			var that = STYLEV.VALIDATOR;
	
			return new Promise(function(resolve, reject) {
				var script = document.createElement('script');
				script.classList.add('stylev-ignore');
				script.addEventListener('load', function() {
					resolve();
				});
				script.addEventListener('error', function(event) {
					reject(new URIError("The script " + event.target.src + " is not accessible."));
				});
				script.src = path;
				docFlag.appendChild(script);
			});
	
		},
	
		getAllCSSProperties: function() {
			var that = STYLEV.VALIDATOR;
			var allCSSProperties = Object.keys(document.documentElement.style);
	
			that.allCSSProperties = [];
	
			STYLEV.METHODS.each(allCSSProperties, function(cssProperty) {
				that.allCSSProperties.push(that.camel2Hyphen(cssProperty));
			});
		},
	
		camel2Hyphen: function(string) {
			// for Unicode transforms, replace [A-Z] with \p{Lu} if available
			return string
				.replace(/^[A-Z]/g, function(letter) {
					return letter.toLowerCase();
				})
				.replace(/[A-Z]/g, function(letter) {
					return '-'+letter.toLowerCase();
				});
		},
	
		insertJS4Bookmarklet: function() {
			var that = STYLEV.VALIDATOR;
	
				if(STYLEV.isBookmarklet) {
	
					var promiseArray = [];
					var docFlag = document.createDocumentFragment();
	
					STYLEV.METHODS.each(that.JS_PATHES, function(path) {
						if(document.querySelectorAll('script[src="' + path + '"]').length) {
							return 'continue';
						}
						promiseArray.push(that.getScript(path, docFlag));
					});
	
					that.head.appendChild(docFlag);
				}
	
			return promiseArray;
		},
	
		//TODO: remove
		updateOptions: function() {
			var that = STYLEV.VALIDATOR;
			return new Promise(function(resolve, reject) {
				try {
					if(STYLEV.isChromeExtension) {
	
						chrome.storage.sync.get('options', function(message) {
	
							if(message.options !== undefined) {
	
								STYLEV.options = {
	
									ENABLE_MUTATION_OBSERVER: message.options.enabledMutationObserver,
									ENABLE_AUTO_EXECUTION: message.options.enableAutoExecution,
									ENABLE_ANIMATION: message.options.enableAnimation,
									SCOPE_SELECTORS: message.options.scopeSelectors,
									SCOPE_SELECTORS_TEXT: message.options.scopeSelectorsText ? message.options.scopeSelectorsText.split(',') : '',
									IGNORE_SELECTORS: message.options.ignoreSelectors,
									IGNORE_SELECTORS_TEXT: message.options.ignoreSelectorsText ? message.options.ignoreSelectorsText.split(',') : '',
									URL_FILTERS: message.options.urlFilters
								};
							}
	
							resolve();
	
						});
					} else {
						resolve();
					}
				} catch(error) {
					that.throwError(error);
				}
			});
		},
	
		validate: function(callback) {
			var that = STYLEV.VALIDATOR;
	
			try {
				console.info('Style Validator: Validator is starting...');
	
				that.initializeValidation();
	
				//Check all elements in the document
				STYLEV.METHODS.each(that.allElem, that.validateByElement);
	
				that.removeIframe4getDefaultStyles();
	
				//TODO: confirm
				//if(that.isSameWithPreviousData()) {
				//	return false;
				//}
	
				that.showConsole();
				that.setParametersOfConsole();
				that.bindEvents2Element();
	
				//バリデート完了時のcallbackが存在し関数だった場合実行
				if(typeof callback === 'function') {
					callback();
				}

				that.sendLog();
				that.send2GA();

				console.info('Style Validator: Validated and Console has been displayed');
	
				//バリデータによるDOM変更が全て完了してから監視開始
				that.moManager.connect();
	
				STYLEV.isValidated = true;
	
				if(STYLEV.isChromeExtension) {
					STYLEV.CHROME_EXTENSION.syncStatusIsValidated(true);
				}
	
			} catch(error) {
				that.throwError(error);
			}
		},
	
		//TODO: move to outside for try-catch wrapping
		send2GA: function(error) {
			var that = STYLEV.VALIDATOR;
	
			that.removeGA();
	
			var queryString = '';
	
			if(error) {
				queryString += 'error=';
				queryString += error.message || '';
				if(error.filename) {
					queryString += '(';
					queryString += error.filename || '';
					queryString += error.lineno ? ':' + error.lineno : '';
					queryString += error.colno ? ':' + error.colno : '';
					queryString += ')';
				}
				if(error.stack) {
					queryString += '(';
					queryString += error.stack;
					queryString += ')';
				}
			}
	
			that.scriptTagGA = document.createElement('script');
			that.scriptTagGA.src = that.settings.GA_PATH + (queryString ? '?' + encodeURIComponent(queryString) : '');
			that.scriptTagGA.async = "async";
			that.scriptTagGA.id = 'stylev-ga';
			that.scriptTagGA.classList.add('stylev-ignore');
	
			that.head.appendChild(that.scriptTagGA);
		},

		removeGA: function() {
			var that = STYLEV.VALIDATOR;
			if(that.scriptTagGA !== undefined) {
				that.scriptTagGA.parentElement.removeChild(that.scriptTagGA);
				that.scriptTagGA = undefined;
			}
		},
	
		isRegularTag: function (tagName) {
			var that = STYLEV.VALIDATOR;
			return that.tagsAllData.indexOf(tagName) > -1;
		},
	
		isFilteredHTMLTag: function (tagName) {
			var that = STYLEV.VALIDATOR;
			return that.tagsFilter.indexOf(tagName) > -1;
		},
	
		validateByElement: function(elem) {
	
			var that = STYLEV.VALIDATOR;
	
			var elemObj = {};
	
			elemObj.elem = elem;
			elemObj.elemTagName = elemObj.elem.tagName.toLowerCase();
	
			elemObj.emptyElem = that.tagsEmptyData.indexOf(elemObj.elemTagName) > -1;
			elemObj.isReplaced = that.tagsReplacedElementData.indexOf(elemObj.elemTagName) > -1;
	
			if(that.isFilteredHTMLTag(elemObj.elemTagName)) {
				return 'continue';
			}
			if(elemObj.elem.ownerSVGElement) {
				return 'continue';
			}
	
			that.getElementInformation(elemObj);
	
			//Check All Rules
			STYLEV.METHODS.each(that.rulesData, that.validateByRule(elemObj));
	
			if(!STYLEV.isFirstExecution) {
				that.removeSelectedClass(elemObj);
			}
		},
	
		getElementInformation: function(elemObj) {
			var that = STYLEV.VALIDATOR;
	
			elemObj.elemDefault = that.iframeDocument.querySelector(that.isRegularTag(elemObj.elemTagName) ? elemObj.elemTagName : 'span');
	
			elemObj.elemParent = elemObj.elem.parentElement || null;
			elemObj.elemParentTagName = elemObj.elemParent && elemObj.elemParent.tagName.toLocaleLowerCase();
			elemObj.elemParent = that.isFilteredHTMLTag(elemObj.elemParentTagName) ? null : elemObj.elemParent;
			elemObj.elemParentDefault = elemObj.elemParent && that.iframeDocument.querySelector(that.isRegularTag(elemObj.elemParentTagName) ? elemObj.elemParentTagName : 'span');
	
			elemObj.elemGrandParent = elemObj.elemParent && elemObj.elemParent.parentElement || null;
			elemObj.elemGrandParentTagName = elemObj.elemGrandParent && elemObj.elemGrandParent.tagName.toLocaleLowerCase();
			elemObj.elemGrandParent = that.isFilteredHTMLTag(elemObj.elemGrandParentTagName) ? null : elemObj.elemGrandParent;
			elemObj.elemGrandParentDefault = elemObj.elemGrandParent && that.iframeDocument.querySelector(that.isRegularTag(elemObj.elemGrandParentTagName) ? elemObj.elemGrandParentTagName : 'span');
	
			elemObj.isHidden = STYLEV.METHODS.isHidden(elemObj.elem);
		},
	
		removeSelectedClass: function(elemObj) {
			var that = STYLEV.VALIDATOR;
			if(!that.hasNGClass(elemObj.elem)) {
				elemObj.elem.classList.remove('stylev-target-selected');
			}
		},
	
		validateByRule: function(elemObj) {
			var that = STYLEV.VALIDATOR;
			return function(ruleObj) {
				try {
	
					if(!ruleObj.isEnabled) {
						return 'continue';
					}
	
					//Filter unsupported tag
					var isUnsupportedTag =
						(ruleObj.replacedElem === 'replaced' && !elemObj.isReplaced) ||
						(ruleObj.replacedElem === 'non-replaced' && elemObj.isReplaced) ||
						(ruleObj.emptyElem === 'empty' && !elemObj.emptyElem) ||
						(ruleObj.emptyElem === 'no-empty' && elemObj.emptyElem);
	
					if(isUnsupportedTag) {
						return 'continue';
					}
	
					//Extend Property to Element Object
					//These properties need to be initialize by a rule
					ruleObj.hasAllBaseStyles = true;
					ruleObj.baseStylesText = '';//TODO: unite below?
					ruleObj.baseStylesObjArray = [];
	
	
					//Check All Base Styles
					STYLEV.METHODS.each(ruleObj.baseStyles, function(baseStyleObj) {
						that.testStyles(baseStyleObj, elemObj, ruleObj, 'base')
					});
	
					//If all base rules is passed TODO: ORもオプションで指定できるようにするか検討
					if(ruleObj.hasAllBaseStyles) {
						//Check All NG Styles
						STYLEV.METHODS.each(ruleObj.ngStyles, function(ngStyleObj) {
							that.testStyles(ngStyleObj, elemObj, ruleObj, 'ng');
						});
					}
	
				} catch(error) {
					that.throwError(error);
				}
			};
		},
	
		testStyles: function(styleObj, elemObj, ruleObj, type) {//TODO: baseStylesText is necessary?
	
			var that = STYLEV.VALIDATOR;
	
			//Init extended prop object
			styleObj.prop = {};//TODO: confirm プロパティというより変数にした方が早いかも
			elemObj.prop = {};//TODO: confirm プロパティというより変数にした方が早いかも
	
			//If has no parent but `isParentElem` is true, continue
			if(styleObj.isParentElem && elemObj.elemParent === null) {
				return 'continue';
			}
	
			//TODO: confirm better way cache
			that.getStylePropObj(styleObj);
	
			switch(styleObj.isParentElem) {
	
				// If has not parent element
				case false:
	
					//TODO: cache
					elemObj.prop.value = that.getSpecifiedStyle(elemObj.elem, styleObj.property, styleObj.pseudoElem);
					elemObj.prop.defaultValue = that.getSpecifiedStyle(elemObj.elemDefault, styleObj.property, styleObj.pseudoElem);
	
					if(elemObj.elemParent) {
						elemObj.prop.parentValue = that.getSpecifiedStyle(elemObj.elemParent, styleObj.property, styleObj.pseudoElem);
					}
					if(elemObj.elemParentDefault) {
						elemObj.prop.parentDefaultValue = that.getSpecifiedStyle(elemObj.elemParentDefault, styleObj.property, styleObj.pseudoElem);
					}
	
					break;
	
				// If has parent element
				case true:
	
					elemObj.prop.value = that.getSpecifiedStyle(elemObj.elemParent, styleObj.property, styleObj.pseudoElem);
					elemObj.prop.defaultValue = that.getSpecifiedStyle(elemObj.elemParentDefault, styleObj.property, styleObj.pseudoElem);
	
					if(elemObj.elemGrandParent) {
						elemObj.prop.parentValue = that.getSpecifiedStyle(elemObj.elemGrandParent, styleObj.property, styleObj.pseudoElem);
					}
					if(elemObj.elemGrandParentDefault) {
						elemObj.prop.parentDefaultValue = that.getSpecifiedStyle(elemObj.elemGrandParentDefault, styleObj.property, styleObj.pseudoElem);
					}
	
					//line-height needs special support
					if(styleObj.prop.isLineHeight) {
	
						//Override value to getComputedStyle TODO: fix performance
						elemObj.prop.value = that.getComputedStyleAndCache(elemObj.elem, styleObj.property, styleObj.pseudoElem);
						elemObj.prop.parentvalue = that.getComputedStyleAndCache(elemObj.elemParent, styleObj.property, styleObj.pseudoElem);
	
						var fontSize = parseFloat(that.getSpecifiedStyle(elemObj.elem, 'font-size'));
						var parentFontSize = parseFloat(that.getSpecifiedStyle(elemObj.elemParent, 'font-size'));
						var fontSizeScaleRate = parentFontSize / fontSize;
						var lineHeightNormalScaleRate = 1.14;//TODO: avoid magic number
	
						//Convert keyword to pixel
						if(elemObj.prop.value === 'normal') {
							elemObj.prop.value = fontSize * lineHeightNormalScaleRate + 'px';
						}
						if(elemObj.prop.parentValue === 'normal') {
							elemObj.prop.value = parentFontSize * lineHeightNormalScaleRate + 'px';
						}
	
						var parsedTargetElemNGStyleVal = that.controlFloat(elemObj.prop.value, 1);
						var parsedTargetElemParentNGStyleVal = that.controlFloat(elemObj.prop.value, 1);
	
						elemObj.prop.isInheritLineHeight =
							parsedTargetElemNGStyleVal * fontSizeScaleRate === parsedTargetElemParentNGStyleVal;
					}
	
					break;
	
				default:
	
					break;
			}
	
			that.executeTest(elemObj, ruleObj, styleObj, type);
		},
	
		getStylePropObj: function(styleObj) {
	
			//Copy value
			styleObj.prop.value = styleObj.value;
	
			//Detect reverse operator
			styleObj.prop.isReverse = styleObj.prop.value[0] === '!';
	
			//Remove reverse operator(!)
			if(styleObj.prop.isReverse) {
				styleObj.prop.value = styleObj.prop.value.slice(1);
	
			}
	
			//Detect group operator([...])
			styleObj.prop.hasGroupOperator = styleObj.prop.value[0] === '[' && styleObj.prop.value.slice(-1) === ']';
	
			//Override value if has group operator
			if(styleObj.prop.hasGroupOperator) {
				styleObj.prop.value = styleObj.prop.value.slice(1, -1);
			}
	
			//Convert to array
			styleObj.prop.value = styleObj.prop.value.split('|');
	
			//If line-height
			styleObj.prop.isLineHeight = styleObj.property === 'line-height';
		},
	
		executeTest: function(elemObj, ruleObj, styleObj, type) {
			var that = STYLEV.VALIDATOR;
	
			var hasRulePropVal = styleObj.prop.value.indexOf(elemObj.prop.value) > -1;
			var isOverZero = parseFloat(elemObj.prop.value) > 0;
			var isUnderZero = parseFloat(elemObj.prop.value) < 0;
			var isZero = parseFloat(elemObj.prop.value) === 0;
			var isDefault = elemObj.prop.value === elemObj.prop.defaultValue;
			var isInherit = elemObj.prop.value === elemObj.prop.parentValue;
	
			//TODO: refactor
			if(!hasRulePropVal) {
	
				var hasSpecialKW = false;
				STYLEV.METHODS.each(styleObj.prop.value, function(value) {
					if(that.specialKwVals.indexOf(value) > -1) {
						styleObj.prop.valueSpecialKW = value;
						hasSpecialKW = true;
						return 'break';
					}
				});
			}
	
			//TODO: refactor below
			//TODO: 0.00001とかの場合を考慮して、parseIntの10進数も考える 修正済み？要確認
			//Detect NG style and define error or warning
			if(
				/*
				 * Normal Pattern
				 * */
	
				(!styleObj.prop.isReverse && (
	
					// Equal with NG Style
					(hasRulePropVal) ||
	
					// 0
					(styleObj.prop.valueSpecialKW === '0' && isZero) ||
	
					// Granter than 0
					(styleObj.prop.valueSpecialKW === 'over-0' && isOverZero) ||
	
					// Less than 0
					(styleObj.prop.valueSpecialKW === 'under-0' && isUnderZero) ||
	
					// Default Value
					(styleObj.prop.valueSpecialKW === 'default' && isDefault) ||
	
					// Inherit Style（in case of line-height）
					(styleObj.prop.valueSpecialKW === 'inherit' && styleObj.prop.isLineHeight && elemObj.prop.isInheritLineHeight) ||
	
					// Inherit Style（in case of NOT line-height）
					(styleObj.prop.valueSpecialKW === 'inherit' && isInherit)
	
				)) ||
	
	
				/*
				 * Reverse Pattern
				 * */
	
				(styleObj.prop.isReverse && (
	
					// Without it TODO: Need to research that how it is possible
					(!hasRulePropVal && !hasSpecialKW) ||
	
					// Not 0
					(styleObj.prop.valueSpecialKW === '0' && !isZero) ||
	
					// Not Detault
					(styleObj.prop.valueSpecialKW === 'default' && !isDefault) ||
	
					// Not Inherit Style（in case of line-height）
					(styleObj.prop.valueSpecialKW === 'inherit' && styleObj.prop.isLineHeight && !elemObj.prop.isInheritLineHeight) ||
	
					// Not Inherit Style（in case of NOT line-height）
					(styleObj.prop.valueSpecialKW === 'inherit' && !isInherit)
	
				))
	
			){
	
				//TODO: 一度取得したものをインスタンス変数に格納しておく
				if(styleObj.prop.isLineHeight) {
					elemObj.prop.value = that.getSpecifiedStyle(elemObj.elem, styleObj.property, styleObj.pseudoElem);
				}
	
				//NG Style is passed
				if(type === 'ng') {
					that.generateResult(elemObj, ruleObj, styleObj);
	
				//Base Style is passed
				} else {
	
					var baseStyleObj = {};
					baseStyleObj.property = styleObj.property;
					baseStyleObj.value = elemObj.prop.value;
					baseStyleObj.isParentElem = styleObj.isParentElem;
					baseStyleObj.pseudoElem = styleObj.pseudoElem;
					ruleObj.baseStylesObjArray.push(baseStyleObj);
				}
	
			} else {
	
				//Base Style is not passed
				if(type === 'base') {
					ruleObj.hasAllBaseStyles = false;
					return 'break';
				}
			}
		},
	
		generateResult: function(elemObj, ruleObj, styleObj) {
			var that = STYLEV.VALIDATOR;
	
			//For Console
			var outputObj = {};
	
			//For Log
			var logObj = {};
	
			//Set Index
			if(!that.hasNGClass(elemObj.elem)) {
				that.elemIndex = (that.elemIndex+1)|0;
			}
	
			//Set Index to Data Attribute
			elemObj.elem.dataset.stylevid = that.elemIndex;
	
			//For generating data:start
			outputObj.ruleID = ruleObj.ruleID;
			outputObj.title = ruleObj.title;
	
			var baseStylesText = '';
			STYLEV.METHODS.each(ruleObj.baseStylesObjArray, function(baseStylesObj) {
	
				if(baseStylesText) {
					baseStylesText += ' ' + baseStylesObj.property + ': ';
					baseStylesText += baseStylesObj.value + ';';
				} else {
					baseStylesText += baseStylesObj.property + ': ';
					baseStylesText += baseStylesObj.value + ';';
				}
			});
	
			outputObj.messageText =
	
				'[' + outputObj.title + ']' + ' '+
	
				'<' + elemObj.elemTagName + '> ' +
	
				(baseStylesText ? '{' + baseStylesText + '} ' : '') +
	
				(styleObj.isParentElem ? 'This parent' + (styleObj.pseudoElem ? '\'s pseudo' : '') + ' element ' + '<' + elemObj.elemParentTagName + '>' : '') +
	
				(styleObj.pseudoElem ? styleObj.pseudoElem : '') +
	
				(STYLEV.METHODS.isHidden(elemObj.elem) ? '(hidden)' : '') +
	
				' is defined ' +
	
				'{' + styleObj.property + ': ' + elemObj.prop.value + ';}.' + ' ' +
	
				(styleObj.reason ? styleObj.reason : '');
	
	
			outputObj.tagName = elemObj.elemTagName;
			outputObj.targetStyle = {};
			outputObj.targetStyle[styleObj.property] = elemObj.prop.value;
	
			outputObj.ngStyle = {};
			outputObj.ngStyle[styleObj.property] = styleObj.prop.value;
			if(ruleObj.baseStyles) {
				outputObj.baseStyle = ruleObj.baseStyles;
			}
			if(styleObj.isParentElem) {
				outputObj.targetParentStyle = {};
				outputObj.targetParentStyle[styleObj.property] = elemObj.prop.parentValue;//TODO: fix
			}
			outputObj.reason = styleObj.reason;
			outputObj.referenceURL = styleObj.referenceURL;
			outputObj.stylevid = that.elemIndex;
			outputObj.riskLevel = styleObj.riskLevel;
	
			if(styleObj.riskLevel === 'error') {
				elemObj.elem.classList.add('stylev-target-error');
			}
	
			if(styleObj.riskLevel === 'warning') {
				elemObj.elem.classList.add('stylev-target-warning');
			}
			//For generating data:end
	
			//Generate Log Data for Log: start
			logObj.ruleID = ruleObj.ruleID;
			logObj.title = ruleObj.title;
			logObj.replacedElem = ruleObj.replacedElem;
			logObj.emptyElem = ruleObj.emptyElem;
	
			logObj.tagName = elemObj.elemTagName;
	
			logObj.baseStyle = [];
			//TODO: refactor below
			//var baseStylesArray = ruleObj.baseStylesText.split(';');
			STYLEV.METHODS.each(ruleObj.baseStylesObjArray, function(baseStylesObj) {
				logObj.baseStyle.push(baseStylesObj);
			});
	
			logObj.ngStyle = {};
			logObj.ngStyle[styleObj.property] = elemObj.prop.value;
			logObj.ngStyle.riskLevel = styleObj.riskLevel;
			logObj.ngStyle.isParentElem = styleObj.isParentElem;
			logObj.ngStyle.pseudoElem = styleObj.pseudoElem;
			//Generate Data for Log: end
	
			//Push to Array
			that.outputObjArray.push(outputObj);
			that.logObjArray.push(logObj);
		},
	
		hasNGClass: function(target) {
			var targetClassList = target.classList;
			return	targetClassList.contains('stylev-target-error') ||
					targetClassList.contains('stylev-target-warning');
		},
	
		sendLog: function() {
			var that = STYLEV.VALIDATOR;
	
			var xhr = new XMLHttpRequest();
			var apiURI = 'https://style-validator.herokuapp.com/sendLog';
			//var apiURI = 'http://localhost:8001/sendLog';
	
			var dataObj = {};
	
			dataObj.uuid = '';
			dataObj.caller = STYLEV.caller;
			dataObj.exeMode = STYLEV.exeMode;
			dataObj.version = STYLEV.version;//TODO: Bookmarkletのために、menifest.jsonから取得するか検討
			dataObj.url = location.href;
			dataObj.date = new Date();
			dataObj.ua = navigator.userAgent;
			dataObj.timeMS = new Date() - that.startTime;
			dataObj.matchedMediaTexts = that.matchedMediaTextsArray;
			dataObj.count = {};
			dataObj.count.total = that.logObjArray.length;
			dataObj.count.error = that.errorNum;
			dataObj.count.warning = that.warningNum;
			dataObj.results = that.logObjArray;

			//TODO: remove?
			STYLEV.logData = dataObj;
	
			var data4send = JSON.stringify(dataObj, null, '\t');
	
			xhr.open('POST', apiURI, true);
			xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
			xhr.addEventListener('load', function () {
				if (xhr.status === 200) {
					that.showSuccessMsg();
				} else {
					that.showErrorMsg();
				}
			});
			xhr.addEventListener('error', that.showErrorMsg);
	
			if (xhr.readyState == 4) {
				return;
			}
	
			console.info('Style Validator: Sending Data is starting...');
			xhr.send(data4send);
		},
		showSuccessMsg: function() {
			console.info('Style Validator: Sent result to database successfully');
		},
	
		showErrorMsg: function(e) {
			throw new Error('Request is failed!');
		},
	
		initializeValidation: function() {
	
			var that = STYLEV.VALIDATOR;
	
			//note: order of following scripts is very important.
	
			//remove console if it has already showed.
			if(STYLEV.isValidated) {
				that.destroy();
			}
	
			//getting all elements
			that.allElem = document.querySelectorAll('*:not(.stylev-ignore)');
	
			//Inserting StyleSheet when Validator has been executed from Bookmarklet
			that.insertCSS4Bookmarklet();
	
			//initialize array of validation result
			that.logObjArray = [];
			that.outputObjArray = [];
	
			//initialize number of error
			that.errorNum = 0;
	
			//initialize number of warning
			that.warningNum = 0;
	
			//initialize number of element's Index
			that.elemIndex = 0;
	
			if(!STYLEV.isFirstExecution) {
	
				//Initialize observation
				that.initializeVars4Observer();
				that.showMessageViaObserver();
	
				//Initialize refresh
				that.clearExecutionTimer();
				that.resetRefreshButton();
			}
	
			//Get default style of each tags
			that.insertIframe4getDefaultStyles();
			that.getStyleAttrs(that.iframeDocument);
			that.getStyleSheets(that.iframeDocument);
	
			//Add custom property into DOM element to get non-computed style
			that.getStyleAttrs(document);
			that.getStyleSheets(document);
		},
	
		getOpenTag: function(target) {
			switch(target.nodeType) {
				case Node.ELEMENT_NODE:
					return target.outerHTML.replace(/\n/g, '').match(/<[a-zA-Z]+(>|.*?[^?]>)/g)[0];
					break;
				case Node.TEXT_NODE:
					var parent = target.parentElement;
					return parent && parent.outerHTML.replace(/\n/g, '').match(/<[a-zA-Z]+(>|.*?[^?]>)/g)[0];
				default:
					return '';
			}
		},
	
		isEqualWithOpenTag: function(elem1, elem2) {
			var that = STYLEV.VALIDATOR;
			return that.getOpenTag(elem1) === that.getOpenTag(elem2);
		},
	
		//監視開始
		setupMutationObserver: function() {
	
			var that = STYLEV.VALIDATOR;
	
			var targetAttributes = ['style', 'class'];
	
			var observationConfig = {
				childList: true,
				subtree: true,
				attributes: true,
	//			attributeFilter: targetAttributes,
				attributeOldValue: true,
				characterData: true,
				characterDataOldValue: true
			};
			var previousTarget = null;
	
			var mutationCallback = function (mutations) {
	
				var mutationsLen = mutations.length;
				var eachMessageArray = [];
	
				//TODO: Need to refactor above
	
				//監視対象毎に
				mutationsLoop: for(var i = 0; i < mutationsLen; i = (i+1)|0) {
	
					var mutation = mutations[i];
					var target = mutation.target;
	
					var isElementNode = target.nodeType === Node.ELEMENT_NODE;
					var isTextNode = target.nodeType === Node.TEXT_NODE;
	
					var tagName = isElementNode ? target.tagName.toLowerCase() : (isTextNode ? target.wholeText : 'any other node');
					var tag = '<' + tagName + '>';
					var openTag = isElementNode ? that.getOpenTag(target) : (isTextNode ? target.wholeText : 'any other node');
	
					var type = mutation.type;
					var addedNodes = mutation.addedNodes;
					var addedNodesLen = addedNodes.length;
					var removedNodes = mutation.removedNodes;
					var removedNodesLen = removedNodes.length;
	
					var ignoreTargetsArray = STYLEV.ignoreTargetsArray;
					var ignoreTargetsArrayLen = ignoreTargetsArray.length;
	
					/***************************************************************
					 * Judgement section
					 ****************************************************************/
	
					//Continue when current target is equal with ignoring element
					for(var x = 0; x < ignoreTargetsArrayLen; x = (x+1)|0) {
						var ignoreTarget = ignoreTargetsArray[x];
						var isEqualWithIgnoringTarget = that.isEqualWithOpenTag(target, ignoreTarget);
						if(isEqualWithIgnoringTarget) {
							continue mutationsLoop;
						}
					}
	
					if( isElementNode && (
							target.classList.contains('stylev-ignore') ||
							target.classList.contains('stylev-animation')
						)
					) {
						continue;
					}
	
					if(type === 'attributes') {
						var attributeName = mutation.attributeName;
						var newValueOfAttr = target.getAttribute(attributeName);
						if(mutation.oldValue === newValueOfAttr) {
							continue;
						}
	
						eachMessageArray.push('******** Attributes has been changed ********\nOld:\t' + attributeName + '="' + mutation.oldValue + '"\nNew:\t' + attributeName + '="' + newValueOfAttr + '"');
					}
					if(type === 'characterData') {
						var newValueOfText = target.textContent;
						if(mutation.oldValue === newValueOfText) {
							continue;
						}
						eachMessageArray.push('******** CharacterData has been changed ********\nOld:\t' + mutation.oldValue + '\nNew:\t' + newValueOfText);
					}
	
					if(type === 'childList') {
	
						for(var n = 0; n < removedNodesLen; n = (n+1)|0) {
							var removedNode = removedNodes[n];
							var isTagRemovedNode = removedNode.nodeType === Node.ELEMENT_NODE;
							var isTextRemovedNode = removedNode.nodeType === Node.TEXT_NODE;
							var removedNodeContent;
	
							if( isTagRemovedNode &&
								removedNode.tagName.toLowerCase() === 'script' &&
								removedNode.src.indexOf('analytics.js') !== -1) {
								continue mutationsLoop;
							}
							if(isTagRemovedNode) {
								removedNodeContent = removedNode.outerHTML;
							}
							if(isTextRemovedNode) {
								removedNodeContent = removedNode.wholeText;
							}
							eachMessageArray.push('******** Removed from ' + tag + ' ********\n' + removedNodeContent);
						}
						for(var m = 0; m < addedNodesLen; m = (m+1)|0) {
							var addedNode = addedNodes[m];
							var isTagAddedNode = addedNode.nodeType === Node.ELEMENT_NODE;
							var isTextAddedNode = addedNode.nodeType === Node.TEXT_NODE;
							var addedNodeContent;
	
							if( isTagAddedNode &&
								addedNode.tagName.toLowerCase() === 'script' &&
								addedNode.src.indexOf('analytics.js') !== -1) {
								continue mutationsLoop;
							}
							if(isTagAddedNode) {
								addedNodeContent = addedNode.outerHTML;
							}
							if(isTextAddedNode) {
								addedNodeContent = addedNode.wholeText;
							}
							eachMessageArray.push('******** Added into ' + tag + ' ********\n' + addedNodeContent);
						}
	
					}
	
					/***************************************************************
					 * Record Section
					 ****************************************************************/
	
					//If a muted info passed, don't ignore
					that.isIgnore = false;
	
					if(target.dataset_mutationOvserberID === undefined) {
						target.dataset_mutationOvserberID = ++STYLEV.mutationOvserberID;
					}
					var isSameIDWithPreviousTarget =
						previousTarget && previousTarget.dataset_mutationOvserberID ?
						target.dataset_mutationOvserberID === previousTarget.dataset_mutationOvserberID :
						false;
	
					var isEqualElemWithPreviousTarget = previousTarget ? that.isEqualWithOpenTag(target, previousTarget) : false;
	
					if(!isSameIDWithPreviousTarget) {
	
						eachMessageArray.unshift(
							'==================================================\n' + openTag
						);
	
						//Merge array
						that.moMessageArray.push.apply(that.moMessageArray, eachMessageArray);
	
						//Initialize array
						eachMessageArray = [];
					}
	
					if(isSameIDWithPreviousTarget || isEqualElemWithPreviousTarget) {
						STYLEV.sameElemCount = (STYLEV.sameElemCount+1)|0;
					} else {
						STYLEV.sameElemCount = 0;
					}
	
					//前回の要素と今回の要素が同じだった回数が5回以上の場合
					if(STYLEV.sameElemCount > 5) {
	
	
						//Initialization
						STYLEV.sameElemCount = 0;
						console.info('Style Validator: Ignored the following element\n' + openTag)
	
						//Ingore Target
						ignoreTargetsArray.push(target);
					}
	
					//keep previous target
					previousTarget = target;
	
					console.info('Style Validator: DOM has been modified...')
	
				}
	
	
				//Caught by above detection
				if(!that.isIgnore) {
					that.setExecutionTimer();
				}
	
				//TODO: ダイアログで無視するか確認する方式にするか検討
				//resetting regularly
	//			that.resetIgnoresTimer = setInterval(function() {
	//				ignoreTargetsArray = [];
	//			}, that.settings.IGNORING_ELEM_ARRAY_RESET_INTERVAL);
			};
	
			//Define countdown default second
			that.COUNTDOWN_DEFAULT_SECOND = that.settings.OBSERVATION_INTERVAL / that.settings.COUNTDOWN_INTERVAL;
	
			//consoleに出すメッセージの配列
			that.moMessageArray = [];
	
			//反応したとき無視するかどうか
			that.isIgnore = true;
	
			//Create MutationObserver and define callback
			that.observer = new MutationObserver(mutationCallback);
	
			return {
	
				connect: function() {
					if(!STYLEV.options.ENABLE_MUTATION_OBSERVER) {
						return false;
					}
					if(!that.isObserving) {
						that.observer.observe(that.body, observationConfig);
						that.observer.observe(that.head, observationConfig);
						that.isObserving = true;
						console.info('Style Validator: Mutation Observer has connected');
					}
				},
	
				disconnect: function() {
					if(!STYLEV.options.ENABLE_MUTATION_OBSERVER) {
						return false;
					}
					if(that.isObserving) {
						clearTimeout(that.observationTimer);
	//					clearTimeout(that.resetIgnoresTimer);
						that.observer.disconnect();
						that.isObserving = false;
						console.info('Style Validator: Mutation Observer has disconnected');
					}
				}
			}
	
		},
	
		setExecutionTimer: function() {
			var that = STYLEV.VALIDATOR;
	
			that.clearExecutionTimer();
			that.resetRefreshButton();//TODO: unite below?
			that.indicateRefreshButton();
	
			that.countDownTimer = setInterval(that.countDown2Refresh, that.settings.COUNTDOWN_INTERVAL);
	
		},
	
		clearExecutionTimer: function() {
			var that = STYLEV.VALIDATOR;
	
			clearInterval(that.countDownTimer);
		},
	
		resetRefreshButton: function() {
			var that = STYLEV.VALIDATOR;
	
			that.countdownDynamicSecond = that.COUNTDOWN_DEFAULT_SECOND;
			that.consoleRefreshCount.textContent = '';
	
			that.consoleRefreshButtonImage.classList.remove('is-hidden');
			that.consoleRefreshButtonImageActive.classList.add('is-hidden');
			that.consoleRefreshButton.classList.remove('stylev-console-refresh-button-active');
		},
	
		indicateRefreshButton: function() {
			var that = STYLEV.VALIDATOR;
	
			that.consoleRefreshCount.textContent = that.COUNTDOWN_DEFAULT_SECOND;
	
			that.consoleRefreshButtonImage.classList.add('is-hidden');
			that.consoleRefreshButtonImageActive.classList.remove('is-hidden');
			that.consoleRefreshButton.classList.add('stylev-console-refresh-button-active');
		},
	
		executeWithDetectingCE: function() {
			var that = STYLEV.VALIDATOR;
			if(STYLEV.isChromeExtension) {
				STYLEV.CHROME_EXTENSION.execute();
			}
			if(STYLEV.isBookmarklet) {
				that.execute();
			}
		},
	
		showMessageViaObserver: function() {
	
			var that = STYLEV.VALIDATOR;
	
			if(that.moMessageArray instanceof Array && that.moMessageArray.length) {
				console.groupCollapsed('Style Validator: Modified Elements Data');
				console.info(that.moMessageArray.join('\n\n'));
				console.groupEnd('Style Validator: Modified Elements Data');
			}
	
		},
	
		initializeVars4Observer: function() {
			var that = STYLEV.VALIDATOR;
	
			//Init
			that.isIgnore = true;
		},
	
		isSameWithPreviousData: function() {
	
			var that = STYLEV.VALIDATOR;
	
			return false;
		},
	
		//スタイルシート挿入
		insertCSS4Bookmarklet: function() {
	
			var that = STYLEV.VALIDATOR;
	
			if(STYLEV.isBookmarklet) {
	
				var docFrag = document.createDocumentFragment();
				that.linkTags = [];
	
				STYLEV.METHODS.each(that.CSS_PATHES, function(path) {
					if(document.querySelectorAll('link[href="' + path + '"]').length) {
						return 'continue';
					}
	
					var linkTag = document.createElement('link');
					linkTag.id = that.settings.STYLESHEET_ID;
					linkTag.rel = 'stylesheet';
					linkTag.classList.add('stylev-ignore');
					linkTag.href = path;
	
					that.linkTags.push(linkTag);
					docFrag.appendChild(linkTag);
				});
	
	
				/* append */
				that.head.appendChild(docFrag);
			}
		},
	
		//スタイルシートを削除
		removeStyleSheet: function() {
			var that = STYLEV.VALIDATOR;
	
			STYLEV.METHODS.each(that.linkTags, function(linkTag) {
				linkTag.parentElement.removeChild(linkTag);
			});
		},
	
		//コンソールを削除
		removeConsole: function() {
			var that = STYLEV.VALIDATOR;
	
			if(that.consoleWrapper !== undefined) {
				that.consoleWrapper.parentElement.removeChild(that.consoleWrapper);
			}
	
			if(that.html !== undefined) {
				//ログ表示領域分の余白を初期化
				that.html.style.setProperty('border-bottom-width', that.htmlDefaultBorderBottomWidth, '');
			}
		},
	
		insertIframe4getDefaultStyles: function() {
	
			var that = STYLEV.VALIDATOR;
	
			that.iframe4test = document.createElement('iframe');
			that.iframe4test.id = 'stylev-dummy-iframe';
			that.iframe4test.classList.add('stylev-ignore');
			that.html.appendChild(that.iframe4test);
			that.iframeWindow = that.iframe4test.contentWindow;
			that.iframeDocument = that.iframeWindow.document;
			that.iframeBody = that.iframeDocument.querySelector('body');
	
			var docFrag = document.createDocumentFragment();
	
			STYLEV.METHODS.each(that.tagsAllData, function(tagName, i) {
				docFrag.appendChild(document.createElement(tagName));
			});
	
			that.iframeBody.appendChild(docFrag);
	
		},
	
		removeIframe4getDefaultStyles: function() {
			var that = STYLEV.VALIDATOR;
	
			that.iframe4test.parentElement.removeChild(that.iframe4test);
		},
	
		removeAllAttrAndEvents: function() {
			var that = STYLEV.VALIDATOR;
	
			//属性やclassNameを削除
			STYLEV.METHODS.each(that.allElem, function(elem) {
				elem.removeAttribute('data-stylevid');
				elem.removeAttribute('data-stylevclass');
				elem.classList.remove('stylev-target-error');
				elem.classList.remove('stylev-target-warning');
				elem.classList.remove('stylev-target-selected');
				elem.removeEventListener('click', STYLEV.CHROME_DEVTOOLS.inspectViaTargets);
				elem.removeEventListener('click', that.markElementViaTargets);
			});
	
			if(that.html !== undefined) {
				that.html.removeEventListener('keyup', that.destroyByEsc);
			}
	
		},
	
		countDown2Refresh: function() {
			var that = STYLEV.VALIDATOR;
			that.consoleRefreshCount.textContent = --that.countdownDynamicSecond;
			if(that.countdownDynamicSecond <= 1) {
				clearInterval(that.countDownTimer);
				that.executeWithDetectingCE();
			}
		},
	
		insertStyle2ShadowDOM: function() {
			var that = STYLEV.VALIDATOR;
			var styleElement = document.createElement('style');
			styleElement.textContent = that.consoleStyleText;
			that.consoleWrapperShadowRoot.appendChild(styleElement);
		},
	
		showConsole: function() {
			var that = STYLEV.VALIDATOR;
	
			if(STYLEV.options.ENABLE_AUTO_EXECUTION && that.outputObjArray.length === 0) {
				that.showBadgeText();
				return;
			}
	
			that.setParameters4Console();
			that.createConsoleElements();
			that.setAttrOfConsoleElements();
			that.insertStyle2ShadowDOM();
			that.showConsoleMessages();
			that.bindEvents2Console();
			that.generateConsoleCounterText();
			that.appendConsoleElements();
			that.doAfterShowingConsole();
		},
	
		setParameters4Console: function() {
			var that = STYLEV.VALIDATOR;
	
			that.isMouseDownConsoleHeader = false;
	
			that.consoleStartPosY = 0;
			that.consoleCurrentPosY = 0;
			that.consoleDiffPosY = 0;
		},
	
		createConsoleElements: function() {
			var that = STYLEV.VALIDATOR;
	
			that.docFrag = document.createDocumentFragment();
	
			that.consoleWrapper = document.createElement('div');
			that.consoleWrapperShadowRoot = that.consoleWrapper.createShadowRoot();
			that.consoleHeader = document.createElement('header');
			that.consoleHeading = document.createElement('h1');
			that.consoleHeadingLogo = document.createElement('a');
			that.consoleHeadingLogoImage = document.createElement('img');
			that.consoleMode = document.createElement('p');
			that.consoleButtons = document.createElement('div');
			that.consoleRefreshButton = document.createElement('a');
			that.consoleRefreshButtonImage = document.createElement('img');
			that.consoleRefreshButtonImageActive = document.createElement('img');
			that.consoleRefreshCount = document.createElement('output');
			that.consoleCounter = document.createElement('div');
			that.consoleMediaQueries = document.createElement('div');
			that.consoleMediaQueriesImage = document.createElement('img');
			that.consoleMediaQueriesText = document.createElement('span');
			that.consoleBody = document.createElement('div');
			that.consoleList = document.createElement('ul');
			that.consoleCloseButton = document.createElement('a');
			that.consoleCloseButtonImage = document.createElement('img');
			that.consoleMinimizeButton = document.createElement('a');
			that.consoleMinimizeButtonImage = document.createElement('img');
			that.consoleNormalizeButton = document.createElement('a');
			that.consoleNormalizeButtonImage = document.createElement('img');
		},
	
		setAttrOfConsoleElements: function() {
			var that = STYLEV.VALIDATOR;
	
			that.consoleWrapper.id = that.settings.CONSOLE_WRAPPER_ID;
			that.consoleWrapper.classList.add('stylev-ignore');
	
			//TODO: refactor change to class?
			that.consoleWrapper.style.setProperty('opacity', '0', '');
			that.consoleList.id = that.settings.CONSOLE_LIST_ID;
			that.consoleHeader.classList.add('stylev-console-header');
			that.consoleHeading.classList.add('stylev-console-heading');
			that.consoleHeadingLogo.classList.add('stylev-console-heading-logo');
			that.consoleHeadingLogo.href = 'https://style-validator.herokuapp.com/';
			that.consoleHeadingLogo.target = '_blank';
			that.consoleHeadingLogoImage.classList.add('stylev-console-heading-logo-image');
			that.consoleHeadingLogoImage.src = that.settings.ICON_LOGO_PATH;
			that.consoleMode.classList.add('stylev-console-mode');
			that.consoleButtons.classList.add('stylev-console-buttons');
			that.consoleRefreshButton.href = 'javascript: void(0);';
			that.consoleRefreshButton.classList.add('stylev-console-refresh-button');
			that.consoleRefreshButtonImage.classList.add('stylev-console-refresh-button-image');
			that.consoleRefreshButtonImage.src = that.settings.ICON_REFRESH_PATH;
			that.consoleRefreshButtonImageActive.classList.add('stylev-console-refresh-button-image-active');
			that.consoleRefreshButtonImageActive.classList.add('is-hidden');
			that.consoleRefreshButtonImageActive.src = that.settings.ICON_REFRESH_ACTIVE_PATH;
			that.consoleRefreshCount.classList.add('stylev-console-refresh-count');
			that.consoleCounter.classList.add('stylev-console-counter');
			that.consoleMediaQueries.classList.add('stylev-console-mediaqueries');
			that.consoleMediaQueriesImage.classList.add('stylev-console-mediaqueries-image');
			that.consoleMediaQueriesImage.src = that.settings.ICON_RESPONSIVE_PATH;
			that.consoleMediaQueriesText.classList.add('stylev-console-mediaqueries-text');
			that.consoleBody.classList.add('stylev-console-body');
			that.consoleList.classList.add('stylev-console-list');
			that.consoleCloseButton.href = 'javascript: void(0);';
			that.consoleCloseButton.classList.add('stylev-console-close-button');
			that.consoleCloseButtonImage.classList.add('stylev-console-close-button-image');
			that.consoleCloseButtonImage.src = that.settings.ICON_CLOSE_PATH;
			that.consoleMinimizeButton.href = 'javascript: void(0);';
			that.consoleMinimizeButton.classList.add('stylev-console-minimize-button');
			that.consoleMinimizeButtonImage.classList.add('stylev-console-minimize-button-image');
			that.consoleMinimizeButtonImage.src = that.settings.ICON_MINIMIZE_PATH;
			that.consoleNormalizeButton.href = 'javascript: void(0);';
			that.consoleNormalizeButton.classList.add('is-hidden');
			that.consoleNormalizeButton.classList.add('stylev-console-normalize-button');
			that.consoleNormalizeButtonImage.classList.add('stylev-console-normalize-button-image');
			that.consoleNormalizeButtonImage.src = that.settings.ICON_NORMALIZE_PATH;
		},
	
		generateConsoleCounterText: function() {
			var that = STYLEV.VALIDATOR;
	
			that.consoleHeadingText = document.createTextNode(that.settings.CONSOLE_HEADING_TEXT);
			that.consoleCounter.textContent = 'Total: ' + that.outputObjArray.length + ' / Error: ' + that.errorNum + ' / Warning: ' + that.warningNum;
			that.consoleMediaQueriesText.textContent = that.matchedMediaTextsArray.join(', ');
		},
	
		appendConsoleElements: function() {
			var that = STYLEV.VALIDATOR;
	
			that.consoleHeadingLogo.appendChild(that.consoleHeadingLogoImage);
			//that.consoleHeadingLogo.appendChild(that.consoleHeadingText);
			that.consoleHeading.appendChild(that.consoleHeadingLogo);
	
			that.consoleMediaQueries.appendChild(that.consoleMediaQueriesImage);
			if(that.consoleMediaQueriesText.hasChildNodes()) {
				that.consoleMediaQueries.appendChild(that.consoleMediaQueriesText);
			}
			that.consoleRefreshButton.appendChild(that.consoleRefreshButtonImage);
			that.consoleRefreshButton.appendChild(that.consoleRefreshButtonImageActive);
			that.consoleRefreshButton.appendChild(that.consoleRefreshCount);
			that.consoleNormalizeButton.appendChild(that.consoleNormalizeButtonImage);
			that.consoleMinimizeButton.appendChild(that.consoleMinimizeButtonImage);
			that.consoleCloseButton.appendChild(that.consoleCloseButtonImage);
	
			that.consoleButtons.appendChild(that.consoleRefreshButton);
			that.consoleButtons.appendChild(that.consoleMinimizeButton);
			that.consoleButtons.appendChild(that.consoleNormalizeButton);
			that.consoleButtons.appendChild(that.consoleCloseButton);
	
			that.consoleHeader.appendChild(that.consoleHeading);
			that.consoleHeader.appendChild(that.consoleCounter);
			that.consoleHeader.appendChild(that.consoleMediaQueries);
			that.consoleHeader.appendChild(that.consoleMode);
			that.consoleHeader.appendChild(that.consoleButtons);
			that.consoleWrapperShadowRoot.appendChild(that.consoleHeader);
			that.consoleWrapperShadowRoot.appendChild(that.consoleBody);
			that.consoleList.appendChild(that.docFrag);
			that.consoleBody.appendChild(that.consoleList);
			that.html.appendChild(that.consoleWrapper);
	
		},
	
		doAfterShowingConsole: function() {
	
			var that = STYLEV.VALIDATOR;
	
			setTimeout(function() {
	
				that.normalizeConsole();
	
				//TODO: refactor change to class?
				that.consoleWrapper.style.setProperty('opacity', null, '');
	
				//コンソールの包括要素のデフォルトの高さを計算し記憶しておく
				//TODO: refactor export named function
				that.consoleWrapperDynamicHeight = parseInt(that.consoleWrapper.offsetHeight, 10);
	
				//コンソールの包括要素の高さ分だけ最下部に余白をつくる
				//コンソールで隠れる要素がでないための対応
				//TODO: refactor export named function
				that.html.style.setProperty('border-bottom-width', that.consoleWrapperDynamicHeight + 'px', 'important');
	
				that.sendResult2ChromeExtension();
				that.restorePreviousCondition();
			}, 0);
		},
	
		showBadgeText: function() {
			var that = STYLEV.VALIDATOR;
			var length = that.outputObjArray.length;
	
			chrome.runtime.sendMessage({
				name: 'setBadgeText',
				badgeText: length ? length : ''
			});
		},
	
		showConnectionStatus: function() {
			var that = STYLEV.VALIDATOR;
	
			chrome.runtime.sendMessage({
				name: 'switchMode'
			}, function(message) {
	
				if(message.isConnected2Devtools !== undefined) {
	
					var consoleModeImage = document.createElement('img');
					var consoleModeText = document.createTextNode(message.isConnected2Devtools ? that.settings.CONNECTED_2_DEVTOOLS_MESSAGE : that.settings.DISCONNECTED_2_DEVTOOLS_MESSAGE);
					consoleModeImage.classList.add('stylev-console-mode-image');
					consoleModeImage.src = message.isConnected2Devtools ? that.settings.ICON_CONNECTED_PATH : that.settings.ICON_DISCONNECTED_PATH;
					that.consoleMode.appendChild(consoleModeImage);
					that.consoleMode.appendChild(consoleModeText);
					that.consoleMode.classList.add(message.isConnected2Devtools ? that.settings.CONNECTED_2_DEVTOOLS_CLASS : that.settings.DISCONNECTED_2_DEVTOOLS_CLASS);
				}
			});
		},
	
		sendResult2ChromeExtension: function() {
	
			var that = STYLEV.VALIDATOR;
	
			if(STYLEV.isChromeExtension) {
				that.showBadgeText();
				that.showConnectionStatus();
			}
		},
	
		//前回開いた状態を復元する
		restorePreviousCondition: function() {
	
			var that = STYLEV.VALIDATOR;
	
			//前回のスクロール値まで移動　それがなければ、0がはいる
			setTimeout(function() {
				that.consoleList.scrollTop = STYLEV.consoleScrollTop;
			}, 0);
	
			//スクロール値を記憶　TODO: イベント削除をいれる　必要ないか・・・一度消えるし今は
			that.consoleList.addEventListener('scroll', function(event) {
				STYLEV.consoleScrollTop = event.currentTarget.scrollTop;
			});
	
			//最後にフォーカスしていた要素に対して、インスペクト
			if(typeof STYLEV.CHROME_DEVTOOLS.inspectOfConsoleAPI === 'function') {
				STYLEV.CHROME_DEVTOOLS.inspectOfConsoleAPI();
			}
	
			//選択した行があった場合、選択した行と現在のリストを比べて、同一のものに選択状態のclassを付与
			if(STYLEV.selectedConsoleLine) {
				var listItems = that.consoleList.querySelectorAll('li');
	
				STYLEV.METHODS.each(listItems, function(listItem) {
					if(listItem.isEqualNode(STYLEV.selectedConsoleLine)) {
						listItem.classList.add('stylev-trigger-selected');
						return 'break';
					}
				});
			}
		},
	
		showConsoleMessages: function() {
	
			var that = STYLEV.VALIDATOR;
	
			if(that.outputObjArray.length === 0) {
				that.showPerfectMessage();
			} else {
				STYLEV.METHODS.each(that.outputObjArray, that.createConsoleMessage);
			}
		},
	
		showPerfectMessage: function() {
			var that = STYLEV.VALIDATOR;
	
			that.congratulationsMessage = document.createElement('li');
			that.congratulationsMessage.classList.add('stylev-console-perfect');
			that.congratulationsMessage.textContent = that.settings.CONGRATULATION_MESSAGE_TEXT;
			that.docFrag.appendChild(that.congratulationsMessage);
	
		},
	
		createConsoleMessage: function(outputObj) {
			var that = STYLEV.VALIDATOR;
	
			var li = document.createElement('li');
			var anchor = document.createElement('a');
			var ids = document.createElement('span');
			var elemID = document.createElement('a');
			var ruleID = document.createElement('a');
	
			ids.classList.add('stylev-console-list-ids');
	
			anchor.href = 'javascript: void(0);';
			anchor.dataset.stylevconsoleid = outputObj.stylevid;
			anchor.classList.add('stylev-console-list-anchor');
	
			elemID.href = 'javascript: void(0);';
			elemID.dataset.stylevconsoleid = outputObj.stylevid;
			elemID.classList.add('stylev-console-list-stylevid');
	
			ruleID.target = '_blank';
	
			if(STYLEV.isChromeExtension) {
				ruleID.href = 'javascript: void(0);';
				ruleID.addEventListener('click', that.jump2RulePage('#rule-' + outputObj.ruleID));
			} else {
				//ruleID.href = 'http://localhost:8001/extension/options.html#rule-' + outputObj.ruleID;//TODO: change url
				ruleID.href = 'https://style-validator.herokuapp.com/extension/options.html#rule-' + outputObj.ruleID;//TODO: change url
			}
			ruleID.classList.add('stylev-console-list-ruleid');
	
			anchor.addEventListener('click', that.markElementViaConsole);
			elemID.addEventListener('click', that.markElementViaConsole);
	
			anchor.textContent = outputObj.messageText;
			elemID.textContent = outputObj.stylevid;
			ruleID.textContent = outputObj.ruleID;
	
			if(outputObj.riskLevel === 'error') {
	
				li.classList.add('stylev-trigger-error');
				that.errorNum = (that.errorNum+1)|0;
			}
	
			if(outputObj.riskLevel === 'warning') {
	
				li.classList.add('stylev-trigger-warning');
				that.warningNum = (that.warningNum+1)|0;
			}
			ids.appendChild(elemID);
			if(ruleID.href) {
				ids.appendChild(ruleID);
			}
			li.appendChild(ids);
			li.appendChild(anchor);
			that.docFrag.appendChild(li);
		},
	
		jump2RulePage: function(hash) {
			var that = STYLEV.VALIDATOR;
			return function(event) {
				chrome.runtime.sendMessage({name: 'openOptionsPage', hash: hash});
			};
		},
	
		setParametersOfConsole: function() {
			var that = STYLEV.VALIDATOR;
	
			that.markedTargets = document.querySelectorAll('.stylev-target-error, .stylev-target-warning');
			that.consoleListItems = that.consoleList.children;
			that.consoleTriggers = that.consoleList.querySelectorAll('a[data-stylevconsoleid]');
		},
	
		bindEvents2Console: function() {
			var that = STYLEV.VALIDATOR;
	
			that.consoleWrapper.addEventListener('click', that.stopPropagation);
			that.consoleHeader.addEventListener('mousedown', that.initConsoleHeader);
			that.html.addEventListener('mousemove', that.moveConsoleHeader);
			that.html.addEventListener('mouseup', that.offConsoleHeader);
			that.consoleCloseButton.addEventListener('click', that.destroy);
			that.consoleRefreshButton.addEventListener('click', that.executeWithDetectingCE);
			that.consoleMinimizeButton.addEventListener('click', that.toggleConsole);
			that.consoleNormalizeButton.addEventListener('click', that.toggleConsole);
			that.html.addEventListener('keyup', that.destroyByEsc);
		},
	
		stopPropagation: function(event) {
			event.stopPropagation();
		},
	
		initConsoleHeader: function(event) {
			event.stopPropagation();
			var that = STYLEV.VALIDATOR;
			that.isMouseDownConsoleHeader = true;
			that.consoleStartPosY = event.pageY;
		},
	
		moveConsoleHeader: function(event) {
			event.stopPropagation();
			var that = STYLEV.VALIDATOR;
			if(that.isMouseDownConsoleHeader) {
				that.consoleCurrentPosY = event.pageY;
				that.consoleDiffPosY = that.consoleStartPosY - that.consoleCurrentPosY;
				that.consoleWrapper.style.setProperty('height', (that.consoleWrapperDynamicHeight + that.consoleDiffPosY) + 'px', '');
				event.currentTarget.style.setProperty('border-bottom-width', that.consoleWrapperDynamicHeight + that.consoleDiffPosY + 'px', 'important');
	
				if(that.consoleWrapper.offsetHeight === 30) {
					that.consoleNormalizeButton.classList.remove('is-hidden');
					that.consoleMinimizeButton.classList.add('is-hidden');
				} else if(that.consoleWrapper.offsetHeight > 30) {
					that.consoleNormalizeButton.classList.add('is-hidden');
					that.consoleMinimizeButton.classList.remove('is-hidden');
				}
			}
		},
	
		offConsoleHeader: function(event) {
			event.stopPropagation();
			var that = STYLEV.VALIDATOR;
			if(that.isMouseDownConsoleHeader) {
				that.consoleWrapperDynamicHeight = parseInt(that.consoleWrapper.offsetHeight, 10);
			}
			that.isMouseDownConsoleHeader = false;
		},
	
		destroyByEsc: function(event) {
			var that = STYLEV.VALIDATOR;
			var escKeyCode = 27;
	
			if(event.keyCode === escKeyCode) {
				that.destroy();
			}
		},
	
		markElementViaConsole: function(event) {
	
			event.preventDefault();
			event.stopPropagation();
	
			var that = STYLEV.VALIDATOR;
	
			that.moManager.disconnect();
	
			var allLines = that.consoleList.children;
			STYLEV.METHODS.each(allLines, that.offSelectedClassFromLine);
	
			//クリックした行と同じidを持つ行に選択状態を付加
			var triggers = that.consoleList.querySelectorAll('a[data-stylevconsoleid="' + event.currentTarget.dataset.stylevconsoleid + '"]');
			STYLEV.METHODS.each(triggers, function(trigger, i) {
				trigger.parentElement.classList.add('stylev-trigger-selected');
				if(i === 0) {
					STYLEV.selectedConsoleLine = trigger.parentElement;
				}
			});
	
			//全ての対象要素から選択状態を外し、クリックした要素に選択状態を付加
			STYLEV.METHODS.each(that.allElem, function(elem) {
				elem.classList.remove('stylev-target-selected');
			});
			var target = document.querySelector('[data-stylevid="' + event.target.dataset.stylevconsoleid + '"]');
			target.classList.add('stylev-target-selected');
	
			STYLEV.SMOOTH_SCROLL.execute(target);
	
			that.moManager.connect();
	
		},
	
		offSelectedClassFromLine: function(line) {
			line.classList.remove('stylev-trigger-selected');
		},
	
		bindEvents2Element: function() {
	
			var that = STYLEV.VALIDATOR;
	
			//エラーや警告が１件もなければ何もしない
			if(that.outputObjArray.length === 0) {
				return false;
			}
	
			STYLEV.METHODS.each(that.markedTargets, function(target) {
				target.addEventListener('click', that.markElementViaTargets);
			});
		},
		//TODO: Try to unite with method of markElementViaConsole
		markElementViaTargets: function(event) {
	
			event.stopPropagation();
			event.preventDefault();
	
			var that = STYLEV.VALIDATOR;
	
			//監視を中断
			that.moManager.disconnect();
	
			//コンソールの全ての行から選択状態を外し、クリックした行に選択状態を付加
			STYLEV.METHODS.each(that.consoleListItems, function(consoleTrigger) {
				consoleTrigger.classList.remove('stylev-trigger-selected');
			});
			var triggers = that.consoleList.querySelectorAll('a[data-stylevconsoleid="' + event.currentTarget.dataset.stylevid + '"]');
	
			STYLEV.METHODS.each(triggers, function(trigger, i) {
				trigger.parentElement.classList.add('stylev-trigger-selected');
	
				//選択した行として、複数ある内の最初の要素を記憶
				if(i === 0) {
					STYLEV.selectedConsoleLine = trigger.parentElement;
				}
			});
	
			//全ての対象要素から選択状態を外し、クリックした要素に選択状態を付加
			STYLEV.METHODS.each(that.allElem, function(elem) {
				elem.classList.remove('stylev-target-selected');
			});
			var target = document.querySelector('[data-stylevid="' + event.currentTarget.dataset.stylevid + '"]');
			target.classList.add('stylev-target-selected');
	
			//複数ある場合は先頭の行にランディング
			var distance = triggers[0].offsetTop;
	
			//コンソール内の対象要素の行を先頭に
			that.consoleBody.scrollTop = distance;
	
			//監視を復活
			that.moManager.connect();
	
		},
	
		//四捨五入で指定された小数点以下を切り捨てる
		controlFloat: function(targetVal, pointPos) {
			return Math.round(parseFloat(targetVal) * Math.pow(10, pointPos)) / Math.pow(10, pointPos);
		},
	
		destroy: function(event) {
			var that = STYLEV.VALIDATOR;
			var isViaCloseButton = event && event.currentTarget.className === that.consoleCloseButton.className;
	
			that.removeAllAttrAndEvents();
			that.removeConsole();
	
			if(that.moManager !== undefined) {
				that.moManager.disconnect();
			}
	
			if(STYLEV.isBookmarklet && isViaCloseButton) {
				that.removeStyleSheet();
			}
	
			that.removeGA();
	
			STYLEV.isValidated = false;
	
			if(STYLEV.isChromeExtension) {
				STYLEV.CHROME_EXTENSION.syncStatusIsValidated(false);
			}
	
			console.info('Style Validator: Style Validator has removed.');
		},
	
		toggleConsole: function(event) {
			var that = STYLEV.VALIDATOR;
			var scaleMode = STYLEV.scaleMode;
	
			if(event && event.type) {
				scaleMode === 'normal' && that.minimizeConsole();
				scaleMode === 'minimum' && that.normalizeConsole();
			} else {
				scaleMode === 'normal' && that.normalizeConsole();
				scaleMode === 'minimum' && that.minimizeConsole();
			}
		},
	
		minimizeConsole: function() {
			var that = STYLEV.VALIDATOR;
			that.consoleMinimizeButton.classList.add('is-hidden');
			that.consoleNormalizeButton.classList.remove('is-hidden');
			that.consoleWrapper.style.setProperty('height', that.consoleHeader.offsetHeight + 'px', '');
			that.consoleWrapperDynamicHeight = that.consoleWrapper.offsetHeight;
			STYLEV.scaleMode = 'minimum';
		},
	
		normalizeConsole: function() {
			var that = STYLEV.VALIDATOR;
			that.consoleMinimizeButton.classList.remove('is-hidden');
			that.consoleNormalizeButton.classList.add('is-hidden');
			that.consoleWrapper.style.setProperty('height', STYLEV.consoleWrapperDynamicHeight || that.settings.CONSOLE_WRAPPER_DEFAULT_HEIGHT + 'px', '');
			that.consoleWrapperDynamicHeight = that.consoleWrapper.offsetHeight;
			STYLEV.scaleMode = 'normal';
		},
	
		//TODO: refactor name etc...
		getStyleSheets: function(_document) {
			var that = STYLEV.VALIDATOR;
			var doc = _document || document;
			var styleSheets = doc.styleSheets;
			that.matchedMediaTextsArray = [];
	
			return new Promise(function(resolve, reject) {
				try {
					STYLEV.METHODS.each(styleSheets, that.searchByStyleSheet(doc));
					resolve();
				} catch(error) {
					that.throwError(error);
				}
			});
		},
	
		searchByStyleSheet: function(doc) {
			var that = STYLEV.VALIDATOR;
			return function(styleSheet) {
				try {
					var cssRules = styleSheet.cssRules;
	
					//TODO: remove?
					if(cssRules === null) {
						return 'continue';
					}
	
					STYLEV.METHODS.each(cssRules, that.searchByCssRule(doc));
	
				} catch(error) {
					that.throwError(error);
				}
			};
		},
	
		searchByCssRule: function(doc) {
			var that = STYLEV.VALIDATOR;
	
			return function(cssRule) {
				try {
					that.bindMediaQueryChange(cssRule);
					that.handleCssRule(cssRule, doc);
				} catch(error) {
					that.throwError(error);
				}
			}
		},
	
		allMediaTextsArray: [],
		bindMediaQueryChange: function(cssRule) {
			var that = STYLEV.VALIDATOR;
			if(cssRule.media) {
				var mediaText = cssRule.media.mediaText;
				var mediaQueryList = matchMedia(mediaText);
	
				if(that.allMediaTextsArray.indexOf(mediaText) < 0) {
					mediaQueryList.addEventListener('change', that.mediaQueryEventHandler);
					that.allMediaTextsArray.push(mediaText);
				}
	
				if(mediaQueryList.matches) {
					if(that.matchedMediaTextsArray.indexOf(mediaText) < 0) {
						that.matchedMediaTextsArray.push(mediaText);
					}
				}
			}
		},
	
		//TODO: support muliple mediaquery
		mediaQueryEventHandler: function(event) {
			var that = STYLEV.VALIDATOR;
			try {
				if(STYLEV.isValidated) {
	
					//TODO: display console header
					console.info('Style Validator: Media Query has been changed ' + (event.matches ? 'to' : 'from') + ' ' + event.media);
	
					that.getStyleSheets()
						.then(that.setExecutionTimer);
				}
			} catch(error) {
				that.throwError(error);
			}
		},
	
		handleCssRule: function(cssRule, doc) {
			var that = STYLEV.VALIDATOR;
	
			/*
			CSSRule.STYLE_RULE	1	CSSStyleRule
			CSSRule.MEDIA_RULE	4	CSSMediaRule
			CSSRule.FONT_FACE_RULE	5	CSSFontFaceRule
			CSSRule.PAGE_RULE	6	CSSPageRule
			CSSRule.IMPORT_RULE	3	CSSImportRule : IDL: nsIDOMCSSImportRule
			CSSRule.CHARSET_RULE	2	CSSCharsetRule  [Removed in most browsers]
			CSSRule.UNKNOWN_RULE	0	CSSUnknownRule
			CSSRule.KEYFRAMES_RULE	7	CSSKeyframesRule [1]
			CSSRule.KEYFRAME_RULE	8	CSSKeyframeRule [1]
			Reserved for future use	9	Should be used to define color profiles in the future
			CSSRule.NAMESPACE_RULE	10	CSSNamespaceRule
			CSSRule.COUNTER_STYLE_RULE	11	CSSCounterStyleRule
			CSSRule.SUPPORTS_RULE	12	CSSSupportsRule
			CSSRule.DOCUMENT_RULE	13	CSSDocumentRule
			CSSRule.FONT_FEATURE_VALUES_RULE	14	CSSFontFeatureValuesRule
			CSSRule.VIEWPORT_RULE	15	CSSViewportRule
			CSSRule.REGION_STYLE_RULE	16	CSSRegionStyleRule
			*/
	
			//TODO: support @support
			switch(cssRule.type) {
	
				case CSSRule.STYLE_RULE:
					break;
	
				case CSSRule.MEDIA_RULE:
					var mediaText = cssRule.media.mediaText;
					var mediaQueryList = matchMedia(mediaText);
					if(mediaQueryList.matches) {
						STYLEV.METHODS.each(cssRule.cssRules, that.searchByCssRule(doc));
					}
					return 'continue';
					break;
	
				default:
					return 'continue';
					break;
			}
	
			var selectorText = cssRule.selectorText;
			var style = cssRule.style;
	
			var styleData = {};
	
			STYLEV.METHODS.each(style, function(property) {
				var value = style.getPropertyValue(property);
				if(value) {
					styleData[property] = {};
					styleData[property].value = value;
					styleData[property].priority = style.getPropertyPriority(property);
				}
			});
	
			var specificityArray = SPECIFICITY.calculate(selectorText);
	
			STYLEV.METHODS.each(specificityArray, that.searchBySelector(styleData, doc));
		},
	
		searchBySelector: function(styleData, doc) {
			var that = STYLEV.VALIDATOR;
			return function(specificityObj) {
				try {
					var selector = specificityObj.selector;
	
					var targetsBySelector = doc.querySelectorAll(selector);
					var specificity = parseInt(specificityObj.specificity.replace(/,/g, ''), 10);
	
					STYLEV.METHODS.each(styleData, function(property) {
						styleData[property].specificity = specificity;
					});
	
					STYLEV.METHODS.each(targetsBySelector, that.searchByElementViaSelector(styleData));
	
				} catch(error) {
					that.throwError(error);
				}
			};
		},
	
		searchByElementViaSelector: function(styleData) {
			var that = STYLEV.VALIDATOR;
			return function(target) {
				try {
					var targetStyle = target.style;
					var targetProperties = Array.prototype.filter.call(Object.keys(styleData), function(element) {
						return that.specifiedTargetProperties.indexOf(element) >= 0;
					});
					STYLEV.METHODS.each(targetProperties, that.setStyleDataViaStylesheet(target, targetStyle, styleData));
				} catch(error) {
					that.throwError(error);
				}
			};
		},
	
		setStyleDataViaStylesheet: function(target, targetStyle, styleData) {
			var that = STYLEV.VALIDATOR;
			return function(property) {
				try {
	
					//Cancel If property data is none [important]
					if(styleData[property] === undefined) {
						return 'continue';
					}
					if(!targetStyle) {
						return 'continue';
					}
	
					//Via CSS Rule
					var valueOfCssRule = styleData[property].value || 'auto';//TODO: refactor
					var priorityOfCSSRule = styleData[property].priority || '';//TODO: refactor
					var specificityOfCSSRule = styleData[property].specificity || '';//TODO: refactor
	
					//Via Style Attribute
					var valueOfAttr = targetStyle.getPropertyValue(property);
					var priorityOfAttr = targetStyle.getPropertyPriority(property);
	
					//Calculate specificity
					var specificity = valueOfAttr ? 1000 : specificityOfCSSRule;
	
					//Set & initialize custom property
					target.specifiedStyle = target.specifiedStyle || {};
					target.specifiedStyle[property] = target.specifiedStyle[property] || {};
	
					target.specifiedStyle[property].priority = target.specifiedStyle[property].priority || '';
					target.specifiedStyle[property].specificity = target.specifiedStyle[property].specificity || 0;
	
					//other hand：CSS Rule: yes Style Attribute: no => (CSS Rule win)
					if(valueOfCssRule && !valueOfAttr) {
						return that.testAndSet(target, property, valueOfCssRule, priorityOfCSSRule, specificity);
					}
	
					//other hand：CSS Rule: no Style Attribute: yes => (Style Attribute win)
					if(!valueOfCssRule && valueOfAttr) {
						return that.testAndSet(target, property, valueOfAttr, priorityOfAttr, specificity);
					}
	
					//If defined css rule and attribute
					if(valueOfCssRule && valueOfAttr) {
	
						//Both：CSS Rule(important: no) and  Style Attribute(important: no) => (Style Attribute win)
						if(!priorityOfCSSRule && !priorityOfAttr) {
							return that.testAndSet(target, property, valueOfAttr, priorityOfAttr, specificity);
						}
						//Both：CSS Rule(important: yes) and  Style Attribute(important: no) => (CSS Rule win)
						if(priorityOfCSSRule && !priorityOfAttr) {
							return that.testAndSet(target, property, valueOfCssRule, priorityOfCSSRule, specificity);
						}
						//Both：CSS Rule(important: yes) and  Style Attribute(important: yes) => (Style Attribute win)
						if(priorityOfCSSRule && priorityOfAttr) {
							return that.testAndSet(target, property, valueOfAttr, priorityOfAttr, specificity);
						}
						//Both：CSS Rule(important: no) and  Style Attribute(important: yes) => (Style Attribute win)
						if(!priorityOfCSSRule && priorityOfAttr) {
							return that.testAndSet(target, property, valueOfAttr, priorityOfAttr, specificity);
						}
					}
				} catch(error) {
					that.throwError(error);
				}
			};
		},
	
		testAndSet: function(target, property, value, priority, specificity) {
	
			var isEqualWithPreviousPriority = priority.length === target.specifiedStyle[property].priority.length;
			var isWinPrevSpecificity = specificity >= target.specifiedStyle[property].specificity;
			var isWinPreviousPriority = priority.length > target.specifiedStyle[property].priority.length;
	
			if(isEqualWithPreviousPriority) {
				if(isWinPrevSpecificity) {
					target.specifiedStyle[property].value = value;
					target.specifiedStyle[property].priority = priority;
					target.specifiedStyle[property].specificity = specificity;
				}
	
			} else {
				if(isWinPreviousPriority) {
					target.specifiedStyle[property].value = value;
					target.specifiedStyle[property].priority = priority;
					target.specifiedStyle[property].specificity = specificity;
	
				}
			}
	
			return 'continue';
		},
	
		//TODO: refactor name etc...
		getStyleAttrs: function(_document) {
			var that = STYLEV.VALIDATOR;
			var doc = _document || document;
			var targets = doc.querySelectorAll('*:not(.stylev-ignore)');
	
			STYLEV.METHODS.each(targets, that.searchByElement);
		},
	
		searchByElement: function(target) {
			var that = STYLEV.VALIDATOR;
	
			var targetStyle = target.style;
			var targetProperties = Array.prototype.filter.call(targetStyle, function(element) {
				return that.specifiedTargetProperties.indexOf(element) >= 0;
			});
			that.initializeElement(target);
			STYLEV.METHODS.each(targetProperties, that.setStyleDataViaAttr(target, targetStyle));
		},
	
		//TODO: remove?
		initializeElement: function(target) {
			var that = STYLEV.VALIDATOR;
			target.specifiedStyle = null;
		},
	
		setStyleDataViaAttr: function(target, targetStyle) {
			var that = STYLEV.VALIDATOR;
			return function(property) {
				try {
					var value = targetStyle.getPropertyValue(property);
					if(value) {
						var priority = targetStyle.getPropertyPriority(property);
						target.specifiedStyle = target.specifiedStyle || {};
						target.specifiedStyle[property] = target.specifiedStyle[property] || {};
						target.specifiedStyle[property].value = value;
						target.specifiedStyle[property].priority = priority || '';
						target.specifiedStyle[property].specificity = 1000;
					}
				} catch(error) {
					that.throwError(error);
				}
			};
		},
	
		//https://developer.mozilla.org/en/docs/Web/CSS/computed_value
		//https://developer.mozilla.org/en-US/docs/Web/CSS/used_value
		specifiedTargetProperties: [
			'background-position',
			'bottom',
			'left',
			'right',
			'top',
			'height',
			'width',
			'margin-bottom',
			'margin-left',
			'margin-right',
			'margin-top',
			'min-height',
			'min-width',
			'padding-bottom',
			'padding-left',
			'padding-right',
			'padding-top',
			'text-indent',
	
			'line-height',
			'font-size',
	
			'display'
		],
	
		getSpecifiedStyle: function(target, property, pseudoElem) {
			var that = STYLEV.VALIDATOR;
	
			var specifiedProperty = target.specifiedStyle && target.specifiedStyle[property];
			var specifiedPropertyValue = specifiedProperty && specifiedProperty.value;
	
			//TODO: get dynamically Default Specified Value
			switch(property) {
				case 'width':
					return specifiedPropertyValue || 'auto';//TODO: default value? computed style?
					break;
				case 'height':
					return specifiedPropertyValue || 'auto';
					break;
				case 'min-width':
					return specifiedPropertyValue || '0px';
					break;
				case 'min-height':
					return specifiedPropertyValue || '0px';
					break;
				case 'top':
					return specifiedPropertyValue || 'auto';
					break;
				case 'right':
					return specifiedPropertyValue || 'auto';
					break;
				case 'bottom':
					return specifiedPropertyValue || 'auto';
					break;
				case 'left':
					return specifiedPropertyValue || 'auto';
					break;
				case 'margin-top':
					return specifiedPropertyValue || '0px';
					break;
				case 'margin-right':
					return specifiedPropertyValue || '0px';
					break;
				case 'margin-bottom':
					return specifiedPropertyValue || '0px';
					break;
				case 'margin-left':
					return specifiedPropertyValue || '0px';
					break;
				case 'padding-top':
					return specifiedPropertyValue || '0px';
					break;
				case 'padding-right':
					return specifiedPropertyValue || '0px';
					break;
				case 'padding-bottom':
					return specifiedPropertyValue || '0px';
					break;
				case 'padding-left':
					return specifiedPropertyValue || '0px';
					break;
				case 'background-position':
					return specifiedPropertyValue || '0% 0%';
					break;
				case 'text-indent':
					return specifiedPropertyValue || '0px';
					break;
	
				case 'line-height':
					return specifiedPropertyValue || 'normal';
					break;
				case 'font-size':
					return specifiedPropertyValue || '16px';
					break;
	
				case 'display':
					return specifiedPropertyValue || that.getComputedStyleAndCache(target, property, pseudoElem);
					break;
	
				default:
					return that.getComputedStyleAndCache(target, property, pseudoElem);
					break;
			}
		},
	
		getComputedStyleAndCache: function(target, property, pseudoElem) {
	
			if(pseudoElem) {
				target[pseudoElem] = target[pseudoElem] || {};
				target[pseudoElem].computedStyle = target[pseudoElem].computedStyle || getComputedStyle(target, pseudoElem);
				return target[pseudoElem].computedStyle.getPropertyValue(property);
			} else {
				target.computedStyle = target.computedStyle || getComputedStyle(target, null);
				return target.computedStyle.getPropertyValue(property);
			}
	
		}
	};

STYLEV.SMOOTH_SCROLL = {

	getAbsoluteTopPosition: function(target) {

		if(target.nodeName.toLowerCase() === 'html') {
			return -window.pageYOffset;
		} else {
			return target.getBoundingClientRect().top + window.pageYOffset;
		}
	},

	easeInOutCubic: function (t) { return t<.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1; },

	getTargetPosition: function(start, end, elapsed, duration) {

		var that = STYLEV.SMOOTH_SCROLL;

		if (elapsed > duration) return end;
		return start + (end - start) * that.easeInOutCubic(elapsed / duration); // <-- you can change the easing funtion there
	},

	execute: function(target, duration) {

		var that = STYLEV.SMOOTH_SCROLL;

		var duration = duration || 500;
		var scrollTopY = window.pageYOffset;
		var targetPosY = that.getAbsoluteTopPosition(target) - 100;

		var clock = Date.now();

		var requestAnimationFrame =
			window.requestAnimationFrame ||
			window.mozRequestAnimationFrame ||
			window.webkitRequestAnimationFrame ||
			function(fn){window.setTimeout(fn, 15);};

		//進度を計算し、スクロールさせる
		var step = function() {
			var elapsed = Date.now() - clock;
			window.scroll(0, that.getTargetPosition(scrollTopY, targetPosY, elapsed, duration));
			if(elapsed <= duration) {
				requestAnimationFrame(step);
			}
		};
		step();
	}
};

//TODO: remove?
//STYLEV.VALIDATOR.getAllCSSProperties();

if(STYLEV.isChromeExtension){

	STYLEV.CHROME_EXTENSION = {

		execute: function() {

			setTimeout(function() {//Fix Timing Bug
				chrome.runtime.sendMessage({name: 'execute'});
			}, 0);

		},

		syncStatusIsValidated: function(status) {

			setTimeout(function() {//Fix Timing Bug
				chrome.runtime.sendMessage({
					name: 'syncStatusIsValidated',
					isValidated: status || STYLEV.isValidated
				});
			}, 0);
		}

	};

	STYLEV.CHROME_DEVTOOLS = {

		execute: function(inspectOfConsoleAPI) {

			var that = STYLEV.CHROME_DEVTOOLS;

			if(STYLEV.VALIDATOR.outputObjArray.length === 0) {
				return;
			}
			that.inspectOfConsoleAPI = inspectOfConsoleAPI;
			that.bindEvents();
		},

		bindEvents: function() {
			var that = STYLEV.CHROME_DEVTOOLS;

			STYLEV.METHODS.each(STYLEV.VALIDATOR.consoleTriggers, function(trigger) {
				trigger.addEventListener('click', that.inspectViaConsole);
			});
			STYLEV.METHODS.each(STYLEV.VALIDATOR.markedTargets, function(target) {
				target.addEventListener('click', that.inspectViaTargets);
			});
		},

		inspectViaConsole: function(event){

			event.preventDefault();
			event.stopPropagation();

			var that = STYLEV.CHROME_DEVTOOLS;

			var trigger = event.currentTarget;
			var targetID = trigger.dataset.stylevconsoleid;
			var elem = document.querySelector('[data-stylevid="' + targetID + '"]');

			try {
				that.inspectOfConsoleAPI(elem);
			} catch(error) {
				STYLEV.VALIDATOR.send2GA(error);
				throw new Error(error);
			}

		},

		inspectViaTargets: function(event) {

			event.preventDefault();
			event.stopPropagation();

			var that = STYLEV.CHROME_DEVTOOLS;

			var target = event.target;

			try {
				that.inspectOfConsoleAPI(target);
			} catch(error) {
				STYLEV.VALIDATOR.send2GA(error);
				throw new Error(error);
			}

		}
	};

	chrome.runtime.sendMessage({
		name: 'requestVersion'
	}, function(message) {
		STYLEV.version = message.version;
	});

	STYLEV.VALIDATOR.RESOURCE_ROOT = chrome.runtime.getURL('');

	STYLEV.VALIDATOR.updateOptions().then(function() {
		if(STYLEV.options.ENABLE_AUTO_EXECUTION) {
			STYLEV.CHROME_EXTENSION.execute();
		}
	});

	chrome.storage.onChanged.addListener(function(changes, namespace) {
		if(namespace === 'sync') {
			if(changes.options) {

				//Toggle Class
				if(changes.options.newValue.enableAnimation) {
					document.documentElement.classList.add('stylev-animation');
				} else {
					document.documentElement.classList.remove('stylev-animation');
				}

				//Override TODO: confirm and implement
				//STYLEV.options = {
				//
				//	ENABLE_MUTATION_OBSERVER: changes.options.newValue.enabledMutationObserver,
				//	ENABLE_AUTO_EXECUTION: changes.options.newValue.enableAutoExecution,
				//	ENABLE_ANIMATION: changes.options.newValue.enableAnimation,
				//	SCOPE_SELECTORS: changes.options.newValue.scopeSelectors,
				//	SCOPE_SELECTORS_TEXT: changes.options.newValue.scopeSelectorsText ? changes.options.newValue.scopeSelectorsText.split(',') : '',
				//	IGNORE_SELECTORS: changes.options.newValue.ignoreSelectors,
				//	IGNORE_SELECTORS_TEXT: changes.options.newValue.ignoreSelectorsText ? changes.options.newValue.ignoreSelectorsText.split(',') : '',
				//	URL_FILTERS: changes.options.newValue.urlFilters
				//};
			}
		}
	});
}

if(STYLEV.isPassedURLFilters && STYLEV.isAutoMode) {

	if(STYLEV.isBookmarklet) {

		if(STYLEV.isLoaded) {

			console.groupEnd();
			console.group('Style Validator: Executed by Bookmarklet.');
			STYLEV.VALIDATOR.execute();

		} else if(STYLEV.isReloaded) {

			console.groupEnd();
			console.group('Style Validator: Executed by Bookmarklet (Replay)');
			STYLEV.VALIDATOR.execute();
		}
	}
}