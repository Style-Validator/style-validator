'use strict';

var buffer = require('buffer');
var del = require('del');
var map = require('map-stream');

var gulp = require('gulp');
var gulpNodemon = require('gulp-nodemon');
var gulpJshint = require('gulp-jshint');
var gulpUglify = require('gulp-uglify');

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
	var watcher = gulp.watch('extension/style-validator.js', ['generate']);
	watcher.on('change', function(event) {
		console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
	});
});

//start server
gulp.task('start-server', function () {
	gulpNodemon({
		script: 'app.js',
		ext: 'html js'
	})
});
gulp.task('default', ['clean', 'generate', 'watch', 'start-server']);
