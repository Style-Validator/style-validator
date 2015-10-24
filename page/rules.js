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

				that.setParametersAfterLoadJSON();
				that.bindEvents();
				that.setStyleDataOfWidthHeight();
			});
	},
	setParameters: function() {
		var that = STYLEV.RULES_EDITOR;

		//TODO:sertParametersが二回呼びだされているので、設計し直す
//		that.generateButton = document.querySelector('#generate-button');
		that.saveButton = document.querySelector('#save-button');
		that.datalistOfProperties = document.querySelector('#all-css-properties');
		that.jsonView = document.querySelector('#json-view');
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
		that.INPUT_ARROW_WIDTH = 24;
//		that.INPUT_ARROW_WIDTH = 53;
	},
	setParametersAfterLoadJSON: function() {
		var that = STYLEV.RULES_EDITOR;

		//TODO:sertParametersが二回呼びだされているので、設計し直す
		that.stylesLists = document.querySelectorAll('.styles-list');
		that.stylesInputs = document.querySelectorAll('.styles-input');
	},
	bindEvents: function() {
		var that = STYLEV.RULES_EDITOR;

//		that.generateButton.addEventListener('click', that.generateJSON, false);
		that.saveButton.addEventListener('click', that.saveJSON, false);

		for(var i = 0, len = that.stylesLists.length; i < len; i++) {
			var stylesList = that.stylesLists[i];
			stylesList.addEventListener('click', that.insertProperty, false);
		}
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

		that.dummyElement4detectWidth.textContent = cssProperty.value;

		cssProperty.style.width = (that.dummyElement4detectWidth.offsetWidth + that.INPUT_ARROW_WIDTH) + 'px';
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

		that.dummyElement4detectWidth.textContent = cssPropertyValue.value;
		cssPropertyValue.style.width = (that.dummyElement4detectWidth.offsetWidth + that.INPUT_ARROW_WIDTH) + 'px';
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
		cssProperty.dataset.isvalid = isValid ? 'true' : 'false';

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
						if(target.dataset.stylevwidthspecificity === undefined) {
							target.dataset.stylevwidthspecificity = specificityOfWidth;
						}
						if(target.dataset.stylevheightspecificity === undefined) {
							target.dataset.stylevheightspecificity = specificityOfHeight;
						}
						if(target.dataset.stylevwidthimportant === undefined) {
							target.dataset.stylevwidthimportant = importantOfWidthOfStyleAttr;
						}
						if(target.dataset.stylevheightimportant === undefined) {
							target.dataset.stylevheightimportant = importantOfHeightOfStyleAttr;
						}

						//TODO: もう1パターン？
						//CSS指定がありstyle属性がない
						if(widthOfCssRules && !widthOfStyleAttr) {
							if( specificityOfWidth >= parseInt(target.dataset.stylevwidthspecificity, 10) &&
								importantOfWidthOfCssRules.length >= target.dataset.stylevwidthimportant.length
							) {
								target.dataset.stylevwidth = widthOfCssRules;
								target.dataset.stylevwidthspecificity = specificityOfWidth;
								target.dataset.stylevwidthimportant = importantOfWidthOfCssRules;
							}
						}
						//importantのCSS指定とstyle属性
						if(widthOfCssRules && importantOfWidthOfCssRules && !importantOfWidthOfStyleAttr) {

							if( specificityOfWidth >= parseInt(target.dataset.stylevwidthspecificity, 10) &&
								importantOfWidthOfCssRules.length >= target.dataset.stylevwidthimportant.length
							) {
								target.dataset.stylevwidth = widthOfCssRules;
								target.dataset.stylevwidthspecificity = specificityOfWidth;
								target.dataset.stylevwidthimportant = importantOfWidthOfCssRules;
							}
						}
						//非importantのCSS指定とstyle属性
						if(widthOfCssRules && !importantOfWidthOfCssRules && widthOfStyleAttr) {

							if( specificityOfWidth >= parseInt(target.dataset.stylevwidthspecificity, 10) &&
								importantOfWidthOfStyleAttr.length >= target.dataset.stylevwidthimportant.length
							) {
								target.dataset.stylevwidth = widthOfStyleAttr;
								target.dataset.stylevwidthspecificity = specificityOfWidth;
								target.dataset.stylevwidthimportant = importantOfWidthOfStyleAttr;
							}
						}
						//style属性かつimportant
						if(widthOfStyleAttr && importantOfWidthOfStyleAttr) {
							if( specificityOfWidth >= parseInt(target.dataset.stylevwidthspecificity, 10) &&
								importantOfWidthOfStyleAttr.length >= target.dataset.stylevwidthimportant.length
							) {
								target.dataset.stylevwidth = widthOfStyleAttr;
								target.dataset.stylevwidthspecificity = specificityOfWidth;
								target.dataset.stylevwidthimportant = importantOfWidthOfStyleAttr;
							}
						}


						//CSS指定がありstyle属性がない
						if(heightOfCssRules && !heightOfStyleAttr) {
							if( specificityOfHeight >= parseInt(target.dataset.stylevheightspecificity, 10) &&
								importantOfWidthOfStyleAttr.length >= target.dataset.stylevheightimportant.length
							) {
								target.dataset.stylevheight = heightOfCssRules;
								target.dataset.stylevheightspecificity = specificityOfHeight;
								target.dataset.stylevheightimportant = importantOfHeightOfStyleAttr;
							}
						}
						//CSS指定がありimportantとstyle属性
						if(heightOfCssRules && importantOfHeightOfCssRules && heightOfStyleAttr) {
							if( specificityOfHeight >= parseInt(target.dataset.stylevheightspecificity, 10) &&
								importantOfWidthOfStyleAttr.length >= target.dataset.stylevheightimportant.length
							) {
								target.dataset.stylevheight = heightOfCssRules;
								target.dataset.stylevheightspecificity = specificityOfHeight;
								target.dataset.stylevheightimportant = importantOfHeightOfStyleAttr;
							}
						}

						//CSS指定があり非importantとstyle属性
						if(heightOfCssRules && !importantOfHeightOfCssRules && heightOfStyleAttr) {
							if( specificityOfHeight >= parseInt(target.dataset.stylevheightspecificity, 10) &&
								importantOfWidthOfStyleAttr.length >= target.dataset.stylevheightimportant.length
							) {
								target.dataset.stylevheight = heightOfStyleAttr;
								target.dataset.stylevheightspecificity = specificityOfHeight;
								target.dataset.stylevheightimportant = importantOfHeightOfStyleAttr;
							}
						}
						//style属性かつimportant
						if(heightOfStyleAttr && importantOfHeightOfStyleAttr) {
							if( specificityOfHeight >= parseInt(target.dataset.stylevheightspecificity, 10) &&
								importantOfWidthOfStyleAttr.length >= target.dataset.stylevheightimportant.length
							) {
								target.dataset.stylevheight = heightOfStyleAttr;
								target.dataset.stylevheightspecificity = specificityOfHeight;
								target.dataset.stylevheightimportant = importantOfHeightOfStyleAttr;
							}
						}

					}
				}

			}
		}
	},
	calculateWidthHeightValue: function(target, property, propertyValue) {
		var that = STYLEV.RULES_EDITOR;
		var culculatedValue;

		if(
			(property === 'width' || property === 'height') &&
			propertyValue === 'auto'
		) {

			if(property === 'width') {

				if(target.dataset.stylevwidth === 'auto') {
					culculatedValue = target.dataset.stylevwidth;
				} else {
					culculatedValue = getComputedStyle(target, '')[property];
				}
			}

			if(property === 'height') {

				if(target.dataset.stylevheight === 'auto') {
					culculatedValue = target.dataset.stylevheight;
				} else {
					culculatedValue = getComputedStyle(target, '')[property];
				}
			}

		} else {

			culculatedValue = getComputedStyle(target, '')[property];
		}

		return culculatedValue;
	},
	validatePropertyValue: function(cssProperty, cssPropertyValue) {
		var that = STYLEV.RULES_EDITOR;
		var property = cssProperty.value;
		var propertyValue = cssPropertyValue.value;

		that.dummyElement4testStyle.style[property] = propertyValue;

		var computedValue = that.calculateWidthHeightValue(that.dummyElement4testStyle, property, propertyValue);
//		var computedValue = getComputedStyle(that.dummyElement4testStyle, '')[property];

//		console.log('computedValue: ' + computedValue);
//		console.log('propertyValue: ' + propertyValue);

		var regexOkOriginalKeyWords = new RegExp(' default | non-default | !default | non-0 | !0 | over-0 | under-0 | non-inherit | !inherit');

		var isValid = propertyValue === computedValue || regexOkOriginalKeyWords.test(' ' + propertyValue + ' ');

		cssPropertyValue.dataset.isvalid = isValid ? 'true' : 'false';
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
			currentTarget.style['margin-right'] = -(that.INPUT_ARROW_WIDTH/1.45) + 'px';
			setTimeout(that.updateValidClass, 0, currentTarget);
		} else {
			cssProperty.style['margin-right'] = -(that.INPUT_ARROW_WIDTH/1.45) + 'px';
			cssPropertyValue.style['margin-right'] = -(that.INPUT_ARROW_WIDTH/1.45) + 'px';
			setTimeout(that.updateValidClass, 0, cssProperty);
			setTimeout(that.updateValidClass, 0, cssPropertyValue);
		}

	},
	updateValidClass: function(currentTarget) {
		if(currentTarget && currentTarget.value) {
			var hasTheClass;
			if(currentTarget.dataset.isvalid === 'true') {
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
		that.dummyElement4detectWidth.textContent = currentTarget.value;
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
				that.allCSSProperties.push(that.camelToHyphen(property));
			}
		}
	},
	camelToHyphen: function(string) {
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

//		that.jsonView.addEventListener('click', that.selectJSONText, false);

		return new Promise(function(resolve, reject) {

			that.getURL('../data/rules.json')
				.then(JSON.parse)
				.then(function(data) {

					that.currentJSON = data;

					for(var i = 0, len = that.currentJSON.length; i < len; i++) {

						var rule = that.currentJSON[i];

						var clone = document.importNode(that.templateRule, true);
						var styleLists = clone.querySelectorAll('.styles-list');
						var styleInputs = clone.querySelectorAll('.styles-input');

						for(var j = 0, styleListsLength = styleLists.length; j < styleListsLength; j++) {
							var styleList = styleLists[j];
							that.setPropertyFromRuleData(styleList, rule, styleList.dataset.id);
						}
						for(var k = 0, styleInputsLength = styleInputs.length; k < styleInputsLength; k++) {
							var styleInput = styleInputs[k];
							that.setPropertyFromRuleData(styleInput, rule, styleInput.dataset.id);
						}

						that.jsonView.appendChild(clone);
					}

					resolve();

				});
		});
	},

	setPropertyFromRuleData: function(target, rule, id) {
		var that = STYLEV.RULES_EDITOR;
		var ruleStyles = rule[id];

		if(ruleStyles) {

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
				var anchor = target.querySelector('a');
				input.value = ruleStyles;
				if(anchor) {
					anchor.href = ruleStyles;
				}
			}


		} else {

			target.style.setProperty('display', 'none', 'important');

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

		var json = that.getRulesParameters();
		that.currentJSON.unshift(json);
		that.jsonView.textContent = JSON.stringify(that.currentJSON, null, '\t');
		Prism.highlightAll();

	},
	getRulesParameters: function() {
		var that = STYLEV.RULES_EDITOR;
		var json = {};

		for(var i = 0, len = that.stylesLists.length; i < len; i++) {
			var styleList = that.stylesLists[i];

			var id = styleList.id;

			var styleListItems = styleList.querySelectorAll('li');

			if(!styleListItems.length) {
				continue;
			}

			json[id] = {};

			for(var j = 0, styleListItemsLength = styleListItems.length; j < styleListItemsLength; j++) {

				var styleListItem = styleListItems[j];
				var property = styleListItem.querySelector('.css-property');
				var propertyValue = styleListItem.querySelector('.css-property-value');

				json[id][property.value] = propertyValue.value;
			}

		}
		for(var k = 0, stylesInputsLength = that.stylesInputs.length; k < stylesInputsLength; k++) {
			var styleInput = that.stylesInputs[k];

			var id = styleInput.id;

			var styleInputItem = styleInput.querySelector('input');

			json[id] = styleInputItem.value;
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
		var mothodType = 'POST';
		var data = that.jsonView.textContent;

		xhr.open(mothodType, apiURI, true);
		xhr.setRequestHeader('User-Agent','XMLHTTP/1.0');
		xhr.setRequestHeader('Content-type','application/x-www-form-urlencoded');

		//TODO: add handling of response
		//TODO: not server connected, alert error

		if (xhr.readyState == 4) return;

		xhr.send(data);
	}
};

STYLEV.RULES_EDITOR.execute();

//syntax highlight override
Prism.languages.css = {
	'selector': /"(.*":\s*)/,
	'string': /("|')(\\(?:\r\n|[\w\W])|(?!\1)[^\\\r\n])*\1/
};
