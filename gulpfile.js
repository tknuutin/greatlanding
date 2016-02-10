

'use strict';

var browserify = require('browserify');
var babel = require('gulp-babel');
var gulp = require('gulp');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var sourcemaps = require('gulp-sourcemaps');
var gutil = require('gulp-util');
var glob = require('glob');
var debug = require('gulp-debug');
var del = require('del');

var path = require('path');
var join = path.join;

var config = {
    baseFolder: './app/',
    sourceFolder: './app/src',
    buildFolder: './public',
    bundleName: 'app.js'
};

gulp.task('clean', function(cb) {
    del(config.buildFolder, cb);
});

gulp.task('copy', function(){
    gulp.src(join(config.baseFolder, 'assets/**/*'), { base: join(config.baseFolder, 'assets/') })
        .pipe(gulp.dest(join(config.buildFolder, 'assets')));
})

gulp.task('build', ['copy'], function () {
    // set up the browserify instance on a task basis
    var b = browserify({
        entries: glob.sync(join(config.sourceFolder, '/**/*.js')),
        debug: true,
        paths: [config.sourceFolder]
    });

    return b.bundle()
        .pipe(source(config.bundleName))
        .pipe(debug())
        .pipe(buffer())
        .pipe(sourcemaps.init({ loadMaps: true }))
            .pipe(babel())
            .on('error', gutil.log)
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(config.buildFolder));
});