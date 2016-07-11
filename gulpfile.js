var del = require('del');
var fs = require('fs');
var changeCase = require('change-case');
var yaml = require('js-yaml');
var through2 = require('through2');
var assemble = require('assemble')();
var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();
var merge = require('merge-stream');
var minimist = require('minimist');
var path = require('path');
var critical = require('critical').stream;
var secrets = require('./secrets.json');

var allowedOptions = {
    string: 'env',
    default: {env: 'development'}
};
// Parses CLI arguments into a nice object, using the given defaults
var options = minimist(process.argv.slice(2), allowedOptions);
var isStaging = options.env === 'staging';
var isProduction = options.env === 'production';

var context = require('./hbs_context.json');

// Assemble dropped handlebars-helpers, so it needs to be loaded manually
// https://github.com/assemble/assemble/issues/813
function loadHelpers() {
    assemble.engine('hbs', require('engine-handlebars'));
    var handlebars_mock = (function () {
        var myapp = assemble;
        return {
            registerHelper: function (name, code) {
                myapp.helper(name, code);
            },
            SafeString: function (value) {
                return value;
            }
        }
    })();

    assemble.helpers(require('handlebars-helpers').register(handlebars_mock, {}, {}));
}

gulp.task('clean', function () {
    // Clean out dist directory for new build
    return del(['dist/**/*', '.tmp/**/*']);
});

gulp.task('copy', ['clean'], function () {
    // Copy over images and fonts from assets/ to .tmp/
    return gulp.src(['./assets/images/**/*', './assets/fonts/**/*'], {base: './assets'})
        .pipe(gulp.dest('.tmp/'));
});

// Use this for templated pages
function createManagementPages() {
    // Grab array of managements from context
    managements = context.managements;
    // Make temporary directories to hold generated hbs templates
    fs.mkdirSync('./.tmp/pages/');
    fs.mkdirSync('./.tmp/pages/managements/');
    var index = 0;
    managements.forEach(function (management) {
        // Use the management.hbs template to generate individual templates
        file = fs.readFileSync('./pages/_templates/management.hbs');
        management.id = index++;
        // Name the file after the management name
        management.page_name = changeCase.snakeCase(management.name);
        page = process.cwd() + '/.tmp/pages/managements/' + management.page_name + '.hbs';
        // Insert the specific context for the management on the page
        data = "---\nlayout: collection.hbs\n" + yaml.dump(management) + "\n---\n";
        fs.writeFileSync(page, data + file);
    });
    assemble.pages('./.tmp/pages/**/*.hbs');
};

gulp.task('assemble', ['clean'], function () {
    // Use Assemble to assemble Handlebars templates, layouts, etc.
    assemble.partials('./partials/**/*.hbs');
    assemble.layouts('./layouts/**/*.hbs');
    assemble.pages(['./pages/**/*.hbs',
        '!./pages/_templates/management.hbs']); // Ignore templates for multiple pages

    loadHelpers();
    //createManagementPages();

    // Not sure why, but assemble.data('filename') isn't working
    assemble.data(context);
    assemble.data({root: process.cwd(), date: new Date()});

    return assemble.toStream('pages')
        .pipe(assemble.renderFile())
        .pipe(plugins.extname()) // Converts .hbs to .html
        .pipe(gulp.dest('.tmp/'));
});

gulp.task('stylesheets', ['clean'], function () {
    // Rely on sass imports rather than usemin for stylesheets
    // Make sure all pages include stylesheets/main.css
    return gulp.src('./assets/stylesheets/main.scss')
        .pipe(plugins.sass())
        .pipe(plugins.autoprefixer())
        .pipe(plugins.cssmin())
        .pipe(gulp.dest('./.tmp/stylesheets/'));
});

