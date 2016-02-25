/*!
 Style Validator

 Description": Style Validator is CSS Validator that can detect `Risky Style` that might break layout after JavaScript or CSS Media Queries.
 URL: http://style-validator.github.io/
 Author: Igari Takeharu
 License: MIT License
 */

'use strict';

var STYLEV = STYLEV || {};

STYLEV.isInChromeExtensionPage = location.protocol === 'chrome-extension:';

STYLEV.RULES = {

	execute: function() {
		var that = STYLEV.RULES;

		that.setParameters();
		that.bindEvents();
		that.restoreSettings();

		if(STYLEV.isInChromeExtensionPage) {
			that.getDataViaAJAX().then(that.initializePresetsSelect);
		} else {
			document.documentElement.classList.add('is-not-extension');
			that.getDataViaAJAX().then(that.renderRuleArea);
		}
		
//		that.getAllCSSProperties();//TODO: implement completion
//		that.deleteSaveButtonWhenNotLocal()
	},
	
	setParameters: function() {
		var that = STYLEV.RULES;

		that.each = STYLEV.METHODS.each;
		that.wrapper = document.querySelector('.wrapper');
		that.main = document.querySelector('.main');
		that.aside = document.querySelector('.aside');
		that.mainHeader = document.querySelector('.main-header');
		that.resetButton = document.querySelector('#reset-button');
		that.addRuleButton = document.querySelector('#add-rule-button');
		that.saveButton = document.querySelector('#save-button');
		that.exportButton = document.querySelector('#export-button');
		that.importButton = document.querySelector('#import-button');
		that.datalistOfProperties = document.querySelector('#all-css-properties');
		that.datalistOfTags = document.querySelector('#all-html-tags');
		that.ruleList = document.querySelector('#rule-list');
		that.templateStyleBase = document.querySelector('#template-style-base').content;
		that.templateStyleNg = document.querySelector('#template-style-ng').content;
		that.templateRule = document.querySelector('#template-rule').content;
		that.reasonCheckbox = document.querySelector('#reason-checkbox');
		that.referenceURLCheckbox = document.querySelector('#reference-url-checkbox');
		that.searchRuleInput = document.querySelector('#search-rule-input');
		that.searchedRuleCount = document.querySelector('#searched-rule-count');
		that.totalRuleCount = document.querySelector('#total-rule-count');
		that.displayModeLList = document.querySelector('#display-mode-list');
		that.displayListMode = document.querySelector('#display-list-mode');
		that.displayColumnMode = document.querySelector('#display-column-mode');
		that.detailElements = document.querySelectorAll('detail');
		that.presetsSelect = document.querySelector('.presets-select');
		that.resetAllPresetsButton = document.querySelector('#reset-all-presets-button');
		that.deletePresetsButton = document.querySelector('#delete-presets-button');
		that.mainContentHeading = document.querySelector('.main-content-heading');
		that.mainHeaderOffsetHeight = that.mainHeader.offsetHeight;
		that.showAsideButton = document.querySelector('#show-aside-button');

		that.defaultPresetsSelectInnerHTML = that.presetsSelect.innerHTML;

		that.windowInnerHeight = window.innerHeight;
		that.originalJSON = null;
		that.generatedJSON = null;
		that.fixPositionHandlers = [];

		that.allCSSProperties = [];

		that.escKeyCode = 27;
		that.enterKeyCode = 13;

	},

	//TODO: needs to refactoring. would like to avoid get all again
	setParametersAfterShow: function() {
		var that = STYLEV.RULES;

		that.ruleListItems = that.ruleList.children;
		that.elementType = that.ruleList.querySelectorAll('.element-type');
		that.styleLists = that.ruleList.querySelectorAll('.style-list');
		that.textInputs = that.ruleList.querySelectorAll('.rule-title');

		that.reasons = that.ruleList.querySelectorAll('[data-id="reason"]');
		that.cssProperties = that.ruleList.querySelectorAll('[data-id="property"]');

		that.riskLevelSelects = that.ruleList.querySelectorAll('[data-id="riskLevel"]');
		that.fixInScrollingTargets = that.ruleList.querySelectorAll('.fix-in-scrolling');

	},

	bindEvents: function() {
		var that = STYLEV.RULES;

		that.showAsideButton.addEventListener('click', that.toggleAsideMenu);
	},

	bindEventsAfterShow: function() {
		var that = STYLEV.RULES;

		that.resetButton.addEventListener('click', that.resetRule);
		that.addRuleButton.addEventListener('click', that.addRule);
		that.saveButton.addEventListener('click', that.saveJSON);
		that.exportButton.addEventListener('mousedown', that.exportJSON);
		that.importButton.addEventListener('change', that.importJSON);
		that.reasonCheckbox.addEventListener('change', that.toggleReason);
		that.referenceURLCheckbox.addEventListener('change', that.toggleReferenceURL);
		that.searchRuleInput.addEventListener('input', that.searchRules);
		that.presetsSelect.addEventListener('change', that.selectPresets);
		that.deletePresetsButton.addEventListener('click', that.deletePresets);
		that.resetAllPresetsButton.addEventListener('click', that.resetAllPresets);
		that.each(that.detailElements, function(detailElement) {
			detailElement.addEventListener('click', that.positionBasedOnScroll);
		});

		document.documentElement.addEventListener('keydown', that.saveJSONByShortcutKey);

		document.addEventListener("visibilitychange", function(event) {
			that.getHashFromConsole()
				.then(that.adjustScrollByHash.bind(null, event));
		});

		window.addEventListener('resize', that.adjustPadding);
		window.addEventListener('resize', that.positionBasedOnScroll);
		window.addEventListener('resize', that.getEachHeight);
		window.addEventListener('hashchange', that.adjustScrollByHash);
		window.addEventListener('popstate', function(event) {
			//TODO: implement pjax
		});
	},

	/******************************************************************************************************************
	 * Main Methods
	 *******************************************************************************************************************/

	toggleAsideMenu: function(event) {
		event.preventDefault();
		var that = STYLEV.RULES;
		document.documentElement.classList.toggle('show-aside');
	},

	getDataViaAJAX: function() {
		var that = STYLEV.RULES;

		return new Promise(function(resolve, reject) {

			Promise.all([
				that.getURL('./data/rules.json').then(JSON.parse),
				that.getURL('./data/special-kw-vals.json').then(JSON.parse)
			]).then(function(dataArray) {

				that.ruleJSONViaAJAX = dataArray[0];
				that.specialKwVals = dataArray[1];

				resolve();
			});
		});
	},

	initializePresetsSelect: function() {
		var that = STYLEV.RULES;

		chrome.storage.local.get('savedPresetsArray', function(message) {

			var savedPresetsArray = message['savedPresetsArray'];

			if(savedPresetsArray) {
				var sevedPresetsArrayLength = savedPresetsArray.length;
				var isExistPresets = sevedPresetsArrayLength > 1;

				if(isExistPresets) {
					var documentFragment = document.createDocumentFragment();
					that.presetsSelect.innerHTML = '';
					that.each(savedPresetsArray, function(savedPresets) {
						var option = new Option(savedPresets.text, savedPresets.value);
						documentFragment.appendChild(option);
					});
					that.presetsSelect.appendChild(documentFragment);
				}

			} else {

				that.presetsSelect.innerHTML = that.defaultPresetsSelectInnerHTML;
			}

			chrome.storage.local.get('selectedPresetsName', function(message) {
				var selectedPresetsName = message['selectedPresetsName'];
				if(selectedPresetsName) {
					that.togglePresets(selectedPresetsName);
					that.presetsSelect.value = selectedPresetsName;
				} else {
					that.togglePresets(that.defaultPresetsName);
				}
			});
		});
	},


	togglePresets: function(presetsName) {
		var that = STYLEV.RULES;

		that.initializeRulesArea();

		that.mainContentHeading.textContent = presetsName;

		if(presetsName === that.defaultPresetsName) {
			that.deletePresetsButton.classList.add('is-hidden');
		} else {
			that.deletePresetsButton.classList.remove('is-hidden');
		}

		chrome.storage.local.get(presetsName, function(message) {
			var ruleJSONViaChromeStorage = message[presetsName];

			if(ruleJSONViaChromeStorage) {
				that.renderRuleArea(ruleJSONViaChromeStorage);
			} else {
				that.renderRuleArea();
				//throw new Error('The rule data is not exist!')
			}
		});
	},

	initializeRulesArea: function() {
		var that = STYLEV.RULES;

		//TODO: replace image
		that.ruleList.innerHTML = 'Loading...';
	},

	//TODO: refactor funciton name and position
	renderRuleArea: function(ruleJSONViaChromeStorage) {
		var that = STYLEV.RULES;

		that.resetAllModifiedClass();//TODO: here?

		that.json2html(ruleJSONViaChromeStorage).then(function() {

			that.deleteLoadingSpinner();
			that.setParametersAfterShow();
			that.bindEventsAfterShow();
			that.toggleReason();
			that.toggleReferenceURL();
			if(location.hash) {
				that.searchRules(null, 'reset');
			} else {
				that.searchRules();
			}

			that.getEachHeight();
			that.adjustPadding()
				.then(that.getHashFromConsole)
				.then(that.adjustScrollByHash)
				.then(that.positionBasedOnScroll)
				.then(that.adjustScrollByHash);
		});
	},

	getHashFromConsole: function() {
		var that = STYLEV.RULES;
		return new Promise(function(resolve, reject) {
			if(STYLEV.isInChromeExtensionPage) {
				var port = chrome.runtime.connect({
					name: "optionsPage"
				});
				that.setHashFromConsoleHandler = that.setHashFromConsole(port, resolve);
				port.onMessage.addListener(that.setHashFromConsoleHandler);
			} else {
				resolve();
			}
		});
	},

	setHashFromConsole: function(port, resolve) {
		var that = STYLEV.RULES;
		return function(message) {

			if(message.name === 'sendRuleId') {
				that.ruleId = message.ruleId;
			}
			port.onMessage.removeListener(that.setHashFromConsoleHandler);
			resolve();
		};
	},

	json2html: function(ruleJSONViaChromeStorage) {
		var that = STYLEV.RULES;

		return new Promise(function(resolve, reject) {

			if(ruleJSONViaChromeStorage) {

				that.renderHTML(ruleJSONViaChromeStorage, resolve);

			} else {

				if(STYLEV.isInChromeExtensionPage) {
					var obj4ChromeStorage = {};
					obj4ChromeStorage[that.defaultPresetsName] = that.ruleJSONViaAJAX;
					chrome.storage.local.set(obj4ChromeStorage);
				}

				that.renderHTML(that.ruleJSONViaAJAX, resolve);
			}
		});
	},

	renderHTML: function(ruleJSON, resolve) {
		var that = STYLEV.RULES;
		var documentFragment = document.createDocumentFragment();

		that.originalJSON = ruleJSON;

		that.each(that.originalJSON, that.applyRuleData2HTML(documentFragment));

		//TODO: refactor and replace to loading image
		that.ruleList.innerHTML = '';
		that.ruleList.appendChild(documentFragment);
		localStorage.setItem('lastRuleID', that.maxRuleID);//TODO: confirm chrome storage?

		if(typeof resolve === 'function') {
			resolve();
		}
	},

	defaultPresetsName: 'Default',
	defaultPresetsName4Duplication: 'Copy of Default',
	selectPresets: function(event) {
		var that = STYLEV.RULES;
		var target = event.target;

		if(target.value === 'Add') {
			that.addNewPresets();
		} else {
			that.togglePresets(target.value);
		}

		//Save Current Presets Name for Reloading Page
		chrome.storage.local.set({selectedPresetsName: target.value});
	},

	deletePresets: function(event) {
		var that = STYLEV.RULES;

		event.preventDefault();

		if(confirm('Are you sure you want to delete this presets? (It can not restore)')) {

			var currentPresetsName = that.presetsSelect.value;
			if(currentPresetsName === that.defaultPresetsName) {
				return;
			}

			//Delete target option
			that.deletePresetsOption(currentPresetsName);

			//Update saved presets array
			that.updateSavedPresetsArray();

			//Delete presets data
			chrome.storage.local.remove(currentPresetsName);

			that.togglePresets(that.defaultPresetsName);

			chrome.storage.local.set({selectedPresetsName: that.defaultPresetsName});

		}
	},

	deletePresetsOption: function(presetsName) {
		var that = STYLEV.RULES;
		var targetOption = that.presetsSelect.querySelector('[value="' + presetsName + '"]');
		targetOption.parentElement.removeChild(targetOption);
	},

	resetAllPresets: function(event) {
		var that = STYLEV.RULES;
		event.preventDefault();


		//TODO: けせてないので、消す
		if(confirm('Are you sure you want to initialize all presets? (It can not restore)')) {

			chrome.storage.local.get('savedPresetsArray', function(message) {
				var savedPresetsArray = message['savedPresetsArray'];
				if(savedPresetsArray) {
					that.each(savedPresetsArray, function(savedPresets) {
						chrome.storage.local.remove(savedPresets.value);
					});
				}
				//TODO: refactor
				chrome.storage.local.remove('Default');
				chrome.storage.local.remove('savedPresetsArray');
				chrome.storage.local.remove('selectedPresetsName');
				that.initializePresetsSelect();
			})

		}
	},

	addNewPresets: function(importedJSON) {
		var that = STYLEV.RULES;

		//Get the option element
		var option2Add = that.presetsSelect.querySelector('option[value="Add"]');

		//Count of default presets name
		var defaultPresetsNameCount = 0;
		that.each(that.presetsSelect.children, function(option) {
			if(option.value.indexOf(that.defaultPresetsName4Duplication) > -1) {
				defaultPresetsNameCount++;
			}
		});

		//Show Prompt
		var defaultPromptMessage = that.defaultPresetsName4Duplication + ' ' + (defaultPresetsNameCount ? defaultPresetsNameCount : '');
		var newPresetsName = prompt("Please enter your presets of rules", defaultPromptMessage);

		//Validation
		var isValidName = true;
		that.each(that.presetsSelect.children, function(option) {
			if(option.value === newPresetsName) {
				isValidName = false;
				return 'break';
			}
		});

		//If new presets name is exist and valid
		if (newPresetsName && isValidName) {

			//Set Heading Text
			that.mainContentHeading.textContent = newPresetsName;

			//Create New Option
			var newOption = new Option(newPresetsName, newPresetsName, false, true);
			that.presetsSelect.insertBefore(newOption, option2Add);

			//Show Delete Anchor
			that.deletePresetsButton.classList.remove('is-hidden');

			if(importedJSON) {

				var obj4ChromeStorage = {};
				obj4ChromeStorage[newPresetsName] = importedJSON;
				chrome.storage.local.set(obj4ChromeStorage, function() {
					that.togglePresets(newPresetsName);
				});
				that.updateSavedPresetsArray();

			} else {

				//TODO: defaultからのコピーにするか?
				that.getURL('./data/rules.json').then(JSON.parse).then(function(data) {
					var obj4ChromeStorage = {};
					obj4ChromeStorage[newPresetsName] = data;
					chrome.storage.local.set(obj4ChromeStorage, function() {
						that.togglePresets(newPresetsName);
					});
					that.updateSavedPresetsArray();
				});
			}



		} else {

			alert('Invalid name! Please retry to set another name.');

			//Revert
			that.presetsSelect.value = that.mainContentHeading.textContent;
		}
	},

	updateSavedPresetsArray: function() {
		var that = STYLEV.RULES;
		var savedPresetsArray = [];
		that.each(that.presetsSelect.children, function(option) {
			var savedPresets = {};
			savedPresets.text = option.textContent;
			savedPresets.value = option.value;
			savedPresetsArray.push(savedPresets);
		});
		chrome.storage.local.set({savedPresetsArray: savedPresetsArray});
	},

	//TODO: possible to unite addRule?
	applyRuleData2HTML: function(documentFragment) {
		var that = STYLEV.RULES;
		that.maxRuleID = 0;

		return function(rule) {

			var template = document.importNode(that.templateRule, true);
			var ruleListItem = template.firstElementChild;
			var hashLink = template.querySelector('.rule-box-hash-link');
			var title = template.querySelector('[data-id="title"]');
			var replacedElem = template.querySelector('[data-id="replacedElem"]');
			var emptyElem = template.querySelector('[data-id="emptyElem"]');
			var baseStyleList = template.querySelector('[data-id="baseStyles"]');
			var ngStyleList = template.querySelector('[data-id="ngStyles"]');
			var isEnabled = template.querySelector('[data-id="isEnabled"]');

			//Max ID
			if(rule.ruleID > that.maxRuleID) {
				that.maxRuleID = rule.ruleID;
			}

			//Rule ID
			ruleListItem.dataset.ruleid = rule.ruleID;
			ruleListItem.id = 'rule-' + rule.ruleID;

			//Hash Link
			hashLink.href = '#rule-' + rule.ruleID;

			//Title
			that.setValue(title, rule.title);
			that.setDefaultValue(title, rule.title);

			//Replaced Element
			that.setValue(replacedElem, rule.replacedElem);
			that.setDefaultValue(replacedElem, rule.replacedElem);

			//Empty Element
			that.setValue(emptyElem, rule.emptyElem);
			that.setDefaultValue(emptyElem, rule.emptyElem);

			//Style Data
			that.each(rule.baseStyles, that.applyStylesData2HTML(baseStyleList));
			that.each(rule.ngStyles, that.applyStylesData2HTML(ngStyleList));

			//Title
			that.setValue(isEnabled, rule.isEnabled);
			that.setDefaultValue(isEnabled, rule.isEnabled);

			//Bind Events
			that.bindEvents2RuleListItem(ruleListItem);

			//Toggle Style
			that.toggleStylePart(ruleListItem);

			//Append
			documentFragment.appendChild(template);
		};
	},

	applyStylesData2HTML: function(styleList) {
		var that = STYLEV.RULES;
		return function(styleObj) {
			var styleListItem = that.addStyle(styleList, styleObj);
			that.modifyCSSProperty(null, styleListItem);
			that.modifyCSSValue(null, styleListItem);
			that.applyValidationResult(null, styleListItem);
		};
	},

	restoreSettings: function() {
		var that = STYLEV.RULES;
		that.reasonCheckboxData = localStorage.getItem(that.reasonCheckbox.id);
		that.reasonCheckbox.checked = that.reasonCheckboxData ? that.reasonCheckboxData === 'true' : that.reasonCheckbox.checked;
		that.referenceURLCheckboxData = localStorage.getItem(that.referenceURLCheckbox.id);
		that.referenceURLCheckbox.checked = that.referenceURLCheckboxData ? that.referenceURLCheckboxData === 'true' : that.referenceURLCheckbox.checked;
	},
	
	/******************************************************************************************************************
	 * General Methods
	 *******************************************************************************************************************/

	getURL: function(url) {

		return new Promise(function (resolve, reject) {

			var xhr = new XMLHttpRequest();
			xhr.open('GET', url, true);
			xhr.onload = function () {
				if (xhr.status === 200) {
					resolve(xhr.responseText);
				} else {
					reject(new Error(xhr.statusText));
				}
			};
			xhr.onerror = function () {
				reject(new Error(xhr.statusText));
			};
			xhr.send();
		});
	},

	//TODO: fix better way
	camel2Hyphen: function(string) {
		// for Unicode transforms, replace [A-Z] with \p{Lu} if available
		return string
			.replace(/^[A-Z]/g, function(letter) {
				return letter.toLowerStyle();
			})
			.replace(/[A-Z]/g, function(letter) {
				return '-'+letter.toLowerStyle();
			});
	},

	selectAllTextOnFocus: function(event) {
		event.target.select();
		//TODO: Not working when Tab key
	},

	isCheckboxOrRadio: function(target) {
		return target.type && /^(checkbox|radio)/.test(target.type);
	},

	getValue: function(target) {
		var that = STYLEV.RULES;
		return that.isCheckboxOrRadio(target) ? target.checked : target.value;
	},

	getDefaultValue: function(target) {
		var that = STYLEV.RULES;
		return that.isCheckboxOrRadio(target) ? target.dataset.defaultChecked === 'true' : target.dataset.defaultValue;
	},

	setValue: function(target, value) {
		var that = STYLEV.RULES;

		if(that.isCheckboxOrRadio(target)) {
			target.checked = value;
		} else {
			target.value = value;
		}
	},

	setDefaultValue: function(target, value) {
		var that = STYLEV.RULES;
		if(that.isCheckboxOrRadio(target)) {
			target.dataset.defaultChecked= value;
		} else {
			target.dataset.defaultValue = value;
		}
	},

	/******************************************************************************************************************
	 * JSON Handler
	 *******************************************************************************************************************/

	detectModifying: function(event) {
		var that = STYLEV.RULES;
		that.generateJSON();
		that.compareValue(event);
		that.compareJSON();
	},

	generateJSON: function() {
		var that = STYLEV.RULES;
		var jsonArray = [];

		//TODO: Need to receive `lastRuleID` from database on server
		var localLastRuleID = localStorage.getItem('lastRuleID');
		that.lastRuleID = (localLastRuleID && +localLastRuleID) || 0;

		that.ruleListItems = that.ruleList.children;

		that.each(that.ruleListItems, function(ruleListItem, i) {

			var ruleObj = {};

			var ruleID = ruleListItem.dataset.ruleid;
			if(ruleID === undefined) {
				that.lastRuleID = (that.lastRuleID+1)|0;
				ruleObj.ruleID = that.lastRuleID;
				ruleListItem.dataset.ruleid = ruleObj.ruleID;
			} else {
				that.lastRuleID = (that.lastRuleID < +ruleID) ? +ruleID : that.lastRuleID;
				ruleObj.ruleID = +ruleID;
			}

			ruleObj.title = that.getValue(ruleListItem.querySelector('[data-id="title"]'));
			ruleObj.replacedElem = that.getValue(ruleListItem.querySelector('[data-id="replacedElem"]'));
			ruleObj.emptyElem = that.getValue(ruleListItem.querySelector('[data-id="emptyElem"]'));
			ruleObj.isEnabled = that.getValue(ruleListItem.querySelector('[data-id="isEnabled"]'));

			var styleLists = ruleListItem.querySelectorAll('.style-list');

			that.each(styleLists, function(styleList) {

				var xStyles = styleList.dataset.id;
				var styleListItems = styleList.querySelectorAll('.style-list-item');

				ruleObj[xStyles] = [];

				that.each(styleListItems, function(styleListItem) {

					var styleObj = {};
					var targets = styleListItem.querySelectorAll('[data-id]');

					that.each(targets, function(target) {
						var key = target.dataset.id;
						styleObj[key] = that.getValue(target);
					});

					ruleObj[xStyles].push(styleObj);
				});
			});

			jsonArray.push(ruleObj);
		});

		//TODO: Need to send `lastRuleID` to server
		//do ajax

		localStorage.setItem('lastRuleID', that.lastRuleID);

		//TODO: remove
		//that.generatedJSON = jsonArray;
		that.generatedJSON = jsonArray.sort(function(a, b) {
			return a.ruleID - b.ruleID;
		});
	},

	compareValue: function(event, _target) {
		var that = STYLEV.RULES;
		if(!event && !_target) {
			return;
		}
		var target = _target || event.target;
		var defaultValue = that.getDefaultValue(target);
		var currentValue = that.getValue(target);
		var isModifiedValue = defaultValue !== currentValue;

		if(isModifiedValue) {
			target.classList.add('is-modified');
		} else {
			target.classList.remove('is-modified');
		}
	},
	
	compareJSON: function() {
		var that = STYLEV.RULES;

		//var generatedJSONString = JSON.stringify(that.generatedJSON);
		//var originalJSONString = JSON.stringify(that.originalJSON);
		//
		//that.isJSONModified = generatedJSONString !== originalJSONString;

		if( that.ruleList.querySelector('.is-modified' ) ||
			that.generatedJSON.length !== that.originalJSON.length ) {

			that.isJSONModified = true;

		} else {

			that.isJSONModified = false;

		}

		if(that.isJSONModified) {
			that.saveButton.classList.add('is-modified');
			//that.exportButton.classList.add('is-modified');

		} else {
			that.saveButton.classList.remove('is-modified');
			//that.exportButton.classList.remove('is-modified');
		}
	},

	exportJSON: function(event) {

		event.preventDefault();
		var that = STYLEV.RULES;

		if(that.isJSONModified) {
			var json = that.generatedJSON;
			this.href = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(json));
			alert('Download and replace file which named rules.json without rename the file');

			that.callbackOnSave();
		}
	},

	importJSON: function(event) {
		var that = STYLEV.RULES;

		var data = null;
		var file = event.target.files[0];
		var reader = new FileReader();
		reader.readAsText(file);
		reader.onload = function(event) {
			var textData = event.target.result;
			data = JSON.parse(textData);
			that.addNewPresets(data);
		};
		reader.onerror = function() {
			alert('Unable to read ' + file.fileName);
		};

	},

	saveJSON: function() {
		var that = STYLEV.RULES;

		if(that.isJSONModified) {

			if(STYLEV.isInChromeExtensionPage) {

				var obj4ChromeStorage = {};
				obj4ChromeStorage[that.presetsSelect.value] = that.generatedJSON;
				chrome.storage.local.set(obj4ChromeStorage, function() {
					that.callbackOnSave();
					alert('Saving rules was successful! Let\'s try your new rule setting of rules.');
				});

			} else {

				var xhr = new XMLHttpRequest();
				var apiURI = 'http://localhost:8001/saveJSON'; //Local
				var method = 'POST';
				var data4send = JSON.stringify(that.generatedJSON, null, '\t');

				xhr.open(method, apiURI, true);
				xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
				xhr.addEventListener('load', function () {
					if (xhr.status === 200) {

						that.callbackOnSave();
						that.showSuccessMsg();
					} else {
						that.showErrorMsg();
					}

				});
				xhr.addEventListener('error', that.showErrorMsg);

				if (xhr.readyState == 4) {
					return;
				}

				xhr.send(data4send);
			}

		}

	},

	showSuccessMsg: function() {
		alert('Saving rules was successful! Let\'s send Pull Request!');
	},

	showErrorMsg: function() {
		alert('Sorry. Could not connect to api server. Connect to api server, or click export button.');
	},

	callbackOnSave: function() {
		var that = STYLEV.RULES;

		//Reset
		that.resetSaveButton();
		that.resetDefaultValue();
		that.leaveEditMode();

		//Save current json data
		that.originalJSON = that.generatedJSON;
	},

	saveJSONByShortcutKey: function(event) {
		var that = STYLEV.RULES;
		var isPressedCommandOrCtrlKey = (event.ctrlKey && !event.metaKey) || (!event.ctrlKey && event.metaKey);

		if (isPressedCommandOrCtrlKey && event.keyCode == 83) {//s
			event.preventDefault();
			event.target.blur();
			that.saveJSON();
		}
	},

	deleteSaveButtonWhenNotLocal: function() {
		var that = STYLEV.RULES;
		if(location.hostname !== 'localhost') {
			that.saveButton.hidden = true;
		}
	},

	//Callback of save action
	resetDefaultValue: function() {
		var that = STYLEV.RULES;
		var formParts = that.ruleList.querySelectorAll('input[data-id], select[data-id], textarea[data-id]');

		that.each(formParts, function(formPart) {
			var currentValue = that.getValue(formPart);
			formPart.classList.remove('is-modified');
			that.setDefaultValue(formPart, currentValue)
		});
	},

	resetAllModifiedClass: function() {
		var that = STYLEV.RULES;
		var targets = document.querySelectorAll('.is-modified');
		that.isJSONModified = false;
		that.each(targets, function(target) {
			target.classList.remove('is-modified');
		});
	},

	resetFilterRules: function(ruleListItem) {
		ruleListItem.classList.remove('is-hidden');
	},

	resetSaveButton: function() {
		var that = STYLEV.RULES;

		that.saveButton.classList.remove('is-modified');
		that.exportButton.classList.remove('is-modified');
	},

	/******************************************************************************************************************
	 * Filter Rule Box
	 *******************************************************************************************************************/
	searchRules: function(event, mode) {

		var that = STYLEV.RULES;
		var ruleListItems = that.ruleListItems;
		var ruleListItemsLen = ruleListItems.length;
		that.ruleCount = 0;

		//Set initial value
		if(!event) {
			that.searchRuleInput.value = localStorage.getItem(that.searchRuleInput.id);
		}
		if(mode === 'reset') {
			that.searchRuleInput.value = '';
		}

		var inputValue = that.searchRuleInput.value;
		var regexInputValue = new RegExp('^' + inputValue, 'i');

		//Set total count
		that.totalRuleCount.textContent = ruleListItemsLen + '';

		//Search by value
		if(inputValue) {

			that.each(ruleListItems, that.filterRules(regexInputValue));
			that.searchedRuleCount.textContent = that.ruleCount + '';

		} else {

			that.each(ruleListItems, that.resetFilterRules);
			that.searchedRuleCount.textContent = ruleListItemsLen + '';
		}

		localStorage.setItem(that.searchRuleInput.id, inputValue);

		if(event) {
			that.positionBasedOnScroll();
		}
	},

	isHit: false,
	filterRules: function(regexInputValue) {
		var that = STYLEV.RULES;

		return function(ruleListItem) {

			var searchTargets = ruleListItem.querySelectorAll('.title');
			
			that.isHit = false;

			that.each(searchTargets, that.testInputText(regexInputValue));
			
			if(that.isHit) {
				that.ruleCount = (that.ruleCount+1)|0;
				ruleListItem.classList.remove('is-hidden');
			} else {
				ruleListItem.classList.add('is-hidden');
			}
		};
	},

	testInputText: function(regexInputValue) {
		var that = STYLEV.RULES;
		return function(searchTarget) {
			if(regexInputValue.test(searchTarget.value)) {
				that.isHit = true;
				return 'break';
			}
		};
	},

	/******************************************************************************************************************
	 * Toggle
	 *******************************************************************************************************************/

	toggleReason: function(event) {
		var that = STYLEV.RULES;
		if(!that.reasonCheckbox.checked) {
			that.ruleList.classList.add('hide-reason');
		} else {
			that.ruleList.classList.remove('hide-reason');
		}
		localStorage.setItem(that.reasonCheckbox.id, that.reasonCheckbox.checked);
	},

	toggleReferenceURL: function(event) {
		var that = STYLEV.RULES;

		if(!that.referenceURLCheckbox.checked) {
			that.ruleList.classList.add('hide-reference-url');
		} else {
			that.ruleList.classList.remove('hide-reference-url');
		}
		localStorage.setItem(that.referenceURLCheckbox.id, that.referenceURLCheckbox.checked);
	},

	toggleEditMode: function(event) {
		var that = STYLEV.RULES;
		event.preventDefault();

		var target = event.target || event.target;
		var ruleListItem = target.closest('li[data-ruleid]');
		var isEditMode = ruleListItem.classList.contains('edit-mode');

		function save() {
			that.toggleStylePart(ruleListItem); //TODO: remove?
			ruleListItem.classList.remove('edit-mode');
			event.target.textContent = 'Edit';

		}

		function show() {
			var styleLists = ruleListItem.querySelectorAll('.style-list');
			ruleListItem.classList.add('edit-mode');
			event.target.textContent = 'Set';
			that.each(styleLists, function(styleList) {
				styleList.classList.remove('is-hidden');
			});
		}

		if(isEditMode) {
			save();
		} else {
			show();
		}
	},

	leaveEditMode: function() {
		var that = STYLEV.RULES;

		var ruleListItems = that.ruleList.querySelectorAll('.edit-mode');

		that.each(ruleListItems, function(ruleListItem) {
			ruleListItem.classList.remove('edit-mode');
			that.toggleStylePart(ruleListItem);
		});
	},

	toggleStylePart: function(ruleListItem) {
		var that = STYLEV.RULES;

		var formPartsStyleListItems = ruleListItem.querySelectorAll('.style-list-body > ul > li');
		that.each(formPartsStyleListItems, function(formPartsStyleListItem) {

			var formParts = formPartsStyleListItem.querySelectorAll('[data-id]');
			var hasData = false;

			that.each(formParts, function(formPart) {
				if(that.getValue(formPart)) {
					hasData = true;
					return 'break';
				}
			});

			if(hasData) {
				formPartsStyleListItem.classList.remove('is-hidden');
			} else {
				formPartsStyleListItem.classList.add('is-hidden');
			}
		});

		var elementType = ruleListItem.querySelector('.element-type');
		var elementTypeListItems = elementType.querySelectorAll('.element-type-list > li');
		var hasNoDataAll = true;

		that.each(elementTypeListItems, function(elementTypeListItem) {
			var elementTypeFormPart = elementTypeListItem.querySelector('[data-id]');
			var hasData = false;

			if(that.getValue(elementTypeFormPart)) {
				hasData = true;
				hasNoDataAll = false;
			}

			if(hasData) {
				elementTypeListItem.classList.remove('is-hidden');
			} else {
				elementTypeListItem.classList.add('is-hidden');
			}
		});

		if(!hasNoDataAll) {
			elementType.classList.remove('is-hidden');
		} else {
			elementType.classList.add('is-hidden');
		}
	},

	toggleRiskLevel: function(event) {
		var that = STYLEV.RULES;
		var riskLevelSelect = event.target;
		var parentStyleListItem = riskLevelSelect.closest('.style-list-item');
		var options = riskLevelSelect.querySelectorAll('option');
		that.each(options, function(option) {
			parentStyleListItem.classList.remove(option.value);
		});
		parentStyleListItem.classList.add(event.target.value);
	},
	
	/******************************************************************************************************************
	* Rules Box
	*******************************************************************************************************************/

	resetRule: function() {
		var that = STYLEV.RULES;

		that.togglePresets(that.presetsSelect.value);
	},

	//TODO: unite applyRuleData2HTML?
	addRule: function(event) {
		var that = STYLEV.RULES;
		var template = document.importNode(that.templateRule, true);
		var ruleListItem = template.firstElementChild;
		var title = template.querySelector('[data-id="title"]');
		var replacedElem = template.querySelector('[data-id="replacedElem"]');
		var emptyElem = template.querySelector('[data-id="emptyElem"]');
		var isEnabled = template.querySelector('[data-id="isEnabled"]');
		var incrementedID = ruleListItem.dataset.ruleid = parseInt(localStorage.getItem('lastRuleID'), 10) + 1;

		//Rule ID
		ruleListItem.dataset.ruleid = incrementedID;
		ruleListItem.id = 'rule-' + incrementedID;

		//Title
		that.setDefaultValue(title, '');

		//Replaced Element
		that.setDefaultValue(replacedElem, '');

		//Empty Element
		that.setDefaultValue(emptyElem, '');

		//Bind Events
		that.bindEvents2RuleListItem(ruleListItem);

		that.ruleList.insertBefore(template, that.ruleList.firstElementChild);
		var appendedRuleListItem = that.ruleList.firstElementChild;
		appendedRuleListItem.classList.add('edit-mode');
		appendedRuleListItem.querySelector('input').focus();

		that.setParametersAfterShow();
		that.searchRules(event, 'reset');
		that.positionBasedOnScroll();
		that.detectModifying();
	},

	deleteRule: function(event) {
		var that = STYLEV.RULES;
		event.preventDefault();

		var ruleListItem = event.target.closest('.rule-list-item');

		if(confirm('Are you sure you want to delete this rule?')) {
			ruleListItem.parentElement.removeChild(ruleListItem);
			that.detectModifying();
		}
	},


	/******************************************************************************************************************
	 * Event Binding Method
	 *******************************************************************************************************************/

	bindDetectModifyingEvent: function(target) {
		var that = STYLEV.RULES;
		target.addEventListener('input', that.detectModifying);
		target.addEventListener('change', that.detectModifying);
		target.addEventListener('blur', that.detectModifying);
	},

	bindEvents2RuleListItem: function(ruleListItem) {
		var that = STYLEV.RULES;

		var title = ruleListItem.querySelector('[data-id="title"]');
		var editRuleButton = ruleListItem.querySelector('.rule-box-edit-button');
		var deleteRuleButton = ruleListItem.querySelector('.rule-box-delete-button');

		var replacedElem = ruleListItem.querySelector('[data-id="replacedElem"]');
		var emptyElem = ruleListItem.querySelector('[data-id="emptyElem"]');
		var isEnabled = ruleListItem.querySelector('[data-id="isEnabled"]');

		var addStyleButtons = ruleListItem.querySelectorAll('.add-property-button');
		var styleLists = ruleListItem.querySelectorAll('.style-list');

		//Title
		title.addEventListener('keyup', that.fireBlurEventByEscKey);
		that.bindDetectModifyingEvent(title);

		//Replaced Element
		replacedElem.addEventListener('keyup', that.fireBlurEventByEscKey);
		that.bindDetectModifyingEvent(replacedElem);

		//Empty Element
		emptyElem.addEventListener('keyup', that.fireBlurEventByEscKey);
		that.bindDetectModifyingEvent(emptyElem);

		//isEnabled Element
		that.bindDetectModifyingEvent(isEnabled);

		//Edit Button
		editRuleButton.addEventListener('click', that.toggleEditMode);
		
		//Remove Button
		deleteRuleButton.addEventListener('click', that.deleteRule);

		//Add Button
		that.bindEvents2AddStyleButton(styleLists, addStyleButtons);
	},
	
	bindEvents2StyleListItem: function(styleList, styleListItem, isBaseStyle) {
		var that = STYLEV.RULES;
		var formParts = styleListItem.querySelectorAll('input[data-id], select[data-id], textarea[data-id]');
		var deleteButton = styleListItem.querySelector('.style-list-delete-button');

		//TODO: refactor > null, null, ...
		deleteButton.addEventListener('click', that.deleteStyle);

		that.each(formParts, function(formPart) {

			//Common
			that.bindDetectModifyingEvent(formPart);
			formPart.addEventListener('blur', that.deleteStyleIfNoData);
			formPart.addEventListener('blur', that.positionBasedOnScroll);
			formPart.addEventListener('keyup', that.fireBlurEventByEscKey);

			if(formPart.dataset.id === 'property') {
				formPart.addEventListener('keyup', that.moveFocusByEnter);
				formPart.addEventListener('focus', that.selectAllTextOnFocus);
			}

			if(formPart.dataset.id === 'value') {
				formPart.addEventListener('focus', that.selectAllTextOnFocus);
			}

			//if(formPart.dataset.id === 'emptyElem') {
			//	formPart.addEventListener('change', function(event) {
			//		var target = event.target;
			//		var linkTarget = target.closest('.css-meta-list').querySelector('[data-id="isParentElem"]');
			//		if(that.getValue(target)) {
			//			linkTarget.disabled = true;
			//			that.setValue(linkTarget, false);
			//		} else {
			//			linkTarget.disabled = false;
			//		}
			//	});
			//}

			//if(formPart.dataset.id === 'isParentElem') {
			//	formPart.addEventListener('change', function(event) {
			//		var target = event.target;
			//		var linkTarget = target.closest('.css-meta-list').querySelector('[data-id="emptyElem"]');
			//		if(that.getValue(target)) {
			//			linkTarget.disabled = true;
			//			that.setValue(linkTarget, '');
			//		} else {
			//			linkTarget.disabled = false;
			//		}
			//	});
			//}
			
			if(formPart.dataset.id === 'riskLevel') {
				formPart.addEventListener('change', that.toggleRiskLevel);
			}

			if(formPart.dataset.id === 'referenceURL') {
				formPart.addEventListener('dblclick', that.jump2URLOfValue);
			}

		});
	},
	
	bindEvents2AddStyleButton: function(styleLists, addStyleButtons) {
		var that = STYLEV.RULES;
		that.each(addStyleButtons, function(addStyleButton, i) {
			var styleList = styleLists[i];
			addStyleButton.addEventListener('click', that.setHandler2AddStyleButton(styleList));
		});
	},

	bindEvents2FormHasDummy: function(formPart) {
		var that = STYLEV.RULES;
		var dummy = formPart.parentElement.querySelector('output');

		that.setValue2dummy(formPart, dummy);
		formPart.addEventListener('input', that.bindEvents2Dummy(formPart, dummy));
	},

	bindEvents2Dummy: function(formPart, dummy) {
		var that = STYLEV.RULES;
		return function() {
			that.setValue2dummy(formPart, dummy);
		};
	},

	setHandler2AddStyleButton: function(styleList) {
		var that = STYLEV.RULES;
		return function(event) {
			that.addStyle(styleList);
		}
	},

	jump2URLOfValue: function(event) {
		window.open(event.target.value, '_blank');
	},

	/******************************************************************************************************************
	 * Style Box
	 *******************************************************************************************************************/

	addStyle: function(styleList, stylesObj) {

		var that = STYLEV.RULES;

		var isBaseStyles = styleList.dataset.id === 'baseStyles';

		var template;

		if(isBaseStyles) {
			template = document.importNode(that.templateStyleBase, true);
		} else {
			template = document.importNode(that.templateStyleNg, true);
		}

		if(stylesObj) {
			that.each(stylesObj, function(key, value) {
				var target = template.querySelector('[data-id="' + key + '"]');
				that.setValue(target, value);
				that.setDefaultValue(target, value);
			});
		} else {
			var targets = template.querySelectorAll('[data-id]');
			that.each(targets, function(target) {
				that.setDefaultValue(target, '');
			});
		}

		styleList.appendChild(template);

		var styleListItem = styleList.lastElementChild;
		that.doAfterAddingStyle(styleList, styleListItem, isBaseStyles);

		return styleListItem;
	},
	
	deleteStyle: function(event) {
		event.preventDefault();
		var that = STYLEV.RULES;
		var target = event.target.closest('.style-list-item');
		target.parentElement.removeChild(target);
		that.detectModifying();
	},

	LABEL_BUBBLING_DELAY_TIME: 100,
	deleteStyleIfNoData: function(event) {
		var that = STYLEV.RULES;

		setTimeout(function() {

			var focusedElement = document.activeElement;
			var focusedStyleListItem = focusedElement.closest('.style-list-item');

			var blurredElement = event.target;
			var blurredStyleListItem = blurredElement.closest('.style-list-item');

			if(blurredStyleListItem.isSameNode(focusedStyleListItem)) {
				return;
			}

			var formParts = blurredStyleListItem.querySelectorAll('[data-id]');
			var hasNoData = true;
			that.each(formParts, function(formPart) {
				if(formPart.dataset.id === 'riskLevel') {
					return 'continue';
				}
				if(that.getValue(formPart)) {
					hasNoData = false;
					return 'break';
				}
			});

			if(hasNoData) {
				that.deleteStyle(event);
			}
		}, that.LABEL_BUBBLING_DELAY_TIME);
	},

	doAfterAddingStyle: function(styleList, styleListItem, isBaseStyles) {
		var that = STYLEV.RULES;
		var property = styleListItem.querySelector('[data-id="property"]');
		var value = styleListItem.querySelector('[data-id="value"]');

		//Bind Events
		that.bindEvents2StyleListItem(styleList, styleListItem, isBaseStyles);

		property.addEventListener('keydown', that.preventNewLine);
		property.addEventListener('input', that.modifyCSSProperty);
		property.addEventListener('blur', that.applyValidationResult);

		value.addEventListener('keydown', that.preventNewLine);
		value.addEventListener('input', that.modifyCSSValue);
		value.addEventListener('blur', that.applyValidationResult);

		that.bindEvents2FormHasDummy(property);
		that.bindEvents2FormHasDummy(value);

		if(!isBaseStyles) {//NG Styles
			var riskLevelSelect = styleListItem.querySelector('[data-id="riskLevel"]');
			var reason = styleListItem.querySelector('[data-id="reason"]');
			var referenceURL = styleListItem.querySelector('[data-id="referenceURL"]');
			var styleListItem = riskLevelSelect.closest('.style-list-item');
			styleListItem.classList.add(riskLevelSelect.value);
			that.bindEvents2FormHasDummy(reason);
		}

		property.focus();
	},

	preventNewLine: function(event) {
		var that = STYLEV.RULES;
		if(event.keyCode === that.enterKeyCode) {
			event.preventDefault();
		}
	},
	
	modifyCSSProperty: function(event, styleListItem) {
		var that = STYLEV.RULES;

		var styleListItem = styleListItem || event.target.closest('.style-list-item');
		var cssProperty = styleListItem.querySelector('[data-id="property"]');
		var cssValue = styleListItem.querySelector('[data-id="value"]');

		that.validateProperty(cssProperty);
		that.validateValue(cssProperty, cssValue);

	},
	
	modifyCSSValue: function(event, styleListItem) {
		var that = STYLEV.RULES;

		var styleListItem = styleListItem || event.target.closest('.style-list-item');
		var cssProperty = styleListItem.querySelector('[data-id="property"]');
		var cssValue = styleListItem.querySelector('[data-id="value"]');

		that.validateValue(cssProperty, cssValue);
	},
	
	fireBlurEventByEscKey: function(event) {
		var that = STYLEV.RULES;

		if(event.keyCode === that.escKeyCode) {
			event.target.blur();
			that.detectModifying(event);
		}
	},
	
	moveFocusByEnter: function(event) {
		
		//TODO: need to test
		var that = STYLEV.RULES;
		var styleListItem = event.target.closest('.style-list-item');
		var inputs = styleListItem.querySelectorAll('[data-id]');
		var inputsLastIndex = inputs.length - 1;

		if(event.keyCode === that.enterKeyCode) {
			that.each(inputs, function(input, i) {

				if(i < inputsLastIndex) {
					var nextInput = inputs[i+1];
					if(nextInput !== null && input.isEqualNode(event.target)) {
						nextInput.focus();
					}
				}
			});
		}
	},

	validateProperty: function(propertyInput) {
		var property = propertyInput.value;
		var isValid = CSS.supports(property, 'inherit');//Set global value
		propertyInput.dataset_isvalid = isValid ? 'true' : 'false';
	},

	validateValue: function(propertyInput, valueInput) {
		var that = STYLEV.RULES;
		var property = propertyInput.value;
		var value = valueInput.value;
		var isValid = that.isValidValue(property, value);
		valueInput.dataset_isvalid = isValid ? 'true' : 'false';
	},

	isValidValue: function (property, value) {
		var that = STYLEV.RULES;
		var hasSpecialKeyword = that.specialKwVals.indexOf(value) > -1;
		//TODO: confirm necessary
		var isReverse = value[0] === '!';
		if(isReverse) {
			value = value.slice(1);
		}

		//Detect group operator([...])
		var hasGroupOperator = value[0] === '[' && value.slice(-1) === ']';

		//Override value if has group operator
		if(hasGroupOperator) {
			value = value.slice(1, -1);
		}

		var valuesArray = value.split('|');

		var isSupportedSyntaxAll = true;

		that.each(valuesArray, function(value) {
			var isSupportedSyntax = CSS.supports(property, value);
			if(!isSupportedSyntax) {
				isSupportedSyntaxAll = false;
				return 'break';
			}
		});

		return hasSpecialKeyword || isSupportedSyntaxAll;

	},
	
	applyValidationResult: function(event, _styleListItem) {

		var that = STYLEV.RULES;
		var parent = _styleListItem || event.target.closest('li');
		var property = parent.querySelector('[data-id="property"]');
		var value = parent.querySelector('[data-id="value"]');

		if(event && event.target) {
			setTimeout(that.toggleValidClass, 0, event.target);
		} else {
			setTimeout(that.toggleValidClass, 0, property);
			setTimeout(that.toggleValidClass, 0, value);
		}
	},
	
	toggleValidClass: function(target) {
		if(target && target.value) {
			if(target.dataset_isvalid === 'true') {
				target.parentElement.classList.remove('invalid');
				target.parentElement.classList.add('valid');
			} else {
				target.parentElement.classList.remove('valid');
				target.parentElement.classList.add('invalid');
			}
		}
	},
	
	//TODO: implement?
	setCSSProperty2DataList: function() {
		var that = STYLEV.RULES;
		var df = document.createDocumentFragment();
		that.each(that.allCSSProperties, function(cssProperty) {
			var option = new Option(cssProperty, cssProperty);
			df.appendChild(option);
		});
		that.datalistOfProperties.appendChild(df);
	},

	//TODO: implement?
	setHTMLTags2DataList: function() {
		var that = STYLEV.RULES;
		var df = document.createDocumentFragment();

		that.getURL('./data/tags-all.json').then(JSON.parse).then(function(data) {
			that.each(data, function(tagName) {
				var option = new Option(tagName, tagName);
				df.appendChild(option);
			});
			that.datalistOfTags.appendChild(df);
		});
	},
	
	//TODO: implement?
	getAllCSSProperties: function() {
		var that = STYLEV.RULES;
		var allCSSProperties = Object.keys(document.documentElement.style);

		that.each(allCSSProperties, function(cssProperty) {
			that.allCSSProperties.push(that.camel2Hyphen(cssProperty));
		});
	},

	setValue2dummy: function(formPart, dummy) {
		var that = STYLEV.RULES;
		var isReason = formPart.classList.contains('reason');
		var postFix = isReason ? '\n' : '';
		dummy.textContent = formPart.value + postFix;
	},

	deleteLoadingSpinner: function() {
		var that = STYLEV.RULES;
		var loadingSpinner = document.querySelector('#loading-spinner');
		loadingSpinner && loadingSpinner.parentElement.removeChild(loadingSpinner);
	},


	/******************************************************************************************************************
	 * Scrolling and Positioning
	 *******************************************************************************************************************/

	getEachHeight: function() {
		var that = STYLEV.RULES;
		that.mainHeaderOffsetHeight = that.mainHeader.offsetHeight;
		that.windowInnerHeight = window.innerHeight;
	},

	adjustPadding: function() {
		var that = STYLEV.RULES;
		return new Promise(function(resolve, reject) {
			that.wrapper.style.setProperty('padding-top', that.mainHeaderOffsetHeight + 'px', '');
			that.aside.style.setProperty('padding-top', that.mainHeaderOffsetHeight + 'px', '');
			setTimeout(resolve, 0);
		});
	},

	positionBasedOnScroll: function() {
		var that = STYLEV.RULES;

		return new Promise(function(resolve, reject) {

			//Initialize handler
			if(that.fixPositionHandlers.length) {
				that.each(that.fixPositionHandlers, function(positionHandler) {
					window.removeEventListener('scroll', positionHandler);
				});
				that.fixPositionHandlers = [];
			}

			//Bind events
			that.each(that.fixInScrollingTargets, function(target) {
				var fixPositionHandler = that.setPosition2FixElement(target);
				window.addEventListener('scroll', fixPositionHandler);
				that.fixPositionHandlers.push(fixPositionHandler);
			});
			setTimeout(resolve, 0);
		});
	},

	setPosition2FixElement: function(target) {

		var that = STYLEV.RULES;

		var ruleBoxGBCR = target.getBoundingClientRect();
		var ruleBoxHeader = target.querySelector('.rule-box-header');
		var ruleBoxStyle = target.querySelector('.rule-box-style');
		var ruleBoxStyleInner = ruleBoxStyle.querySelector('.rule-box-style-inner');

		var ruleBoxStyleInnerOffsetHeight = ruleBoxStyleInner.clientHeight + 20;//TODO: fix magic number
		var isHorizontal = ruleBoxStyle.getBoundingClientRect().top === ruleBoxStyle.nextElementSibling.getBoundingClientRect().top;

		if(isHorizontal) {
			target.classList.remove('vertical');
			target.classList.add('horizontal');
		} else {
			target.classList.remove('horizontal');
			target.classList.add('vertical');
		}

		ruleBoxHeader.style.setProperty('top', that.mainHeaderOffsetHeight + 'px', '');
		ruleBoxHeader.style.setProperty('left', ruleBoxGBCR.left + 'px', '');
		ruleBoxHeader.style.setProperty('right', window.innerWidth - ruleBoxGBCR.right + 'px', '');

		ruleBoxStyleInner.style.setProperty('top', (that.mainHeaderOffsetHeight + 40) + 'px', '');//TODO: fix magic number and bug first rule is only needs 40px
		ruleBoxStyleInner.style.setProperty('left', (ruleBoxGBCR.left + 1) + 'px', '');//TODO: fix magic number

		if(isHorizontal) {
			ruleBoxStyleInner.style.setProperty('right', '', '');
		} else {
			ruleBoxStyle.style.setProperty('min-height', ruleBoxStyleInnerOffsetHeight + 'px', '');
			ruleBoxStyleInner.style.setProperty('right', (ruleBoxGBCR.left + 1) + 'px', '');//TODO: fix magic number
		}

		return that.fixPositionHandler(target, [ruleBoxHeader, ruleBoxStyleInner]);
	},

	fixPositionHandler: function(target, fixTargets) {
		var that = STYLEV.RULES;
		that.fixPosition(target, fixTargets);

		return function(event) {
			that.fixPosition(target, fixTargets);
		};
	},

	fixPosition: function(target, fixTargets) {
		var that = STYLEV.RULES;

		that.each(fixTargets, function(fixTarget, i) {

			var fixTargetGBCR;
			var targetGBCR = target.getBoundingClientRect();

			//enter
			if(targetGBCR.top <= that.mainHeaderOffsetHeight + 1) {//TODO: fix magic number

				fixTarget.classList.add('float-in-window', 'fixed-in-window');
				fixTarget.classList.remove('absolute-in-window');

				fixTargetGBCR = fixTarget.getBoundingClientRect();

				//transition
				if(targetGBCR.bottom <= fixTargetGBCR.bottom + 1) {//TODO: fix magic number
					fixTarget.classList.remove('fixed-in-window');
					fixTarget.classList.add('absolute-in-window');
				}

				//leave
			} else {
				fixTargetGBCR = null;
				fixTarget.classList.remove('float-in-window', 'fixed-in-window', 'absolute-in-window');
			}
		});
	},

	adjustScrollByHash: function(event) {

		var that = STYLEV.RULES;

		return new Promise(function(resolve, reject) {

			//TODO: refactor
			var isHashChange = event && event.type === 'hashchange';
			var isLanding = event === undefined;
			var ruleId = isHashChange || isLanding ? location.hash || that.ruleId : that.ruleId;

			if(ruleId) {
				var target = document.querySelector(ruleId);
				if(target) {
					var title = target.querySelector('.title').value + ' | ' + document.title;
					var targetMarginTop = parseInt(getComputedStyle(target, '').getPropertyValue('margin-top'), 10);
					var targetPosY = target.getBoundingClientRect().top + window.scrollY - that.mainHeaderOffsetHeight - targetMarginTop;
					window.scrollTo(0, targetPosY);
					history.pushState(null, title, ruleId);
					resolve();
				}
			} else {
				resolve();
			}
		});
	}
};



