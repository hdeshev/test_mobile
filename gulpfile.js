'use strict';

/* global -Promise */
var Promise = require('q');
var connect = require('gulp-connect');
var gulp = require('gulp');
var merge = require('merge2');
var rename = require('gulp-rename');
var template = require('gulp-template');
var inject = require('gulp-inject');
var ts = require('gulp-typescript');
var ngAnnotate = require('gulp-ng-annotate');
var tsconfig = require('gulp-tsconfig-files');
var modRewrite = require('connect-modrewrite');
var html2js = require('gulp-html-js-template');
var git = require('gulp-git');
var bump = require('gulp-bump');
var inject = require('gulp-inject');
var changed = require('gulp-changed');
var less = require('gulp-less');
var path = require('path');
var fs = require('fs');
/* global -Proxy */
var Proxy = require('gulp-connect-proxy');
var jspm = require('gulp-jspm');
var gulpConfig = require('./gulp.config')();
var runSequence = require('run-sequence');
var tslint = require('gulp-tslint');

var paths = gulpConfig.paths;
var themes = gulpConfig.themes;
var colors = gulpConfig.colors;

var env = gulpConfig.environment;

console.log('Config is set to "' + env + '" environemnt');

gulp.task('clean', function () {

    var del = require('del');

    return Promise.all([
        // TODO(): add variables
        del([
            'dist/**/*',
            'app/**/*.js.map',
            'app/**/*.html.ts',
            'app/**/*.d.ts',
            '!app/missing-modules.d.ts',
            '!dist/.git*'
        ]),
        del(paths.scriptsJS),
        del(paths.stylesCSS)
    ]);
});


gulp.task('config', function() {

    return gulp.src(gulpConfig.configFolder + '/config-local.' + env + '.ts')
        .pipe(rename('config-local.ts'))
        .pipe(gulp.dest(gulpConfig.configFolder));
});


// TODO: now it is creating js file which is wrong as it has to be compiled...
gulp.task('rebuild_templates', function() {
    return gulp.src(paths.templates)
        .pipe(rename({ suffix: '.html', extname: '.ts' }))
        .pipe(changed('app', {extension: '.ts'}))
        .pipe(html2js())
        .pipe(gulp.dest('app'))
        .pipe(connect.reload());
});

gulp.task('template', function() {
    return gulp.src(paths.templates)
        .pipe(html2js())
        .pipe(rename({ suffix: '.html', extname: '.ts' }))
        .pipe(gulp.dest('app'));
});

gulp.task('htmls', function () {

    var sourcesScript = gulp.src(paths.scriptsJS, { read: false });

    var sourcesStyle = gulp.src(paths.stylesLESS, { read: false })
        .pipe(rename({ suffix: '.{{ app.theme.code }}', extname: '.css' }));

    var p = require('./package.json');

    return gulp.src(paths.htmls)
        .pipe(template({
            version: p.version,
            baseHref: gulpConfig.baseHref[env]
            }))
        .pipe(inject(merge([sourcesScript, sourcesStyle]), { ignorePath: '/app' }))
        .pipe(rename('index.html'))
        .pipe(gulp.dest('app'))
        .pipe(gulp.dest('dist/app'))
        .pipe(connect.reload());
});

// gulp.task('templates', function () {
//
//     var templateCache = require('gulp-angular-templatecache');
//
//     return gulp.src(paths.templates)
//         .pipe(templateCache({ root: '/' }))
//         .pipe(rename({ prefix: 'app.' }))
//         .pipe(gulp.dest('app'));
// });

gulp.task('tsFiles', function () {

    var result = merge([
        gulp.src(paths.scripts, { read: false }),
        gulp.src(paths.typings, { read: false })
    ]);

    result
        .pipe(tsconfig({ indent: 4 }));
});

