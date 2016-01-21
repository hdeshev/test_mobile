'use strict';

var argv = require('yargs').argv;

var env = (!!argv.env ? argv.env : process.env.NODE_ENV) || 'development';

switch(env) {
    case 'dev':
        env = 'development';
        break;
    case 'prod':
        env = 'production';
        break;
    default:
        env = env;
}

module.exports = function() {

    var config = {
        environment : env,
        configFolder: 'app/config',
        paths: {
            htmls: 'app/index.tpl.xml',
            templates: ['app/**/*.xml', '!app/index.tpl.xml', '!app/index.xml'],
            scripts: ['app/**/*.ts', '!app/**/*.d.ts'],
            typings: ['typings/**/*.d.ts', 'app/missing-modules.d.ts'],
            scriptsJS: ['app/**/*.js'],
            stylesCSS: ['app/**/*.css'],
            stylesLESS: ['app/app.module.less'],
            stylesColors: ['app/app.module.theme.less'],
            watch: {
                less: 'app/**/*.less'
            }
        },
        baseHref: {
            production: '/',
            development: '/',
            test: '/'
        },
        themes: {
            init: ['material'],
            main: 'material'
        },
        colors: {
            init: ['red', 'green','blue','dark','yellow','green'],
            main: 'red'
        },
        server: {
            host: 'app.notasks.local',
            port: 6897,
            root: argv.root || '',
            startPage: 'app/index.xml',
            rewrites: [ ]
        },
        copy: [
            // 'jspm_packages/system.js',
            // 'config.js',
            // 'app/style/fonts#<{(|*',
            // 'app/style/media#<{(|*',
            // 'jspm_packages/npm/font-awesome@4.5.0/fonts#<{(|*.*'
        ]
    };

    return config;
};

