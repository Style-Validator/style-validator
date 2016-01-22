'use strict';

var STYLEV = STYLEV || {};

STYLEV.TOPPAGE = STYLEV.TOPPAGE || {};

STYLEV.TOPPAGE.FIRST_ANIMATION = {

	execute: function() {
		var that = STYLEV.TOPPAGE.FIRST_ANIMATION;
		document.addEventListener('WebComponentsReady', that.firstExecution);
	},

	setParameter: function() {
		var that = STYLEV.TOPPAGE.FIRST_ANIMATION;

		that.wrapper = document.querySelector('.wrapper');
		that.main = document.querySelector('.main');
		that.header = document.querySelector('.header');

	},
	
	firstExecution: function() {
		var that = STYLEV.TOPPAGE.FIRST_ANIMATION;

		that.setParameter();
		that.bindEvents();
		that.startAnimation();
		that.animateSVG();
	},

	bindEvents: function() {
		var that = STYLEV.TOPPAGE.FIRST_ANIMATION;

		window.addEventListener('resize', that.adjustPosition);
	},
	
	startAnimation: function() {
		var that = STYLEV.TOPPAGE.FIRST_ANIMATION;

		setTimeout(that.startFadeIn, 100);
		setTimeout(that.adjustPosition, 0);
	},

	adjustPosition: function() {
		var that = STYLEV.TOPPAGE.FIRST_ANIMATION;

		that.wrapper.style.setProperty('padding-top', that.header.offsetHeight + 'px', '');
	},

	startFadeIn: function () {
		var that = STYLEV.TOPPAGE.FIRST_ANIMATION;

		that.main.classList.add('fadeIn');
	},
	
	animateSVG: function() {
		var that = STYLEV.TOPPAGE.FIRST_ANIMATION;

		new Vivus('vivus-kv-logo', {
			duration: 200,
			file: '/img/style-validator.logo.nopadding.svg',
			type: 'async'
		});
	}

};

STYLEV.TOPPAGE.FIRST_ANIMATION.execute();
