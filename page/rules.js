'use strict';

var STYLEV = STYLEV || {};

STYLEV.RULES_EDITOR = {

	execute: function() {
		var that = STYLEV.RULES_EDITOR;

		that.setParameters();
		that.insertDummyElements();
		that.getAllCSSProperties();
		that.setCSSPropertyDataList();

		that.showCurrentJSON()
			.then(function() {

				that.setParametersAfterAdding();
				that.bindEvents();
				that.setStyleDataOfWidthHeight();
			});
	},
	setParameters: function() {
		var that = STYLEV.RULES_EDITOR;

		that.addButton = document.querySelector('#add-button');
		that.saveButton = document.querySelector('#save-button');
		that.downloadButton = document.querySelector('#download-button');
		that.datalistOfProperties = document.querySelector('#all-css-properties');
		that.rulesList = document.querySelector('#rules-list');
		that.templateProperty = document.querySelector('#template-property').content;
		that.templateRule = document.querySelector('#template-rule').content;
		that.dummyElementWrapper = document.createElement('div');
		that.dummyElementWrapper.className = 'dummy-wrapper';
		that.dummyElement4detectWidth = document.createElement('div');
		that.dummyElement4detectWidth.id = 'dummy-element-4-detect-width';
		that.dummyElement4detectWidth.className = 'dummy';
		that.dummyElement4testStyle = document.createElement('div');
		that.dummyElement4testStyle.id = 'dummy-element-4-test-style';
		that.dummyElement4testStyle.className = 'dummy';
		that.allCSSProperties = [];
		that.INPUT_ARROW_WIDTH = 22;
	},
	setParametersAfterAdding: function() {
		var that = STYLEV.RULES_EDITOR;

		that.rulesListItems = that.rulesList.querySelectorAll(':scope > li')
		that.stylesSelects = that.rulesList.querySelectorAll('.styles-select');
		that.stylesLists = that.rulesList.querySelectorAll('.styles-list');
		that.stylesInputs = that.rulesList.querySelectorAll('.styles-input');
	},
	bindEvents: function() {
		var that = STYLEV.RULES_EDITOR;

		that.addButton.addEventListener('click', that.addRule, false);
		that.saveButton.addEventListener('click', that.saveJSON, false);
		that.downloadButton.addEventListener('mousedown', that.setParamAndFunc2DownloadButton, false);

		that.bind2RuleBox();
		that.bind2StylesList();
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
			editButton.addEventListener('click', (that.toggleEditMode(rulesListItem)), false);
			removeButton.addEventListener('click', (that.removeTheRule(rulesListItem)), false);
		}

	},

	toggleEditMode: function(rulesListItem) {
		var that = STYLEV.RULES_EDITOR;

		return function() {
			event.stopPropagation();
			event.preventDefault();

			if(rulesListItem.className.indexOf(' edit-mode') !== -1) {

				that.updateShowing(rulesListItem);
				rulesListItem.className = rulesListItem.className.replace(' edit-mode', '');
				this.textContent = 'Edit';
			} else {
				rulesListItem.className += ' edit-mode';
				this.textContent = 'Set';
			}
		};
	},

	updateShowing: function(rulesListItem) {
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

	bind2StylesList: function(targetStyleLists) {
		var that = STYLEV.RULES_EDITOR;

		that.stylesLists = targetStyleLists ? targetStyleLists : that.stylesLists;

		for(var i = 0, len = that.stylesLists.length; i < len; i++) {
			var stylesList = that.stylesLists[i];
			stylesList.addEventListener('click', that.insertProperty, false);
			stylesList.addEventListener('focus', that.insertProperty, false);
		}
	},
	addRule: function() {
		var that = STYLEV.RULES_EDITOR;
		var clone = document.importNode(that.templateRule, true);

		var styleSelects = clone.querySelectorAll('.styles-select');
		var styleLists = clone.querySelectorAll('.styles-list');
		var styleInputs = clone.querySelectorAll('.styles-input');
		that.bind2StylesList(styleLists);
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
	insertProperty: function(styleList, property, propertyValue) {
		var that = STYLEV.RULES_EDITOR;
		var styleList = styleList.nodeType ? styleList : event.currentTarget;
		var clone = document.importNode(that.templateProperty, true);

		if(property) {
			clone.querySelector('.css-property').value = property;
		}
		if(propertyValue) {
			clone.querySelector('.css-property-value').value = propertyValue;
		}

		styleList.appendChild(clone);

		var appendedListItem = styleList.querySelector('li:last-child');
		that.doInsertedProp(appendedListItem);

		return appendedListItem;
	},
	doInsertedProp: function(appendedListItem) {
		var that = STYLEV.RULES_EDITOR;
		var cssProperty = appendedListItem.querySelector('.css-property');
		var cssPropertyValue = appendedListItem.querySelector('.css-property-value');
		that.bind2ListItem(appendedListItem);
		that.bind2CSSProperty(cssProperty);
		that.bind2CSSPropertyValue(cssPropertyValue);
		cssProperty.focus();
	},
	openDatalist: function(element){

		var keyboardEvent = document.createEvent("KeyboardEvent");
		var code = 40;

		Object.defineProperty(keyboardEvent, 'keyCode', {
			get : function() {
				return this.keyCodeVal;
			}
		});

		Object.defineProperty(keyboardEvent, 'which', {
			get : function() {
				return this.keyCodeVal;
			}
		});

		keyboardEvent.initKeyboardEvent(
			"keyup", // event type : keydown, keyup, keypress
			true, // bubbles
			true, // cancelable
			window, // viewArg: should be window
			false, // ctrlKeyArg
			false, // altKeyArg
			false, // shiftKeyArg
			false, // metaKeyArg
			code, // keyCodeArg : unsigned long the virtual key code, else 0
			code // charCodeArgs : unsigned long the Unicode character associated with the depressed key, else 0
		);

		keyboardEvent.keyCodeVal = code;
		element.dispatchEvent(keyboardEvent);
	},
	openSelect: function(element){
		var worked = false;
		if (document.createEvent) { // all browsers
			var e = document.createEvent("MouseEvents");
			e.initMouseEvent("mousedown", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
			worked = element.dispatchEvent(e);
		} else if (element.fireEvent) { // ie
			worked = element.fireEvent("onmousedown");
		}
		if (!worked) { // unknown browser / error
			alert("It didn't worked in your browser.");
		}
	},
	bind2ListItem: function(appendedListItem) {
		var that = STYLEV.RULES_EDITOR;
		appendedListItem.addEventListener('click', that.stopPropagation, false);
	},
	bind2CSSProperty: function(cssProperty) {
		var that = STYLEV.RULES_EDITOR;
		cssProperty.addEventListener('click', that.stopPropagation, false);
		cssProperty.addEventListener('keyup', that.moveFocusByEnter, false);
		cssProperty.addEventListener('input', that.modifyCSSProperty, false);
		cssProperty.addEventListener('focus', that.applySameStyles, false);
		cssProperty.addEventListener('blur', that.applyValidationResult, false);
	},
	bind2CSSPropertyValue: function(cssPropertyValue) {
		var that = STYLEV.RULES_EDITOR;
		cssPropertyValue.addEventListener('click', that.stopPropagation, false);
		cssPropertyValue.addEventListener('keyup', that.insertPropertyByEnter, false);
		cssPropertyValue.addEventListener('input', that.modifyCSSPropertyValue, false);
		cssPropertyValue.addEventListener('focus', that.applySameStyles, false);
		cssPropertyValue.addEventListener('blur', that.applyValidationResult, false);
	},
	modifyCSSProperty: function(event, styleListItem) {
		var that = STYLEV.RULES_EDITOR;

		var currentTarget = event ? event.currentTarget : null;
		var styleListItem = currentTarget ? currentTarget.parentElement : styleListItem;
		var cssProperty = styleListItem.querySelector('.css-property');
		var cssPropertyValue = styleListItem.querySelector('.css-property-value');

		that.dummyElement4detectWidth.innerHTML = cssProperty.value;
		cssProperty.style.setProperty('width', (that.dummyElement4detectWidth.offsetWidth * 1.05 + that.INPUT_ARROW_WIDTH) + 'px', 'important');
		that.validateProperty(cssProperty, cssPropertyValue);
		that.validatePropertyValue(cssProperty, cssPropertyValue);

		return false;
	},
	moveFocusByEnter: function(event) {
		var that = STYLEV.RULES_EDITOR;
		var styleListItem = event.currentTarget.parentElement;
		var cssPropertyValue = styleListItem.querySelector('.css-property-value');
		if(event.keyCode === 13) {
			cssPropertyValue.focus();
		}
	},
	modifyCSSPropertyValue: function(event, styleListItem) {
		var that = STYLEV.RULES_EDITOR;

		var currentTarget = event ? event.currentTarget : null;
		var styleListItem = currentTarget ? currentTarget.parentElement : styleListItem;
		var cssProperty = styleListItem.querySelector('.css-property');
		var cssPropertyValue = styleListItem.querySelector('.css-property-value');

		that.dummyElement4detectWidth.innerHTML = cssPropertyValue.value;
		cssPropertyValue.style.width = (that.dummyElement4detectWidth.offsetWidth * 1.05 + that.INPUT_ARROW_WIDTH) + 'px';
		that.validatePropertyValue(cssProperty, cssPropertyValue);
	},
	insertPropertyByEnter: function(event) {
		var that = STYLEV.RULES_EDITOR;

		var currentTarget = event.currentTarget;
		var styleListItem = currentTarget.parentElement;
		var cssProperty = styleListItem.querySelector('.css-property');
		var cssPropertyValue = styleListItem.querySelector('.css-property-value');
		var styleList = styleListItem.parentElement;

		if(event.keyCode === 13) {

			if(!cssProperty.value || !cssPropertyValue.value) {
				that.removeProperty(styleList, styleListItem);
				return false;
			}

			that.insertProperty(styleListItem);
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

//			console.log('computedValue: ' + computedValue);
//			console.log('propertyValue: ' + propertyValue);

			var isValid = propertyValue === computedValue || regexOkOriginalKeyWords.test(' ' + propertyValue + ' ');

			cssPropertyValue.dataset_isvalid = isValid ? 'true' : 'false';

		}


//		var groupValue;
//
//		if(hasTheNotOperator) {
//			groupValue = propertyValue.match(/^!\[([a-z|A-Z|0-9|,|!|\(|\)]+)\]$/)[1];
//		} else {
//			groupValue = propertyValue.match(/^[a-z|A-Z|0-9|,|!|\(|\)]+$/);
//		}
//
//		if(groupValue === null) {
//			isValidOfGroupValue = false;
//			new Error('Syntax Error in Value (' + propertyValue + ')');
//		} else {
//			var separatedValues = groupValue.split('|');
//
//			for(var i = 0, len = separatedValues.length; i < len; i++) {
//
//				var separatedValue = separatedValues[i];
//
//
//			}
//		}

	},
	applyValidationResult: function(event, styleListItem) {

		var that = STYLEV.RULES_EDITOR;
		var currentTarget = event ? event.currentTarget : null;
		var styleListItem = currentTarget ? currentTarget.parentElement : styleListItem;
		var cssProperty = styleListItem.querySelector('.css-property');
		var cssPropertyValue = styleListItem.querySelector('.css-property-value');
		var styleList = styleListItem.parentElement;

		if(!cssProperty.value && !cssPropertyValue.value) {
			that.removeProperty(styleList, styleListItem);
			return false;
		}

		if(currentTarget) {
			currentTarget.style.setProperty('margin-right',(-that.INPUT_ARROW_WIDTH) + 'px', '');
			setTimeout(that.updateValidClass, 0, currentTarget);
		} else {
			cssProperty.style.setProperty('margin-right', (-that.INPUT_ARROW_WIDTH) + 'px', '');
			cssPropertyValue.style.setProperty('margin-right', (-that.INPUT_ARROW_WIDTH) + 'px', '');
			setTimeout(that.updateValidClass, 0, cssProperty);
			setTimeout(that.updateValidClass, 0, cssPropertyValue);
		}

	},
	updateValidClass: function(currentTarget) {
		if(currentTarget && currentTarget.value) {
			var hasTheClass;
			if(currentTarget.dataset_isvalid === 'true') {
				currentTarget.className = currentTarget.className.replace(' invalid', '');
				hasTheClass = currentTarget.className.indexOf(' valid') !== -1;
				currentTarget.className += !hasTheClass ? ' valid' : '';
			} else {
				currentTarget.className = currentTarget.className.replace(' valid', '');
				hasTheClass = currentTarget.className.indexOf(' invalid') !== -1;
				currentTarget.className += !hasTheClass ? '  invalid' : '';
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
	removeProperty: function(styleList, styleListItem) {
		var that = STYLEV.RULES_EDITOR;
		styleList.removeChild(styleListItem);
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

		return new Promise(function(resolve, reject) {

			that.getURL('../extension/data/rules.json')
				.then(JSON.parse)
				.then(function(data) {

					that.currentJSON = data;

					for(var i = 0, len = that.currentJSON.length; i < len; i++) {

						var rule = that.currentJSON[i];

						var clone = document.importNode(that.templateRule, true);
						var styleSelects = clone.querySelectorAll('.styles-select');
						var styleLists = clone.querySelectorAll('.styles-list');
						var styleInputs = clone.querySelectorAll('.styles-input');

						for(var h = 0, styleSelectsLength = styleSelects.length; h < styleSelectsLength; h++) {
							var styleSelect = styleSelects[h];
							styleSelect.querySelector('select').tabIndex = 1;
							that.addPropertyFromHTMLToJSON(styleSelect, rule, styleSelect.dataset.id);
						}
						for(var j = 0, styleListsLength = styleLists.length; j < styleListsLength; j++) {
							var styleList = styleLists[j];
							styleList.tabIndex = 1;
							that.addPropertyFromHTMLToJSON(styleList, rule, styleList.dataset.id);
						}
						for(var k = 0, styleInputsLength = styleInputs.length; k < styleInputsLength; k++) {
							var styleInput = styleInputs[k];
							styleInput.querySelector('input').tabIndex = 1;
							that.addPropertyFromHTMLToJSON(styleInput, rule, styleInput.dataset.id);
						}

						df.appendChild(clone);

					}

					that.rulesList.appendChild(df);

					resolve();

				});
		});
	},

	addPropertyFromHTMLToJSON: function(target, rule, id) {
		var that = STYLEV.RULES_EDITOR;
		var ruleStyles = rule[id];

		if(ruleStyles) {

			if(target.className === 'styles-select') {

				var select = target.querySelector('select');
				select.value = ruleStyles;

			}
			if(target.className === 'styles-list') {
				for(var property in ruleStyles) {
					if(ruleStyles.hasOwnProperty(property)) {
						var propertyValue = ruleStyles[property];
						var styleListItem = that.insertProperty(target, property, propertyValue);
						that.modifyCSSProperty(null, styleListItem);
						that.modifyCSSPropertyValue(null, styleListItem);
						that.applyValidationResult(null, styleListItem);
					}
				}
			}
			if(target.className === 'styles-input') {
				var input = target.querySelector('input');
				input.value = ruleStyles;

				if(id === 'reference-url') {
					//TODO: URLは強制的にdisplay: none;に。URLができ次第復活させる
					target.classList.add('hide-rule');
//					target.style.setProperty('display', 'none', '');
					var anchor = target.querySelector('a');
					if(anchor) {
						anchor.href = ruleStyles;
					}
				}
			}


		} else {

			target.classList.add('hide-rule');
//			target.style.setProperty('display', 'none', '');
		}
	},

	selectJSONText: function() {
		var that = STYLEV.RULES_EDITOR;
		var range, selection;

		if (window.getSelection) {
			selection = window.getSelection();
			range = document.createRange();
			range.selectNodeContents(this);
			selection.removeAllRanges();
			selection.addRange(range);
		} else if (document.body.createTextRange) {
			range = document.body.createTextRange();
			range.moveToElementText(this);
			range.select();
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
				
				if(dataElement.classList.contains('styles-list')) {

					var styleListItems = dataElement.querySelectorAll('li');

					if(!styleListItems.length) {
						continue;
					}
					rule[id] = {};

					for(var j = 0, styleListItemsLength = styleListItems.length; j < styleListItemsLength; j++) {

						var styleListItem = styleListItems[j];
						var property = styleListItem.querySelector('.css-property');
						var propertyValue = styleListItem.querySelector('.css-property-value');

						//TODO: 検証が通っていないものも入れるようにしているが、後々ベストな振る舞いについて考える
//						if (
//							property.dataset_isvalid === 'true' &&
//							propertyValue.dataset_isvalid === 'true'
//						) {

							rule[id][property.value] = propertyValue.value;
//						}
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
	}
};

STYLEV.RULES_EDITOR.execute();