var buffer			= require('buffer');
var del				= require('del');
var map				= require('map-stream');
var gulp			= require('gulp');
var gulpUglify		= require('gulp-uglify');
var postcss			= require('gulp-postcss');
var sourcemaps		= require('gulp-sourcemaps');
var gulpAutoprefixer= require('autoprefixer');

gulp.task('clean', clean);
gulp.task('copy', ['clean'], copy);
gulp.task('autoprefixer', ['copy'], autoprefixer);
gulp.task('bookmarklet', ['autoprefixer'], bookmarklet);
gulp.task('build', ['bookmarklet']);
gulp.task('live', function() {
	return copy('!./src/**/app.js').on('end', function() {
		autoprefixer();
		bookmarklet();
	});
});
gulp.task('b', bookmarklet);
gulp.task('watch',function(){
	gulp.watch('./src/**/*', ['live']);
});
gulp.task('default', ['live', 'watch']);

function autoprefixer() {
	return gulp.src('./src/**/*.css')
		.pipe(sourcemaps.init())
		.pipe(postcss([ gulpAutoprefixer({ browsers: ['last 3 versions'] }) ]))
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest('./dest'));
}

function bookmarklet() {
	var header = new Buffer('javascript:void ');
	return gulp.src('./src/bookmarklet/style-validator.js')
		.pipe(gulpUglify())
		.pipe(map(function (file, cb) {
			file.contents = buffer.Buffer.concat([header, file.contents]);
			cb(null, file);
		}))
		.pipe(gulp.dest('./dest/bookmarklet'));
}

function copy(exceptionSrc) {
	var targetSrc = ['./src/**/*', './src/**/.*'];
	if(typeof exceptionSrc === 'string') {
		targetSrc.push(exceptionSrc);
	}
	return gulp.src(targetSrc)
		.pipe(gulp.dest('./dest'));
}

function clean() {
	return del(['./dest']);
}