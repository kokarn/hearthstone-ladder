module.exports = function( grunt ) {
    'use strict';

    grunt.initConfig({
        pkg: grunt.file.readJSON( 'package.json' ),

        watch: {
            react: {
                files: 'components/*.jsx',
                tasks: [ 'env:dev', 'eslint:components', 'browserify' ]
            },
            uglify: {
                files: 'www/scripts/app.built.js',
                tasks: [ 'uglify' ]
            }
        },

        browserify: {
            options: {
                transform: [ 'babelify' ],
                browserifyOptions: {
                    extensions: [ '.jsx', 'jsx' ]
                }
            },
            client: {
                src: [ 'components/App.jsx' ],
                dest: 'www/scripts/app.built.js'
            }
        },

        uglify: {
            client: {
                src: [ 'www/scripts/app.built.js' ],
                dest: 'www/scripts/app.min.js'
            }
        },

        eslint: {
            components: {
                options: {
                    configFile: '.jsxeslintrc'
                },
                files: {
                    src: [ 'components/**/*.jsx' ]
                }
            }
        },

        env: {
            dev : {
                NODE_ENV : 'development'
            }
        },

        'sftp-deploy': {
            default: {
                auth: {
                    host: 'kokarn.com',
                    port: 22,
                    authKey: 'hearthstone-legends'
                },
                cache: 'sftpCache.json',
                src: './www/',
                dest: '/var/www/hearthstone-legends/',
                exclusions: [
                    '.DS_Store',
                    'node_modules',
                    'data',
                    'components',
                    'sftpCache.json',
                    '.gitignore',
                    '.ftppass',
                    'Gruntfile.js',
                    './scripts/app.built.js',
                    'README.md',
                    'package.json',
                    'tmp',
                    'comparisons',
                    'position-index.json',
                    'hash-index.json',
                    'dev.html'
                ],
                serverSep: '/',
                localSep: '/',
                concurrency: 4,
                progress: true
            }
        }
    });

    require( 'load-grunt-tasks' )( grunt );

    grunt.registerTask( 'deploy', [
        'eslint:components',
        'browserify',
        'uglify',
        'sftp-deploy'
    ] );
};
