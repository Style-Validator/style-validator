'use strict';

var STYLEV = STYLEV || {};

STYLEV.TOPPAGE = STYLEV.TOPPAGE || {};

STYLEV.TOPPAGE.FIRST_ANIMATION = {

	execute: function() {
		var that = STYLEV.TOPPAGE.FIRST_ANIMATION;
		that.setParameter();
		that.bindEvents();
		that.startAnimation();
	},

	setParameter: function() {
		var that = STYLEV.TOPPAGE.FIRST_ANIMATION;

		that.wrapper = document.querySelector('.wrapper');
		that.main = document.querySelector('.main');
		that.header = document.querySelector('.header');
	},

	bindEvents: function() {
		var that = STYLEV.TOPPAGE.FIRST_ANIMATION;

		window.addEventListener('resize', that.adjustWrapperPosition);
		window.addEventListener('scroll', that.addShadow2header);
	},
	
	startAnimation: function() {
		var that = STYLEV.TOPPAGE.FIRST_ANIMATION;

		setTimeout(that.addShadow2header, 0);
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

	addShadow2header: function() {
		var that = STYLEV.TOPPAGE.FIRST_ANIMATION;
		var isNotDefaultPosY = window.scrollY > 0;
		if(isNotDefaultPosY) {
			that.header.classList.add('header-with-shadow');
		} else {
			that.header.classList.remove('header-with-shadow');
		}
	}

};

document.addEventListener('WebComponentsReady', STYLEV.TOPPAGE.FIRST_ANIMATION.execute);
