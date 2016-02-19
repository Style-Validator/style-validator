'use strict';

var STYLEV = STYLEV || {};

STYLEV.COMMON = {

	execute: function() {
		var that = STYLEV.COMMON;

		that.setParameters();
		that.bindEvents();
		that.showWelcomeMsg();
		that.setNameOfOS();
	},

	setParameters: function() {
		var that = STYLEV.COMMON;

	},

	bindEvents: function() {
		var that = STYLEV.COMMON;

	},

	showWelcomeMsg: function() {
		var that = STYLEV.COMMON;

		console.info('%cWelcome to Style Validator!', 'font-size: 18px; color: #1F9E0D; line-height: 1.7;');
	},

	setNameOfOS: function() {
		var typeOfOS;
		var appVersion = navigator.appVersion;
		if (appVersion.indexOf("Mac") !== -1 ) {
			typeOfOS = "is-mac";
		} else if (appVersion.indexOf("PowerPC") !== -1 ) {
			typeOfOS = "is-mac";
		} else if (appVersion.indexOf("Win") !== -1 ) {
			typeOfOS = "is-win";
		}
		document.documentElement.classList.add(typeOfOS);
	}
};

STYLEV.COMMON.execute();