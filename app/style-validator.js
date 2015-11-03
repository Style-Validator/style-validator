/*!
 Style Validator
 "Validation in the Browser". Validate computedStyle with track all events.
 https://style-validator.github.io/
 by Igari Takeharu
 MIT License
 */

'use strict';

//名前空間を生成
var STYLEV = STYLEV || {};

//Chromeブラウザかの判定　※Operaを除く
STYLEV.isChrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1 && navigator.userAgent.toLowerCase().indexOf('opr') < 0;

//Chrome Extensionかの判定
STYLEV.isChromeExtension = (function() {
	try {
		chrome.runtime.onMessage.addListener(function() {} );
		return true;
	} catch(e) {
		return false;
	}
}());

//ブックマークレットかの判定 ChromeでかつChrome Extensionでない場合はブックマークレット
STYLEV.isBookmarklet = STYLEV.isChrome ? !STYLEV.isChromeExtension : true;

//再読込かどうかの判定
STYLEV.isReLoaded = STYLEV.VALIDATOR !== undefined;

//初期読込かどうかの判定
STYLEV.isLoaded = !STYLEV.isReLoaded;

//初期実行かどうかの判定
STYLEV.isFirstExecution = true;

//検証済かどうか
STYLEV.isValidated = false;

//オプション設定
STYLEV.options = {

	ENABLE_MUTATION_OBSERVER: true,
	ENABLE_AUTO_EXECUTION: false,
	ENABLE_ANIMATION: false,
	TARGET_SELECTOR: false,
	TARGET_SELECTOR_TEXT: '',
	NOT_TARGET_SELECTOR: false,
	NOT_TARGET_SELECTOR_TEXT: ''
};

//TODO: 再度テストする↓
//監視用プロパティ 連続で同じ要素が変更される場合は、メモリ節約のため、無視する
STYLEV.affectedElemsStylevId = STYLEV.affectedElemsStylevId || [];
STYLEV.ignoreElemsStylevId = STYLEV.ignoreElemsStylevId || [];
STYLEV.sameElemCount = STYLEV.sameElemCount || 0;

//consoleのscroll位置を記憶
STYLEV.consoleWrapperHeight = STYLEV.consoleWrapperHeight || 0;
STYLEV.consoleScrollTop = STYLEV.consoleScrollTop || 0;
STYLEV.selectedLineInConsole = STYLEV.selectedLineInConsole || null;

