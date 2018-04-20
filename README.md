# pug-start
CLI tool for Pug templates.

## Installing

### npm
To install pug-start using npm, simply run:
```js
$ npm i --save -g pug-start
```

## Using
All you have to do is to install package globally and run <code>pg-cli</code> in Command Line.

```
$ pg-cli <pug-directory>
```

> Template directory must be specified when compiling a pg-cli.

> If the directory is empty, index.pug, footer.pug, and header.pug will be compiled automatically.

### CLI Questions
After running <code>pg-cli</code> in Command Line you will be asked questions about your template.
* <span style="color:cyan">Enter your title:</span> - &lt;title&gt;YOUR TITLE&lt;/title&gt;
* <span style="color:cyan">Enter your keywords (delimeter: ','):</span> - &lt;meta name="keywords" content="YOUR_KEYWORDS" /&gt;
* <span style="color:cyan">Enter your description:</span> - &lt;meta name="description" content="YOUR_DESCRIPTION" /&gt;
* <span style="color:cyan">Do you want to set 'follow' in robots.txt?</span> - &lt;meta name="robots" content="index, follow" /&gt;
* <span style="color:cyan">Do you want to set 'index' in robots.txt?</span> - &lt;meta name="robots" content="index, follow" /&gt;
* <span style="color:cyan">Enter your GoogleAnalyticsId if you want to add it (leave empty if not):</span> - If you want to add google analytics script to your template, enter your googleAnalyticsId
* <span style="color:cyan">Do you want to include 'footer' section?</span> - include './sections/footer.pug' to your template.
* <span style="color:cyan">Do you want to include 'header' section?</span> - include './sections/header.pug' to your template.
* <span style="color: cyan">Do you want to add 'itemscope' and 'appleMobileWebAppCapable' parameters?</span> - &lt;html itemscope itemtype="http://schema.org/Website"&gt;

### CLI cdnjs
After the above questions, you will be asked which CDNs you want to add to your template.
> Only if you chose 'cdn' in 'Please select sections you want to include in your template'

Example:
<pre>
? <strong>Please enter the name of the CDN you would like to add:</strong> jquery

⠙ <strong>Looking for package..</strong>

    <span style="color:green">jquery has been successfully added to your cdn file.</span>

? <strong>Please enter the name of the CDN you would like to add:</strong> animate

⠦ <strong>Looking for package..</strong>

 <span style="color:cyan">Package name is incorrect. Please enter one of the names below or try another:</span>
<span style="color:yellow">
 animate.css
 animateplus
 jquery-animateNumber
 animatelo
 animated-header
 leaflet.AnimatedMarker
 marker-animate-unobtrusive
 just-animate
 animateCSS
 css3-animate-it
</span>

? <strong>Please enter the name of the CDN you would like to add:</strong> animate.css

⠚ <strong>Looking for package..</strong>

    <span style="color:green">animate.css has been successfully added to your cdn file.</span>
</pre>

#### Flags
```
-r // If index.pug exists, but it was not compiled with pg-cli, this flag will overwrite it and wrap it with the pg-cli layout.
```

##### Command Line:
```
$ pg-cli ./views -r
```

> Content of the index.pug will be saved.

##### Example:
index.pug before:
```pug
section.jumbotron
    .container
        h1.jumbotron-heading Album example
        p.lead.text-muted 
            | Something short and leading about the collection..
        p
            a(href="#").btn.btn-primary.my-2 Main call to action
```
> The code above was taken from getbootstrap.com

index.pug after:
```pug
extends _base/layout

//- Include all files
//- All configurations for the template
block config
    include _base/config

block main
    section.jumbotron
        .container
            h1.jumbotron-heading Album example
            p.lead.text-muted 
                | Something short and leading about the collection..
            p
                a(href="#").btn.btn-primary.my-2 Main call to action
```

## Contribute
Please file an issue if you think something could be improved. Please submit Pull Requests when ever possible.