STYLEV.OPTIONS = {
	execute: function() {

		var that = STYLEV.OPTIONS;
		that.setParameters();
		that.bindEvents();
		that.modifyValue();
	},
	setParameters: function() {

		var that = STYLEV.OPTIONS;

		that.formParts = document.querySelectorAll('.option-form-parts');
		that.isFirst = true;
		that.options = {};
	},
	bindEvents: function() {

		var that = STYLEV.OPTIONS;

		for(var i = 0, len = that.formParts.length; i < len; i++) {

			var target = that.formParts[i];

			target.addEventListener('keyup', that.modifyValue);
			target.addEventListener('blur', that.modifyValue);
			target.addEventListener('change', that.modifyValue);
		}
	},
	modifyValue: function(event) {

		var that = STYLEV.OPTIONS;

		for(var i = 0, len = that.formParts.length; i < len; i++) {

			var target = that.formParts[i];
			var type = target.type;
			var id = target.id;
			var checkbox = type === 'radio' || type === 'checkbox';
			var textbox = type === 'text';
			var isChecked = checkbox ? target.checked : false;
			var name = target.name;
			var value = target.value;

			if(localStorage.getItem(id) !== null && that.isFirst) {

				if(checkbox) {

					target.checked = !!(localStorage.getItem(id) === 'true');
				}
				if(textbox) {

					target.value = localStorage.getItem(id);
				}

			} else {

				if(checkbox) {

					that.options[id] = isChecked;
					localStorage.setItem(id, isChecked);
				}
				if(textbox) {

					that.options[id] = value;
					localStorage.setItem(id, value);
				}
			}


			if(id === 'scopeSelectors' || id === 'ignoreSelectors') {

				var defineBox = document.querySelector('#' + id + 'Text');
				defineBox.disabled = !isChecked;
			}
		}

		//初期表示を終わりクリックした時


		//初期表示を終わりクリックした時
		if(!that.isFirst && event) {
			chrome.storage.sync.set({'options': that.options});
		}

		that.isFirst = false;
	}
};

STYLEV.RULES.execute();
STYLEV.OPTIONS.execute();
