var buffer			= require('buffer');
var del				= require('del');
var map				= require('map-stream');
var gulp			= require('gulp');
var gulpUglify		= require('gulp-uglify');
var postcss			= require('gulp-postcss');
var sourcemaps		= require('gulp-sourcemaps');
var autoprefixer	= require('autoprefixer');

gulp.task('build', function() {
	return clean().on('end', function() {
		copy().on('end', function() {
			autoprefix();
			bookmarklet();
		});
	});
});
gulp.task('live', function() {
	return copy('!./src/**/app.js').on('end', function() {
		autoprefix();
		bookmarklet();
	});
});
gulp.task('watch',function(){
	gulp.watch('./src/**/*', ['live']);
});
gulp.task('default', ['live', 'watch']);

function autoprefix() {
	return gulp.src('./src/**/*.css')
		.pipe(sourcemaps.init())
		.pipe(postcss([ autoprefixer({ browsers: ['last 3 versions'] }) ]))
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