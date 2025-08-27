const gulp = require('gulp');
const svgmin = require('gulp-svgmin');

gulp.task('build:icons', () => {
	return gulp
		.src('nodes/**/*.svg')
		.pipe(svgmin())
		.pipe(gulp.dest('dist/nodes'));
});

gulp.task('default', gulp.series('build:icons'));
