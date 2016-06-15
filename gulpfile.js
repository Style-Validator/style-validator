'use strict';

var buffer = require('buffer');
var del = require('del');
var map = require('map-stream');

var gulp			= require('gulp');
var gulpUglify		= require('gulp-uglify');
var postcss			= require('gulp-postcss');
var sourcemaps		= require('gulp-sourcemaps');
var autoprefixer	= require('autoprefixer');

gulp.task('clean', function() {
	return del(['./dest']);
});

gulp.task('copy', ['clean'], function(){
	return gulp.src(['./src/**/*', './src/**/.*'])
		.pipe(gulp.dest('./dest'))
});

gulp.task('autoprefixer', ['copy'], function () {

	return gulp.src('./src/**/*.css')
		.pipe(sourcemaps.init())
		.pipe(postcss([ autoprefixer({ browsers: ['last 3 versions'] }) ]))
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest('./dest'));
});

gulp.task('bookmarklet', ['autoprefixer'], function () {
	var header = new Buffer('javascript:void ');
	return gulp.src('src/bookmarklet/style-validator.js')
		.pipe(gulpUglify())
		.pipe(map(function (file, cb) {
			file.contents = buffer.Buffer.concat([header, file.contents]);
			cb(null, file);
		}))
		.pipe(gulp.dest('dest/bookmarklet'));
});
gulp.task('build', ['bookmarklet']);

gulp.task('watch',function(){
	gulp.watch('./src/**/*', ['build']);
});

gulp.task('default', ['build', 'watch']);

