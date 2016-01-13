'use strict';

var buffer = require('buffer');
var del = require('del');
var gulp = require('gulp');
var nodemon = require('gulp-nodemon');
var gulpConcat = require('gulp-concat');
var gulpJshint = require('gulp-jshint');
var gulpUglify = require('gulp-uglify');
var webserver = require('gulp-webserver');
var map = require('map-stream');

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

gulp.task('clean', del.bind(null, 'generate'));

gulp.task('watch', function () {
	var watcher = gulp.watch('extension/style-validator.js', ['generate']);
	watcher.on('change', function(event) {
		console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
	});
});

gulp.task('api-start', function () {
	nodemon({
		script: 'overriding-api.js',
		ext: 'html css js'
	})
});

gulp.task('webserver', function () {
	gulp
		.src('../')
		.pipe(
			webserver({
				livereload: false,
				open: 'http://localhost:8000/Style-Validator/page/rules.html'
			})
		);
});

gulp.task('default', ['clean', 'generate', 'watch', 'api-start', 'webserver']);