gulp.task('usemin', ['assemble', 'clean'], function () {
    // Use gulp-inject to insert Google Analytics code: set read to false since the GA code doesn't need to be loaded
    // The link is relative to the pages/ directory
    var analytics = gulp.src(['../assets/javascripts/**/analytics.js'], {read: false, cwd: '.tmp'});
    // Remember: usemin will fail with no error if you have a set of build tags without anything inside
    return gulp.src('./.tmp/**/*.html')
        .pipe(plugins.if(isProduction, plugins.inject(analytics)))
        // Usemin doesn't support multiple HTML files - need to use foreach instead
        // See here: https://github.com/zont/gulp-usemin/issues/91
        .pipe(plugins.foreach(function (stream, file) {
            return stream
                // Usemin will apply the given plugins to the javascripts,
                // then combine it one file and replace the references in the html template
                .pipe(plugins.usemin())
        }))
        .pipe(gulp.dest('./.tmp/'));
});

/*
 NOT READY FOR USE
 */
gulp.task('critical', ['stylesheets', 'usemin'], function () {
    // Note: this task will fail if any HTML files don't have <html> tags (basically, if they're empty)
    // Parses HTML files for stylesheets, calculates above-the-fold styles, and inlines them into the HTML
    // Then, changes the stylesheet link to load asynchronously using loadCSS
    return gulp.src('./.tmp/**/*.html')
        .pipe(critical({
            inline: true,
            base: '.tmp/',
            width: 1366,
            height: 768,
            minify: true,
            extract: false // Prefer cache-ability over a smaller CSS file, since main.css is reused among every page
        }))
        .pipe(gulp.dest('.tmp'));
});

gulp.task('build', ['stylesheets', 'usemin', 'copy'], function () {
    // Only compress stylesheets and javascripts
    var compress = plugins.filter(['**/*.css', '**/*.js'], {restore: true});
    // Only replace tags in the html templates
    var replaceTags = plugins.filter(['**/*.html'], {restore: true});

    return gulp.src([
        './.tmp/**/*',
        '!./.tmp/pages{,/**/*}', // See https://github.com/sindresorhus/del/issues/3 for how this works
        '!./.tmp/**/tmp*.html' // Skip Critical tmp files
    ])
        // Add file revisioning to all assets and change the references in the html templates
        .pipe(plugins.if(isProduction, new plugins.revAll({dontRenameFile: ['.*\.html']}).revision()))
        .pipe(compress)
        .pipe(plugins.if(isProduction, plugins.gzip()))
        .pipe(compress.restore)
        .pipe(replaceTags)
        // Replace asset links with compressed versions
        .pipe(plugins.if(isProduction, plugins.replace(/(javascripts\/.*)\.js/gi, '$1.js.gz')))
        .pipe(plugins.if(isProduction, plugins.replace(/(stylesheets\/.*)\.css/gi, '$1.css.gz')))
        .pipe(replaceTags.restore)
        .pipe(gulp.dest('./dist/'));
});

gulp.task('default', ['build']);

gulp.task('deploy', ['build'], function () {
    //if (isStaging || isProduction) {
        var publisher = plugins.awspublish.create({
            params: {
                Bucket: secrets.s3.bucketname
            },
            accessKeyId: secrets.s3.key,
            secretAccessKey: secrets.s3.secret
        });

        var headers = {
            'Cache-Control': 'max-age=315360000, no-transform, public'
        };
        var compressedHeaders = {
            'Cache-Control': 'max-age=315360000, no-transform, public',
            'Content-Encoding': 'gzip'
        };

        var uncompressed = gulp.src(['./dist/**/*', '!/*.gz'])
            .pipe(publisher.publish(headers));

        var compressed = gulp.src(['./dist/**/*.gz'])
            .pipe(publisher.publish(compressedHeaders));

        merge(uncompressed, compressed).pipe(publisher.sync())
            .pipe(plugins.awspublish.reporter());
    //}
});

gulp.task('watch', function () {
    var watcher = gulp.watch(['assets/**/*', 'pages/**/*'], ['build']);
    watcher.on('change', function (event) {
        console.log('File ' + event.path + ' was ' + event.type + ', running tasks…');
    });
});
