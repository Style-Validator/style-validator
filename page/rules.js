'use strict';

var STYLEV = STYLEV || {};

STYLEV.RULES_EDITOR = {

	execute: function() {
		var that = STYLEV.RULES_EDITOR;

		that.setParameters();
		that.insertDummyElements();
		that.getAllCSSProperties();
		that.setCSSPropertyDataList();
		that.removeSaveButtonWhenNotLocal();
		that.initializeRuleArea();
	},
	initializeRuleArea: function() {
		var that = STYLEV.RULES_EDITOR;

		that.showCurrentJSON()
			.then(function() {

				that.setParametersAfterAdding();
				that.bindEvents();
				that.setStyleDataOfWidthHeight();
				that.resizeTextareaBasedOnLine();

			});
	},
	setParameters: function() {
		var that = STYLEV.RULES_EDITOR;

		that.resetButton = document.querySelector('#reset-button');
		that.addButton = document.querySelector('#add-button');
		that.saveButton = document.querySelector('#save-button');
		that.downloadButton = document.querySelector('#download-button');
		that.datalistOfProperties = document.querySelector('#all-css-properties');
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
		that.allCSSProperties = [];
		that.INPUT_ARROW_WIDTH = 22;
	},
	setParametersAfterAdding: function() {
		var that = STYLEV.RULES_EDITOR;

		that.rulesListItems = that.rulesList.querySelectorAll(':scope > li');
		that.stylesSelects = that.rulesList.querySelectorAll('.styles-select');
		that.stylesLists = that.rulesList.querySelectorAll('.styles-list');
		that.stylesInputs = that.rulesList.querySelectorAll('.styles-input');
		that.reasons = that.rulesList.querySelectorAll('.reason');
		that.referenceURLs = that.rulesList.querySelectorAll('.reference-url');
	},
	bindEvents: function() {
		var that = STYLEV.RULES_EDITOR;

		that.resetButton.addEventListener('click', that.initializeRuleArea, false);
		that.addButton.addEventListener('click', that.addRule, false);
		that.saveButton.addEventListener('click', that.saveJSON, false);
		that.downloadButton.addEventListener('mousedown', that.setParamAndFunc2DownloadButton, false);
		that.reasonCheckbox.addEventListener('change', that.toggleReason, false);
		that.referenceURLCheckbox.addEventListener('change', that.toggleReferenceURL, false);
		window.addEventListener('resize', that.resizeTextareaBasedOnLine, false);

		that.bind2RuleBox();
		that.bind2StylesList();
	},

	toggleReason: function(event) {
		var that = STYLEV.RULES_EDITOR;
		for(var i = 0, reasons = that.reasons, reasonsLen = reasons.length; i < reasonsLen; i++) {
			var reason = reasons[i];
			reason.hidden = !event.currentTarget.checked;
		}
	},

	toggleReferenceURL: function(event) {
		var that = STYLEV.RULES_EDITOR;
		for(var i = 0, referenceURLs = that.referenceURLs, referenceURLsLen = referenceURLs.length; i < referenceURLsLen; i++) {
			var referenceURL = referenceURLs[i];
			referenceURL.hidden = !event.currentTarget.checked;
		}
	},

	removeSaveButtonWhenNotLocal: function() {
		var that = STYLEV.RULES_EDITOR;
		if(location.hostname === 'style-validator.io') {
			that.saveButton.hidden = true;
		}
	},
	
	setParamAndFunc2DownloadButton: function() {
		var that = STYLEV.RULES_EDITOR;
		var json = that.generateJSON();
		this.href = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(json, null, '\t'));
		alert('Download and replace file which named rules.json without rename the file');
	},

	bind2RuleBox: function() {
		var that = STYLEV.RULES_EDITOR;
		for(var i = 0, len = that.rulesListItems.length; i < len; i++) {
			var rulesListItem = that.rulesListItems[i];
			var editButton = rulesListItem.querySelector('.edit-button');
			var removeButton = rulesListItem.querySelector('.remove-button');
			editButton.addEventListener('click', that.toggleEditMode, false);
			removeButton.addEventListener('click', that.removeTheRule, false);
		}
	},

	toggleEditMode: function() {
		var that = STYLEV.RULES_EDITOR;

		event.stopPropagation();
		event.preventDefault();

		var rulesListItem = that.closest(event.currentTarget, 'li');

		if(rulesListItem.classList.contains('edit-mode')) {

			that.modifyBasedOnCurrentData(rulesListItem);
			rulesListItem.classList.remove('edit-mode');
			this.textContent = 'Edit';
		} else {
			rulesListItem.classList.add('edit-mode');
			this.textContent = 'Set';
		}
	},

	modifyBasedOnCurrentData: function(rulesListItem) {
		var that = STYLEV.RULES_EDITOR;

		//TODO: データの有り無しで表示切り替え
		var dataElements = rulesListItem.querySelectorAll('.styles-list, .styles-input, .styles-select');

		for(var i = 0, len = dataElements.length; i < len; i++) {
			var dataElement = dataElements[i];
			var hasDataFlg = false;

			if(dataElement.classList.contains('styles-list')) {
				var inputLists = dataElement.querySelectorAll('input');
				if(inputLists === null) {
					hasDataFlg = false;
					break;
				}
				for(var j = 0, inputListLen = inputLists.length; j < inputListLen; j++) {
					var inputList = inputLists[j];
					if(inputList.value) {
						hasDataFlg = true;
						break;
					}
				}
			}
			if(dataElement.classList.contains('styles-input')) {
				var inputs = dataElement.querySelectorAll('input');
				if(inputs === null) {
					hasDataFlg = false;
					break;
				}
				for(var k = 0, inputLen = inputs.length; k < inputLen; k++) {
					var input = inputs[k];
					if(input.value) {
						hasDataFlg = true;
						break;
					}
				}
			}
			if(dataElement.classList.contains('styles-select')) {
				var selects = dataElement.querySelectorAll('select');
				if(selects === null) {
					hasDataFlg = false;
					break;
				}
				for(var l = 0, selectsLen = selects.length; l < selectsLen; l++) {
					var select = selects[l];
					if(select.value) {
						hasDataFlg = true;
						break;
					}
				}
			}
			if(hasDataFlg) {
				dataElement.classList.remove('hide-rule');
			} else {
				dataElement.classList.add('hide-rule');
			}
		}

	},

	removeTheRule: function(rulesListItem) {
		return function() {
			event.stopPropagation();
			event.preventDefault();

			if(confirm('Are you sure you want to remove the rule?')) {
				rulesListItem.parentElement.removeChild(rulesListItem);
			}
		};
	},

	bind2StylesList: function(targetstylesLists) {
		var that = STYLEV.RULES_EDITOR;

		that.stylesLists = targetstylesLists ? targetstylesLists : that.stylesLists;

		for(var i = 0, len = that.stylesLists.length; i < len; i++) {
			var stylesList = that.stylesLists[i];
//			stylesList.addEventListener('click', that.insertProperty, false);
			stylesList.addEventListener('focus', that.insertProperty, false);
		}
	},
	addRule: function() {
		var that = STYLEV.RULES_EDITOR;
		var clone = document.importNode(that.templateRule, true);
		var stylesLists = clone.querySelectorAll('.styles-list');

		that.bind2StylesList(stylesLists);
		that.rulesList.insertBefore(clone, that.rulesList.firstChild);
		that.setParametersAfterAdding();
		that.bind2RuleBox();
		that.rulesList.querySelector('.styles-input').querySelector('input').focus();
	},
	insertDummyElements: function() {
		var that = STYLEV.RULES_EDITOR;

		document.documentElement.appendChild(that.dummyElementWrapper);
		that.dummyElementWrapper.appendChild(that.dummyElement4detectWidth);
		that.dummyElementWrapper.appendChild(that.dummyElement4testStyle);
	},
	insertProperty: function(event, stylesList, property, propertyValue, reason, referenceURL) {

		var that = STYLEV.RULES_EDITOR;
		var stylesList = stylesList || event.currentTarget || event.target;
		var isBaseStyles = stylesList.dataset.id === 'base-styles';

		var clone = null;

		if(isBaseStyles) {
			clone = document.importNode(that.templatePropertyBase, true);
		} else {
			clone = document.importNode(that.templatePropertyNg, true);
		}

		if(property) {
			clone.querySelector('.css-property').value = property;
		}
		if(propertyValue) {
			clone.querySelector('.css-property-value').value = propertyValue;
		}
		if(reason) {
			clone.querySelector('.reason').value = reason;
		}
		if(referenceURL) {
			clone.querySelector('.reference-url').value = referenceURL;
		}

		stylesList.appendChild(clone);

		var appendedStylesListItem = stylesList.querySelector(':scope > li:last-child');
		that.doInsertedProperty(appendedStylesListItem, isBaseStyles);

		return appendedStylesListItem;
	},

	jump2urlOfValue: function(event) {
		location.href = event.currentTarget.value;
	},

	doInsertedProperty: function(appendedStylesListItem, isBaseStyles) {
		var that = STYLEV.RULES_EDITOR;
		var cssProperty = appendedStylesListItem.querySelector('.css-property');
		var cssPropertyValue = appendedStylesListItem.querySelector('.css-property-value');
		that.bindEvents2ListItem(appendedStylesListItem);
		that.bindEvents2CSSPropertyAndValue(cssProperty, cssPropertyValue);

		if(!isBaseStyles) {
			var reason = appendedStylesListItem.querySelector('.reason');
			var referenceURL = appendedStylesListItem.querySelector('.reference-url');
			that.bindEvents2Textarea(reason);
			referenceURL.addEventListener('dblclick', that.jump2urlOfValue, false);
		}

		cssProperty.focus();
	},
	bindEvents2ListItem: function(appendedStylesListItem) {
		var that = STYLEV.RULES_EDITOR;
		appendedStylesListItem.addEventListener('click', that.stopPropagation, false);
	},
	bindEvents2CSSPropertyAndValue: function(cssProperty, cssPropertyValue) {
		var that = STYLEV.RULES_EDITOR;
		cssProperty.addEventListener('click', that.stopPropagation, false);
		cssProperty.addEventListener('keyup', that.moveFocusByEnter, false);
		cssProperty.addEventListener('keyup', that.fireBlurEventByEscKey, false);
		cssProperty.addEventListener('input', that.modifyCSSProperty, false);
		cssProperty.addEventListener('focus', that.applySameStyles, false);
		cssProperty.addEventListener('blur', that.applyValidationResult, false);

		cssPropertyValue.addEventListener('click', that.stopPropagation, false);
		cssPropertyValue.addEventListener('keyup', that.insertPropertyByEnterKey, false);
		cssPropertyValue.addEventListener('keyup', that.fireBlurEventByEscKey, false);
		cssPropertyValue.addEventListener('input', that.modifyCSSPropertyValue, false);
		cssPropertyValue.addEventListener('focus', that.applySameStyles, false);
		cssPropertyValue.addEventListener('blur', that.applyValidationResult, false);
	},
	modifyCSSProperty: function(event, stylesListItem) {
		var that = STYLEV.RULES_EDITOR;

		var stylesListItem = stylesListItem || that.closest(event.currentTarget, 'li');
		var cssProperty = stylesListItem.querySelector('.css-property');
		var cssPropertyValue = stylesListItem.querySelector('.css-property-value');

		that.dummyElement4detectWidth.innerHTML = cssProperty.value;
		cssProperty.style.setProperty('width', (that.dummyElement4detectWidth.offsetWidth * 1.05 + that.INPUT_ARROW_WIDTH) + 'px', 'important');
		that.validateProperty(cssProperty, cssPropertyValue);
		that.validatePropertyValue(cssProperty, cssPropertyValue);

		return false;
	},
	modifyCSSPropertyValue: function(event, stylesListItem) {
		var that = STYLEV.RULES_EDITOR;

		var stylesListItem = stylesListItem || that.closest(event.currentTarget, 'li');
		var cssProperty = stylesListItem.querySelector('.css-property');
		var cssPropertyValue = stylesListItem.querySelector('.css-property-value');

		that.dummyElement4detectWidth.innerHTML = cssPropertyValue.value;
		cssPropertyValue.style.width = (that.dummyElement4detectWidth.offsetWidth * 1.05 + that.INPUT_ARROW_WIDTH) + 'px';
		that.validatePropertyValue(cssProperty, cssPropertyValue);
	},
	fireBlurEventByEscKey: function(event) {
		var escKeyCode = 27;

		if(event.keyCode === escKeyCode) {
			event.currentTarget.blur();
		}
	},
	moveFocusByEnter: function(event) {
		var that = STYLEV.RULES_EDITOR;
		var stylesListItem = that.closest(event.currentTarget, 'li');
		var cssPropertyValue = stylesListItem.querySelector('.css-property-value');
		var enterKeyCode = 13;
		if(event.keyCode === enterKeyCode) {
			cssPropertyValue.focus();
		}
	},
	insertPropertyByEnterKey: function(event) {
		var that = STYLEV.RULES_EDITOR;

		var stylesListItem = that.closest(event.currentTarget, 'li');
		var stylesList = stylesListItem.parentElement;
		var cssProperty = stylesListItem.querySelector('.css-property');
		var cssPropertyValue = stylesListItem.querySelector('.css-property-value');
		var enterKeyCode = 13;

		if(event.keyCode === enterKeyCode) {

			if(!cssProperty.value || !cssPropertyValue.value) {
				that.removeProperty(stylesList, stylesListItem);
			} else {
				that.insertProperty(null, stylesList);
			}
		}
	},
	validateProperty: function(cssProperty, cssPropertyValue) {
		var that = STYLEV.RULES_EDITOR;

		var property = cssProperty.value;
		var propertyValue = cssPropertyValue.value;
		var isValid = false;

		for(var i = 0, len = that.allCSSProperties.length; i < len; i++) {

			var propertyFromData = that.allCSSProperties[i];
			if(property === propertyFromData) {
				isValid = true;
				break;
			}
		}
		cssProperty.dataset_isvalid = isValid ? 'true' : 'false';

	},
	setStyleDataOfWidthHeight: function() {
		var that = STYLEV.RULES_EDITOR;

		var stylesheets = document.styleSheets;

		for(var i = 0, len = stylesheets.length; i < len; i++) {

			var stylesheet = stylesheets[i];
			var cssRules = stylesheet.cssRules;

			if(cssRules === null) {
				continue;
			}

			for(var j = 0, rulesLength = cssRules.length; j < rulesLength; j++) {

				var cssRule = cssRules[j];

				//TODO: support media query
				if(cssRule.media) {
					continue;
				}

				var selectorsOfCssRules = cssRule.selectorText;
				var styleOfCssRules = cssRule.style;
				var widthOfCssRules = !!styleOfCssRules.width ? styleOfCssRules.width : 'auto';
				var heightOfCssRules = !!styleOfCssRules.height ? styleOfCssRules.height : 'auto';

				var importantOfWidthOfCssRules = styleOfCssRules.getPropertyPriority('width');
				var importantOfHeightOfCssRules = styleOfCssRules.getPropertyPriority('height');
				var specificityArrayOfCssRules = SPECIFICITY.calculate(selectorsOfCssRules);

				//selectorの数分だけループ
				for(var k = 0, specificityArrayOfCssRulesLength = specificityArrayOfCssRules.length; k < specificityArrayOfCssRulesLength; k++) {

					var specificityObjectOfCssRules = specificityArrayOfCssRules[k];

					var selectorOfCssRules = specificityObjectOfCssRules.selector;
					var specificityOfCssRules = parseInt(specificityObjectOfCssRules.specificity.replace(/,/g, ''), 10);

					var targetsFromCssRules = document.querySelectorAll(selectorOfCssRules);

					for(var l = 0, targetsLength = targetsFromCssRules.length; l < targetsLength; l++) {

						var target = targetsFromCssRules[l];
						var styleOfStyleAttr = target.style;
						var widthOfStyleAttr = !!styleOfStyleAttr.width ? styleOfStyleAttr.width : 'auto';
						var heightOfStyleAttr = !!styleOfStyleAttr.height ? styleOfStyleAttr.height : 'auto';

						var specificityOfWidth = widthOfStyleAttr ? 1000 : specificityOfCssRules;
						var specificityOfHeight = heightOfStyleAttr ? 1000 : specificityOfCssRules;

						var importantOfWidthOfStyleAttr = styleOfStyleAttr.getPropertyPriority('width');
						var importantOfHeightOfStyleAttr = styleOfStyleAttr.getPropertyPriority('height');

						//initialize
						if(target.dataset_stylevwidthspecificity === undefined) {
							target.dataset_stylevwidthspecificity = specificityOfWidth;
						}
						if(target.dataset_stylevheightspecificity === undefined) {
							target.dataset_stylevheightspecificity = specificityOfHeight;
						}
						if(target.dataset_stylevwidthimportant === undefined) {
							target.dataset_stylevwidthimportant = importantOfWidthOfStyleAttr;
						}
						if(target.dataset_stylevheightimportant === undefined) {
							target.dataset_stylevheightimportant = importantOfHeightOfStyleAttr;
						}

						//TODO: もう1パターン？
						//CSS指定がありstyle属性がない
						if(widthOfCssRules && !widthOfStyleAttr) {
							if( specificityOfWidth >= parseInt(target.dataset_stylevwidthspecificity, 10) &&
								importantOfWidthOfCssRules.length >= target.dataset_stylevwidthimportant.length
							) {
								target.dataset_stylevwidth = widthOfCssRules;
								target.dataset_stylevwidthspecificity = specificityOfWidth;
								target.dataset_stylevwidthimportant = importantOfWidthOfCssRules;
							}
						}
						//importantのCSS指定とstyle属性
						if(widthOfCssRules && importantOfWidthOfCssRules && !importantOfWidthOfStyleAttr) {

							if( specificityOfWidth >= parseInt(target.dataset_stylevwidthspecificity, 10) &&
								importantOfWidthOfCssRules.length >= target.dataset_stylevwidthimportant.length
							) {
								target.dataset_stylevwidth = widthOfCssRules;
								target.dataset_stylevwidthspecificity = specificityOfWidth;
								target.dataset_stylevwidthimportant = importantOfWidthOfCssRules;
							}
						}
						//非importantのCSS指定とstyle属性
						if(widthOfCssRules && !importantOfWidthOfCssRules && widthOfStyleAttr) {

							if( specificityOfWidth >= parseInt(target.dataset_stylevwidthspecificity, 10) &&
								importantOfWidthOfStyleAttr.length >= target.dataset_stylevwidthimportant.length
							) {
								target.dataset_stylevwidth = widthOfStyleAttr;
								target.dataset_stylevwidthspecificity = specificityOfWidth;
								target.dataset_stylevwidthimportant = importantOfWidthOfStyleAttr;
							}
						}
						//style属性かつimportant
						if(widthOfStyleAttr && importantOfWidthOfStyleAttr) {
							if( specificityOfWidth >= parseInt(target.dataset_stylevwidthspecificity, 10) &&
								importantOfWidthOfStyleAttr.length >= target.dataset_stylevwidthimportant.length
							) {
								target.dataset_stylevwidth = widthOfStyleAttr;
								target.dataset_stylevwidthspecificity = specificityOfWidth;
								target.dataset_stylevwidthimportant = importantOfWidthOfStyleAttr;
							}
						}


						//CSS指定がありstyle属性がない
						if(heightOfCssRules && !heightOfStyleAttr) {
							if( specificityOfHeight >= parseInt(target.dataset_stylevheightspecificity, 10) &&
								importantOfWidthOfStyleAttr.length >= target.dataset_stylevheightimportant.length
							) {
								target.dataset_stylevheight = heightOfCssRules;
								target.dataset_stylevheightspecificity = specificityOfHeight;
								target.dataset_stylevheightimportant = importantOfHeightOfStyleAttr;
							}
						}
						//CSS指定がありimportantとstyle属性
						if(heightOfCssRules && importantOfHeightOfCssRules && heightOfStyleAttr) {
							if( specificityOfHeight >= parseInt(target.dataset_stylevheightspecificity, 10) &&
								importantOfWidthOfStyleAttr.length >= target.dataset_stylevheightimportant.length
							) {
								target.dataset_stylevheight = heightOfCssRules;
								target.dataset_stylevheightspecificity = specificityOfHeight;
								target.dataset_stylevheightimportant = importantOfHeightOfStyleAttr;
							}
						}

						//CSS指定があり非importantとstyle属性
						if(heightOfCssRules && !importantOfHeightOfCssRules && heightOfStyleAttr) {
							if( specificityOfHeight >= parseInt(target.dataset_stylevheightspecificity, 10) &&
								importantOfWidthOfStyleAttr.length >= target.dataset_stylevheightimportant.length
							) {
								target.dataset_stylevheight = heightOfStyleAttr;
								target.dataset_stylevheightspecificity = specificityOfHeight;
								target.dataset_stylevheightimportant = importantOfHeightOfStyleAttr;
							}
						}
						//style属性かつimportant
						if(heightOfStyleAttr && importantOfHeightOfStyleAttr) {
							if( specificityOfHeight >= parseInt(target.dataset_stylevheightspecificity, 10) &&
								importantOfWidthOfStyleAttr.length >= target.dataset_stylevheightimportant.length
							) {
								target.dataset_stylevheight = heightOfStyleAttr;
								target.dataset_stylevheightspecificity = specificityOfHeight;
								target.dataset_stylevheightimportant = importantOfHeightOfStyleAttr;
							}
						}

					}
				}

			}
		}
	},
	getUncomputedStyle: function(target, property, propertyValue) {
		var that = STYLEV.RULES_EDITOR;
		var culculatedValue;

		if(
			(property === 'width' || property === 'height') &&
			propertyValue === 'auto'
		) {

			if(property === 'width') {

				if(target.dataset_stylevwidth === 'auto') {
					culculatedValue = target.dataset_stylevwidth;
				} else {
					culculatedValue = getComputedStyle(target, '').getPropertyValue(property);
				}
			}

			if(property === 'height') {

				if(target.dataset_stylevheight === 'auto') {
					culculatedValue = target.dataset_stylevheight;
				} else {
					culculatedValue = getComputedStyle(target, '').getPropertyValue(property);
				}
			}

		} else {

			culculatedValue = getComputedStyle(target, '').getPropertyValue(property);
		}

		return culculatedValue;
	},
	validatePropertyValue: function(cssProperty, cssPropertyValue) {

		var that = STYLEV.RULES_EDITOR;
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

			for(var i = 0, len = separatedPropertyValues.length; i < len; i++) {
				var separatedPropertyValue = separatedPropertyValues[i];

				that.dummyElement4testStyle.style.setProperty(property, separatedPropertyValue, '');

				var computedValue = that.getUncomputedStyle(that.dummyElement4testStyle, property, separatedPropertyValue);
				that.dummyElement4testStyle.style.setProperty(property, null, '');

				var isValid = separatedPropertyValue === computedValue || regexOkOriginalKeyWords.test(' ' + separatedPropertyValue + ' ');

				if(!isValid) {
					isValidOfGroupValue = false;
					break;
				}

			}

			cssPropertyValue.dataset_isvalid = isValidOfGroupValue ? 'true' : 'false';

		} else {

			that.dummyElement4testStyle.style.setProperty(property, propertyValue, '');

			var computedValue = that.getUncomputedStyle(that.dummyElement4testStyle, property, propertyValue);
			that.dummyElement4testStyle.style.setProperty(property, null, '');

			var isValid = propertyValue === computedValue || regexOkOriginalKeyWords.test(' ' + propertyValue + ' ');

			cssPropertyValue.dataset_isvalid = isValid ? 'true' : 'false';

		}
	},
	applyValidationResult: function(event, stylesListItem) {

		var that = STYLEV.RULES_EDITOR;
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
	setCSSPropertyDataList: function() {
		var that = STYLEV.RULES_EDITOR;
		var df = document.createDocumentFragment();
		for(var j = 0, propLen = that.allCSSProperties.length; j < propLen; j++) {
			var prop = that.allCSSProperties[j];
			var option = new Option(prop, prop);
			df.appendChild(option);
		}
		that.datalistOfProperties.appendChild(df);
	},
	stopPropagation: function() {
		event.stopPropagation();
	},
	applySameStyles: function(event) {
		var that = STYLEV.RULES_EDITOR;
		var currentTarget = event.currentTarget;
		that.dummyElement4detectWidth.innerHTML = currentTarget.value;
		that.dummyElement4detectWidth.style['font-size'] = getComputedStyle(currentTarget, '').getPropertyValue('font-size');
		that.dummyElement4detectWidth.style['font-family'] = getComputedStyle(currentTarget, '').getPropertyValue('font-family');
		currentTarget.select();
	},
	removeProperty: function(stylesList, stylesListItem) {
		stylesList.removeChild(stylesListItem);
	},
	getAllCSSProperties: function() {
		var that = STYLEV.RULES_EDITOR;
		var properties = document.documentElement.style;

		for(var property in properties) {

			if(properties.hasOwnProperty(property)) {
				var propertyValue = properties[property];//TODO: remove?

				if( property === 'cssFloat') {
					property = 'float';
				}

				if( property === 'cssText' ||
					property === 'parentRule' ||
					property === 'length' ||
					property === '0' ||
					property === 'all'
				) {
					continue;
				}
				that.allCSSProperties.push(that.camel2Hyphen(property));
			}
		}
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
	showCurrentJSON: function() {
		var that = STYLEV.RULES_EDITOR;
		var df = document.createDocumentFragment();

		that.rulesList.innerHTML = '';//TODO: add loading image...

		return new Promise(function(resolve, reject) {

			that.getURL('../extension/data/rules.json')
				.then(JSON.parse)
				.then(function(data) {

					that.currentJSON = data;

					for(var i = 0, len = that.currentJSON.length; i < len; i++) {

						var rule = that.currentJSON[i];
						var ngStyles = rule['ng-styles'];

						var clone = document.importNode(that.templateRule, true);
						var styleSelects = clone.querySelectorAll('.styles-select');
						var stylesListsBase = clone.querySelectorAll('.styles-list-base');
						var stylesListsNg = clone.querySelectorAll('.styles-list-ng');
						var styleInputs = clone.querySelectorAll('.styles-input');

						for(var h = 0, styleSelectsLength = styleSelects.length; h < styleSelectsLength; h++) {
							var styleSelect = styleSelects[h];
							styleSelect.querySelector('select').tabIndex = 1;
							that.addPropertyFromJSON2HTML(styleSelect, rule, styleSelect.dataset.id);
						}
						for(var j = 0, stylesListsBaseLength = stylesListsBase.length; j < stylesListsBaseLength; j++) {
							var stylesListBase = stylesListsBase[j];
							stylesListBase.tabIndex = 1;
							that.addPropertyFromJSON2HTML(stylesListBase, rule, stylesListBase.dataset.id);
						}
						for(var m = 0, stylesListsNgLength = stylesListsNg.length; m < stylesListsNgLength; m++) {
							var stylesListNg = stylesListsNg[m];
							stylesListNg.tabIndex = 1;
							that.addPropertyFromJSON2HTML(stylesListNg, ngStyles, stylesListNg.dataset.id);
						}
						for(var k = 0, styleInputsLength = styleInputs.length; k < styleInputsLength; k++) {
							var styleInput = styleInputs[k];
							styleInput.querySelector('input').tabIndex = 1;
							that.addPropertyFromJSON2HTML(styleInput, rule, styleInput.dataset.id);
						}

						df.appendChild(clone);

					}

					that.rulesList.appendChild(df);

					resolve();

				});
		});
	},

	addPropertyFromJSON2HTML: function(target, rule, id) {
		var that = STYLEV.RULES_EDITOR;
		var ruleStyles = rule && rule[id];

		if(ruleStyles) {

			if(target.classList.contains('styles-select')) {

				var select = target.querySelector('select');
				select.value = ruleStyles;

			}
			if(target.classList.contains('styles-list')) {

				for(var property in ruleStyles) {
					if(ruleStyles.hasOwnProperty(property)) {


						var propertyValue = ruleStyles[property];
						var reason;
						var referenceURL;
						if(propertyValue instanceof Array) {
							referenceURL = propertyValue[2];
							reason = propertyValue[1];
							propertyValue = propertyValue[0];
						}

						var stylesListItem = that.insertProperty(null, target, property, propertyValue, reason, referenceURL);
						that.modifyCSSProperty(null, stylesListItem);
						that.modifyCSSPropertyValue(null, stylesListItem);
						that.applyValidationResult(null, stylesListItem);
					}
				}
			}
			if(target.classList.contains('styles-input')) {
				var input = target.querySelector('input');
				input.value = ruleStyles;

				if(id === 'reference-url') {
					//TODO: URLは強制的にdisplay: none;に。URLができ次第復活させる
					target.classList.add('hide-rule');
					var anchor = target.querySelector('a');
					if(anchor) {
						anchor.href = ruleStyles;
					}
				}
			}


		} else {

			target.classList.add('hide-rule');
		}
	},

	generateJSON: function() {
		var that = STYLEV.RULES_EDITOR;
		var json = [];

		that.rulesListItems = that.rulesList.querySelectorAll(':scope > li');

		for(var r = 0, rulesListItemsLength = that.rulesListItems.length; r < rulesListItemsLength; r++) {

			var rule = {};

			var rulesListItem = that.rulesListItems[r];
			var dataElements = rulesListItem.querySelectorAll('.styles-list, .styles-input, .styles-select');

			for(var i = 0, len = dataElements.length; i < len; i++) {

				var dataElement = dataElements[i];
				var id = dataElement.dataset.id;

				if(dataElement.classList.contains('styles-select')) {

					var styleSelect = dataElement;

					var styleSelectItem = styleSelect.querySelector('select');

					if(styleSelectItem.value) {
						rule[id] = styleSelectItem.value;
					}
				}

				if(dataElement.classList.contains('styles-list-base')) {

					var stylesListItems = dataElement.querySelectorAll(':scope > li');

					if(!stylesListItems.length) {
						continue;
					}
					rule[id] = {};

					for(var j = 0, stylesListItemsLength = stylesListItems.length; j < stylesListItemsLength; j++) {

						var stylesListItem = stylesListItems[j];
						var property = stylesListItem.querySelector('.css-property');
						var propertyValue = stylesListItem.querySelector('.css-property-value');

						//TODO: 検証が通っていないものも入れるようにしているが、後々ベストな振る舞いについて考える
//						if (
//							property.dataset_isvalid === 'true' &&
//							propertyValue.dataset_isvalid === 'true'
//						) {

						rule[id][property.value] = propertyValue.value;
//						}
					}
				}
				if(dataElement.classList.contains('styles-list-ng')) {

					var stylesListItems = dataElement.querySelectorAll(':scope > li');

					if(!stylesListItems.length) {
						continue;
					}
					rule['ng-styles'] = {};
					rule['ng-styles'][id] = {};

					for(var j = 0, stylesListItemsLength = stylesListItems.length; j < stylesListItemsLength; j++) {

						var stylesListItem = stylesListItems[j];
						var property = stylesListItem.querySelector('.css-property');
						var propertyValue = stylesListItem.querySelector('.css-property-value');
						var reason = stylesListItem.querySelector('.reason');
						var referenceURL = stylesListItem.querySelector('.reference-url');

						rule['ng-styles'][id][property.value] = [];
						rule['ng-styles'][id][property.value][0] = propertyValue.value;
						rule['ng-styles'][id][property.value][1] = reason.value;
						rule['ng-styles'][id][property.value][2] = referenceURL.value;
					}
				}

				if(dataElement.classList.contains('styles-input')) {

					var styleInput = dataElement;

					var styleInputItem = styleInput.querySelector('input');

					if(styleInputItem.value) {
						rule[id] = styleInputItem.value;
					}
				}


			}

			json.push(rule);
		}

		return json;
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
		var that = STYLEV.RULES_EDITOR;

		var xhr = new XMLHttpRequest();
		var apiURI = 'http://localhost:8001/saveJSON';
		var method = 'POST';
		var json = that.generateJSON();
		var data4send = JSON.stringify(json, null, '\t');

		xhr.open(method, apiURI, true);
		xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

		xhr.addEventListener('load', function () {
			if (xhr.status === 200) {
				that.showSuccessMsg();
			} else {
				that.showErrorMsg();
			}
		}, false);
		xhr.onerror = function () {
			that.showErrorMsg();
		};
		//TODO: add handling of response
		//TODO: not server connected, alert error

		if (xhr.readyState == 4) return;

		xhr.send(data4send);
	},
	showSuccessMsg: function() {
		alert('Saving of rules was successful! Let\'s send Pull Request!');
	},
	showErrorMsg: function() {
		alert('It could not connect to api server. Connect to api server, or click download button.')
	},

	closest: function(target, selector) {
		var selector = selector.toLowerCase();

		if(selector.indexOf(' ') !== -1 || selector.split(/[\.|#]/).length > 1) {
			return null;
		}

		var selectorType = (function() {
			if(selector.indexOf('.') === 0) {
				selector = selector.substr(1);
				return 'class';
			} else if(selector.indexOf('#') === 0) {
				selector = selector.substr(1);
				return 'id';
			} else {
				return 'tag';
			}
		}());

		while(
			target !== null &&
			!(
				(selectorType === 'tag' && target.tagName.toLowerCase() === selector) ||
				(selectorType === 'class' && target.classList.contains(selector)) ||
				(selectorType === 'id' && target.id === selector)
			)
		) {
			target = target.parentElement;
		}

		return target;
	},

	resizeTextareaBasedOnLine: function() {
		var that = STYLEV.RULES_EDITOR;
		var reasons = that.reasons;
		for(var i = 0, reasonsLen = reasons.length; i < reasonsLen; i++) {
			var reason = reasons[i];
			that.adjustHeight(null, reason);
		}
	},

	bindEvents2Textarea: function(textarea) {
		var that = STYLEV.RULES_EDITOR;
		textarea.addEventListener('keyup', that.adjustHeight, false);
	},

	adjustHeight: function(event, target) {
		var target = target || event.currentTarget || event.target;
		target.style.setProperty('height', 0 + 'px', '');
		target.style.setProperty('height', target.scrollHeight + 'px', '');
	}

};

STYLEV.RULES_EDITOR.execute();