//バリデート機能オブジェクト
STYLEV.VALIDATOR = {

	//実行するための関数
	execute: function(callback) {

		var that = this;

		//インスタンス変数などを設定
		that.setParameters();

		//ライブラリを挿入
		that.insertLibraryOnBookmarklet();
		
		//GAに送信
		that.send2GA();

		//データを並列で非同期に取得し、全て終わったらそれぞれのインスタンス変数に格納
		Promise
			.all([
				that.getURL(that.settings.RULES_PATH).then(JSON.parse),
				that.getURL(that.settings.RULES_BY_EMPTY_TAG_PATH).then(JSON.parse),
				that.getURL(that.settings.TAGS_ALL_PATH).then(JSON.parse),
				that.getURL(that.settings.EMPTY_TAGS_PATH).then(JSON.parse),
				that.getURL(that.settings.TAGS_REPLACED_ELEMENT_PATH).then(JSON.parse),
				that.getURL(that.settings.TAGS_TABLE_CHILDREN_PATH).then(JSON.parse),
				that.getURL(that.settings.DISPLAY_PROP_CHANGEABLE_PROPERTIES_PATH).then(JSON.parse)
			])
			.then(function(dataArray) {

				that.rulesData = dataArray[0];
				that.emptyElemRulesData = dataArray[1];
				that.tagsAllData = dataArray[2];
				that.tagsEmptyData = dataArray[3];
				that.tagsReplacedElementData = dataArray[4];
				that.tagsTableChildren = dataArray[5];
				that.displayChangeableProperties = dataArray[6];

				//TODO: Promiseチェーンを整理する
				that.updateOptions().then(function() {
					//検査開始
					that.validate(callback);

					STYLEV.isFirstExecution = false;
				});
			});
	},

	insertLibraryOnBookmarklet: function() {
		var that = this;

		if(STYLEV.isBookmarklet) {
			that.scriptTag = document.createElement('script');
			that.scriptTag.src = that.settings.SPECIFICITY_PATH;

			/* append */
			that.head.appendChild(that.scriptTag);
		}
	},

	send2GA: function() {
		var that = this;

		var currentGA = that.head.querySelector('#stylev-ga');

		var isCurrentGA = currentGA !== null;

		if(isCurrentGA) {
			that.head.removeChild(currentGA);
		}

		that.scriptTagGA = document.createElement('script');
		that.scriptTagGA.src  = that.settings.GA_PATH;
		that.scriptTagGA.async  = true;
		that.scriptTagGA.id = 'stylev-ga';

		/* append */
		that.head.appendChild(that.scriptTagGA);
	},

	//インスタンス変数の定義
	setParameters: function() {

		var that = this;

		//要素の取得
		that.html = document.querySelector('html');
		that.head = document.querySelector('head');
		that.body = document.querySelector('body');

		//html要素のボーダーボトムのスタイルの初期値を記憶
		//このバリデータによる指定がない場合は、消す処理（null）をいれ、指定があった場合は、初期の数値に戻す
		that.htmlDefaultBorderBottomWidth = that.html.style.borderBottomWidth === '' ? null : that.html.style.borderBottomWidth;

		//リソースルートを設定
		that.RESOURCE_ROOT = STYLEV.chromeExtension.RESOURCE_ROOT || 'https://style-validator.github.io/';

		//静的な設定値 TODO: 他にもsettingsにまとめられる値があるので後で精査
		that.settings = {

			CONSOLE_WRAPPER_ID: 'stylev-console-wrapper',
			CONSOLE_LIST_ID: 'stylev-console-list',
			CONSOLE_HEADING_TEXT: 'Style Validator',
			CONSOLE_HEADER_DEFAULT_HEIGHT: 200,
			STYLESHEET_ID: 'stylev-stylesheet',
			STYLESHEET_PATH: that.RESOURCE_ROOT + 'app/style-validator.css',
			SPECIFICITY_PATH: that.RESOURCE_ROOT + 'extension/specificity.js',
			GA_PATH: that.RESOURCE_ROOT + './extension/google-analytics.js',
			CONGRATULATION_MESSAGE_TEXT: 'It\'s Perfect!',
			SERVER_RESOURCE_ROOT: 'https://style-validator.github.io/',
			RULES_PATH: that.RESOURCE_ROOT + 'data/rules.json',
			RULES_BY_EMPTY_TAG_PATH: that.RESOURCE_ROOT + 'data/rules-by-empty-tags.json',
			TAGS_ALL_PATH: that.RESOURCE_ROOT + 'data/tags-all.json',
			EMPTY_TAGS_PATH: that.RESOURCE_ROOT + 'data/tags-empty.json',
			TAGS_REPLACED_ELEMENT_PATH: that.RESOURCE_ROOT + 'data/tags-replaced-element.json',
			TAGS_TABLE_CHILDREN_PATH: that.RESOURCE_ROOT + 'data/tags-table-children.json',
			DISPLAY_PROP_CHANGEABLE_PROPERTIES_PATH: that.RESOURCE_ROOT + 'data/displayChangeableProperties.json',
			CONNECTED_2_DEVTOOLS_MESSAGE: 'Connected to DevTools',
			DISCONNECTED_2_DEVTOOLS_MESSAGE: 'Disconnected to DevTools',
			CONNECTED_2_DEVTOOLS_CLASS: 'stylev-console-mode-devtools',
			DISCONNECTED_2_DEVTOOLS_CLASS: 'stylev-console-mode-no-devtools'
		};

	},

	//Ajaxでデータを取得する関数
	getURL: function(url) {

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

	updateOptions: function() {

		return new Promise(function(resolve, reject) {

			//設定の更新
			if(STYLEV.isChromeExtension) {

				chrome.storage.sync.get('options', function(message) {

					if(message.options !== undefined) {
						//オプション設定
						STYLEV.options = {

							ENABLE_MUTATION_OBSERVER: message.options.enabledMutationObserver,
							ENABLE_AUTO_EXECUTION: message.options.enableAutoExecution,
							ENABLE_ANIMATION: message.options.enableAnimation,
							TARGET_SELECTOR: message.options.targetSelector,
							TARGET_SELECTOR_TEXT: message.options.targetSelectorText ? message.options.targetSelectorText.split(',') : '',
							NOT_TARGET_SELECTOR: message.options.notTargetSelector,
							NOT_TARGET_SELECTOR_TEXT: message.options.notTargetSelectorText ? message.options.notTargetSelectorText.split(',') : ''
						};
					}

					resolve();

				});

			} else {

				resolve();
			}
		});

	},

	//全要素に対して、バリデートを行う
	validate: function(callback) {

		console.info('Validator Started');

		var that = this;

		//DOM情報などを初期化
		that.initializeBeforeValidation();

		//全容要素を検査
		for ( var i = 0; i < that.allElemLength; i++ ) {

			var elemData = {};
			elemData.targetElem = that.allElem[i];
			elemData.targetElemTagName = elemData.targetElem.tagName.toLowerCase();
			elemData.targetElemDefault = that.iframeDocument.querySelector(elemData.targetElemTagName);

			var isRegularHTMLTag = that.regexAllHTMLTag.test(' ' + elemData.targetElemTagName + ' ');

			//通常のHTMLタグでない場合は、処理を止める svg1.1のsvgとstyleタグもdata属性が許可されていない
			if(!isRegularHTMLTag || elemData.targetElemTagName === 'style') {
				continue;
			}

			elemData.targetElem.dataset.stylevid = 'stylev-' + i;
			elemData.targetElemStyles = getComputedStyle(elemData.targetElem, '');
			elemData.targetParentElem = elemData.targetElem.parentElement;

			//親要素が合った場合
			if(elemData.targetParentElem) {

				//親要素のスタイル情報
				elemData.targetElemParentStyles = getComputedStyle(elemData.targetParentElem, '');

				//親要素のDisplayのプロパティ値
				elemData.targetElemParentDisplayProp = elemData.targetElemParentStyles.getPropertyValue('display');

			}

			//デフォルトスタイル情報（既にあれば既存オブジェクトを参照）TODO: 必要なしなので、あとで消す
//			elemData.targetElemDefaultStyles = elemData.targetElemDefaultStyles || getComputedStyle(elemData.targetElemDefault, '');

			//対象要素のDisplayプロパティのプロパティ値
			elemData.targetElemDisplayPropVal = elemData.targetElemStyles.getPropertyValue('display');

			//対象要素のDisplayプロパティのデフォルトのプロパティ値 TODO: displayはautoが無いので、普通のgetでもいいかも？
//			elemData.targetElemDefaultDisplayProp = elemData.targetElemDefaultStyles.getPropertyValue('display'); TODO: 必要なしなので、あとで消す
			elemData.targetElemDefaultDisplayProp = that.getStyle(elemData.targetElemDefault, 'display');

			//空要素を判定
			var isEmptyElements = that.regexEmptyElem.test(' ' + elemData.targetElemTagName + ' ');

			//テーブル要素を判定
			var isTableChildElements = that.regexTableChildElem.test(' ' + elemData.targetElemTagName + ' ');

			//インライン要素を判定 TODO: タグ名で判定できるようにする
			var isInlineElements = elemData.targetElemDisplayPropVal === 'inline';

			//インラインブロック要素を判定 TODO: タグ名で判定できるようにする
			var isInlineBlockElements = elemData.targetElemDisplayPropVal === 'inline-block';

			//サイズ指定できるインライン要素を判定
			var isReplacedElemTag = that.regexReplacedElem.test(' ' + elemData.targetElemTagName + ' ');

			//HTML以外であれば、親が存在するので親要素のチェック
			var hasParent = elemData.targetElemTagName !== 'html';

			if(isEmptyElements) {
				//TODO: 擬似要素をインスタンス変数に格納し、擬似要素エラー
			}

			//一つ一つの要素に対して、全てのNGルールの分だけ検査
			for(var j = 0, len = that.rulesData.length; j < len; j++) {

				//全てのbaseStyleが指定されているか
				var hasAllBaseStyles = true;
				var rule = that.rulesData[j];
				var baseStyles = rule['base-styles'];
				var errorRules = rule['error-styles'];
				var warningRules = rule['warning-styles'];
				var parentErrorRules = rule['parent-error-styles'];
				var parentWarningRules = rule['parent-warning-styles'];
				var replaced = rule['replaced'];

				//TODO: 以下に対応させる
				var pseudoBeforeErrorRules = rule['pseudo-before-error-styles'];
				var pseudoBeforeWarningRules = rule['pseudo-before-warning-styles'];
				var pseudoAfterErrorRules = rule['pseudo-after-error-styles'];
				var pseudoAfterWarningRules = rule['pseudo-after-warning-styles'];
				var referenceURL = rule['reference-url'];

				//初期化
				elemData.isDisplayPropChanged = false;

				//置換要素、非置換要素のルールに適合しない場合は、そのルールを無視する
				var isReplacedRuleOK =
					(replaced === 'Replaced elements' && isReplacedElemTag) ||
					(replaced === 'Non-replaced elements' && !isReplacedElemTag) ||
					(replaced === undefined);
				if(!isReplacedRuleOK) {
					continue;
				}

				//全てのベーススタイルの分だけ検査
				for(var baseStyleProp in baseStyles) {
					if ( baseStyles.hasOwnProperty(baseStyleProp) ) {

						var baseStylePropVal = baseStyles[baseStyleProp];

						var targetElemBasePropVal = getComputedStyle(elemData.targetElem, '').getPropertyValue(baseStyleProp);

						var hasBaseStyle = baseStylePropVal === targetElemBasePropVal;

						//ベーススタイルを持っていない場合は、中止してループから抜け出す
						if(!hasBaseStyle) {
							hasAllBaseStyles = false;
							break;
						}
					}
				}


				//全てのベーススタイルに適合した場合 TODO: ORもオプションで指定できるようにするか検討
				if(hasAllBaseStyles) {

					//エラースタイルのいずれかに適合するかを検査
					for (var errorRulesProp in errorRules) {
						if ( errorRules.hasOwnProperty(errorRulesProp) ) {
							that.detectErrorAndWarn('error', errorRulesProp, errorRules, elemData, isEmptyElements, false);
						}
					}

					//警告スタイルのいずれかに適合するかを検査
					for (var warningRulesProp in warningRules) {
						if ( warningRules.hasOwnProperty(warningRulesProp) ) {
							that.detectErrorAndWarn('warning', warningRulesProp, warningRules, elemData, isEmptyElements, false);
						}
					}

					//TODO: 擬似要素のスタイル取得に問題があるため、一時削除するが、後ほど調査
//					//擬似要素に対して警告スタイル毎に検査
//					for (var pseudoBeforeWarningProp in pseudoBeforeWarningRules) {
//						if (pseudoBeforeWarningRules.hasOwnProperty(pseudoBeforeWarningProp)) {
//							that.detectErrorAndWarn('warning', pseudoBeforeWarningProp, pseudoBeforeWarningRules, elemData, isEmptyElements, false, 'before');
//						}
//					}
//
//					//擬似要素に対してエラースタイル毎に検査
//					for (var pseudoBeforeErrorProp in pseudoBeforeErrorRules) {
//						if (pseudoBeforeErrorRules.hasOwnProperty(pseudoBeforeErrorProp)) {
//							that.detectErrorAndWarn('error', pseudoBeforeErrorProp, pseudoBeforeErrorRules, elemData, isEmptyElements, false, 'before');
//						}
//					}
//
//					//擬似要素に対して警告スタイル毎に検査
//					for (var pseudoAfterWarningProp in pseudoAfterWarningRules) {
//						if (pseudoAfterWarningRules.hasOwnProperty(pseudoAfterWarningProp)) {
//							that.detectErrorAndWarn('warning', pseudoAfterWarningProp, pseudoAfterWarningRules, elemData, isEmptyElements, false, 'after');
//						}
//					}
//
//					//擬似要素に対してエラースタイル毎に検査
//					for (var pseudoAfterErrorProp in pseudoAfterErrorRules) {
//						if (pseudoAfterErrorRules.hasOwnProperty(pseudoAfterErrorProp)) {
//							that.detectErrorAndWarn('error', pseudoAfterErrorProp, pseudoAfterErrorRules, elemData, isEmptyElements, false, 'after');
//						}
//					}

					//HTML以外であれば、親が存在するので親要素のチェック
					if(hasParent) {

						//親要素が警告スタイルのいずれかに適合するかを検査
						for (var parentWarningRulesProp in parentWarningRules) {
							if ( parentWarningRules.hasOwnProperty(parentWarningRulesProp) ) {
								that.detectErrorAndWarn('warning', parentWarningRulesProp, parentWarningRules, elemData, isEmptyElements, true);
							}
						}
						//親要素がエラースタイルのいずれかに適合するかを検査
						for (var parentErrorRulesProp in parentErrorRules) {
							if ( parentErrorRules.hasOwnProperty(parentErrorRulesProp) ) {
								that.detectErrorAndWarn('error', parentErrorRulesProp, parentErrorRules, elemData, isEmptyElements, true);
							}
						}
					}

					//デフォルトがブロック要素以外の場合は、Displayのプロパティ値を変化させるようなプロパティを指定してはいけない
					if( elemData.targetElemDefaultDisplayProp !== 'block' &&
						elemData.targetElemDefaultDisplayProp !== 'list-item' &&
						elemData.targetElemDefaultDisplayProp !== 'table' &&
						elemData.targetElemDefaultDisplayProp !== 'none' ) {

						//Displayプロパティを変化させるプロパティを指定されている場合
						for (var changeDisplayProp in that.displayChangeableProperties) {
							if ( that.displayChangeableProperties.hasOwnProperty(changeDisplayProp) ) {

								elemData.isDisplayPropChanged = true;

//								if(isTableChildElements) {
								that.detectErrorAndWarn('error', changeDisplayProp, that.displayChangeableProperties, elemData, isEmptyElements, false);
//								} else {
//									that.detectErrorAndWarn('warning', changeDisplayProp, that.displayChangeableProperties, elemData, isEmptyElements, isReplacedElem);
//								}

								elemData.isDisplayPropChanged = false;
							}
						}
					}


					//空要素の場合　TODO: インスタンス変数に格納　こうゆうの→that.emptyElemRulesData['warning-styles']
					if( isEmptyElements ) {

						//警告スタイル毎に検査
						for (var emptyElemWarningProp in that.emptyElemRulesData['warning-styles']) {
							if (that.emptyElemRulesData['warning-styles'].hasOwnProperty(emptyElemWarningProp)) {
								that.detectErrorAndWarn('warning', emptyElemWarningProp, that.emptyElemRulesData['warning-styles'], elemData, isEmptyElements, false);
							}
						}

						//エラースタイル毎に検査
						for (var emptyElemErrorProp in that.emptyElemRulesData['error-styles']) {
							if (that.emptyElemRulesData['error-styles'].hasOwnProperty(emptyElemErrorProp)) {
								that.detectErrorAndWarn('error', emptyElemErrorProp, that.emptyElemRulesData['error-styles'], elemData, isEmptyElements, false);
							}
						}
					}

				}

			}
		}

		//デフォルトスタイル取得用のiframeを削除
		that.removeIframe4getDefaultStyles();


		//コンソールを表示
		that.showConsole();

		//対象要素をクリックした時のイベントハンドラを登録
		that.toggleSelected();

		//バリデート完了時のcallbackが存在し関数だった場合実行
		if(typeof callback === 'function') {
			callback.bind(that)();
		}

		//バリデータによるDOM変更が全て完了してから監視開始
		that.ovservationManager = that.connectObserve();

	},

	//バリデーション実行直前の初期化処理
	initializeBeforeValidation: function() {

		var that = this;

		//HTMLタグを判定する用の正規表現
		that.regexEmptyElem = new RegExp('^( ' + that.tagsEmptyData.join(' | ') + ' )');
		that.regexReplacedElem = new RegExp('^( ' + that.tagsReplacedElementData.join(' | ') + ' )');
		that.regexTableChildElem = new RegExp('^( ' + that.tagsTableChildren.join(' | ') + ' )');

		//以下の処理の順序が重要

		//再実行時かつ、監視がされていたら監視を切断
		if(STYLEV.isReLoaded && that.isObserving) {
			that.ovservationManager.disconnectObserve();
		}

		//コンソールを削除
		that.removeConsole();

		//全ての属性とイベントを削除
		that.removeAllAttrAndEvents();

		//全要素を取得
		that.allElem = document.querySelectorAll('*');
		that.allElemLength = that.allElem.length;

		//エラー及び警告メッセージを管理する配列の初期化
		that.messageArray = [];

		//エラー数の初期化
		that.errorNum = 0;

		//警告数の初期化
		that.warningNum = 0;

		//デフォルトスタイル取得用iframeを挿入
		that.insertIframe4getDefaultStyles();


		//Auto判定のためにData属性を全要素に付与
		that.setStyleDataBySelectors(document);
		that.setStyleDataBySelectors(that.iframeDocument);

		//全てのHTMLタグ名の判定用の正規表現
		that.regexAllHTMLTag = new RegExp(' ' + that.tagsAllData.join(' | ') + ' ');

	},

	//エラーや警告を検知する TODO: propertyも事前に引数として渡して良いのでは？
	detectErrorAndWarn: function(type, ngStyleRulesProp, ngStyleRules, elemData, isEmptyElements, isParentCheck, pseudoSelector) {

		var that = this;

		//メッセージ管理するオブジェクト
		var message = {};

		//JSONデータのNGスタイルのプロパティ値
		var ngStyleRulesPropVal = ngStyleRules[ngStyleRulesProp];

		//対象要素のNGスタイルのデフォルト値
		var targetElemNgStyleDefaultVal = that.getStyle(elemData.targetElemDefault, ngStyleRulesProp, pseudoSelector);

		//対象要素のNGスタイルの現在の値
		var targetElemNgStyleVal = that.getStyle(elemData.targetElem, ngStyleRulesProp, pseudoSelector);

		//NGスタイルのプロパティ値を検索するための正規表現
		var regexNgStyleRulesPropVal;

		//否定表現の有無を検査
		var isReverse = ngStyleRulesPropVal.indexOf('!') === 0;

		//[]括弧が存在するか検査
		var hasGroupOperator = ngStyleRulesPropVal.match(/^!{0,1}\[(.+)\]$/);

		//括弧がある場合は、括弧の中身を返し、ない場合は、そのまま
		ngStyleRulesPropVal = hasGroupOperator ? hasGroupOperator[1] : ngStyleRulesPropVal.replace('!', '');

		//|OR演算子があるかの検査
		var hasOrOperator = ngStyleRulesPropVal.split('|').length > 1;

		//OR演算子がある場合は、OR演算子で区切った配列を返却し、そうでない場合はそのまま
		ngStyleRulesPropVal = hasOrOperator ? ngStyleRulesPropVal.split('|') : ngStyleRulesPropVal;

		//NGスタイルのプロパティ値が複数あった場合
		if(hasOrOperator) {

			//両端にスペースをいれて完全単語検索をしてかつ、複数ワードで検索
			regexNgStyleRulesPropVal = new RegExp(' ' + ngStyleRulesPropVal.join(' | ') + ' ');

		} else {

			//両端にスペースをいれて完全単語検索をしている
			regexNgStyleRulesPropVal = new RegExp(' ' + ngStyleRulesPropVal + ' ');
		}


		//親要素を持つ場合
		if(elemData.targetParentElem) {

			//親要素のNGスタイルの値
			var targetElemParentNgStyleVal = elemData.targetElemParentStyles.getPropertyValue(ngStyleRulesProp);

			//line-heightの相対指定の場合は、親子の継承関係であってもfont-sizeによって相対的に変わるため、font-sizeの関係性を計算に入れる
			//TODO: line-heightの計算にバグあり　今は指定を外している？
			if(ngStyleRulesProp === 'line-height') {
				var targetElemFontSize = parseFloat(elemData.targetElemStyles.getPropertyValue('font-size'));
				var targetElemParentFontSize = parseFloat(elemData.targetElemParentStyles.getPropertyValue('font-size'));
				var fontSizeScaleRate = targetElemParentFontSize / targetElemFontSize;
				var lineHeightNormalScaleRate = 1.14;
				targetElemNgStyleVal = targetElemNgStyleVal === 'normal' ? targetElemFontSize * lineHeightNormalScaleRate + 'px' : targetElemNgStyleVal;
				targetElemParentNgStyleVal = targetElemParentNgStyleVal === 'normal' ? that.controlFloat(targetElemParentFontSize * lineHeightNormalScaleRate, 1) + 'px' : targetElemParentNgStyleVal;
			}
		}

		var isNgStyle = regexNgStyleRulesPropVal.test(' ' + targetElemNgStyleVal + ' ');
		var is0Over = (parseInt(targetElemNgStyleVal, 10) > 0);
		var is0Under = (parseInt(targetElemNgStyleVal, 10) < 0);
		var is0 = (parseInt(targetElemNgStyleVal, 10) === 0);
		var isDefault = (targetElemNgStyleVal === targetElemNgStyleDefaultVal);
		var isInheritWithLineHeight = (that.controlFloat(parseFloat(targetElemNgStyleVal) * fontSizeScaleRate, 1) !== that.controlFloat(parseFloat(targetElemParentNgStyleVal), 1));
		var isInherit = (targetElemNgStyleVal === targetElemParentNgStyleVal);
		var isParentNgStyle = (regexNgStyleRulesPropVal.test(' ' + elemData.targetElemParentDisplayProp + ' '));

//		console.log('=================')
//		console.log('elemData.targetElemTagName: ' + elemData.targetElemTagName)
//		console.log('isReverse: ' + isReverse)
//		console.log('ngStyleRulesProp: ' + ngStyleRulesProp)
//		console.log('ngStyleRulesPropVal: ' + ngStyleRulesPropVal)
//		console.log('targetElemNgStyleVal: ' + targetElemNgStyleVal)
//		console.log('targetElemNgStyleDefaultVal: ' + targetElemNgStyleDefaultVal)
//		console.log('regexNgStyleRulesPropVal: ' + regexNgStyleRulesPropVal)

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
			(!isReverse && ngStyleRulesPropVal === 'over-0' && is0Over) ||

			//0以下
			(!isReverse && ngStyleRulesPropVal === 'under-0' && is0Under) ||

			//デフォルト値の場合
			(!isReverse && ngStyleRulesPropVal === 'default' && isDefault) ||

			//継承スタイルの場合（line-height）
			(!isReverse && ngStyleRulesPropVal === 'inherit' && ngStyleRulesProp === 'line-height' && isInheritWithLineHeight) ||

			//継承スタイルの場合（通常：line-height以外）
			(!isReverse && ngStyleRulesPropVal === 'inherit' && isInherit) ||

			//反転でない場合かつ、親要素がエラースタイルの場合
			(!isReverse && isParentCheck && isParentNgStyle) ||


			/////////////////////////////
			//is reverse
			//
			// 一致しない TODO: 実現できるか調査
//			(isReverse && !isNgStyle) ||

			//0以外
			(isReverse && ngStyleRulesPropVal === '0' && !is0) ||

			//デフォルト値以外
			(isReverse && ngStyleRulesPropVal === 'default' && !isDefault) ||

			//継承スタイル以外（line-height）
			(isReverse && ngStyleRulesPropVal === 'inherit' && ngStyleRulesProp === 'line-height' && !isInheritWithLineHeight) ||

			//継承スタイル以外（通常：line-height以外）
			(isReverse && ngStyleRulesPropVal === 'inherit' && !isInherit) ||

			//反転の場合かつ、親要素のエラースタイル以外に適合したら
			(isReverse && isParentCheck && !isParentNgStyle)

		){

			//親要素を検査する場合
			if(isParentCheck) {
				message.text = (isEmptyElements ? 'Empty Elements ' : '') +'<' + elemData.targetElemTagName + '>' + ' display: ' + elemData.targetElemDisplayPropVal + '; display property of parent element is incorrect.(' +elemData.targetElemParentDisplayProp + ')';

			//通常時
			} else {
				message.text = (isEmptyElements ? 'Empty Elements ' : '') +'<' + elemData.targetElemTagName + '>' + ' display: ' + elemData.targetElemDisplayPropVal + '; ' + ngStyleRulesProp + ': ' + targetElemNgStyleVal + ';' + (elemData.isDisplayPropChanged ? '(Display Property has changed.)' : '');
			}

			//要素のID名
			message.idName = elemData.targetElem.dataset.stylevid;

			//エラーか警告かのタイプ
			message.type = type;

			//メッセージ配列に挿入
			that.messageArray.push(message);

			//エラー
			if(type === 'error') {

				STYLEV.methods.addClass(elemData.targetElem, 'stylev-target-error');
			}

			//警告
			if(type === 'warning') {

				STYLEV.methods.addClass(elemData.targetElem, 'stylev-target-warning');
			}
		}
	},

	//監視
	ovservationManager: null,

	//監視開始
	connectObserve: function() {
		var that = this;

		//監視対象の属性を指定
		var targetAttributes = [
			'style',
			'class'
		];

		//監視する実行スパンをミリ秒で指定
		var OBSERVE_INTERVAL = 1000;

		if(!STYLEV.options.ENABLE_MUTATION_OBSERVER) {
			if(that.isObserving) {
				that.ovservationManager.disconnectObserve();
			}
			return false;
		}

		that.observer = new MutationObserver(function (mutations) {

			//監視タイマーがある場合は、クリア
			if(that.observationTimer !== undefined) {

				clearTimeout(that.observationTimer);
			}

			//監視タイマーの設定
			that.observationTimer = setTimeout(function() {

				//consoleに出すメッセージの配列
				var message = [];
				//監視に反応したとき無視するかどうか
				var isIgnore = false;

				//監視対象毎に
				for(var i = 0, len = mutations.length; i < len; i++) {

					var mutation = mutations[i];

					var regex = new RegExp(' ' + STYLEV.ignoreElemsStylevId.join(' | ') + ' ');
					if(regex.test(' ' + mutation.target.dataset.stylevid + ' ')) {
						isIgnore = true;
						continue;
					}

					//要素の記録が存在する場合
					if(STYLEV.affectedElemsStylevId.length) {

						//現在の要素と、1つ前の要素が同じ場合
						if(mutation.target.dataset.stylevid === STYLEV.affectedElemsStylevId[STYLEV.affectedElemsStylevId.length - 1]) {
							STYLEV.sameElemCount++;
						} else {
							STYLEV.sameElemCount = 0;
						}
					}

					//前回の要素と今回の要素が同じだった回数が5より少ない場合
					if(STYLEV.sameElemCount < 5) {

						//影響した要素のIDを保管
						STYLEV.affectedElemsStylevId.push(mutation.target.dataset.stylevid);

					} else {

						//初期化
						STYLEV.affectedElemsStylevId = [];
						STYLEV.sameElemCount = 0;
						STYLEV.ignoreElemsStylevId.push(mutation.target.dataset.stylevid);
					}


					if(mutation.target.tagName) {
						var attrsArray=[];
						for (var attr, i = 0, attrs = mutation.target.attributes, n = attrs.length; i < n; i++){
							attr = attrs[i];
							if(i === 0){
								attrsArray.push(' ' + attr.nodeName + '="' + attr.nodeValue + '"');
							} else {
								attrsArray.push(attr.nodeName + '="' + attr.nodeValue + '"');
							}
						}
						message.push(mutation.target.dataset.stylevid + ': <' + mutation.target.tagName.toLowerCase() + attrsArray.join(' ') + '>');
					}

					if(mutation.type === 'attributes') {
						message.push(mutation.attributeName + ' ' + mutation.type + ' of above is changed from "' + mutation.oldValue + '".');
					}
					if(mutation.type === 'characterData') {
						message.push(mutation.characterData + ' ' + mutation.type + ' of above is changed from "' + mutation.oldValue + '".');
					}

					if(mutation.addedNodes.length) {
						for(var i = 0, len = mutation.addedNodes.length; i < len; i++) {
							message.push(mutation.addedNodes[i].outerHTML + ' is added.');
						}
					}
					if(mutation.removedNodes.length) {
						for(var i = 0, len = mutation.removedNodes.length; i < len; i++) {
							message.push(mutation.removedNodes[i].outerHTML + ' is removed.');
						}
					}

					console.info(message.join('\n\n'));
				}

				//無視しない場合
				if(!isIgnore) {

					//TODO: 共通化できないか調査
					if(STYLEV.isChromeExtension) {
						STYLEV.chromeExtension.execute();

					} else {

						that.validate();
					}
				}


			}, OBSERVE_INTERVAL);
		});

		//対象要素の配下の全要素を監視し、ノードの追加・変更・削除と属性の追加・変更・削除を検知
		var observationConfig = {
			attributes: true,
			attributeFilter: targetAttributes,
			childList: true,
			subtree: true,
			attributeOldValue: true,
			characterDataOldValue: true

		};

		that.observer.observe(document.querySelector('body'), observationConfig);
		that.observer.observe(document.querySelector('head'), observationConfig);

		console.info('Observer Connected');
		that.isObserving = true;

		return {

			disconnectObserve: function() {
				//監視がされている場合、監視を止める
				that.observer.disconnect();
				that.isObserving = false;
				console.info('Observer Disconnected');
			}
		}

	},

	//スタイルシート挿入
	insertStylesheet: function() {

		var that = this;

		//Extensionが稼働している場合
		if(STYLEV.isUsingExtension) {
			return false;
		}

		//Extensionが稼働していない場合
		else {

			that.linkTag = document.createElement('link');
			that.linkTag.id = that.settings.STYLESHEET_ID;
			that.linkTag.rel = 'stylesheet';
			that.linkTag.type = 'text/css';
			that.linkTag.href = that.settings.STYLESHEET_PATH;

			/* append */
			that.head.appendChild(that.linkTag);
		}

		return false;
	},

	//スタイルシートを削除
	removeStylesheet: function() {
		var that = this;

		//TODO: 全体的に、再取得と削除できないか調査
		var targetLink = document.querySelector('#stylev-stylesheet');

		if(targetLink !== null) {
			that.head.removeChild(that.linkTag);
		}
	},

	//コンソールを削除
	removeConsole: function() {
		var that = this;

		//TODO: 全体的に、再取得と削除できないか調査
		var html = document.querySelector('html');
		//TODO: 全体的に、再取得と削除できないか調査
		var consoleWrapper = document.querySelector('#stylev-console-wrapper');

		if(consoleWrapper !== null) {

			html.removeChild(consoleWrapper);

			var triggers = consoleWrapper.shadowRoot.querySelectorAll('a');

			for(var i = 0, len = triggers.length; i < len; i++) {
				var trigger = triggers[i];
				trigger.removeEventListener('click');//TODO: 関数を指定する
			}

			//ログ表示領域分の余白を初期化
			html.style.setProperty('border-bottom-width', that.htmlDefaultBorderBottomWidth, '');

		}
	},

	//デフォルトスタイルを取得するために、ダミーiframeを挿入
	insertIframe4getDefaultStyles: function() {

		var that = this;

		//TODO: 全体的に、再取得と削除できないか調査
		var dummyIFrame = document.querySelector('#stylev-dummy-iframe');
		if(dummyIFrame !== null) {
			return;
		}

		that.iframe4test = document.createElement('iframe');
		that.iframe4test.id = 'stylev-dummy-iframe';
		that.html.appendChild(that.iframe4test);
		that.iframeWindow = that.iframe4test.contentWindow;
		that.iframeDocument = that.iframeWindow.document;
		that.iframeBody = that.iframeDocument.querySelector('body');

		var df = document.createDocumentFragment();

		for(var i = 0, len = that.tagsAllData.length; i < len; i++) {
			df.appendChild(document.createElement(that.tagsAllData[i]));
		}

		that.iframeBody.appendChild(df);

	},

	//ダミーiframeを削除
	removeIframe4getDefaultStyles: function() {
		var that = this;

		//TODO: 全体的に、再取得と削除できないか調査
		var dummyIFrame = document.querySelector('#stylev-dummy-iframe');

		//対象要素が存在していたら
		if(dummyIFrame !== null) {
			that.html.removeChild(dummyIFrame);
		}
	},

	//全要素のclassを削除する関数
	removeAllAttrAndEvents: function() {
		var that = this;

		var allElem = document.querySelectorAll('*');
		var html = document.querySelector('html');

		//属性やclassNameを削除
		for(var i = 0, len = allElem.length; i < len; i++) {
			allElem[i].removeAttribute('data-stylevid');
			allElem[i].removeAttribute('data-stylevclass');
			allElem[i].removeEventListener('click', STYLEV.chromeExtension.bind2DevToolsInspect.inspectFromElements);
			allElem[i].removeEventListener('click', that.actionInBody);
		}

		if(html !== undefined) {
			html.removeEventListener('keyup', that.destroyOnEsc);
		}

	},

	//結果を表示させる
	showConsole: function() {

		var that = this;

		//ドキュメンとフラグメント
		that.docFlag = document.createDocumentFragment();

		that.consoleWrapper = document.createElement('div');
		that.consoleWrapperShadowRoot = that.consoleWrapper.createShadowRoot();

		if(STYLEV.isChromeExtension) {
			that.consoleWrapperShadowRoot.innerHTML = '<style>@import "' + STYLEV.chromeExtension.RESOURCE_ROOT + 'app/style-validator-for-console.css' + '";</style>';
		} else {
			that.consoleWrapperShadowRoot.innerHTML = '<style>@import "' + that.settings.SERVER_RESOURCE_ROOT + 'app/style-validator-for-console.css' + '";</style>';
		}

		that.consoleHeader = document.createElement('header');
		that.consoleHeading = document.createElement('h1');
		that.consoleMode = document.createElement('p');
		that.consoleTotalNum = document.createElement('div');
		that.consoleBody = document.createElement('div');
		that.consoleList = document.createElement('ul');
		that.consoleCloseButton = document.createElement('a');

		//クリック時の判定
		that.isMouseDownConsoleHeader = false;

		//ドラッグアンドドロップで移動させる処理に必要な変数
		that.consoleStartPosY = 0;
		that.consoleCurrentPosY = 0;
		that.consoleDiffPosY = 0;

		//属性を設定
		that.consoleWrapper.id = that.settings.CONSOLE_WRAPPER_ID;
		that.consoleCloseButton.href = 'javascript: void(0);';
		that.consoleList.id = that.settings.CONSOLE_LIST_ID;

		//コンソールヘッダに表示させるテキストの設定
		that.consoleHeading.textContent = that.settings.CONSOLE_HEADING_TEXT;
		that.consoleTotalNum.textContent = 'Total: ' + that.messageArray.length + ' / Error: ' + that.errorNum + ' / warning: ' + that.warningNum;

		//コンソール内に表示させる結果の要素を生成
		that.createMessagesInConsole();

		//コンソール関連の動作のイベントの登録
		that.bindEvents4Console();

		//コンソール内に挿入するHTML要素を挿入 TODO: 同じ記述をまとめる
		that.consoleHeader.appendChild(that.consoleHeading);
		that.consoleHeader.appendChild(that.consoleTotalNum);
		that.consoleHeader.appendChild(that.consoleMode);
		that.consoleHeader.appendChild(that.consoleCloseButton);
		that.consoleWrapperShadowRoot.appendChild(that.consoleHeader);
		that.consoleWrapperShadowRoot.appendChild(that.consoleBody);
		that.consoleList.appendChild(that.docFlag);
		that.consoleBody.appendChild(that.consoleList);
		that.html.appendChild(that.consoleWrapper);

		that.doAfterParsedConsole();
	},

	doAfterParsedConsole: function() {

		var that = this;

		setTimeout(function() {

			that.consoleWrapper.style['height'] = (STYLEV.consoleWrapperHeight || that.settings.CONSOLE_HEADER_DEFAULT_HEIGHT) + 'px';

			//コンソールの包括要素のデフォルトの高さを計算し記憶しておく
			that.consoleWrapperDefaultHeight = parseInt(that.consoleWrapper.offsetHeight, 10);

			//コンソールの包括要素の高さ分だけ最下部に余白をつくる
			//コンソールで隠れる要素がでないための対応
			that.html.style.setProperty('border-bottom-width', that.consoleWrapperDefaultHeight + 'px', 'important');

			//表示結果をChrome Extensionに伝える
			that.send2ChromeExtension();

			//前回開いた状態を復元する
			that.restorePreviousCondition();
		}, 0);
	},

	send2ChromeExtension: function() {

		var that = this;

		if(STYLEV.isChromeExtension) {

			//アイコンに件数を表示させる
			chrome.runtime.sendMessage({
				setBadgeText: that.messageArray.length
			});

			//DevToolsの接続状態を表示させる
			chrome.runtime.sendMessage({

				name: 'switchMode'

			}, function(message) {

				if(message.isConnected2Devtools !== undefined) {

					STYLEV.methods.addClass(that.consoleMode, message.isConnected2Devtools ? that.settings.CONNECTED_2_DEVTOOLS_CLASS : that.settings.DISCONNECTED_2_DEVTOOLS_CLASS);
					that.consoleMode.textContent = message.isConnected2Devtools ? that.settings.CONNECTED_2_DEVTOOLS_MESSAGE : that.settings.DISCONNECTED_2_DEVTOOLS_MESSAGE;
				}
			});
		}

	},

	//前回開いた状態を復元する
	restorePreviousCondition: function() {

		var that = this;

		//前回のスクロール値まで移動　それがなければ、0がはいる
		setTimeout(function() {
			that.consoleList.scrollTop = STYLEV.consoleScrollTop;
		}, 0);

		//スクロール値を記憶　TODO: イベント削除をいれる　必要ないか・・・一度消えるし今は
		that.consoleList.addEventListener('scroll', function() {
			STYLEV.consoleScrollTop = event.currentTarget.scrollTop;
		});

		//最後にフォーカスしていた要素に対して、インスペクト
		if(typeof STYLEV.chromeExtension.bind2DevToolsInspect.inspectOfConsoleAPI === 'function') {
			STYLEV.chromeExtension.bind2DevToolsInspect.inspectOfConsoleAPI();
		}

		//選択した行があった場合、選択した行と現在のリストを比べて、同一のものに選択状態のclassを付与
		if(STYLEV.selectedLineInConsole) {
			var listItems = that.consoleList.querySelectorAll('li');
			for(var i = 0, len = listItems.length; i < len; i++) {
				if(listItems[i].innerHTML === STYLEV.selectedLineInConsole.innerHTML) {
					STYLEV.methods.addClass(listItems[i], 'stylev-trigger-selected');
					break;
				}
			}
		}
	},

	//コンソール内に表示させる結果の要素を生成
	createMessagesInConsole: function() {

		var that = this;

		//エラーや警告が1件もなかった場合
		if(that.messageArray.length === 0) {

			that.congratulationsMessage = document.createElement('li');
			that.congratulationsMessage.dataset.stylevclass = 'stylev-console-perfect';
			that.congratulationsMessage.textContent = that.settings.CONGRATULATION_MESSAGE_TEXT;
			that.docFlag.appendChild(that.congratulationsMessage);
		}

		//エラーや警告が存在した場合
		else {

			//メッセージの数だけループ
			for(var i = 0, len = that.messageArray.length; i < len; i++) {

				//ログの行を表示させるHTML要素を生成
				var li = document.createElement('li');
				var anchor = document.createElement('a');
				var logID = document.createElement('span');

				//属性を設定
				anchor.href = 'javascript: void(0);';

				//クリックイベントを設定
				anchor.addEventListener('click', that.actionInConsole.bind(that, that.messageArray[i]), false);

				//テキスト情報を挿入
				anchor.textContent = that.messageArray[i].text;

				//ID情報を挿入
				anchor.dataset.stylevconsoleid = that.messageArray[i].idName;
				logID.textContent = that.messageArray[i].idName;

				//エラーか警告のタイプのクラス名を設定
				STYLEV.methods.addClass(li, 'stylev-trigger-' + that.messageArray[i].type);

				//エラー数をカウント
				if(that.messageArray[i].type === 'error') {
					that.errorNum++;
				}

				//警告数をカウント
				if(that.messageArray[i].type === 'warning') {
					that.warningNum++;
				}

				//DocumentFlagmentにHTML要素を挿入
				anchor.appendChild(logID);
				li.appendChild(anchor);
				that.docFlag.appendChild(li);
			}
		}
	},

	//コンソール関連のイベントを登録
	bindEvents4Console: function() {
		var that = this;


		that.consoleHeader.addEventListener('mousedown', function(event) {
			event.preventDefault();
			that.isMouseDownConsoleHeader = true;
			that.consoleStartPosY = event.pageY;
		}, false);

		that.html.addEventListener('mousemove', function(event) {
			if(that.isMouseDownConsoleHeader) {
				that.consoleCurrentPosY = event.pageY;
				that.consoleDiffPosY = that.consoleStartPosY - that.consoleCurrentPosY;
				that.consoleWrapper.style['height'] = (that.consoleWrapperDefaultHeight + that.consoleDiffPosY) + 'px';
				this.style.setProperty('border-bottom-width', that.consoleWrapperDefaultHeight + that.consoleDiffPosY + 'px', 'important');
			}
		}, false);

		that.html.addEventListener('mouseup', function() {
			that.isMouseDownConsoleHeader = false;
			that.consoleWrapperDefaultHeight = parseInt(that.consoleWrapper.offsetHeight, 10);
			STYLEV.consoleWrapperHeight = that.consoleWrapperDefaultHeight;
		}, false);

		that.consoleCloseButton.addEventListener('click', function() {
			that.destroy();
		}, false);

		that.html.addEventListener('keyup', that.destroyOnEsc, false);
	},

	destroyOnEsc: function() {

		var that = STYLEV.VALIDATOR;

		if(event.keyCode === 27) {
			that.destroy();
		}
	},

	//コンソール内の動作
	actionInConsole: function(messageArray) {

		var that = this;

		//TODO: 全体的に、再取得と削除できないか調査
		var wrapper = document.querySelector('#stylev-console-wrapper').shadowRoot;
		var lines = wrapper.querySelectorAll('li');

		//全ての行から選択状態を外す
		for(var i = 0, len = lines.length; i < len; i++) {
			STYLEV.methods.removeClass(lines[i], 'stylev-trigger-selected');
		}

		//クリックした行と同じidを持つ行に選択状態を付加
		var triggers = wrapper.querySelectorAll('[data-stylevconsoleid="' + event.currentTarget.dataset.stylevconsoleid + '"]');
		for(var i = 0, len = triggers.length; i < len; i++) {

			var trigger = triggers[i];
			STYLEV.methods.addClass(trigger.parentElement, 'stylev-trigger-selected');
			if(i === 0) {
				STYLEV.selectedLineInConsole = trigger.parentElement;
			}
		}

		//全ての対象要素から選択状態を外し、クリックした要素に選択状態を付加
		for(var j = 0, len = that.allElem.length; j < len; j++) {
			STYLEV.methods.removeClass(that.allElem[j], 'stylev-target-selected');
		}
		var target = document.querySelector('[data-stylevid="' + messageArray.idName + '"]');
		STYLEV.methods.addClass(target, 'stylev-target-selected');

		//対象の要素までスクロール
		STYLEV.methods.smoothScroll.execute(target);

	},

	//ページ内の要素に対する動作
	toggleSelected: function() {

		var that = this;

		//エラーや警告が１件もなければ何もしない
		if(that.messageArray.length === 0) {
			return false;
		}

		//TODO: 全体的に、再取得と削除できないか調査
		that.consoleWrapper = document.querySelector('#stylev-console-wrapper');
		that.consoleWrapperShadowRoot = that.consoleWrapper.shadowRoot;
		that.consoleTriggerWrapper = that.consoleWrapperShadowRoot.querySelector('ul');
		that.consoleTriggers = that.consoleWrapperShadowRoot.querySelectorAll('li');
		that.targets = document.querySelector('body').querySelectorAll('[data-stylevclass*="stylev-target-error"], [data-stylevclass*="stylev-target-warning"]');

		for(var i = 0, len = that.targets.length; i < len; i++) {
			var target = that.targets[i];
			target.addEventListener('click', that.actionInBody, false);
		}

		return false;
	},
	//TODO: actionInConsole内の処理が似通っているため上手くまとめる。全要素をループしている最中に埋め込むか
	//TODO: あと結構やっつけ処理になっているので後で整理
	actionInBody: function() {

		event.stopPropagation();
		event.preventDefault();

		var that = STYLEV.VALIDATOR;

		//TODO: 全体的に、再取得と削除できないか調査
		var wrapper = document.querySelector('#stylev-console-wrapper').shadowRoot;

		//全ての行から選択状態を外し、クリックした行に選択状態を付加
		for(var i = 0, len = that.consoleTriggers.length; i < len; i++) {
			STYLEV.methods.removeClass(that.consoleTriggers[i], 'stylev-trigger-selected');
		}
		var triggers = wrapper.querySelectorAll('[data-stylevconsoleid="' + event.currentTarget.dataset.stylevid + '"]');

		for(var i = 0, len = triggers.length; i < len; i++) {
			var trigger = triggers[i];
			STYLEV.methods.addClass(trigger.parentElement, 'stylev-trigger-selected');

			//選択した行として、複数ある内の最初の要素を記憶
			if(i === 0) {
				STYLEV.selectedLineInConsole = trigger.parentElement;
			}
		}

		//全ての対象要素から選択状態を外し、クリックした要素に選択状態を付加
		for(var j = 0, len = that.allElem.length; j < len; j++) {
			STYLEV.methods.removeClass(that.allElem[j], 'stylev-target-selected');
		}
		var target = document.querySelector('[data-stylevid="' + event.currentTarget.dataset.stylevid + '"]');
		STYLEV.methods.addClass(target, 'stylev-target-selected');

		//複数ある場合は先頭の行にランディング
		var distance = triggers[0].offsetTop;

		//コンソール内の対象要素の行を先頭に
		that.consoleTriggerWrapper.scrollTop = distance;

	},

	//四捨五入で指定された小数点以下を切り捨てる
	controlFloat: function(targetVal, pointPos) {
		return Math.round(parseFloat(targetVal) * Math.pow(10, pointPos)) / Math.pow(10, pointPos);
	},

	//全てを削除
	destroy: function() {
		var that = this;

		that.removeAllAttrAndEvents();
		that.removeConsole();

		if(that.isObserving) {
			that.ovservationManager.disconnectObserve();
		}
		that.removeStylesheet();

		if(STYLEV.isChromeExtension) {
			setTimeout(function() {//Fix Timing Bug
				chrome.runtime.sendMessage({name: 'validatedStatus2False'});
			}, 0);
		}
	},

	setStyleDataBySelectors: function(document) {
		var that = this;

		var stylesheets = document.styleSheets;

		for(var i = 0, len = stylesheets.length; i < len; i++) {

			var stylesheet = stylesheets[i];
			var cssRules = stylesheet.cssRules;

			if(cssRules === null) {
				continue;
			}

			for(var j = 0, rulesLength = cssRules.length; j < rulesLength; j++) {

				var cssRule = cssRules[j];

				//TODO: support media query and keyframes and etc....
				if(cssRule.media || cssRule.style === undefined) {
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

					}
				}

			}
		}

		that.setStyleDataByElements(document);

	},

	setStyleDataByElements: function(document) {

		var elements = document.querySelectorAll('*');

		for(var g = 0, elementsLength = elements.length; g < elementsLength; g++) {

			var element = elements[g];

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

		}
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


STYLEV.methods = {

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

			var that = this;

			if (elapsed > duration) return end;
			return start + (end - start) * that.easeInOutCubic(elapsed / duration); // <-- you can change the easing funtion there
		},

		//実行
		execute: function(target, duration) {

			var that = this;

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

	//classを追加するための汎用関数
	addClass: function(target, className) {

		var targetClassName = target.dataset.stylevclass;

		var hasTheClassName = false;
		var settingClassName = '';

		if(targetClassName === undefined) {
			target.dataset.stylevclass = '';
		} else {
			hasTheClassName = targetClassName.indexOf(className) !== -1;
		}

		if(!hasTheClassName) {
			settingClassName = (targetClassName ? ' ' : '') + className;
			target.dataset.stylevclass += settingClassName;
		}

		return false;
	},

	//classを削除する関数
	removeClass: function(target, className) {

		if(target.dataset.stylevclass) {
			//TODO: 半角スペースを残さないように処理をいれる
			target.dataset.stylevclass = target.dataset.stylevclass.replace(className, '')
		}
	}

};

//Chrome Extension
STYLEV.chromeExtension = {

	execute: function() {

		console.info('Style Validator with Chrome Extension');

		setTimeout(function() {//Fix Timing Bug
			chrome.runtime.sendMessage({name: 'execute'});
		}, 0);

	},

	RESOURCE_ROOT: null,

	//DevToolsページ内で使うコンソールAPI関数を登録する
	bind2DevToolsInspect: {

		execute: function(inspectOfConsoleAPI) {

			var that = this;

			//エラーや警告が１件もなければ何もしない
			if(STYLEV.VALIDATOR.messageArray.length === 0) {
				return false;
			}
			that.inspectOfConsoleAPI = inspectOfConsoleAPI;
			that.setParameters();
			that.bindEvents();

			return false;
		},

		setParameters: function() {
			var that = this;

			//TODO: 全体的に、再取得と削除できないか調査
			that.consoleWrapper = document.querySelector('#stylev-console-wrapper');
			that.consoleWrapperShadowRoot = that.consoleWrapper.shadowRoot;
			that.consoleList = that.consoleWrapperShadowRoot.querySelector('#stylev-console-list');
			that.triggers = that.consoleList.querySelectorAll('a[data-stylevconsoleid]');
			that.targets = document.querySelector('body').querySelectorAll('[data-stylevclass*="stylev-target-error"], [data-stylevclass*="stylev-target-warning"]');
			//that.targets = document.querySelectorAll('[data-stylevclass*="stylev-target-error"], [data-stylevclass*="stylev-target-warning"]');
			//TODO: 何故指定したクラス以外の要素が入ってきてしまうのか調査
		},

		bindEvents: function() {
			var that = this;

			for(var i = 0, len = that.triggers.length; i < len; i++) {
				that.triggers[i].addEventListener('click', that.inspectFromConsole, false);
			}

			for(var j = 0, len = that.targets.length; j < len; j++) {
				that.targets[j].addEventListener('click', that.inspectFromElements, false);
			}
		},

		//コンソールからインスペクト
		inspectFromConsole: function(){

			event.preventDefault();

			var that = STYLEV.chromeExtension.bind2DevToolsInspect;

			var trigger = event.currentTarget;
			var targetID = trigger.querySelector('span').textContent;
			var targetElem = document.querySelector('[data-stylevid="' + targetID + '"]');

			try {
				that.inspectOfConsoleAPI(targetElem);
			} catch(e) {
				console.error(e);
			}

		},

		//対象要素からインスペクトする
		inspectFromElements: function() {

			event.preventDefault();
			event.stopPropagation();

			var that = STYLEV.chromeExtension.bind2DevToolsInspect;

			var target = event.target;

			try {
				that.inspectOfConsoleAPI(target);
			} catch(e) {
				console.error(e);
			}

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
			STYLEV.chromeExtension.execute();

		//手動実行の場合
		} else {

			//バリデート済の場合は、削除
			if(STYLEV.isValidated) {

				STYLEV.VALIDATOR.destroy();
				STYLEV.isValidated = false;

				//バリデートの場合は、復活
			} else {

				STYLEV.isValidated = true;
			}
		}

		//Chrome Extensionを使っているフラグを立てる
		STYLEV.isUsingExtension = true;

		//Extension内のリソースへアクセスするためのリソースルートを取得
		STYLEV.chromeExtension.RESOURCE_ROOT = chrome.runtime.getURL('');
	});


	chrome.storage.onChanged.addListener(function(changes, namespace) {

		if(namespace === 'sync') {

			if(changes.options) {

				var html = document.querySelector('html');

				if(changes.options.newValue.enableAnimation) {

					if(html.dataset.stylevclass !== undefined) {
						html.dataset.stylevclass += ' stylev-animation';
					} else {
						html.dataset.stylevclass = 'stylev-animation';
					}

				} else {

					if(html.dataset.stylevclass.indexOf(' stylev-animation') !== -1) {
						html.dataset.stylevclass -= ' stylev-animation';
					}
				}

			}
		}
	});
}

//ブックマークレットかつ、初期読込の場合
if(STYLEV.isBookmarklet && STYLEV.isLoaded) {

	//ブックマークレット実行
	console.info('Style Validator with Bookmarklet.');
	STYLEV.VALIDATOR.execute(STYLEV.VALIDATOR.insertStylesheet);

} else

//ブックマークレットで一度実行している場合は、validateのみを実行
if(STYLEV.isBookmarklet && STYLEV.isReLoaded) {

	console.info('Style Validator with Bookmarklet (ReExecution)');
	STYLEV.VALIDATOR.validate();
}