const testReporter = function (failures, file) {
    var output = '';
    for (var i = 0; i < failures.length; ++i) {
        var failure = failures[i];
        var fileName = file.path;
        var failureString = failure.failure;

        var line = failure.startPosition.line + 1;
        var character = failure.startPosition.character + 1;

        output += '<file name=\"' + fileName;
        output += '\"><violation begincolumn=\"' + character;
        output += '\" beginline=\"' + line;
        output += '\" priority=\"1\"';
        output += ' rule=\"' + failureString
            .replace('&', '&amp;')
            .replace('"', '&quot;')
            .replace('\'', '&apos;')
            .replace('<', '&lt;')
            .replace('>', '&gt;') +
            '\"> </violation></file>\n';
    }

    fs.appendFile('dist/tslint.xml', output, function(err) {
        if(err) {
            return console.log(err);
        }
    }); 
};

gulp.task('tslint', function (done) {
    var path = 'dist/tslint.xml';
    fs.writeFile(path, '<pmd version=\"tslint\">');

    var stream = gulp.src(paths.scripts)
        .pipe(tslint())
        .pipe(tslint.report(testReporter, { emitError: false } ));

    stream.on('end', function() {
        fs.appendFile(path, '</pmd>');
        done();
    });
});

gulp.task('build_scripts', function () {
// gulp.task('build_scripts', ['tsFiles'], function () {

    // var uglify = require('gulp-uglify');
    //
    // return gulp.src(paths.scriptsJS)
    //     .pipe(concat('app.js'))
    //     .pipe(uglify())
    //     .pipe(gulp.dest('dist/scripts'));

    var tsProject = ts.createProject('tsconfig.json', {
        removeComments: false,
        declaration: true
    });

    var resultMerge = merge([
        gulp.src(paths.scripts),
        gulp.src(paths.typings)
    ]);

    var tsResult = resultMerge
    // var tsResult = tsProject.src()
        .pipe(ts(tsProject));

    var result = merge([
        tsResult.dts
            // .pipe(gulp.dest('./'))
            .pipe(gulp.dest('dist/app')),
        tsResult.js
            .pipe(ngAnnotate({ 'single_quotes': true }))
            .pipe(gulp.dest('app'))
            // .pipe(gulp.dest('./'))
            .pipe(gulp.dest('dist/app'))
        ]);

    return result
        .pipe(connect.reload());
});

var tsProject = ts.createProject('tsconfig.json', {
    removeComments: false,
    declaration: true
    // noExternalResolve: true
});

gulp.task('watch_scripts', function () {

    var tsResult =  merge([
        tsProject.src()
        // here it is not working somehow...
        // gulp.src('app#<{(||)}>#*.d.ts')
        ])
        .pipe(changed('./', {extension: '.js'}))
        .pipe(ts(tsProject));

    return merge([
        tsResult.dts
            .pipe(gulp.dest('dist/app')),
        tsResult.js
            .pipe(ngAnnotate({ 'single_quotes': true }))
            .pipe(gulp.dest('./'))
        ])
        .pipe(connect.reload());
});

gulp.task('less', function () {

    return gulp.src(paths.stylesLESS)
        .pipe(rename({ suffix: '.' + themes.main }))
        // .pipe(changed('app'), { extension: '.css'})
        .pipe(less({
            paths: [
                path.join(__dirname, 'style'),
                path.join(__dirname, 'jspm_packages'),
                __dirname]
        }))
        .pipe(gulp.dest('app'))
        .pipe(gulp.dest('dist/app'))
        .pipe(connect.reload());
});

gulp.task('less_colors', function () {

    var promises = [];

    for (var i=0; i < colors.init.length; i++) {

        var deferred = Promise.defer();
        var color = colors.init[i];

        gulp.src(paths.stylesColors)
            .pipe(rename({ suffix: '.' + color, extname: '.css' }))
            // .pipe(changed('app'), { extension: '.css'})
            .pipe(less({
                paths: [
                    path.join(__dirname, 'style'),
                    path.join(__dirname, 'jspm_packages'),
                    __dirname],
                globalVars: {
                    themeColor: '"' + color +'"'
                }
            }))
        .pipe(gulp.dest('app'))
        .pipe(gulp.dest('dist/app'))
        .pipe(connect.reload())
        .on('end', function () {
            deferred.resolve();
        });

        promises.push(deferred);
    }
    return Promise.all(promises);
});

