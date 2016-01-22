'use strict';

var STYLEV = STYLEV || {};

STYLEV.COMMON = {

	execute: function() {
		var that = STYLEV.COMMON;

		that.bindEvents();
		that.showWelcomeMsg();

		that.setParameters();
	},

	setParameters: function() {
		var that = STYLEV.COMMON;

	},

	bindEvents: function() {
		var that = STYLEV.COMMON;

	},

	showWelcomeMsg: function() {
		var that = STYLEV.COMMON;

		console.info('%cWelcome to Style Validator!', 'font-size: 18px; color: #1F9E0D; line-height: 2;');
	}
};

STYLEV.COMMON.execute();