'use strict';

var STYLEV = STYLEV || {};

STYLEV.TOPPAGE = STYLEV.TOPPAGE || {};

STYLEV.TOPPAGE.FIRST_ANIMATION = {

	execute: function() {
		var that = STYLEV.TOPPAGE.FIRST_ANIMATION;
		that.setParameter();
		that.bindEvents();
		that.startAnimation();
		that.animateSVG();
		that.getBookmarklet();
	},

	setParameter: function() {
		var that = STYLEV.TOPPAGE.FIRST_ANIMATION;

		that.wrapper = document.querySelector('.wrapper');
		that.main = document.querySelector('.main');
		that.header = document.querySelector('.header');

	},

	bindEvents: function() {
		var that = STYLEV.TOPPAGE.FIRST_ANIMATION;

		window.addEventListener('resize', that.adjustPosition);
		window.addEventListener('scroll', that.addShadow2header);
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

	addShadow2header: function() {
		var that = STYLEV.TOPPAGE.FIRST_ANIMATION;
		var isNotDefaultPosY = window.scrollY > 0;
		if(isNotDefaultPosY) {
			that.header.classList.add('header-with-shadow');
		} else {
			that.header.classList.remove('header-with-shadow');
		}
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
	},

	getBookmarklet: function() {
		var that = STYLEV.TOPPAGE.FIRST_ANIMATION;

		$.ajax({
			url: '/bookmarklet/style-validator.js',
			dataType: 'text',
			success: that.setBookmarklet
		});
	},

	setBookmarklet: function(data) {
		var that = STYLEV.TOPPAGE.FIRST_ANIMATION;
		$('#bookmarklet').attr('href', data);
	}

};

document.addEventListener('WebComponentsReady', STYLEV.TOPPAGE.FIRST_ANIMATION.execute);
