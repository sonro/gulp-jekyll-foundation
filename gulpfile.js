'use strict';
var gulp = require('gulp');
var browserSync = require('browser-sync');
var cp = require('child_process');
var yaml = require('js-yaml');
var fs   = require('fs');
var plumber = require('gulp-plumber');
var $    = require('gulp-load-plugins')();

// Load settings from settings.yml
const { COMPATIBILITY, PORT, UNCSS_OPTIONS, PATHS } = loadConfig();

function loadConfig() {
  let ymlFile = fs.readFileSync('gulpconfig.yml', 'utf8');
  return yaml.load(ymlFile);
}

/**
 * Jekyll Setup
 */
var jekyll   = process.platform === 'win32' ? 'jekyll.bat' : 'jekyll';
var messages = {
    jekyllBuild: '<span style="color: grey">Running:</span> $ jekyll build'
};

/**
 * Jekyll Build
 */
gulp.task('jekyll-build', function(done) {
    browserSync.notify(messages.jekyllBuild);
    return cp.spawn( jekyll , ['build'], {stdio: 'inherit'})
        .on('close', done);
});

gulp.task('jekyll-rebuild', ['jekyll-build'], function () {
    browserSync.reload();
});

/**
 * Sass
 */
gulp.task('sass', function() {
    gulp.src('src/assets/scss/app.scss')
        .pipe($.sass({
            includePaths: PATHS.sass,
            outputStyle: 'compressed' // if css compressed **file size**
        })
                .on('error', $.sass.logError))
        .pipe($.autoprefixer({
            browsers: COMPATIBILITY
        }))
        // .pipe($.uncss(UNCSS_OPTIONS))
        .pipe($.cssnano())
        .pipe(gulp.dest(PATHS.dist + '/assets/css'))
        .pipe(browserSync.reload({stream:true}));
});

/**
 * Javascript
 */
gulp.task('script', function() {
    gulp.src(PATHS.javascript)
        .pipe(plumber())
        .pipe($.babel())
        .pipe($.concat('app.js'))
        .pipe($.uglify())
        .pipe(plumber.stop())
        .pipe(gulp.dest(PATHS.dist + '/assets/js'));
});

/**
 * Images
 */
gulp.task('images', function() {
    gulp.src('src/assets/img/**/*')
        .pipe($.imagemin({
            progressive: true
        }))
        .pipe(gulp.dest(PATHS.dist + '/assets/img'));
});

gulp.task('browser-sync', function() {
    browserSync.reload();
});

/**
 * Build Task
 */
gulp.task('build', ['sass', 'script', 'images', 'jekyll-build'], function() { 
    browserSync.init({
        server: PATHS.dist, port: PORT
    });
});

/**
 * Watch Task
 */
gulp.task('watch', function() {
    gulp.watch('src/assets/scss/**', ['sass']);
    gulp.watch(
        ['src/**/*.html', 'src/_layouts/*.html', 'src/_includes/*.html', 'src/_posts/**'], 
        ['jekyll-rebuild']);
    gulp.watch('src/assets/js/**', ['script', 'browser-sync']);
    gulp.watch('src/assets/img/**', ['images', 'browser-sync']);
});

/**
 * Default Task
 */
gulp.task('default', ['build', 'watch']);
