var gulp = require('gulp');
var filter = require('gulp-filter');
var kclean = require('gulp-kclean');
var modulex = require('gulp-modulex');
var path = require('path');
var rename = require('gulp-rename');
var packageInfo = require('./package.json');
var src = path.resolve(process.cwd(), 'lib');
var build = path.resolve(process.cwd(), 'build');
var clean = require('gulp-clean');
var uglify = require('gulp-uglify');
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');
var jscs = require('gulp-jscs');
var replace = require('gulp-replace');
var wrapper = require('gulp-wrapper');
var date = new Date();
var header = ['//!',
        'Copyright ' + date.getFullYear() + ', ' + packageInfo.name + '@' + packageInfo.version,
        packageInfo.license + ' Licensed,',
        'build time: ' + (date.toGMTString()),
    '\n'].join(' ');
    
gulp.task('lint', function () {
    return gulp.src('./lib/**/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter(stylish))
        .pipe(jshint.reporter('fail'))
        .pipe(jscs());
});

gulp.task('tag', function (done) {
    var cp = require('child_process');
    var version = packageInfo.version;
    cp.exec('git tag ' + version + ' | git push origin ' + version + ':' + version + ' | git push origin master:master', done);
});

gulp.task('clean', function () {
    return gulp.src(build, {
        read: false
    }).pipe(clean());
});

var excludeModulesMap = {

};

var tasks = [];
var names = ['ie', 'hashchange', 'focusin', 'input', 'gesture/util'];

names.forEach(function (tag) {
    names.push(tag);
    excludeModulesMap[tag] = ['event-dom/base'];
});

['gesture/basic', 'gesture/edge-pan', 'gesture/pan', 'gesture/pinch', 'gesture/rotate',
    'gesture/shake', 'gesture/swipe', 'gesture/tap'].forEach(function (tag) {
        names.push(tag);
        excludeModulesMap[tag] = ['event-dom/base', 'event-dom/gesture/util', 'event-dom/base'];
    });

names.push('base');
names.forEach(function (tag) {
    var task = 'build-' + tag;
    tasks.push(task);
    var dir = path.dirname(tag);
    dir = dir ? '/' + dir : dir;
    var basename = path.basename(tag);
    gulp.task(task, ['lint'], function () {
        var packages = {};
        packages['event-dom/' + tag] = {
            base: path.resolve(src, tag)
        };
        return gulp.src('./lib/' + tag + '.js')
            .pipe(modulex({
                modulex: {
                    packages: packages
                },
                excludeModules: excludeModulesMap[tag]
            }))
            .pipe(kclean({
                files: [
                    {
                        src: './lib/' + tag + '-debug.js',
                        outputModule: 'event-dom/' + tag
                    }
                ]
            }))
            .pipe(replace(/@VERSION@/g, packageInfo.version))
            .pipe(wrapper({
                    header: header
                }))
            .pipe(gulp.dest(path.resolve(build, 'event-dom' + dir)))
            .pipe(filter(basename + '-debug.js'))
            .pipe(replace(/@DEBUG@/g, ''))
			.pipe(uglify({
				preserveComments: 'some'
			 }))
            .pipe(rename(basename + '.js'))
            .pipe(gulp.dest(path.resolve(build, 'event-dom' + dir)));
    });
});

gulp.task('build', tasks);

gulp.task('default', ['build']);
