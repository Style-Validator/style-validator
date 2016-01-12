/*!
 Style Validator
 "Validation in the Browser". Validate computedStyle with track all events.
 https://style-validator.github.io/Style-Validator/
 by Igari Takeharu
 MIT License
 */

'use strict';

//Create Namespace
var STYLEV = STYLEV || {};

//Detecting Chrome Extension
STYLEV.isChromeExtension = (function() {
	try {
		chrome.runtime.onMessage.addListener(function() {} );
		return true;
	} catch(e) {
		return false;
	}
}());

//Detecting Bookmarklet
STYLEV.isBookmarklet = !STYLEV.isChromeExtension;

//Detecting if has been reloaded
STYLEV.isReLoaded = STYLEV.VALIDATOR !== undefined;

//Detecting if has been loaded at first
STYLEV.isLoaded = !STYLEV.isReLoaded;

//Detecting if has been Executed at first
STYLEV.isFirstExecuted = true;

//Detecting if has been validated
STYLEV.isValidated = STYLEV.isValidated || false;

//options
STYLEV.options = {

	ENABLE_MUTATION_OBSERVER: true,
	ENABLE_AUTO_EXECUTION: false,
	ENABLE_ANIMATION: false,
	SCOPE_SELECTORS: false,
	SCOPE_SELECTORS_TEXT: '',
	IGNORE_SELECTORS: false,
	IGNORE_SELECTORS_TEXT: '',
	URL_FILTERS: [
		'http://stylev/Style-Validator/page/rules.html',
		'http://localhost:8000/Style-Validator/page/rules.html',
		'http://style-validator.gihub.io/Style-Validator/page/rules.html'
	]
};

//TODO: Need to test again the fallowing
//Properties for Observing. Need to ignore elements that has been modified many times so fast for avoiding memory leak.
STYLEV.modifiedTargetsArray = STYLEV.modifiedTargetsArray || [];
STYLEV.ignoreTargetsArray = STYLEV.ignoreTargetsArray || [];
STYLEV.sameElemCount = STYLEV.sameElemCount || 0;
STYLEV.moid = STYLEV.moid || 0;

//Keeping condition of console
STYLEV.consoleWrapperDynamicHeight = STYLEV.consoleWrapperDynamicHeight || 0;
STYLEV.consoleScrollTop = STYLEV.consoleScrollTop || 0;
STYLEV.selectedConsoleLine = STYLEV.selectedConsoleLine || null;
STYLEV.scaleMode = STYLEV.scaleMode || 'normal';