gulp.task('compile_less', function(done){
    runSequence(
        'less',
        'less_colors',
    done);
});

gulp.task('copy', function () {

    return gulp.src(gulpConfig.copy, {base: '.'})
        .pipe(gulp.dest('dist'));
});

gulp.task('bundle', function () {

    return gulp.src('app/bootstrap.js')
        .pipe(jspm({
            minify: true,
            mangle: true
        }))
        .pipe(gulp.dest('dist/'));
});

gulp.task('connect', function () {

    return connect.server({
        livereload: true,
        root: gulpConfig.server.root,
        host: gulpConfig.server.host,
        port: gulpConfig.server.port,
        middleware: function(connect, options) {

            // urlRewrites
            var middlewares = [];
            var rewriteModule = modRewrite(gulpConfig.server.rewrites);
            middlewares.push(rewriteModule);

            // proxy
            options.route = '/proxy';
            var proxy = new Proxy(options);
            middlewares.push(proxy);

            return middlewares;
        }
    });
});

gulp.task('open', function () {

    var gulpOpen = require('gulp-open');

    var uri = 'http://' + gulpConfig.server.host + ':' + gulpConfig.server.port + '/' + gulpConfig.server.startPage;

    gulp.src(gulpConfig.server.startPage)
        .pipe(gulpOpen({
            uri: uri
        }));
});

gulp.task('test', function (done) {
    var Server = require('karma').Server;
    new Server({
        configFile: __dirname + '/karma.conf.js'
    }).start(function () {
        done();
    });
});

gulp.task('watch', function () {

    gulp.watch(paths.htmls, ['htmls']);
    gulp.watch(paths.templates, ['rebuild_templates']);
    gulp.watch(paths.scripts, ['watch_scripts']);
    gulp.watch(paths.watch.less, ['compile_less']);

    // var Server = require('karma').Server;
    // new Server({
    //     configFile: __dirname + '/karma.conf.js',
    //     singleRun: false
    // }).start();
});

gulp.task('bump', function(){

    git.status({args: '--porcelain'}, function (err, stdout) {
        if (err) {
            throw err;
        }

        if (stdout === '') {
            gulp.src('./package.json')
                .pipe(bump({type:'patch'}))
                .pipe(gulp.dest('./'));
        }
        else {
            throw 'There are changes, which were not committed.';
        }
    });
 });


gulp.task('commit', ['bump'], function () {

    return gulp.src('./package.json')
         .pipe(git.commit('New version'));
});

gulp.task('pushTags', ['commit'], function () {

    // to avoid caching
    var getPackageJson = function () {
        return JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    };

    var pkg = getPackageJson();

    git.tag(pkg.version, 'Version message', function (err) {
        if (err) {
            throw err;
        }
    });
});

gulp.task('publish', ['pushTags'], function () {

    git.push('origin', 'master', {args: '--follow-tags'}, function (err) {
        if (err) {
            throw err;
        }
    });
});

// TODO: ensure that clean and tsfiles are run before everything
// but not interfering with the watch
gulp.task('build', function(done){
    runSequence(
        'clean',
        'template',
        'tsFiles',
        'config',
        'compile_less',
        'build_scripts',
        'htmls',
        'bundle',
        'copy',
        'test',
    done);
});
gulp.task('serve', function (done) {
    runSequence(
        'clean',
        'template',
        'tsFiles',
        'config',
        'compile_less',
        'build_scripts',
        // 'htmls',
        // 'connect',
        // 'open',
        'watch',
    done);
});
gulp.task('default', ['serve']);

