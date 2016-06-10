Plan for the Marketing Site:

1. Build out the HTML/CSS and the build process (gulpfile). 
    Finished product should be a functioning marketing website on S3.
2. Work on Hook and CMS. Work on converting content on the website from static to CMS.
    This is less important, finish #1 first.

* secrets.json
* gulpfile
    * watch
* context files

# Progressive Enhancement

These are the browsers supported by the marketing site:
> <b>Edge</b>: 12+
>
> <b>Internet Explorer</b>: 10+
>
> <b>Firefox</b>: 42+
>
> <b>Chrome</b>: 46+
>
> <b>Chrome for Android</b>: 47
>
> <b>Android Browser</b>: 4.4+
>
> <b>Safari</b>: 9+
>
> <b>iOS Safari & Chrome</b>: 8.4+
>

# Gulpfile

This project is built with Gulp. All Gulp configuration is in the <b>gulpfile.js</b>.

The gulp command accepts a <b>task</b> and <b>arguments</b>. Currently, the allowed tasks and arguments are:
> Tasks:
>
> <b>default/build</b>: Builds the project
>
> <b>deploy</b>: Builds and deploys the project to S3
> 
> Arguments:
>
> <b>env</b>: Sets the intended environment to build or deploy for. Recognized values are <b>staging</b> and <b>production</b>. Anything else is considered development.
>

For example, to run a build for development, enter
<pre>
gulp
</pre>

To build and deploy to staging, enter
<pre>
gulp deploy --env=staging
</pre>

## Build Process

# Development

## CSS

Stylesheets are stored roughly according to SMACSS.

Custom stylesheets typically start with a namespace, and all sub-classes are nested inside using SASS.
The namespace class itself will set some default styles: <code>background</code>, <code>color</code>,
<code>a { color }</code>, <code>-webkit-font-smoothing</code>

