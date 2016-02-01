'use strict';

var STYLEV = STYLEV || {};

STYLEV.RULES = {

	execute: function() {
		var that = STYLEV.RULES;

		that.setParameters();
		that.applyFromLocalStorage();
		that.insertDummyElements();
		that.getAllCSSProperties();
		that.setCSSProperty2DataList();
		that.setHTMLTags2DataList();
		that.removeSaveButtonWhenNotLocal();
		that.initializeRuleArea();
		that.adjustWrapperPosition();

	},
	initializeRuleArea: function() {
		var that = STYLEV.RULES;

		that.rulesList.innerHTML = '';


		that.json2html()
			.then(function() {

				that.removeLoadingSpinner();
				that.setParametersAfterAdding();
				that.bindEvents();
				that.toggleReason();
				that.toggleReferenceURL();
				that.searchProperty();

				//TODO: refactor
				that.each(that.riskLevelSelects, function(riskLevelSelect) {
					that.closest(riskLevelSelect, '.styles-list-item').classList.add(riskLevelSelect.value);
					riskLevelSelect.addEventListener('change', function(event) {
						var target = that.closest(event.target, '.styles-list-item');
						var options = riskLevelSelect.querySelectorAll('option');
						that.each(options, function(option) {
							target.classList.remove(option.value);
						});
						target.classList.add(event.target.value);
					})
				});

				STYLEV.VALIDATOR.setStyleDataBySelectors();
				that.isShowedAllAtFirst = true;

			});
	},
	setParameters: function() {
		var that = STYLEV.RULES;

		that.wrapper = document.querySelector('.wrapper');
		that.main = document.querySelector('.main');
		that.mainHeader = document.querySelector('.main-header');
		that.isShowedAllAtFirst = false;
		that.resetButton = document.querySelector('#reset-button');
		that.addButton = document.querySelector('#add-button');
		that.saveButton = document.querySelector('#save-button');
		that.downloadButton = document.querySelector('#download-button');
		that.datalistOfProperties = document.querySelector('#all-css-properties');
		that.datalistOfTags = document.querySelector('#all-html-tags');
		that.rulesList = document.querySelector('#rules-list');
		that.templatePropertyBase = document.querySelector('#template-property-base').content;
		that.templatePropertyNg = document.querySelector('#template-property-ng').content;
		that.templateRule = document.querySelector('#template-rule').content;
		that.dummyElementWrapper = document.createElement('div');
		that.dummyElementWrapper.classList.add('dummy-wrapper');
		that.dummyElement4detectWidth = document.createElement('div');
		that.dummyElement4detectWidth.id = 'dummy-element-4-detect-width';
		that.dummyElement4detectWidth.classList.add('dummy');
		that.dummyElement4testStyle = document.createElement('div');
		that.dummyElement4testStyle.id = 'dummy-element-4-test-style';
		that.dummyElement4testStyle.classList.add('dummy');
		that.reasonCheckbox = document.querySelector('#reason-checkbox');
		that.referenceURLCheckbox = document.querySelector('#reference-url-checkbox');
		that.searchPropertyInput = document.querySelector('#search-property-input');
		that.searchedRulesCount = document.querySelector('#searched-rules-count');
		that.totalRulesCount = document.querySelector('#total-rules-count');
		that.displayModeLList = document.querySelector('#display-mode-list');
		that.displayListMode = document.querySelector('#display-list-mode');
		that.displayColumnMode = document.querySelector('#display-column-mode');
		that.mainHeaderOffsetHeight = that.mainHeader.offsetHeight;
		that.windowInnerHeight = window.innerHeight;
		that.parsedJSON = null;
		that.generatedJSON = null;

		that.allCSSProperties = [];
		that.INPUT_ARROW_WIDTH = 22;//input with list attr

		that.escKeyCode = 27;
		that.enterKeyCode = 13;

		that.each = STYLEV.METHODS.each;
	},
	applyFromLocalStorage: function() {
		var that = STYLEV.RULES;
		that.reasonCheckboxData = localStorage.getItem(that.reasonCheckbox.id);
		that.reasonCheckbox.checked = that.reasonCheckboxData ? that.reasonCheckboxData === 'true' : that.reasonCheckbox.checked;
		that.referenceURLCheckboxData = localStorage.getItem(that.referenceURLCheckbox.id);
		that.referenceURLCheckbox.checked = that.referenceURLCheckboxData ? that.referenceURLCheckboxData === 'true' : that.referenceURLCheckbox.checked;
	},
	setParametersAfterAdding: function() {
		var that = STYLEV.RULES;

		that.rulesListItems = that.rulesList.querySelectorAll(':scope > li');
		that.elementType = that.rulesList.querySelectorAll('.element-type');
		that.stylesLists = that.rulesList.querySelectorAll('.styles-list');
		that.textInputs = that.rulesList.querySelectorAll('.rule-title');

		that.reasons = that.rulesList.querySelectorAll('.reason');
		that.cssProperties = that.rulesList.querySelectorAll('.css-property');

		that.riskLevelSelects = document.querySelectorAll('[data-id="risk-level"]');
		that.fixInScrollingTargets = document.querySelectorAll('.fix-in-scrolling');

	},
	setParametersAfterToggledProperty: function() {
		var that = STYLEV.RULES;

		that.reasons = that.rulesList.querySelectorAll('.reasons');
	},

	bindEvents: function() {
		var that = STYLEV.RULES;

		that.resetButton.addEventListener('click', that.initializeRuleArea);
		that.addButton.addEventListener('click', that.addRule);
		that.saveButton.addEventListener('click', that.saveJSON);
		that.downloadButton.addEventListener('mousedown', that.setDownloadButton);
		that.reasonCheckbox.addEventListener('change', that.toggleReason);
		that.referenceURLCheckbox.addEventListener('change', that.toggleReferenceURL);
		that.searchPropertyInput.addEventListener('keyup', that.searchProperty);
		document.documentElement.addEventListener('keydown', that.saveJSONByShortcutKey)
		window.addEventListener('resize', that.adjustWrapperPosition);
		window.addEventListener('resize', that.getEachHeight);
		window.addEventListener('load', that.getEachHeight);
		window.addEventListener('resize', that.fixInScrolling);

		that.bindEvent2FormParts();
		that.bindEvents2AddButton();
		that.bindEvents2RuleListItem();
		that.bindEvents2StylesList();

		that.fixInScrolling();//TODO: here?
	},
	
	bindEvent2FormParts: function() {
		var that = STYLEV.RULES;
		var formParts = that.rulesList.querySelectorAll('input, select, textarea');
		that.each(formParts, function(formPart) {
			formPart.addEventListener('change', function() {

				that.generatedJSON = that.generateJSON();

				var generatedJSONString = JSON.stringify(that.generatedJSON);
				var currentJSONString = JSON.stringify(that.parsedJSON);
				var isModified = generatedJSONString !== currentJSONString;

				if(isModified) {
					console.log('change')
					that.saveButton.classList.add('is-modified');
				} else {
					console.log('no change')
					that.saveButton.classList.remove('is-modified');
				}
			});
		});
	},

	searchProperty: function(event) {

		event && event.stopPropagation();

		var that = STYLEV.RULES;
		var rulesListItems = that.rulesListItems;
		var rulesListItemsLen = rulesListItems.length;
		var inputValue = that.searchPropertyInput.value;
		var count = 0;
		that.totalRulesCount.textContent = rulesListItemsLen + '';

		if(inputValue) {

			that.each(rulesListItems, function(rulesListItem) {
				var cssProperties = rulesListItem.querySelectorAll('.css-property');
				var hasWord = false;

				that.each(cssProperties, function(cssProperty) {
					var cssPropertyValue = cssProperty.value;

					if(cssPropertyValue.indexOf(inputValue) !== -1) {
						hasWord = true;
						return 'break';
					}
				});

				if(hasWord) {
					count = (count+1)|0;
					rulesListItem.classList.remove('hidden');
				} else {
					rulesListItem.classList.add('hidden');
				}
			});

			that.searchedRulesCount.textContent = count;

		} else {
			that.each(rulesListItems, function(rulesListItem) {
				rulesListItem.classList.remove('hidden');
			});

			that.searchedRulesCount.textContent = rulesListItemsLen + '';
		}
	},

	toggleReason: function(event) {
		var that = STYLEV.RULES;
		if(!that.reasonCheckbox.checked) {
			that.rulesList.classList.add('hide-reason');
		} else {
			that.rulesList.classList.remove('hide-reason');
		}
		localStorage.setItem(that.reasonCheckbox.id, that.reasonCheckbox.checked);
	},

	toggleReferenceURL: function(event) {
		var that = STYLEV.RULES;
		if(!that.referenceURLCheckbox.checked) {
			that.rulesList.classList.add('hide-reference-url');
		} else {
			that.rulesList.classList.remove('hide-reference-url');
		}
		localStorage.setItem(that.referenceURLCheckbox.id, that.referenceURLCheckbox.checked);
	},

	removeSaveButtonWhenNotLocal: function() {
		var that = STYLEV.RULES;
		if(location.hostname !== 'localhost') {
			that.saveButton.hidden = true;
		}
	},
	
	setDownloadButton: function() {
		var that = STYLEV.RULES;
		var json = that.generatedJSON;
		this.href = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(json));
		alert('Download and replace file which named rules.json without rename the file');
	},
	toggleEditMode: function(event) {
		var that = STYLEV.RULES;

		event.stopPropagation();
		event.preventDefault();

		var target = event.currentTarget || event.target;
		var rulesListItem = that.closest(target, 'li[data-ruleid]');
		var isEditMode = rulesListItem.classList.contains('edit-mode');

		function reset() {
			that.modifyBasedOnCurrentData(rulesListItem);
			rulesListItem.classList.remove('edit-mode');
			event.currentTarget.textContent = 'Edit';

		}

		function showAll() {
			var stylesLists = rulesListItem.querySelectorAll('.styles-list');
			rulesListItem.classList.add('edit-mode');
			event.currentTarget.textContent = 'Set';
			that.each(stylesLists, function(stylesList) {
				stylesList.classList.remove('hidden');
			});
		}

		if(isEditMode) {
			reset();
		} else {
			showAll();
		}
	},

	modifyBasedOnCurrentData: function(rulesListItem) {
		var that = STYLEV.RULES;

		var formPartsWrappers = rulesListItem.querySelectorAll('.styles-list, .rule-title, .element-type');

		that.each(formPartsWrappers, function(formPartsWrapper) {
			var hasData = false;

			var inputs = formPartsWrapper.querySelectorAll('input, textarea');
			if(inputs === null) {
				hasData = false;
				return 'break';
			}
			that.each(inputs, function(input) {
				if(input.type === 'text' && input.value) {
					hasData = true;
					return 'break';
				}
				if(input.type === 'checkbox' && input.checked) {
					hasData = true;
					return 'break';
				}
			});

			if(hasData) {
				formPartsWrapper.classList.remove('hidden');
			} else {
				formPartsWrapper.classList.add('hidden');
			}
		});
	},

	removeTheRule: function(event) {
		var that = STYLEV.RULES;
		event.stopPropagation();
		event.preventDefault();

		var rulesListItem = that.closest(event.currentTarget, 'li');

		if(confirm('Are you sure you want to remove this rule?')) {
			rulesListItem.parentElement.removeChild(rulesListItem);
		}
	},

	bindEvents2StylesList: function(template) {
		var that = STYLEV.RULES;

		var doc = (template && template.nodeType === 11) || that.rulesList;
		var stylesLists = doc.querySelectorAll('.styles-list');

		that.each(stylesLists, function(stylesList) {
			stylesList.addEventListener('focus', that.insertProperty);
		});
	},
	addRule: function() {
		var that = STYLEV.RULES;
		var template = document.importNode(that.templateRule, true);
		var rulesListItem = that.rulesList.querySelector('li');

		rulesListItem.classList.add('edit-mode');

		that.bindEvents2RuleListItem(template);
		that.bindEvents2AddButton(template);
		that.bindEvents2StylesList(template);

		that.rulesList.insertBefore(template, rulesListItem);
		that.rulesList.querySelector('li').querySelector('input').focus();
		that.setParametersAfterAdding();
	},

	setHandler2AddButton: function(stylesList) {
		var that = STYLEV.RULES;
		
		return function(event) {
			that.insertProperty(event, stylesList);
		}
	},

	bindEvents2AddButton: function(template) {
		var that = STYLEV.RULES;

		var doc = (template && template.nodeType === 11) || that.rulesList;

		var addPropertyButtons = doc.querySelectorAll('.add-property-button');
		var stylesLists = doc.querySelectorAll('.styles-list');

		function bindEvent(addPropertyButton, i) {
			var stylesList = stylesLists[i];
			addPropertyButton.addEventListener('click', that.setHandler2AddButton(stylesList));
		}

		that.each(addPropertyButtons, bindEvent);
	},


	bindEvents2RuleListItem: function(template) {
		var that = STYLEV.RULES;

		var doc = (template && template.nodeType === 11) || that.rulesList;
		var rulesListItems = doc.querySelectorAll(':scope > li');

		function findAndBindEvent(rulesListItem) {
			var editButton = rulesListItem.querySelector('.rules-box-edit-button');
			var removeButton = rulesListItem.querySelector('.rules-box-remove-button');
			editButton.addEventListener('click', that.toggleEditMode);
			removeButton.addEventListener('click', that.removeTheRule);
		}

		that.each(rulesListItems, findAndBindEvent);
	},


	insertDummyElements: function() {
		var that = STYLEV.RULES;

		document.documentElement.appendChild(that.dummyElementWrapper);
		that.dummyElementWrapper.appendChild(that.dummyElement4detectWidth);
		that.dummyElementWrapper.appendChild(that.dummyElement4testStyle);
	},
	
	insertProperty: function(event, target, property, propertyValueObj) {

		var that = STYLEV.RULES;
		var stylesList = target || event.currentTarget || event.target;
		var isBaseStyles = stylesList.dataset.id === 'base-styles';

		var template;

		if(isBaseStyles) {
			template = document.importNode(that.templatePropertyBase, true);
		} else {
			template = document.importNode(that.templatePropertyNg, true);
		}

		if(property) {
			template.querySelector('[data-id="key"]').value = property;
		}

		that.each(propertyValueObj, function(key, value) {
			if(value) {
				var target = template.querySelector('[data-id="' + key + '"]');
				that.setValue(target, value);
			}
		});

		stylesList.appendChild(template);

		var appendedStylesListItem = stylesList.querySelector(':scope > li:last-child');
		that.doAfterInsertingProperty(appendedStylesListItem, isBaseStyles);

		return appendedStylesListItem;
	},

	jump2urlOfValue: function(event) {
		location.href = event.currentTarget.value;
	},

	doAfterInsertingProperty: function(appendedStylesListItem, isBaseStyles) {
		var that = STYLEV.RULES;
		var cssProperty = appendedStylesListItem.querySelector('.css-property');
		var cssPropertyValue = appendedStylesListItem.querySelector('.css-property-value');
		that.bindEvents2ListItem(appendedStylesListItem);
		that.bindEvents2CSSPropertyAndValue(cssProperty, cssPropertyValue);

		if(!isBaseStyles) {

			var reason = appendedStylesListItem.querySelector('.reason');
			var referenceURL = appendedStylesListItem.querySelector('.reference-url');
			that.bindEvents2Textarea(reason);
			that.bindEvents2ReferenceURL(referenceURL);
		}

		cssProperty.focus();

		if(that.isShowedAllAtFirst) {
			that.setParametersAfterToggledProperty();
		}
	},
	bindEvents2ReferenceURL: function(referenceURL) {
		var that = STYLEV.RULES;
		referenceURL.addEventListener('dblclick', that.jump2urlOfValue);
		referenceURL.addEventListener('keyup', that.insertPropertyByEnterKey);
	},

	bindEvents2ListItem: function(appendedStylesListItem) {
		var that = STYLEV.RULES;
		var inputs = appendedStylesListItem.querySelectorAll('input');
		var textareas = appendedStylesListItem.querySelectorAll('textarea');
		var selects = appendedStylesListItem.querySelectorAll('select');

		appendedStylesListItem.addEventListener('click', that.stopPropagation);

		that.each(inputs, function(input) {
			input.addEventListener('click', that.stopPropagation);
			input.addEventListener('keyup', that.fireBlurEventByEscKey);
			input.addEventListener('keyup', that.moveFocusByEnter);
			input.addEventListener('focus', that.selectOnFocus);
		});
		that.each(textareas, function(textarea) {
			textarea.addEventListener('click', that.stopPropagation);
			textarea.addEventListener('keyup', that.fireBlurEventByEscKey);
		});
		that.each(selects, function(select) {
			select.addEventListener('click', that.stopPropagation);
			select.addEventListener('keyup', that.fireBlurEventByEscKey);
		});
	},
	bindEvents2CSSPropertyAndValue: function(cssProperty, cssPropertyValue) {
		var that = STYLEV.RULES;

		cssProperty.addEventListener('input', that.modifyCSSProperty);
		cssProperty.addEventListener('focus', that.applySameStyles2dummyElem);
		cssProperty.addEventListener('blur', that.applyValidationResult);

		cssPropertyValue.addEventListener('input', that.modifyCSSPropertyValue);
		cssPropertyValue.addEventListener('focus', that.applySameStyles2dummyElem);
		cssPropertyValue.addEventListener('blur', that.applyValidationResult);


	},
	modifyCSSProperty: function(event, stylesListItem) {
		var that = STYLEV.RULES;

		var stylesListItem = stylesListItem || that.closest(event.currentTarget, 'li');
		var cssProperty = stylesListItem.querySelector('.css-property');
		var cssPropertyValue = stylesListItem.querySelector('.css-property-value');

		that.dummyElement4detectWidth.innerHTML = cssProperty.value;
		cssProperty.style.setProperty('width', (that.dummyElement4detectWidth.offsetWidth * 1.05 + that.INPUT_ARROW_WIDTH) + 'px', 'important');
		that.validateProperty(cssProperty);
		that.validatePropertyValue(cssProperty, cssPropertyValue);

	},
	modifyCSSPropertyValue: function(event, stylesListItem) {
		var that = STYLEV.RULES;

		var stylesListItem = stylesListItem || that.closest(event.currentTarget, 'li');
		var cssProperty = stylesListItem.querySelector('.css-property');
		var cssPropertyValue = stylesListItem.querySelector('.css-property-value');

		that.dummyElement4detectWidth.innerHTML = cssPropertyValue.value;
		cssPropertyValue.style.width = (that.dummyElement4detectWidth.offsetWidth * 1.05 + that.INPUT_ARROW_WIDTH) + 'px';
		that.validatePropertyValue(cssProperty, cssPropertyValue);
	},
	fireBlurEventByEscKey: function(event) {
		event.stopPropagation();
		var that = STYLEV.RULES;

		if(event.keyCode === that.escKeyCode) {
			event.currentTarget.blur();
		}
	},
	moveFocusByEnter: function(event) {

		event.stopPropagation();

		//TODO: need to test
		var that = STYLEV.RULES;
		var stylesListItem = that.closest(event.currentTarget, 'li');
		var inputs = stylesListItem.querySelectorAll('input, textarea, select');
		var inputsLastIndex = inputs.length - 1;

		if(event.keyCode === that.enterKeyCode) {
			that.each(inputs, function(input, i) {

				if(i < inputsLastIndex) {
					var nextInput = inputs[i+1];
					if(nextInput !== null && input.isEqualNode(event.currentTarget)) {
						nextInput.focus();
					}
				}
			});
		}
	},
	insertPropertyByEnterKey: function(event) {
		var that = STYLEV.RULES;

		event.stopPropagation();

		var stylesListItem = that.closest(event.currentTarget, 'li');
		var stylesList = stylesListItem.parentElement;
		var cssProperty = stylesListItem.querySelector('.css-property');
		var cssPropertyValue = stylesListItem.querySelector('.css-property-value');

		if(event.keyCode === that.enterKeyCode) {

			if(!cssProperty.value || !cssPropertyValue.value) {
				that.removeProperty(stylesList, stylesListItem);
			} else {
				that.insertProperty(null, stylesList);
			}
		}
	},
	validateProperty: function(cssProperty) {
		var that = STYLEV.RULES;

		var _cssProperty = cssProperty.value;
		var isValid = false;

		that.each(that.allCSSProperties, function(cssPropertyFromData) {
			if(_cssProperty === cssPropertyFromData) {
				isValid = true;
				return 'break';
			}
		});
		cssProperty.dataset_isvalid = isValid ? 'true' : 'false';

	},

	validatePropertyValue: function(cssProperty, cssPropertyValue) {

		var that = STYLEV.RULES;
		var property = cssProperty.value;
		var propertyValue = cssPropertyValue.value;

		//TODO: 用途を考える
		var isReverse = propertyValue.indexOf('!') === 0;
		propertyValue = propertyValue.replace('!', '');

		var hasGroupOperator = propertyValue.match(/^\[(.+)\]$/);
		propertyValue = hasGroupOperator ? hasGroupOperator[1] : propertyValue;

		var hasOrOperator = propertyValue.split('|').length > 1;

		//TODO: !は不要かも
		var regexOkOriginalKeyWords = new RegExp(' default | !default | 0 | !0 | over-0 | under-0 | inherit | !inherit ');

		if(hasOrOperator) {

			var separatedPropertyValues = propertyValue.split('|');
			var isValidOfGroupValue = true;

			that.each(separatedPropertyValues, function(separatedPropertyValue) {

				that.dummyElement4testStyle.style.setProperty(property, separatedPropertyValue, '');

				var computedValue = STYLEV.VALIDATOR.getStyle(that.dummyElement4testStyle, property, separatedPropertyValue);
				that.dummyElement4testStyle.style.setProperty(property, null, '');

				var isValid = separatedPropertyValue === computedValue || regexOkOriginalKeyWords.test(' ' + separatedPropertyValue + ' ');

				if(!isValid) {
					isValidOfGroupValue = false;
					return 'break';
				}
			});

			cssPropertyValue.dataset_isvalid = isValidOfGroupValue ? 'true' : 'false';

		} else {

			that.dummyElement4testStyle.style.setProperty(property, propertyValue, '');

			var computedValue = STYLEV.VALIDATOR.getStyle(that.dummyElement4testStyle, property, propertyValue);
			that.dummyElement4testStyle.style.setProperty(property, null, '');

			var isValid = propertyValue === computedValue || regexOkOriginalKeyWords.test(' ' + propertyValue + ' ');

			cssPropertyValue.dataset_isvalid = isValid ? 'true' : 'false';

		}
	},
	applyValidationResult: function(event, stylesListItem) {

		var that = STYLEV.RULES;
		var stylesListItem = stylesListItem || that.closest(event.currentTarget, 'li');
		var cssProperty = stylesListItem.querySelector('.css-property');
		var cssPropertyValue = stylesListItem.querySelector('.css-property-value');
		var stylesList = stylesListItem.parentElement;

		if(!cssProperty.value && !cssPropertyValue.value) {

			that.removeProperty(stylesList, stylesListItem);

		} else {

			if(event && event.currentTarget) {

				event.currentTarget.style.setProperty('margin-right',(-that.INPUT_ARROW_WIDTH) + 'px', '');
				setTimeout(that.updateValidClass, 0, event.currentTarget);

			} else {

				cssProperty.style.setProperty('margin-right', (-that.INPUT_ARROW_WIDTH) + 'px', '');
				cssPropertyValue.style.setProperty('margin-right', (-that.INPUT_ARROW_WIDTH) + 'px', '');
				setTimeout(that.updateValidClass, 0, cssProperty);
				setTimeout(that.updateValidClass, 0, cssPropertyValue);
			}

		}
	},
	updateValidClass: function(target) {
		if(target && target.value) {
			if(target.dataset_isvalid === 'true') {
				target.classList.remove('invalid');
				target.classList.add('valid');
			} else {
				target.classList.remove('valid');
				target.classList.add('invalid');
			}
		}
	},
	setCSSProperty2DataList: function() {
		var that = STYLEV.RULES;
		var df = document.createDocumentFragment();
		that.each(that.allCSSProperties, function(cssProperty) {
			var option = new Option(cssProperty, cssProperty);
			df.appendChild(option);
		});
		that.datalistOfProperties.appendChild(df);
	},
	setHTMLTags2DataList: function() {
		var that = STYLEV.RULES;
		var df = document.createDocumentFragment();

		that.getURL('/extension/data/tags-all.json').then(JSON.parse).then(function(data) {
			that.each(data, function(tagName) {
				var option = new Option(tagName, tagName);
				df.appendChild(option);
			});
			that.datalistOfTags.appendChild(df);
		});
	},
	stopPropagation: function() {
		event.stopPropagation();
	},
	applySameStyles2dummyElem: function(event) {
		var that = STYLEV.RULES;
		var currentTarget = event.currentTarget;
		that.dummyElement4detectWidth.innerHTML = currentTarget.value;
		that.dummyElement4detectWidth.style['font-size'] = getComputedStyle(currentTarget, '').getPropertyValue('font-size');
		that.dummyElement4detectWidth.style['font-family'] = getComputedStyle(currentTarget, '').getPropertyValue('font-family');
	},
	selectOnFocus: function(event) {
		event.currentTarget.select();
	},
	removeProperty: function(stylesList, stylesListItem) {
		var that = STYLEV.RULES;
		stylesList.removeChild(stylesListItem);
		that.setParametersAfterToggledProperty();
	},
	getAllCSSProperties: function() {
		var that = STYLEV.RULES;
		var cssProperties = document.documentElement.style;

		that.each(cssProperties, function(cssProperty) {

			if( cssProperty === 'cssFloat') {
				cssProperty = 'float';
			}

			if( cssProperty === 'cssText' ||
				cssProperty === 'parentRule' ||
				cssProperty === 'length' ||
				cssProperty === '0' ||
				cssProperty === 'all'
				) {
				return 'continue';
			}
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
	json2html: function() {
		var that = STYLEV.RULES;
		var df = document.createDocumentFragment();

		return new Promise(function(resolve, reject) {

			that.getURL('/extension/data/rules.json')
				.then(JSON.parse)
				.then(function(parsedJSON) {

					that.parsedJSON = parsedJSON;

					that.each(parsedJSON, function(rule) {

						var template = document.importNode(that.templateRule, true);

						var rulesListItem = template.querySelector('li');
						rulesListItem.dataset.ruleid = rule['rule-id'];

						that.each(rule['rule-data'], function(ruleKey, ruleVal) {

							var target = template.querySelector('[data-id="' + ruleKey + '"]');

							if(ruleKey === 'base-styles' || ruleKey === 'ng-styles') {
								that.applyStylesData2HTML(target, template, ruleKey, ruleVal);
								return 'continue;'
							}

							that.applyData2HTML(target, template, ruleKey, ruleVal);

						});

						df.appendChild(template);
					});

					that.rulesList.appendChild(df);

					resolve();

				});
		});
	},

	applyData2HTML: function (target, template, ruleKey, ruleVal) {
		var that = STYLEV.RULES;

		if(ruleVal) {

			that.setValue(target, ruleVal);

		} else {
			
//			target.classList.add('hidden');
		}
	},

	applyStylesData2HTML: function(target, template, ruleKey, ruleVal) {
		var that = STYLEV.RULES;

		if(ruleVal) {

			if(ruleVal instanceof Array) {

				that.each(ruleVal, function(style) {

					that.each(style, function(property, propertyValueObj) {
						var stylesListItem = that.insertProperty(null, target, property, propertyValueObj);
						that.modifyCSSProperty(null, stylesListItem);
						that.modifyCSSPropertyValue(null, stylesListItem);
						that.applyValidationResult(null, stylesListItem);
					});
				});

			} else {

				that.each(ruleVal, function(property, propertyValueObj) {

					var stylesListItem = that.insertProperty(null, target, property, propertyValueObj);
					that.modifyCSSProperty(null, stylesListItem);
					that.modifyCSSPropertyValue(null, stylesListItem);
					that.applyValidationResult(null, stylesListItem);
				});
			}


		} else {

//			target.classList.add('hidden');
		}
	},

	generateJSON: function() {
		var that = STYLEV.RULES;
		var jsonArray = [];
		
		//TODO: Need to receive `lastRuleID` from database on server
		var localLastRuleID = localStorage.getItem('lastRuleID');
		that.lastRuleID = (localLastRuleID && parseInt(localLastRuleID, 10)) || 0;

		that.rulesListItems = that.rulesList.querySelectorAll(':scope > li');

		that.each(that.rulesListItems, function(rulesListItem) {

			var rule = {};

			var ruleIDFromElem = rulesListItem.dataset.ruleid;

			//Rule ID
			if(ruleIDFromElem === undefined) {

				that.lastRuleID = (that.lastRuleID+1)|0;

				rule['rule-id'] = that.lastRuleID;
				rulesListItem.dataset.ruleid = that.lastRuleID;

			} else {

				rule['rule-id'] = that.lastRuleID = parseInt(ruleIDFromElem, 10);
			}

			//Rule Data
			rule['rule-data'] = {};

			var singleDataWrappers = rulesListItem.querySelectorAll('.rules-box-header, .element-type-list');
			var multiDataWrappers = rulesListItem.querySelectorAll('.styles-list');

			that.each(singleDataWrappers, function(singleDataWrapper) {

				var targets = singleDataWrapper.querySelectorAll('[data-id]');

				that.each(targets, function(target) {
					var key = target.dataset.id;
					rule['rule-data'][key] = that.getValue(target);
				});

			});

			that.each(multiDataWrappers, function(multiDataWrapper) {

				var xStyles = multiDataWrapper.dataset.id;

				if(xStyles === 'base-styles') {

					var targets = multiDataWrapper.querySelectorAll('[data-id]');
					var baseKey;

					rule['rule-data'][xStyles] = {};

					that.each(targets, function(target) {
						var key = target.dataset.id;

						if(key === 'key') {
							baseKey = target.value;
							rule['rule-data'][xStyles][baseKey] = {};
						} else {
							rule['rule-data'][xStyles][baseKey][key] = that.getValue(target);
						}
					});
				}

				if(xStyles === 'ng-styles') {

					var stylesListItems = multiDataWrapper.querySelectorAll('.styles-list-item');

					rule['rule-data'][xStyles] = [];

					that.each(stylesListItems, function(stylesListItem) {

						var obj = {};
						var targets = stylesListItem.querySelectorAll('[data-id]');
						var baseKey;

						that.each(targets, function(target) {
							var key = target.dataset.id;

							if(key === 'key') {
								baseKey = target.value;
								obj[baseKey] = {};
							} else {
								obj[baseKey][key] = that.getValue(target);
							}
						});

						rule['rule-data'][xStyles].push(obj);
					});

				}

			});

			jsonArray.push(rule);
		});

		//TODO: Need to send `lastRuleID` to server 
		//do ajax
		
		localStorage.setItem('lastRuleID', that.lastRuleID);
		
		return jsonArray;
	},

	isCheckboxOrRadio: function(target) {
		return target.type && /^(checkbox|radio)/.test(target.type);
	},

	getValue: function(target) {
		var that = STYLEV.RULES;

		return that.isCheckboxOrRadio(target) ? target.checked : target.value;
	},

	setValue: function(target, value) {
		var that = STYLEV.RULES;
		if(that.isCheckboxOrRadio(target)) {
			target.checked = value;
		} else {
			target.value = value;
		}
	},

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
	saveJSON: function() {
		var that = STYLEV.RULES;

		var xhr = new XMLHttpRequest();
		var apiURI = '/saveJSON';
		var method = 'POST';
		var json = that.generatedJSON || that.generateJSON();
		var data4send = JSON.stringify(json, null, '\t');

		xhr.open(method, apiURI, true);
		xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		xhr.addEventListener('load', function () {
			if (xhr.status === 200) {
				that.saveButton.classList.remove('is-modified');
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

	showSuccessMsg: function() {
		alert('Saving of rules was successful! Let\'s send Pull Request!');
	},
	showErrorMsg: function() {
		alert('Sorry. Could not connect to api server. Connect to api server, or click download button.');
	},

	parseSelector: function (selector) {

		var isCorrectParameters = typeof selector === 'string';

		if(!isCorrectParameters) {
			try {
				throw new Error('Bad Parameter!');
			} catch (e) {
				alert(e.name + ": " + e.message);
			}
		}

		var parsedSelectorObj = {
			tags: [],
			ids: [],
			classes: [],
			attributes: []
		};
		selector.split(/(?=\.)|(?=#)|(?=\[)/).forEach(function(token){
			switch (token[0]) {
				case '#':
					parsedSelectorObj.ids.push(token.slice(1));
					break;
				case '.':
					parsedSelectorObj.classes.push(token.slice(1));
					break;
				case '[':
					parsedSelectorObj.attributes.push(token.slice(1,-1).split('='));
					break;
				default :
					parsedSelectorObj.tags.push(token);
					break;
			}
		});
		return parsedSelectorObj;
	},

	closest: function(element, selector) {

		var that = STYLEV.RULES;
		var isCorrectParameters = element && element.nodeType === 1 && selector && typeof selector === 'string';
		if(!isCorrectParameters) {
			return null;
		}
		var parsedSelectorObj = that.parseSelector(selector);

		function isMatchedSelector(targetElement) {

			var isMatchedWithTags = true;
			var isMatchedWithIDs = true;
			var isMatchedWithClasses = true;
			var isMatchedWithAttributes = true;

			that.each(parsedSelectorObj.tags, function(value) {
				if(targetElement.tagName.toLowerCase() !== value) {
					isMatchedWithTags = false;
				}
			});

			that.each(parsedSelectorObj.ids, function(value) {
				if(targetElement.id !== value) {
					isMatchedWithIDs = false;
				}
			});

			that.each(parsedSelectorObj.classes, function(value) {
				if(!targetElement.classList.contains(value)) {
					isMatchedWithClasses = false;
				}
			});

			that.each(parsedSelectorObj.attributes, function(value) {
				var hasAttributeNameOnly = value.length === 1;
				var attributeName = value[0];
				if(hasAttributeNameOnly) {
					if(!targetElement.hasAttribute(attributeName)) {
						isMatchedWithAttributes = false;
					}
				} else {
					var attributeValue = value[1];
					if(targetElement.getAttribute(attributeName) !== attributeValue) {
						isMatchedWithAttributes = false;
					}
				}
			});
			return isMatchedWithTags && isMatchedWithIDs && isMatchedWithClasses && isMatchedWithAttributes;
		}

		element = element.parentElement;

		while(element && !isMatchedSelector(element)) {
			element = element.parentElement;
		}

		return element;
	},

	bindEvents2Textarea: function(textarea) {
		var that = STYLEV.RULES;
		var dummyTextarea = textarea.parentElement.querySelector('.dummy-textarea');

		that.setValue2dummyTextarea(textarea, dummyTextarea);
		textarea.addEventListener('input', that.bindEvents2DummyTextarea(textarea, dummyTextarea));
	},
	
	bindEvents2DummyTextarea: function(textarea, dummyTextarea) {
		var that = STYLEV.RULES;
		return function() {
			that.setValue2dummyTextarea(textarea, dummyTextarea);
		};
	},

	setValue2dummyTextarea: function(textarea, dummyTextarea) {
		var that = STYLEV.RULES;
		dummyTextarea.textContent = textarea.value + '\n';
	},

	removeLoadingSpinner: function() {
		var that = STYLEV.RULES;
		var loadingSpinner = document.querySelector('#loadingSpinner');
		loadingSpinner && loadingSpinner.parentElement.removeChild(loadingSpinner);
	},

	adjustWrapperPosition: function() {
		var that = STYLEV.RULES;

		if(that.adjustWrapperPositionTimer !== undefined) {
			clearTimeout(that.adjustWrapperPositionTimer);
		}
		that.adjustWrapperPositionTimer = setTimeout(function() {
			that.wrapper.style.setProperty('padding-top', that.mainHeader.offsetHeight + 'px', '');
		}, 0);
	},

	getEachHeight: function() {
		var that = STYLEV.RULES;
			that.mainHeaderOffsetHeight = that.mainHeader.offsetHeight;
			that.windowInnerHeight = window.innerHeight;
	},

	positionHandlers: [],
	fixInScrollingTimer: null,

	fixInScrolling: function() {
		var that = STYLEV.RULES;

		that.each(that.positionHandlers, function(positionHandler) {
			window.removeEventListener('scroll', positionHandler);
		});

		that.each(that.fixInScrollingTargets, function(target, i) {

			var rulesBox = target;
			var rulesBoxGBCR = target.getBoundingClientRect();
			var rulesBoxHeader = rulesBox.querySelector('.rules-box-header');
			var rulesBoxSection = rulesBox.querySelector('.rules-box-section');
			var rulesBoxSectionInner = rulesBoxSection.querySelector('.rules-box-section-inner');
			var rulesBoxSectionInnerOffsetHeight = rulesBoxSectionInner.offsetHeight + 20;//TODO: need to dyna
			var isHorizontal = rulesBoxSection.getBoundingClientRect().top === rulesBoxSection.nextElementSibling.getBoundingClientRect().top;
			var fixTargets = [rulesBoxHeader, rulesBoxSectionInner];
			var fixTargetGBCR;

			if(isHorizontal) {
				rulesBox.classList.remove('vertical');
				rulesBox.classList.add('horizontal');
			} else {
				rulesBox.classList.remove('horizontal');
				rulesBox.classList.add('vertical');
			}

			rulesBoxHeader.style.setProperty('top', that.mainHeaderOffsetHeight + 'px', '');
			rulesBoxHeader.style.setProperty('left', rulesBoxGBCR.left + 'px', '');
			rulesBoxHeader.style.setProperty('right', window.innerWidth - rulesBoxGBCR.right + 'px', '');

			rulesBoxSectionInner.style.setProperty('top', (that.mainHeaderOffsetHeight + 40) + 'px', '');//TODO: need to dyna
			rulesBoxSectionInner.style.setProperty('left', (rulesBoxGBCR.left + 1) + 'px', '');
			if(isHorizontal) {
				rulesBoxSectionInner.style.setProperty('right', null, '');
			} else {
				rulesBoxSection.style.setProperty('min-height', rulesBoxSectionInnerOffsetHeight + 'px', '');
				rulesBoxSectionInner.style.setProperty('right', (rulesBoxGBCR.left + 1) + 'px', '');
			}

			function positionHandler() {

				that.each(fixTargets, function(fixTarget, i) {

					var fixTargetGBCR;
					var rulesBoxGBCR = rulesBox.getBoundingClientRect();

					//enter
					if(rulesBoxGBCR.top <= that.mainHeaderOffsetHeight + 1) {

						fixTarget.classList.add('float-in-window', 'fixed-in-window');
						fixTarget.classList.remove('absolute-in-window');

						fixTargetGBCR = fixTargetGBCR || fixTarget.getBoundingClientRect();

						console.log('==================');
						console.log(fixTarget.className);
						console.log('rulesBoxGBCR.bottom:' + rulesBoxGBCR.bottom);
						console.log('fixTargetGBCR.bottom:' + fixTargetGBCR.bottom);

						//transition
						if(rulesBoxGBCR.bottom <= fixTargetGBCR.bottom) {

							fixTarget.classList.remove('fixed-in-window');
							fixTarget.classList.add('absolute-in-window');

						}

						//out
					} else {
						fixTargetGBCR = null;
						fixTarget.classList.remove('float-in-window', 'fixed-in-window', 'absolute-in-window');
					}


				});
			}

			window.addEventListener('scroll', positionHandler);
			window.addEventListener('load', positionHandler);
			that.positionHandlers.push(positionHandler);
		});
	}

};

STYLEV.RULES.execute();