'use strict';

var buffer = require('buffer');
var del = require('del');
var map = require('map-stream');

var gulp = require('gulp');
var gulpNodemon = require('gulp-nodemon');
var gulpJshint = require('gulp-jshint');
var gulpUglify = require('gulp-uglify');
var gulpWebserver = require('gulp-webserver');

//generate bookmark
gulp.task('generate', function () {

	var header = new Buffer('javascript:');

	gulp.src('extension/style-validator.js')
		.pipe(gulpJshint())
		.pipe(gulpUglify())
		.pipe(map(function (file, cb) {
			file.contents = buffer.Buffer.concat([header, file.contents]);
			cb(null, file);
		}))
		.pipe(gulp.dest('bookmarklet'));
});

gulp.task('clean', del.bind(null, 'bookmarklet'));

gulp.task('watch', function () {
	gulp.watch('extension/style-validator.js', ['generate']);
});

//start server
gulp.task('start-server', function () {
	gulpNodemon({
		script: 'app.js',
		ext: 'html css js'
	}).on('start', function() {
		gulp
			.src('./')
			.pipe(gulpWebserver({
				livereload: true,
				open: true,
				proxies: [{
					source: '/',
					target: 'http://localhost:8001/'
				}]
			}));
	});
});


gulp.task('default', ['clean', 'generate', 'watch', 'start-server']);
