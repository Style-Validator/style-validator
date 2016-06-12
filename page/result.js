'use strict';

var STYLEV = STYLEV || {};

STYLEV.TOPPAGE = STYLEV.TOPPAGE || {};

STYLEV.TOPPAGE.FIRST_ANIMATION = {

	execute: function() {
		var that = STYLEV.TOPPAGE.FIRST_ANIMATION;
		that.setParameter();
		that.bindEvents();
		that.startAnimation();

		//document.querySelector('input[type="text"]').focus();
	},

	setParameter: function() {
		var that = STYLEV.TOPPAGE.FIRST_ANIMATION;

		that.html = document.documentElement;
		that.wrapper = document.querySelector('.wrapper');
		that.main = document.querySelector('.main');
		that.header = document.querySelector('.header');
	},

	bindEvents: function() {
		var that = STYLEV.TOPPAGE.FIRST_ANIMATION;

		window.addEventListener('resize', that.adjustWrapperPosition);
		window.addEventListener('scroll', that.fixHeaderOnScroll);
	},
	throwError: function(error) {
		var that = STYLEV.TOPPAGE.FIRST_ANIMATION;
		throw new Error(error || 'Connection failed.');
	},

	startAnimation: function() {
		var that = STYLEV.TOPPAGE.FIRST_ANIMATION;

		//setTimeout(that.startFadeIn, 100);
		setTimeout(that.adjustWrapperPosition, 0);
	},

	adjustWrapperPosition: function() {
		var that = STYLEV.TOPPAGE.FIRST_ANIMATION;

		if(that.adjustWrapperPositionTimer !== undefined) {
			clearTimeout(that.adjustWrapperPositionTimer);
		}
		that.adjustWrapperPositionTimer = setTimeout(function() {
			that.wrapper.style.setProperty('padding-top', that.header.offsetHeight + 'px', '');
		}, 0);
	},

	fixHeaderOnScroll: function() {
		var that = STYLEV.TOPPAGE.FIRST_ANIMATION;
		var isNotDefaultPosY = window.scrollY > 0;
		if(isNotDefaultPosY) {
			that.html.classList.add('is-fixed-header');
		} else {
			that.html.classList.remove('is-fixed-header');
		}
	},

	startFadeIn: function () {
		var that = STYLEV.TOPPAGE.FIRST_ANIMATION;

		that.main.classList.add('fadeIn');
	},

};

document.addEventListener('WebComponentsReady', STYLEV.TOPPAGE.FIRST_ANIMATION.execute);