//Main object of Validator
STYLEV.VALIDATOR = STYLEV.VALIDATOR || {

	execute: function(callback) {

		var that = STYLEV.VALIDATOR;

		//Execute immediately when second time
		if(!STYLEV.isFirstExecuted) {

			that.validate(callback);
			return false;
		}

		//Define Instance Variables
		that.setParameters();

		//Getting Data and Inserting JS Libraries
		Promise

			.all(
				that.getAllData()
					.concat(that.insertJS4Bookmarklet())
			)

			.then(function(dataArray) {

				//ルールのデータ取得
				that.rulesData = dataArray[0];

				//HTMLタグのデータ
				that.tagsAllData = dataArray[1];
				that.tagsEmptyData = dataArray[2];
				that.tagsReplacedElementData = dataArray[3];
				that.tagsTableChildren = dataArray[4];

				//HTMLタグを判定する用の正規表現
				that.regexAllHTMLTag = new RegExp(' ' + that.tagsAllData.join(' | ') + ' ');
				that.regexEmptyElem = new RegExp('^( ' + that.tagsEmptyData.join(' | ') + ' )');
				that.regexReplacedElem = new RegExp('^( ' + that.tagsReplacedElementData.join(' | ') + ' )');
				that.regexTableChildElem = new RegExp('^( ' + that.tagsTableChildren.join(' | ') + ' )');

				//オプションを更新してから、検証実行
				that.updateOptions().then(function() {

					//DOM監視をセットアップ
					that.moManager = that.setupMutationObserver();

					//検証開始
					that.validate(callback);

					STYLEV.isFirstExecuted = false;
				});
			});

	},

	setParameters: function() {

		var that = STYLEV.VALIDATOR;

		//要素の取得
		that.html = document.querySelector('html');
		that.head = that.html.querySelector(':scope > head');
		that.body = that.html.querySelector(':scope > body');

		//html要素のボーダーボトムのスタイルの初期値を記憶
		//このバリデータによる指定がない場合は、消す処理（null）をいれ、指定があった場合は、初期の数値に戻す
		that.htmlDefaultBorderBottomWidth = that.html.style.borderBottomWidth === '' ? null : that.html.style.borderBottomWidth;

		//リソースルートを設定
		that.RESOURCE_ROOT = that.RESOURCE_ROOT || 'https://style-validator.github.io/Style-Validator/extension/';

		//監視フラグの初期化
		that.isObserving = false;

		//更新フラグの初期化
		that.isModified = false;

		//静的な設定値 TODO: 他にもsettingsにまとめられる値があるので後で精査
		that.settings = {

			OBSERVATION_INTERVAL: 3000,
			IGNORING_ELEM_ARRAY_RESET_INTERVAL: 10000 * 10000,

			CONSOLE_WRAPPER_ID:	'stylev-console-wrapper',
			CONSOLE_LIST_ID:	'stylev-console-list',
			STYLESHEET_ID:		'stylev-stylesheet',

			CONSOLE_WRAPPER_DEFAULT_HEIGHT:	200,
			CONSOLE_HEADING_TEXT:			'Style Validator',
			CONGRATULATION_MESSAGE_TEXT:	'It\'s Perfect!',

			GA_PATH: that.RESOURCE_ROOT + 'google-analytics.js',

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
			that.RESOURCE_ROOT + 'data/tags-table-children.json'
		];
	},

	getAllData: function() {
		var that = STYLEV.VALIDATOR;

		var promiseArray = [];
		
		STYLEV.METHODS.each(that.DATA_PATHES, function(path) {
			promiseArray.push(that.getDataFromURL(path).then(JSON.parse))
		});

		return promiseArray;
	},

	//Ajaxでデータを取得する関数
	//promiseオブジェクトを返す
	getDataFromURL: function(url) {

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

	getScriptFromURL: function(path, docFlag) {
		var that = STYLEV.VALIDATOR;

		return new Promise(function(resolve, reject) {

			var script = document.createElement('script');
			script.src = path;
			script.classList.add('stylev-ignore');
			script.addEventListener('load', function() {
				resolve();
			}, false);
			script.addEventListener('error', function(event) {
				reject(new URIError("The script " + event.target.src + " is not accessible."));
			}, false);

			if(docFlag) {
				docFlag.appendChild(script);
			} else {
				that.head.appendChild(script);
			}
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
				promiseArray.push(that.getScriptFromURL(path, docFlag));
			});

			/* append */
			that.head.appendChild(docFlag);

		}

		return promiseArray;

	},

	insertGA: function() {
		var that = STYLEV.VALIDATOR;

		if(that.scriptTagGA !== undefined) {
			that.scriptTagGA.parentElement.removeChild(that.scriptTagGA);
		}

		that.scriptTagGA = document.createElement('script');
		that.scriptTagGA.src = that.settings.GA_PATH;
		that.scriptTagGA.async = "async";
		that.scriptTagGA.id = 'stylev-ga';
		that.scriptTagGA.classList.add('stylev-ignore');

		/* append */
		that.head.appendChild(that.scriptTagGA);
	},

	updateOptions: function() {
		var that = STYLEV.VALIDATOR;

		return new Promise(function(resolve, reject) {

			//Chrome Extensionの場合は更新する
			if(STYLEV.isChromeExtension) {

				chrome.storage.sync.get('options', function(message) {

					if(message.options !== undefined) {
						//オプション設定
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

			//Chrome Extension以外の場合何もしない
			} else {

				resolve();
			}
		});

	},

	//全要素に対して、バリデートを行う
	validate: function(callback) {

		console.info('Style Validator: Validator is starting...');

		var that = STYLEV.VALIDATOR;

		//DOM情報などを初期化
		that.initializeBeforeValidation();

		//全容要素を検査
		for ( var i = 0; i < that.allElemLength; i = (i+1)|0 ) {

			var elemData = {};

			elemData.targetElem = that.allElem[i];
			elemData.targetElemTagName = elemData.targetElem.tagName.toLowerCase();
			elemData.targetElemDefault = that.iframeDocument.querySelector(elemData.targetElemTagName);

			var isRegularHTMLTag = that.regexAllHTMLTag.test(' ' + elemData.targetElemTagName + ' ');

			//通常のHTMLタグでない場合は、処理を止める svg1.1のsvgとstyleタグもdata属性が許可されていない
			if(!isRegularHTMLTag || elemData.targetElemTagName === 'style') {
				continue;
			}

			elemData.targetElemStyles = getComputedStyle(elemData.targetElem, '');
			elemData.targetParentElem = elemData.targetElem.parentElement || null;

			//親要素が合った場合
			if(elemData.targetParentElem) {

				//親要素のスタイル情報
				elemData.targetElemParentStyles = getComputedStyle(elemData.targetParentElem, '');

				//親要素のDisplayのプロパティ値
				elemData.targetElemParentDisplayProp = elemData.targetElemParentStyles.getPropertyValue('display');

			}

			//TODO: Firefoxの場合は、デフォルトスタイルを取得できるので、それを使うようにする

			//対象要素のDisplayプロパティのプロパティ値
			elemData.targetElemDisplayPropVal = elemData.targetElemStyles.getPropertyValue('display');

			//対象要素のDisplayプロパティのデフォルトのプロパティ値 TODO: displayはautoが無いので、普通のgetでもいいかも？
			elemData.targetElemDefaultDisplayProp = that.getStyle(elemData.targetElemDefault, 'display');

			//空要素を判定
			var isEmptyElements = that.regexEmptyElem.test(' ' + elemData.targetElemTagName + ' ');

			//サイズ指定できるインライン要素を判定
			var isReplacedElemTag = that.regexReplacedElem.test(' ' + elemData.targetElemTagName + ' ');

			//HTML以外であれば、親が存在するので親要素のチェック
			var hasParent = elemData.targetElemTagName !== 'html';

			if(isEmptyElements) {
				//TODO: 擬似要素をインスタンス変数に格納し、擬似要素エラー
			}

			//一つ一つの要素に対して、全てのNGルールの分だけ検査
			STYLEV.METHODS.each(that.rulesData, function(rule) {

				//全てのbaseStyleが指定されているか
				var hasAllBaseStyles = true;
				var baseStyles = rule['base-styles'];
				var ngStyles = rule['ng-styles'];
				var replaced = rule['replaced'];
				var empty = rule['empty'];
				var baseStylesText = '';

				//初期化
				elemData.isDisplayPropChanged = false;

				//置換要素のルールに対応しない要素の場合はフィルターする
				if(replaced === 'Replaced elements') {
					if(!isReplacedElemTag) {
						return 'continue';
					}
				}

				//置換要素のルールに対応しない要素の場合はフィルターする
				if(replaced === 'Non-replaced elements') {
					if(isReplacedElemTag) {
						return 'continue';
					}
				}

				//空要素用のルールだった場合は、空要素でない場合はフィルターする
				if(empty === 'Empty elements') {
					if(!isEmptyElements) {
						return 'continue';
					}
				}

				//全てのベーススタイルの分だけ検査
				STYLEV.METHODS.each(baseStyles, function(baseStyleProp, baseStylePropVal) {

					baseStylesText += baseStyleProp + ': ';
					baseStylesText += baseStylePropVal + ';';

					var targetElemBasePropVal = getComputedStyle(elemData.targetElem, '').getPropertyValue(baseStyleProp);

					var hasBaseStyle = baseStylePropVal === targetElemBasePropVal;

					//ベーススタイルを持っていない場合は、中止してループから抜け出す
					if(!hasBaseStyle) {
						hasAllBaseStyles = false;
						return 'break';
					}
				});

				//全てのベーススタイルに適合した場合 TODO: ORもオプションで指定できるようにするか検討
				if(hasAllBaseStyles) {

					STYLEV.METHODS.each(ngStyles, function(ngStyleType, ngStyleProps) {

						STYLEV.METHODS.each(ngStyleProps, function(ngStyleProp, ngStylePropVal) {

							that.detectError(ngStyleType, ngStyleProp, ngStylePropVal, rule, elemData, baseStylesText);

						});

					});
				}
			});

			that.toggleSelectedClassBasedOnOwnClass(elemData);
			
		}

		//デフォルトスタイル取得用のiframeを削除
		that.removeIframe4getDefaultStyles();

		//コンソールを表示
		that.showConsole();

		//コンソール内のDOMを取得
		that.setParametersAfterShowingConsole();

		//対象要素をクリックした時のイベントハンドラを登録
		that.bind2targetElements();

		//バリデート完了時のcallbackが存在し関数だった場合実行
		if(typeof callback === 'function') {
			callback();
		}

		//GAタグを挿入
		that.insertGA();

		console.info('Style Validator: Validated and Console has been displayed');

		//バリデータによるDOM変更が全て完了してから監視開始
		that.moManager.connect();

		STYLEV.isValidated = true;

		if(STYLEV.isChromeExtension) {
			STYLEV.CHROME_EXTENSION.syncStatusIsValidated(true);
		}
	},
	
	toggleSelectedClassBasedOnOwnClass: function(elemData) {
		//TODO: 共通化できるか？
		//エラーも警告もない場合は選択状態を外す
		if(
			!(
				elemData.targetElem.classList.contains('stylev-target-error') ||
					elemData.targetElem.classList.contains('stylev-target-warning')
				)
			) {
			elemData.targetElem.classList.remove('stylev-target-selected');
		}
	},

	//エラーや警告を検知する
	detectError: function(ngStyleType, ngStyleProp, ngStylePropVal, rule, elemData, baseStylesText) {

		var that = STYLEV.VALIDATOR;

		//メッセージ管理するオブジェクト
		var result = {};

		var splitTypeArray = ngStyleType.split('-');

		//親要素をチェックする
		var isParentCheking = elemData.targetParentElem && splitTypeArray[0] === 'parent';

		//擬似セレクター
		var pseudoSelector = splitTypeArray[0] === 'pseudo' ? splitTypeArray[1] : null;

		//対象要素のNGスタイルのデフォルト値
		var targetElemNgStyleDefaultVal = that.getStyle(elemData.targetElemDefault, ngStyleProp, pseudoSelector);

		//対象要素のNGスタイルの現在の値
		var targetElemNgStyleVal = that.getStyle(elemData.targetElem, ngStyleProp, pseudoSelector);

		//NGスタイルのプロパティ値を検索するための正規表現
		var regexNgStyleRulesPropVal;

		//値が配列の場合
		if(ngStylePropVal instanceof Array) {
			result.reason = ngStylePropVal[1] || '';
			result.referenceURL = ngStylePropVal[2] || '';
			ngStylePropVal = ngStylePropVal[0];
		}

		//否定表現の有無を検査
		var isReverse = ngStylePropVal.indexOf('!') === 0;

		//[]括弧が存在するか検査
		var hasGroupOperator = ngStylePropVal.match(/^!{0,1}\[(.+)\]$/);

		//[]括弧がある場合は、括弧の中身を返し、ない場合は、そのまま
		ngStylePropVal = hasGroupOperator ? hasGroupOperator[1] : ngStylePropVal.replace('!', '');

		//|OR演算子があるかの検査
		var hasOrOperator = ngStylePropVal.split('|').length > 1;

		//OR演算子がある場合は、OR演算子で区切った配列を返却し、そうでない場合はそのまま
		ngStylePropVal = hasOrOperator ? ngStylePropVal.split('|') : ngStylePropVal;

		//NGスタイルのプロパティ値が複数あった場合
		if(hasOrOperator) {

			//両端にスペースをいれて完全単語検索をしてかつ、複数ワードで検索
			regexNgStyleRulesPropVal = new RegExp(' ' + ngStylePropVal.join(' | ') + ' ');

		} else {

			//両端にスペースをいれて完全単語検索をしている
			regexNgStyleRulesPropVal = new RegExp(' ' + ngStylePropVal + ' ');
		}

		//親要素を持つ場合
		if(elemData.targetParentElem) {

			//親要素のNGスタイルの値
			var targetElemParentNgStyleVal = elemData.targetElemParentStyles.getPropertyValue(ngStyleProp);

			//line-heightの相対指定の場合は、親子の継承関係であってもfont-sizeによって相対的に変わるため、font-sizeの関係性を計算に入れる
			//TODO: line-heightの計算にバグあり　今は指定を外している？
			if(ngStyleProp === 'line-height') {
				var targetElemFontSize = parseFloat(elemData.targetElemStyles.getPropertyValue('font-size'));
				var targetElemParentFontSize = parseFloat(elemData.targetElemParentStyles.getPropertyValue('font-size'));
				var fontSizeScaleRate = targetElemParentFontSize / targetElemFontSize;
				var lineHeightNormalScaleRate = 1.14;
				targetElemNgStyleVal = targetElemNgStyleVal === 'normal' ? targetElemFontSize * lineHeightNormalScaleRate + 'px' : targetElemNgStyleVal;
				targetElemParentNgStyleVal = targetElemParentNgStyleVal === 'normal' ? that.controlFloat(targetElemParentFontSize * lineHeightNormalScaleRate, 1) + 'px' : targetElemParentNgStyleVal;
			}
		}

		var isNgStyle = regexNgStyleRulesPropVal.test(' ' + targetElemNgStyleVal + ' ');
		var isZeroOver = (parseInt(targetElemNgStyleVal, 10) > 0);
		var isZeroUnder = (parseInt(targetElemNgStyleVal, 10) < 0);
		var isZero = (parseInt(targetElemNgStyleVal, 10) === 0);
		var isDefault = (targetElemNgStyleVal === targetElemNgStyleDefaultVal);
		var isInheritWithLineHeight = (that.controlFloat(parseFloat(targetElemNgStyleVal) * fontSizeScaleRate, 1) !== that.controlFloat(parseFloat(targetElemParentNgStyleVal), 1));
		var isInherit = (targetElemNgStyleVal === targetElemParentNgStyleVal);
		var isParentNgStyle = (regexNgStyleRulesPropVal.test(' ' + elemData.targetElemParentDisplayProp + ' '));

		//TODO: 以下の判定処理は、ズタボロ。全体的に修正する。
		//TODO: 0.00001とかの場合を考慮して、parseIntの10進数も考える
		//違反スタイルを検知してエラーもしくは警告をだす
		if(

			/////////////////////////////
			//is normal
			//
			// 一致
			(!isReverse && isNgStyle) ||

			//0以上
			(!isReverse && ngStylePropVal === 'over-0' && isZeroOver) ||

			//0以下
			(!isReverse && ngStylePropVal === 'under-0' && isZeroUnder) ||

			//デフォルト値の場合
			(!isReverse && ngStylePropVal === 'default' && isDefault) ||

			//継承スタイルの場合（line-height）
			(!isReverse && ngStylePropVal === 'inherit' && ngStyleProp === 'line-height' && isInheritWithLineHeight) ||

			//継承スタイルの場合（通常：line-height以外）
			(!isReverse && ngStylePropVal === 'inherit' && isInherit) ||

			//反転でない場合かつ、親要素がエラースタイルの場合
			(!isReverse && isParentCheking && isParentNgStyle) ||


			/////////////////////////////
			//is reverse
			//
			// Without it TODO: Need to research that how it is possible
//			(isReverse && !isNgStyle) ||

			//0以外
			(isReverse && ngStylePropVal === '0' && !isZero) ||

			//デフォルト値以外
			(isReverse && ngStylePropVal === 'default' && !isDefault) ||

			//継承スタイル以外（line-height）
			(isReverse && ngStylePropVal === 'inherit' && ngStyleProp === 'line-height' && !isInheritWithLineHeight) ||

			//継承スタイル以外（通常：line-height以外）
			(isReverse && ngStylePropVal === 'inherit' && !isInherit) ||

			//反転の場合かつ、親要素のOKスタイル以外に適合したら
			(isReverse && isParentCheking && !isParentNgStyle)

		){

			if(
				!(
					elemData.targetElem.classList.contains('stylev-target-error') ||
				 	elemData.targetElem.classList.contains('stylev-target-warning')
				)
			) {
				that.elemIndex = (that.elemIndex+1)|0;
			}

			//エラーの発生した要素に、IDを振る
			elemData.targetElem.dataset.stylevid = that.elemIndex;

			//親要素を検査する場合
			if(isParentCheking) {

				result.text =
					'[' + rule['title'] + ']' + ' ' +
					'<' + elemData.targetElemTagName + '> ' +
					'{' + baseStylesText + '}' + ' ' +
					'Parent element\'s style is ' +
					'{' + ngStyleProp + ': ' + targetElemParentNgStyleVal + ';}' + ' ' +
					result.reason;

			//通常時
			} else {

				result.text =
					'[' + rule['title'] + ']' + ' '+
					'<' + elemData.targetElemTagName + '>' + ' ' +
					'{' + baseStylesText + '}' + ' ' +
					'{' + ngStyleProp + ': ' + targetElemNgStyleVal + ';}' + ' ' +
					result.reason;
			}

			//要素のID名
			result.stylevid = elemData.targetElem.dataset.stylevid;

			//エラーか警告かのタイプ
			result.errorLevel = splitTypeArray[splitTypeArray.length - 2];

			//メッセージ配列に挿入
			that.resultArray.push(result);

			//エラー
			if(result.errorLevel === 'error') {

				elemData.targetElem.classList.add('stylev-target-error');
			}

			//警告
			if(result.errorLevel === 'warning') {

				elemData.targetElem.classList.add('stylev-target-warning');
			}
		}
	},

	//バリデーション実行直前の初期化処理
	initializeBeforeValidation: function() {

		var that = STYLEV.VALIDATOR;

		//note: order of following scripts is very important.

		//remove console if it has already showed.
		if(STYLEV.isValidated) {
			that.destroy();
		}

		//getting all elements
		that.allElem = document.querySelectorAll('*:not(.stylev-ignore)');
		that.allElemLength = that.allElem.length;

		//Inserting Stylesheet when Validator has been executed from Bookmarklet
		that.insertCSS4bookmarklet();

		//initialize array of validation result
		that.resultArray = [];

		//initialize number of error
		that.errorNum = 0;

		//initialize number of warning
		that.warningNum = 0;

		//initialize number of element's Index
		that.elemIndex = 0;

		//initialize observation
		that.initializeVariables4observer();
		that.clearObservationTimer();
		that.clearConsoleRefreshTimer();
		that.resetRefreshButton();
		that.showMessageFromObserver();

		//デフォルトスタイル取得用iframeを挿入
		that.insertIframe4getDefaultStyles();

		//Auto判定のためにDOMカスタムプロパティを全要素に付与
		that.setStyleDataBySelectors(document);
		that.setStyleDataByElements(document);
		that.setStyleDataBySelectors(that.iframeDocument);
		that.setStyleDataByElements(that.iframeDocument);

	},

	getOpenTag: function(target) {
		return target ? target.outerHTML.match(/<[a-zA-Z]+(>|.*?[^?]>)/g)[0] : '';
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
			attributeFilter: targetAttributes,
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
				var tagName = target.tagName.toLowerCase();
				var tag = '<' + tagName + '>';
				var openTag = that.getOpenTag(target);
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

				if(target.classList.contains('stylev-ignore')) {
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
						var isTagRemovedNode = removedNode.nodeType === 1;
						var isTextRemovedNode = removedNode.nodeType === 3;
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
						var isTagAddedNode = addedNode.nodeType === 1;
						var isTextAddedNode = addedNode.nodeType === 3;
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

				//1つでも通過したら、無視しない
				that.isIgnore = false;

				if(target.dataset_moid === undefined) {
					target.dataset_moid = ++STYLEV.moid;
				}
				var isSameIDWithPreviousTarget = previousTarget && previousTarget.dataset_moid ? target.dataset_moid === previousTarget.dataset_moid : false;
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

				//前回の要素と今回の要素が同じだった回数が5より少ない場合
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

			//Clear Timer when timer is exist
			that.clearObservationTimer();
			that.clearConsoleRefreshTimer();

			//Caught by above detection
			if(!that.isIgnore) {

				that.informModification();

				//initialize countdown second
				that.countdownDynamicSecond = that.COUNTDOWN_DEFAULT_SECOND;
				that.consoleRefreshCount.textContent = that.COUNTDOWN_DEFAULT_SECOND;

				//Timer for countdown
				that.consoleRefreshTimer = setInterval(that.countDownConsoleRefreshCount, 1000);

				//Timer for avoiding executing many times and too fast
				that.observationTimer = setTimeout(that.executeWithDetectingCE, that.settings.OBSERVATION_INTERVAL);
			}

			//resetting regularly
//			that.resetTImer = setInterval(function() {
//				ignoreTargetsArray = [];
//			}, that.settings.IGNORING_ELEM_ARRAY_RESET_INTERVAL);
		};

		//Define countdown default second
		that.COUNTDOWN_DEFAULT_SECOND = +that.settings.OBSERVATION_INTERVAL / 1000;

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
					//TODO: 属性回避ができれば、全要素を対象に変更
					//that.observer.observe(that.html, observationConfig);
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
					clearTimeout(that.resetTImer);
					that.observer.disconnect();
					that.isObserving = false;
					console.info('Style Validator: Mutation Observer has disconnected');
				}
			}
		}

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

	resetRefreshButton: function() {
		var that = STYLEV.VALIDATOR;

		//アクティブ状態を戻す
		if(that.isModified) {
			that.isModified = false;
			that.consoleRefreshButtonImage.src = that.settings.ICON_REFRESH_PATH;
			that.consoleRefreshButtonImage.classList.remove('stylev-console-refresh-button-image-active');
		}
	},

	clearObservationTimer: function() {
		var that = STYLEV.VALIDATOR;

		//Clear Timer when timer is exist
		if(that.observationTimer !== undefined) {
			clearTimeout(that.observationTimer);

			//Reset Timer
			that.observationTimer = undefined;
		}

	},

	clearConsoleRefreshTimer: function() {
		var that = STYLEV.VALIDATOR;

		if(that.consoleRefreshTimer !== undefined) {
			clearTimeout(that.consoleRefreshTimer);

			//Reset Timer
			that.consoleRefreshTimer = undefined;
		}
	},

	showMessageFromObserver: function() {

		var that = STYLEV.VALIDATOR;

		if(that.moMessageArray instanceof Array && that.moMessageArray.length) {
			console.groupCollapsed('Style Validator: Modified Elements Data');
			console.info(that.moMessageArray.join('\n\n'));
			console.groupEnd();
		}

	},

	initializeVariables4observer: function() {
		var that = STYLEV.VALIDATOR;

		//initialize flag
		that.isIgnore = true;
		that.isModified = false;
	},

	//スタイルシート挿入
	insertCSS4bookmarklet: function() {

		var that = STYLEV.VALIDATOR;

		if(STYLEV.isBookmarklet) {

			var docFlag = document.createDocumentFragment();
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
				docFlag.appendChild(linkTag);
			});


			/* append */
			that.head.appendChild(docFlag);
		}
	},

	//スタイルシートを削除
	removeStylesheet: function() {
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

	//デフォルトスタイルを取得するために、ダミーiframeを挿入
	insertIframe4getDefaultStyles: function() {

		var that = STYLEV.VALIDATOR;

		that.iframe4test = document.createElement('iframe');
		that.iframe4test.id = 'stylev-dummy-iframe';
		that.iframe4test.classList.add('stylev-ignore');
		that.html.appendChild(that.iframe4test);
		that.iframeWindow = that.iframe4test.contentWindow;
		that.iframeDocument = that.iframeWindow.document;
		that.iframeBody = that.iframeDocument.querySelector('body');

		var docFlag = document.createDocumentFragment();

		STYLEV.METHODS.each(that.tagsAllData, function(tagName, i) {
			docFlag.appendChild(document.createElement(tagName));
		});

		that.iframeBody.appendChild(docFlag);

	},

	//ダミーiframeを削除
	removeIframe4getDefaultStyles: function() {
		var that = STYLEV.VALIDATOR;

		that.iframe4test.parentElement.removeChild(that.iframe4test);
	},

	//全要素のclassを削除する関数
	removeAllAttrAndEvents: function() {
		var that = STYLEV.VALIDATOR;

		//属性やclassNameを削除
		STYLEV.METHODS.each(that.allElem, function(elem) {
			elem.removeAttribute('data-stylevid');
			elem.removeAttribute('data-stylevclass');
			elem.classList.remove('stylev-target-error');
			elem.classList.remove('stylev-target-warning');
			elem.classList.remove('stylev-target-selected');
			elem.removeEventListener('click', STYLEV.CHROME_DEVTOOLS.inspectFromTargets);
			elem.removeEventListener('click', that.markElementFromTargets);
		});

		if(that.html !== undefined) {
			that.html.removeEventListener('keyup', that.destroyByEsc);
		}
	},

	informModification: function() {
		var that = STYLEV.VALIDATOR;

		if(that.isModified) {
			return false;
		}
		that.countdownDynamicSecond = that.COUNTDOWN_DEFAULT_SECOND;
		that.isModified = true;
		that.consoleRefreshButtonImage.src = that.settings.ICON_REFRESH_ACTIVE_PATH;
		that.consoleRefreshButtonImage.classList.add('stylev-console-refresh-button-image-active');

	},
	
	countDownConsoleRefreshCount: function() {
		var that = STYLEV.VALIDATOR;
		that.consoleRefreshCount.textContent = --that.countdownDynamicSecond;
		if(that.countdownDynamicSecond <= 0) {
			clearInterval(that.consoleRefreshTimer);
		}
	},

	insertStyle2ShadowDOM: function() {
		var that = STYLEV.VALIDATOR;
		that.consoleWrapperShadowRoot.innerHTML = '<style>@import "' + that.RESOURCE_ROOT + 'style-validator-for-console.css' + '";</style>';
	},

	//結果を表示させる
	showConsole: function() {

		var that = STYLEV.VALIDATOR;

		//ドキュメンとフラグメント
		that.docFlag = document.createDocumentFragment();

		//要素を生成
		that.consoleWrapper = document.createElement('div');
		that.consoleWrapperShadowRoot = that.consoleWrapper.createShadowRoot();
		that.consoleHeader = document.createElement('header');
		that.consoleHeading = document.createElement('h1');
		that.consoleHeadingLogo = document.createElement('a');
		that.consoleHeadingLogoImage = document.createElement('img');
		that.consoleMode = document.createElement('p');
		that.consoleButtons = document.createElement('div');
		that.consoleRefreshButton = document.createElement('a');
		that.consoleRefreshCount = document.createElement('output');
		that.consoleRefreshButtonImage = document.createElement('img');
		that.consoleCounter = document.createElement('div');
		that.consoleBody = document.createElement('div');
		that.consoleList = document.createElement('ul');
		that.consoleCloseButton = document.createElement('a');
		that.consoleCloseButtonImage = document.createElement('img');
		that.consoleMinimizeButton = document.createElement('a');
		that.consoleMinimizeButtonImage = document.createElement('img');
		that.consoleNormalizeButton = document.createElement('a');
		that.consoleNormalizeButtonImage = document.createElement('img');

		//クリック時の判定
		that.isMouseDownConsoleHeader = false;

		//ドラッグアンドドロップで移動させる処理に必要な変数
		that.consoleStartPosY = 0;
		that.consoleCurrentPosY = 0;
		that.consoleDiffPosY = 0;

		//属性を設定
		that.consoleWrapper.id = that.settings.CONSOLE_WRAPPER_ID;
		that.consoleWrapper.classList.add('stylev-ignore');
		that.consoleList.id = that.settings.CONSOLE_LIST_ID;
		that.consoleHeader.classList.add('stylev-console-header');
		that.consoleHeading.classList.add('stylev-console-heading');
		that.consoleHeadingLogo.classList.add('stylev-console-heading-logo');
		that.consoleHeadingLogo.href = 'http://style-validator.github.io/Style-Validator/';
		that.consoleHeadingLogo.target = '_blank';
		that.consoleHeadingLogoImage.classList.add('stylev-console-heading-logo-image');
		that.consoleHeadingLogoImage.src = that.settings.ICON_LOGO_PATH;
		that.consoleMode.classList.add('stylev-console-mode');
		that.consoleButtons.classList.add('stylev-console-buttons');
		that.consoleRefreshButton.href = 'javascript: void(0);';
		that.consoleRefreshButton.classList.add('stylev-console-refresh-button');
		that.consoleRefreshCount.classList.add('stylev-console-refresh-count');
		that.consoleRefreshButtonImage.classList.add('stylev-console-refresh-button-image');
		that.consoleRefreshButtonImage.src = that.settings.ICON_REFRESH_PATH;
		that.consoleCounter.classList.add('stylev-console-counter');
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
		that.consoleNormalizeButton.hidden = true;
		that.consoleNormalizeButton.classList.add('stylev-console-normalize-button');
		that.consoleNormalizeButtonImage.classList.add('stylev-console-normalize-button-image');
		that.consoleNormalizeButtonImage.src = that.settings.ICON_NORMALIZE_PATH;

		//コンソールのスタイルを指定
		that.insertStyle2ShadowDOM();

		//コンソール内に表示させる結果の要素を生成
		that.createMessagesInConsole();

		//コンソール関連の動作のイベントの登録
		that.bindEvents2Console();

			//コンソールヘッダに表示させるテキストの設定
		that.consoleHeadingText = document.createTextNode(that.settings.CONSOLE_HEADING_TEXT);
		that.consoleCounter.textContent = 'Total: ' + that.resultArray.length + ' / Error: ' + that.errorNum + ' / Warning: ' + that.warningNum;

		//ロゴを挿入
		that.consoleHeadingLogo.appendChild(that.consoleHeadingLogoImage);
//		that.consoleHeadingLogo.appendChild(that.consoleHeadingText);
		that.consoleHeading.appendChild(that.consoleHeadingLogo);

		//ボタンの中に画像を配置
		that.consoleRefreshButton.appendChild(that.consoleRefreshCount);
		that.consoleRefreshButton.appendChild(that.consoleRefreshButtonImage);
		that.consoleNormalizeButton.appendChild(that.consoleNormalizeButtonImage);
		that.consoleMinimizeButton.appendChild(that.consoleMinimizeButtonImage);
		that.consoleCloseButton.appendChild(that.consoleCloseButtonImage);

		//コンソールヘッダにボタンを配置
		that.consoleButtons.appendChild(that.consoleRefreshButton);
		that.consoleButtons.appendChild(that.consoleMinimizeButton);
		that.consoleButtons.appendChild(that.consoleNormalizeButton);
		that.consoleButtons.appendChild(that.consoleCloseButton);

		//コンソール内に挿入するHTML要素を挿入 TODO: 同じ記述をまとめる
		that.consoleHeader.appendChild(that.consoleHeading);
		that.consoleHeader.appendChild(that.consoleButtons);
		that.consoleHeader.appendChild(that.consoleCounter);
		that.consoleHeader.appendChild(that.consoleMode);
		that.consoleWrapperShadowRoot.appendChild(that.consoleHeader);
		that.consoleWrapperShadowRoot.appendChild(that.consoleBody);
		that.consoleList.appendChild(that.docFlag);
		that.consoleBody.appendChild(that.consoleList);
		that.html.appendChild(that.consoleWrapper);

		that.doAfterShowingConsole();
	},

	doAfterShowingConsole: function() {

		var that = STYLEV.VALIDATOR;

		setTimeout(function() {

//			that.consoleWrapper.style.setProperty('height', (STYLEV.consoleWrapperDynamicHeight || that.settings.CONSOLE_WRAPPER_DEFAULT_HEIGHT) + 'px', '');
			that.toggleConsole();

			//コンソールの包括要素のデフォルトの高さを計算し記憶しておく
			that.consoleWrapperDynamicHeight = parseInt(that.consoleWrapper.offsetHeight, 10);

			//コンソールの包括要素の高さ分だけ最下部に余白をつくる
			//コンソールで隠れる要素がでないための対応
			that.html.style.setProperty('border-bottom-width', that.consoleWrapperDynamicHeight + 'px', 'important');

			//表示結果をChrome Extensionに伝える
			that.send2ChromeExtension();

			//前回開いた状態を復元する
			that.restorePreviousCondition();
		}, 0);
	},

	send2ChromeExtension: function() {

		var that = STYLEV.VALIDATOR;

		if(STYLEV.isChromeExtension) {

			//アイコンに件数を表示させる
			chrome.runtime.sendMessage({
				name: 'setBadgeText',
				badgeText: that.resultArray.length
			});

			//DevToolsの接続状態を表示させる
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

	//コンソール内に表示させる結果の要素を生成
	createMessagesInConsole: function() {

		var that = STYLEV.VALIDATOR;

		//エラーや警告が1件もなかった場合
		if(that.resultArray.length === 0) {

			that.congratulationsMessage = document.createElement('li');
			that.congratulationsMessage.classList.add('stylev-console-perfect');
			that.congratulationsMessage.textContent = that.settings.CONGRATULATION_MESSAGE_TEXT;
			that.docFlag.appendChild(that.congratulationsMessage);

		//エラーや警告が存在した場合
		} else {

			//メッセージの数だけループ
			STYLEV.METHODS.each(that.resultArray, function(result) {
				
				//ログの行を表示させるHTML要素を生成
				var li = document.createElement('li');
				var anchor = document.createElement('a');
				var logID = document.createElement('span');
				var reference = document.createElement('a');

				//属性を設定
				anchor.href = 'javascript: void(0);';

				//クリックイベントを設定
				anchor.addEventListener('click', that.markElementFromConsole, false);

				//テキスト情報を挿入
				anchor.textContent = result.text;
				logID.textContent = result.stylevid;
				reference.textContent = '?';

				//属性を設定
				anchor.dataset.stylevconsoleid = result.stylevid;
				anchor.classList.add('stylev-console-list-anchor');
				logID.classList.add('stylev-console-list-logid');
				reference.classList.add('stylev-console-list-reference');
				reference.href = result.referenceURL;

				//エラー数をカウント
				if(result.errorLevel === 'error') {

					//エラーか警告のタイプのクラス名を設定
					li.classList.add('stylev-trigger-error');
					that.errorNum = (that.errorNum+1)|0;
				}

				//警告数をカウント
				if(result.errorLevel === 'warning') {

					//エラーか警告のタイプのクラス名を設定
					li.classList.add('stylev-trigger-warning');
					that.warningNum = (that.warningNum+1)|0;
				}

				//DocumentFlagmentにHTML要素を挿入
				li.appendChild(anchor);
				result.referenceURL && logID.appendChild(reference);
				li.appendChild(logID);
				that.docFlag.appendChild(li);
			});
		}
	},

	setParametersAfterShowingConsole: function() {
		var that = STYLEV.VALIDATOR;

		that.markedTargets = document.querySelectorAll('.stylev-target-error, .stylev-target-warning');
		that.consoleListItems = that.consoleList.querySelectorAll(':scope > li');
		that.consoleTriggers = that.consoleList.querySelectorAll('a[data-stylevconsoleid]');
	},

	//コンソール関連のイベントを登録
	bindEvents2Console: function() {
		var that = STYLEV.VALIDATOR;

		that.consoleWrapper.addEventListener('click', that.stopPropagation, false);
		that.consoleHeader.addEventListener('mousedown', that.initConsoleHeader, false);
		that.html.addEventListener('mousemove', that.moveConsoleHeader, false);
		that.html.addEventListener('mouseup', that.offConsoleHeader, false);
		that.consoleCloseButton.addEventListener('click', that.destroy, false);
		that.consoleRefreshButton.addEventListener('click', that.executeWithDetectingCE, false);
		that.consoleMinimizeButton.addEventListener('click', that.toggleConsole, false);
		that.consoleNormalizeButton.addEventListener('click', that.toggleConsole, false);
		that.html.addEventListener('keyup', that.destroyByEsc, false);
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
				that.consoleNormalizeButton.hidden = false;
				that.consoleMinimizeButton.hidden = true;
			} else if(that.consoleWrapper.offsetHeight > 30) {
				that.consoleNormalizeButton.hidden = true;
				that.consoleMinimizeButton.hidden = false;
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

	//コンソールからの動作
	markElementFromConsole: function(event) {

		event.preventDefault();
		event.stopPropagation();

		var that = STYLEV.VALIDATOR;

		//監視を中断
		that.moManager.disconnect();

		var lines = that.consoleList.querySelectorAll(':scope > li');

		//全ての行から選択状態を外す
		STYLEV.METHODS.each(lines, function(line) {
			line.classList.remove('stylev-trigger-selected');
		});

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

		//対象の要素までスクロール
		STYLEV.METHODS.smoothScroll.execute(target);

		//監視を復活
		that.moManager.connect();

	},

	//ページ内の要素に対する動作
	bind2targetElements: function() {

		var that = STYLEV.VALIDATOR;

		//エラーや警告が１件もなければ何もしない
		if(that.resultArray.length === 0) {
			return false;
		}

		STYLEV.METHODS.each(that.markedTargets, function(target) {
			target.addEventListener('click', that.markElementFromTargets, false);
		});
	},
	//TODO: Try to unit with method of markElementFromConsole
	markElementFromTargets: function(event) {

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
		that.consoleList.scrollTop = distance;

		//監視を復活
		that.moManager.connect();

	},

	//四捨五入で指定された小数点以下を切り捨てる
	controlFloat: function(targetVal, pointPos) {
		return Math.round(parseFloat(targetVal) * Math.pow(10, pointPos)) / Math.pow(10, pointPos);
	},

	//全てを削除
	destroy: function(event) {
		var that = STYLEV.VALIDATOR;
		var isFromCloseButton = event && event.currentTarget.className === that.consoleCloseButton.className;

		that.removeAllAttrAndEvents();
		that.removeConsole();

		if(that.moManager !== undefined) {
			that.moManager.disconnect();
		}

		if(STYLEV.isBookmarklet && isFromCloseButton) {
			that.removeStylesheet();
		}

		STYLEV.isValidated = false;

		if(STYLEV.isChromeExtension) {
			STYLEV.CHROME_EXTENSION.syncStatusIsValidated(false);
		}

		console.info('Style Validator: Style Validator has removed.')
//		console.groupEnd();
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
		that.consoleMinimizeButton.hidden = true;
		that.consoleNormalizeButton.hidden = false;
		that.consoleWrapper.style.setProperty('height', that.consoleHeader.style.getPropertyValue('height'), '');
		that.consoleWrapperDynamicHeight = that.consoleWrapper.offsetHeight;
		STYLEV.scaleMode = 'minimum';
	},

	normalizeConsole: function() {
		var that = STYLEV.VALIDATOR;
		that.consoleMinimizeButton.hidden = false;
		that.consoleNormalizeButton.hidden = true;
		that.consoleWrapper.style.setProperty('height', STYLEV.consoleWrapperDynamicHeight || that.settings.CONSOLE_WRAPPER_DEFAULT_HEIGHT + 'px', '');
		that.consoleWrapperDynamicHeight = that.consoleWrapper.offsetHeight;
		STYLEV.scaleMode = 'normal';
	},

	setStyleDataBySelectors: function(_document) {
		var that = STYLEV.VALIDATOR;

		var doc = _document || document;

		var stylesheets = doc.styleSheets;

		STYLEV.METHODS.each(stylesheets, function(stylesheet) {

			var cssRules = stylesheet.cssRules;

			if(cssRules === null) {
				return 'continue';
			}

			STYLEV.METHODS.each(cssRules, function(cssRule) {

				//TODO: support media query and keyframes and etc....
				if(cssRule.media || cssRule.style === undefined || cssRule.selectorText === undefined) {
					return 'continue';
				}

				var selectorsOfCssRules = cssRule.selectorText;
				var styleOfCssRules = cssRule.style;
				var widthOfCssRules = !!styleOfCssRules.width ? styleOfCssRules.width : 'auto';
				var heightOfCssRules = !!styleOfCssRules.height ? styleOfCssRules.height : 'auto';

				var importantOfWidthOfCssRules = styleOfCssRules.getPropertyPriority('width');
				var importantOfHeightOfCssRules = styleOfCssRules.getPropertyPriority('height');
				var specificityArrayOfCssRules = SPECIFICITY.calculate(selectorsOfCssRules);

				//selectorの数分だけループ
				STYLEV.METHODS.each(specificityArrayOfCssRules, function(specificityObjectOfCssRules) {

					var selectorOfCssRules = specificityObjectOfCssRules.selector;
					var specificityOfCssRules = parseInt(specificityObjectOfCssRules.specificity.replace(/,/g, ''), 10);
					try {
						var targetsFromCssRules = doc.querySelectorAll(selectorOfCssRules);
					} catch(e){
						return 'continue';
					}

					STYLEV.METHODS.each(targetsFromCssRules, function(target) {

						var styleOfStyleAttr = target.style;
						var widthOfStyleAttr = !!styleOfStyleAttr.width ? styleOfStyleAttr.width : 'auto';
						var heightOfStyleAttr = !!styleOfStyleAttr.height ? styleOfStyleAttr.height : 'auto';

						var specificityOfWidth = widthOfStyleAttr ? 1000 : specificityOfCssRules;
						var specificityOfHeight = heightOfStyleAttr ? 1000 : specificityOfCssRules;

						var importantOfWidthOfStyleAttr = styleOfStyleAttr.getPropertyPriority('width');
						var importantOfHeightOfStyleAttr = styleOfStyleAttr.getPropertyPriority('height');

						//initialize
						if( target.dataset_stylevwidthspecificity === undefined ) {
							target.dataset_stylevwidthspecificity = specificityOfWidth;
						}
						if( target.dataset_stylevheightspecificity === undefined ) {
							target.dataset_stylevheightspecificity = specificityOfHeight;
						}
						if( target.dataset_stylevwidthimportant === undefined ) {
							target.dataset_stylevwidthimportant = importantOfWidthOfStyleAttr;
						}
						if( target.dataset_stylevheightimportant === undefined ) {
							target.dataset_stylevheightimportant = importantOfHeightOfStyleAttr;
						}

						//TODO: 同じような処理まとめる
						//TODO: IDだけつけて、他のデータ属性は追加しないようにする
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
					});
				});
			});
		});
	},

	setStyleDataByElements: function(_document) {

		var doc = _document || document;
		var elements = doc.querySelectorAll('*:not(.stylev-ignore)');

		STYLEV.METHODS.each(elements, function(element, i) {

			if(element.dataset_stylevwidth === undefined) {

				var widthValue = element.style.getPropertyValue('width');
				if(widthValue) {
					element.dataset_stylevwidth = widthValue;
				} else {
					element.dataset_stylevwidth = 'auto';
				}

			}
			if(element.dataset_stylevheight === undefined) {

				var heightValue = element.style.getPropertyValue('height');
				if(heightValue) {
					element.dataset_stylevheight = heightValue;
				} else {
					element.dataset_stylevheight = 'auto';
				}
			}
		});
	},

	getStyle: function(target, property, pseudo) {

		var culculatedValue;
		var pseudoSelector = pseudo || null;
		var computedPropertyValue = getComputedStyle(target, pseudoSelector).getPropertyValue(property);

		if( property === 'width' || property === 'height' ) {

			if(property === 'width') {
				culculatedValue = target.dataset_stylevwidth;
			}

			if(property === 'height') {
				culculatedValue = target.dataset_stylevheight;
			}

		} else {

			culculatedValue = computedPropertyValue;
		}

		return culculatedValue;
	}

};


STYLEV.METHODS = {

	//スムーススクロール TODO: 親要素を指定してインナースクロールにも対応させる
	smoothScroll: {

		//トップ座標を取得
		getOffsetTop: function(target) {

			if(target.nodeName.toLowerCase() === 'html') {
				return -window.pageYOffset;
			} else {
				return target.getBoundingClientRect().top + window.pageYOffset;
			}
		},

		//イージング
		easeInOutCubic: function (t) { return t<.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1; },

		//対象要素の位置取得
		getTargetPos: function(start, end, elapsed, duration) {

			var that = STYLEV.METHODS.smoothScroll;

			if (elapsed > duration) return end;
			return start + (end - start) * that.easeInOutCubic(elapsed / duration); // <-- you can change the easing funtion there
		},

		//実行
		execute: function(target, duration) {

			var that = STYLEV.METHODS.smoothScroll;

			var duration = duration || 500;
			var scrollTopY = window.pageYOffset;
			var targetPosY = that.getOffsetTop(target) - 100;

			var clock = Date.now();

			var requestAnimationFrame =
				window.requestAnimationFrame ||
					window.mozRequestAnimationFrame ||
					window.webkitRequestAnimationFrame ||
					function(fn){window.setTimeout(fn, 15);};

			//進度を計算し、スクロールさせる
			var step = function() {
				var elapsed = Date.now() - clock;
				window.scroll(0, that.getTargetPos(scrollTopY, targetPosY, elapsed, duration));
				if(elapsed <= duration) {
					requestAnimationFrame(step);
				}
			};
			step();
		}
	},

	each: function(target, fn) {

		var that = STYLEV.METHODS;

		var isExist = !!target;
		var isFunc = typeof fn === 'function';
		var returnedValue;
		var i = 0;

		if(!isExist || !isFunc) {
			return false;
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

					returnedValue = fn(key, value, i = (i+1)|0);

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
			} else {
				loopObject();
			}
		} else {
			loopObject();
		}
	},

	findHEX: function(string) {
		var that = STYLEV.METHODS;

		var resultArray = string.match(/#(?:[0-9a-f]{3}){1,2}/ig);

		that.each(resultArray, function(hex) {
			string = string.replace(hex, that.hex2rgb(hex));
		});

		return string;
	},

	hex2rgb: function (hex) {
		// Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
		var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
		hex = hex.replace(shorthandRegex, function(m, r, g, b) {
			return r + r + g + g + b + b;
		});
		var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result && 'rgb(' + parseInt(result[1], 16) + ' ,' + parseInt(result[2], 16) + ' ,' + parseInt(result[3], 16) + ')';
	}
};

//Chrome Extension
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

//DevToolsページ内で使うコンソールAPI関数を登録する
STYLEV.CHROME_DEVTOOLS = {

	execute: function(inspectOfConsoleAPI) {

		var that = STYLEV.CHROME_DEVTOOLS;

		//エラーや警告が１件もなければ何もしない
		if(STYLEV.VALIDATOR.resultArray.length === 0) {
			return false;
		}
		that.inspectOfConsoleAPI = inspectOfConsoleAPI;
		that.bindEvents();
	},

	bindEvents: function() {
		var that = STYLEV.CHROME_DEVTOOLS;

		STYLEV.METHODS.each(STYLEV.VALIDATOR.consoleTriggers, function(trigger) {
			trigger.addEventListener('click', that.inspectFromConsole, false);
		});
		STYLEV.METHODS.each(STYLEV.VALIDATOR.markedTargets, function(target) {
			target.addEventListener('click', that.inspectFromTargets, false);
		});
	},

	//コンソールからインスペクト
	inspectFromConsole: function(event){

		event.preventDefault();
		event.stopPropagation();

		var that = STYLEV.CHROME_DEVTOOLS;

		var trigger = event.currentTarget;
		var targetID = trigger.dataset.stylevconsoleid;
		var targetElem = document.querySelector('[data-stylevid="' + targetID + '"]');

		try {
			that.inspectOfConsoleAPI(targetElem);
		} catch(e) {
			console.error(e);
		}

	},

	//対象要素からインスペクトする
	inspectFromTargets: function(event) {

		event.preventDefault();
		event.stopPropagation();

		var that = STYLEV.CHROME_DEVTOOLS;

		var target = event.target;

		try {
			that.inspectOfConsoleAPI(target);
		} catch(e) {
			console.error(e);
		}

	}
};


//Chrome Extensionの場合
if(STYLEV.isChromeExtension){

	//オプションを更新してから実行　TODO: promiseを整理する
	STYLEV.VALIDATOR.updateOptions().then(function() {

		//自動実行の場合
		if(STYLEV.options.ENABLE_AUTO_EXECUTION) {

			//バリデートを実行
			STYLEV.CHROME_EXTENSION.execute();

		//手動実行の場合
		} else {

			//バリデート済の場合は、削除
//			if(STYLEV.isValidated) {

//				STYLEV.VALIDATOR.destroy();
//				STYLEV.isValidated = false;

				//バリデートの場合は、復活
//			} else {
//
//				STYLEV.isValidated = true;
//			}
		}

		//Extension内のリソースへアクセスするためのリソースルートを取得
		STYLEV.VALIDATOR.RESOURCE_ROOT = chrome.runtime.getURL('');
	});


	chrome.storage.onChanged.addListener(function(changes, namespace) {

		if(namespace === 'sync') {

			if(changes.options) {

				//TODO: class変更による検証再実行が嫌なら、監視を停止してトグルする
				if(changes.options.newValue.enableAnimation) {

					STYLEV.VALIDATOR.html.classList.add('stylev-animation');

				} else {

					STYLEV.VALIDATOR.html.classList.remove('stylev-animation');
				}

			}
		}
	});
}


STYLEV.isPassedURLFilters = true;
STYLEV.METHODS.each(STYLEV.options.URL_FILTERS, function(url) {
	if(url === location.href) {
		STYLEV.isPassedURLFilters = false;
		return 'break';
	}
});


//ブックマークレット
if(STYLEV.isBookmarklet && STYLEV.isPassedURLFilters) {

	//初期読込の場合
	if(STYLEV.isLoaded) {

		console.groupEnd();console.group('Style Validator: Executed by Bookmarklet.');
		STYLEV.VALIDATOR.execute();

	//一度実行している場合は、validateのみを実行
	} else if(STYLEV.isReLoaded) {

		console.groupEnd();console.group('Style Validator: Executed by Bookmarklet (ReExecution)');
		STYLEV.VALIDATOR.validate();
	}

}
