module.exports = function( grunt ) {
    'use strict';

    grunt.initConfig({
        pkg: grunt.file.readJSON( 'package.json' ),

        watch: {
            react: {
                files: 'components/*.jsx',
                // tasks: [ 'env:dev', 'eslint:components', 'browserify' ]
                tasks: [ 'eslint:components', 'browserify', 'uglify' ]
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
        }
    });

    require( 'load-grunt-tasks' )( grunt );
};
