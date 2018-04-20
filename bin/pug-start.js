#!/usr/bin/env node

const meow = require('meow');
const path = require('path');
const fs = require('fs');
const inquirer = require('inquirer');
const chalk = require('chalk');
const Emitter = require('events').EventEmitter;
const mkdirp = require('mkdirp');
const shell = require('shelljs');
const _ = require('lodash');
const request = require('request');
const async = require('async');
const Spinner = require('cli-spinner').Spinner;

const SOURCE_PUGS = path.resolve(process.cwd(), './node_modules/pug-start', './source/_base');
const packageJSON = require(path.resolve(process.cwd(), 'package.json'));

/**
 * Initialize CLI
 */

var cli = meow({
    help: [
        'Usage:',
        '  pg-cli <pug-directory>',
        ''].join('\n')
}, {
    flags: {
        r: {
            type: 'boolean',
            alias: 'r'
        }
    }});

/**
 * Private function
 * Is a Directory
 *
 * @param {String} filePath
 * @returns {Boolean}
 */

function isDirectory(filePath) {
    var isDir = false;
    try {
      var absolutePath = path.resolve(filePath);
      isDir = fs.existsSync(absolutePath) && fs.statSync(absolutePath).isDirectory();
    } catch (e) {
      isDir = e.code === 'ENOENT';
    }
    return isDir;
  }

/**
 * Private function
 * Creates folder (_base) in template's directory and include files in there
 */
function initBaseDirectory(callback){
    var basePath = path.resolve(cli.input[0], '_base'),
        sectionsBasePath;

    try{
        try{
            /**
             * Creates ./_base directory if it does not exist
             */
            if(!fs.existsSync(basePath) || !fs.statSync(basePath).isDirectory()){
                mkdirp.sync(basePath);
            }
            /**
             * Creates ./_base/_sections directory if it does not exist
             */
            sectionsBasePath = path.resolve(basePath, '_sections');
            
            if(!fs.existsSync(sectionsBasePath) || !fs.statSync(sectionsBasePath).isDirectory()){
                mkdirp.sync(sectionsBasePath);
            }
            
        }catch(e){
            throw Error('Error occurred while initialization _base directory');
        }
        

        try{
            let sourcePath = path.resolve(SOURCE_PUGS, '_sections');
            
            /**
             * If file was required by inject, copies it in ./_base/
             */

            if(shell.ls(sourcePath).code !== 0){
                throw Error('no directory');
            }

            shell.ls(sourcePath).forEach((file)=>{
                shell.cp(path.resolve(sourcePath, file), sectionsBasePath);
            });

            if(shell.cp(path.resolve(sourcePath, '../', 'head.pug'), basePath).code !== 0) throw Error('no file');
            if(shell.cp(path.resolve(sourcePath, '../', 'layout.pug'), basePath).code !== 0) throw Error('no file');

        }catch(e){
            throw Error(`Error occurred while listing _sections files.\n\n   ${chalk.cyan(`Please enter 'npm i --save pg-cli' to fix it`)}`);
        }

        callback(null);
    }catch(e){
        callback(e.message);
    }
    
}

/**
 * Private function
 * Initialization config.pug
 */
const initConfig = (answers, callback) => {
    try{
        if(!answers){
            throw Error('answers is not defined');
        }

        fs.writeFileSync(`${cli.input[0]}/_base/config.pug`, `
-
    var config = {
        // Main properties
        title: "${answers.title}", // title
        keywords: "${answers.keywords}",
        description: "${answers.description}",
        robots: "${answers.index ? 'index' : 'noindex'}, ${answers.follow ? 'follow' : 'nofollow'}",
        googleAnalyticsId: "${answers.googleAnalytics}", // leave empty if you don't have google analytics
        css: ${answers.css ? `[${_.map(_.map(_.split(answers.css, ','), _.trim), (item)=> {return `'${item}'`})}]` : '[]'}, // Array<String> | Path to your css files
        browserConfig: "browserconfig.xml", // Default. Change if you have a browserconfig elsewhere. Comment if you do not have one.
        
        //- Social
        name: "${answers['social:name']}", // name for social
        url: "${answers['social:url']}", // url for social
        image: "${answers['social:image']}", // image for social

        // Additional properties
        footer: ${answers.footer},           // True if you want to include ./../sections/footer.pug to your template
        header: ${answers.header},           // True if you want to include ./../sections/header.pug to your template
        social: ${_.includes(answers.sections, 'social')},           // True if you want to include ./social.pug
        favicon: ${_.includes(answers.sections, 'favicon')},          // True if you want to include ./favicon.pug
        afterScripts: ${_.includes(answers.sections, 'afterScripts')},     // True if you want to include ./afterScripts.pug in the end of your template
        beforeScripts: ${_.includes(answers.sections, 'beforeScripts')},    // True if you want to include ./beforeScripts.pug in the head of your template
        crossBrowser: ${_.includes(answers.sections, 'crossBrowser')},    // True if you want to include ./crossBrowser.pug
        cdn: ${_.includes(answers.sections, 'cdn')},             // True if you want to include ./cdns.pug
        fonts: ${_.includes(answers.sections, 'fonts')},            // True if you want to include ./fonts.pug
        itemscope: ${answers.itemscopeAndApple},        // True if you want to add itemscope and itemtype attrs
        appleMobileWebAppCapable: ${answers.itemscopeAndApple} // sets <meta name="apple-mobile-web-app-capable" content="yes"> if true
    };
        `);

        callback(null, answers);

    }catch(e){
        callback(e.message);
    }
}

/**
 * Private function
 * Initialization index.pug
 */

const initIndex = (callback) => {
    try{
        let index = path.resolve(process.cwd(), cli.input[0], 'index.pug');

        if(!fs.existsSync(index) || !fs.statSync(index).isFile()){
            fs.writeFileSync(index, `
extends _base/layout

//- Include all files
//- All configurations for the template
block config
    include _base/config

    //- If you want to change default configs, just set the properties here
    //- config.title = 'New title';

block main
    h1 Hello world`)

            callback(null);
        }else{
            let indexFile = fs.readFileSync(index, 'utf8');

            /**
             * Add tab before each line for pug's tabulation
             */
            let indexFileTabulation = _.split(indexFile, '\n');
            indexFileTabulation = _.map(indexFileTabulation, (item)=>{
                return `    ${item}`;
            })
            indexFileTabulation = indexFileTabulation.join('\n');


            let indexFileArray = _.split(_.trimStart(indexFile), '\n');

            indexFileArray = _.map(indexFileArray, _.trimStart);

            indexFileArray = _.map(indexFileArray, _.trimEnd);

            if(_.includes(indexFileArray, 'extends _base/layout') && _.includes(indexFileArray, 'block config') && _.includes(indexFileArray, 'block main')){
                
                callback(null);
            }else{
                if(cli.flags.r){
                    fs.writeFileSync(index, `
extends _base/layout

//- Include all files
//- All configurations for the template
block config
    include _base/config

    //- If you want to change default configs, just set the properties here
    //- config.title = 'New title';

block main
${indexFileTabulation}`)
    
                    callback(null);
                }else{
                    throw Error(`Looks that you already have index.pug and it wasn't compiled with pug-start. \n  ${chalk.cyan(`Please run 'pg-cli <pug-template> -r' to allow pug-start rewrite index.pug.`)}`);
                }
            }
        }

    }catch(e){
        callback(e.message);
    }
}

const initSections = (answers, callback) =>{
    try{
        var sectionsPath = path.resolve(cli.input[0], 'sections'),
            sourcePath = path.resolve(SOURCE_PUGS, '../sections');
        /**
         * Continue if footer and header are not required
         */
        if(!answers.footer && !answers.header){
            callback(null, answers);
        }
        /**
         * Creates ./sections directory if it does not exist
         */
        if(!fs.existsSync(sectionsPath) || !fs.statSync(sectionsPath).isDirectory()){
            mkdirp.sync(sectionsPath);            
        }

        if(answers.footer && (!fs.existsSync(path.resolve(sectionsPath, 'footer.pug')) || !fs.statSync(path.resolve(sectionsPath, 'footer.pug')).isFile())){
            if(shell.cp(path.resolve(sourcePath, 'footer.pug'), sectionsPath).code !== 0) throw Error('no file');
        }

        if(answers.header && (!fs.existsSync(path.resolve(sectionsPath, 'header.pug')) || !fs.statSync(path.resolve(sectionsPath, 'header.pug')).isFile())){
            if(shell.cp(path.resolve(sourcePath, 'header.pug'), sectionsPath).code !== 0) throw Error('no file');
        }

        callback(null, answers);

    }catch(e){
        callback(e.message)
    }
}


/**
 * Private function
 * Event emitter
 */
function eventEmitter(){
    var emitter = new Emitter();

    emitter.on('help', (exit)=>{
        console.log(`   ${chalk.cyan(`Use 'pg-cli --help' to get more information`)}`);
    });

    emitter.on('error', (err, help)=>{
        console.log(`   ${chalk.red(`Error: ${err}`)}`);

        if(help){
            emitter.emit('help');
        }

        process.exit(1);
    });

    emitter.on('success', (message)=>{
        console.log(`\n    ${chalk.green(message)}\n`);
    });
    

    return emitter;
}

/**
 * Private functions
 * Searching cdn links
 */
function cdnAdd(answers, callback){
    try{
        var listCDNcss = [];
        var listCDNjs = [];
        var prompt = inquirer.createPromptModule();

        var searchParameter = {
            name: 'search',
            message: 'Please enter the name of the CDN you would like to add: ',
            validate: function(input){
                var done = this.async();

                var resolve = function(){
                    done(null, true);
                }

                var reject = function(text){
                    done(text);
                }

                var error = function(text){
                    done(chalk.red(text));
                }

                if(!input){
                    resolve();
                    return;
                }


                getCDN(input);


                /**
                 * Private function that gets cdn's information
                 * calls search function if it hasn't been found
                */
                function getCDN(e){
                    var spinner = new Spinner('%s Looking for package..');
                    spinner.setSpinnerString(19);
                    spinner.start();

                    request(`https://api.cdnjs.com/libraries/${e}`, (err, res)=>{
                        if(err){
                            spinner.stop();
                            error(err);
                            return;
                        }
    
                        if(res.statusCode !== 200){
                            spinner.stop();
                            error(`response statusCode is ${res.statusCode}`);
                            return;
                        }
    
                        let body = JSON.parse(res.body);
    
                        if(!body || !body.name || !body.filename || !body.version){

                            searchCDN(e, (err, res)=>{
                                spinner.stop();

                                if(err){
                                    error(err);
                                    return;
                                }

                                console.log(`${chalk.cyanBright('\n\n Package name is incorrect. Please enter one of the names below or try another:\n')} \n ${chalk.cyan(res.join('\n '))}\n`);
                                reject(`Press ${chalk.cyan('Enter')} to continue:`);
                                return;
                            });
                        }else{
                            spinner.stop();

                            emitter.emit('success', `\n    ${body.name} has been successfully added to your cdn file.`);

                            let format = _.split(body.filename, '.');


                            if(_.last(format) == 'css'){
                                listCDNcss.push(`https://cdnjs.cloudflare.com/ajax/libs/${body.name}/${body.version}/${body.filename}`);
                            }

                            if(_.last(format) == 'js'){
                                listCDNjs.push(`https://cdnjs.cloudflare.com/ajax/libs/${body.name}/${body.version}/${body.filename}`);
                            }

                            reject(`Press ${chalk.cyan('Enter')} to continue:`);
                        }
                    })
                }

                /**
                 * Private function searching cdn if it hasn't been found
                */
                function searchCDN(e, callback){
                    request(`https://api.cdnjs.com/libraries/?search=${e}`, (err, res)=>{
                        if(err){
                            callback(err);
                            return;
                        }
    
                        if(res.statusCode !== 200){
                            callback(`response statusCode is ${res.statusCode}`);
                            return;
                        }
    
    
                        let body = JSON.parse(res.body);
    
                        if(!body.results || !body.results[0]){
                            callback(`CDNs haven't been found. Please enter another name.`);
                            return;
                        }

                        /**
                         * Returns 10 names of search result
                         */
                        callback(null, _.flatMap(_.take(body.results, 10), (item)=>{
                            return item.name;
                        }));
                    })
                }
            }
        }

        prompt(searchParameter).then((ans)=>{

            let cdnFileCSS = _.map(listCDNcss, (item)=>{
                return `link(rel="stylesheet", href="${item}")`
            })

            let cdnFileJS = _.map(listCDNjs, (item)=>{
                return `script(src="${item}")`
            })

            let cdnAll = _.concat(cdnFileCSS, cdnFileJS);

            fs.writeFileSync(`${cli.input[0]}/_base/_sections/cdn.pug`, `
// START cdn

${cdnAll.join('\n')}

// END cdn`);

            console.log(chalk.cyan(`\n    ${listCDNcss.length} css packages were added to your template.`));
            console.log(chalk.cyan(`\n    ${listCDNjs.length} js packages were added to your template.`));
            emitter.emit('success', 'CDN part has been successfully finished');

            callback(null, answers);
        }).catch((e)=>{
            throw Error(e);
        });

    }catch(e){
        callback(e.message);
    }
}
/**
 * Private function
 * Adding social.pug
 */
const socialAdd = (answers, callback)=> {
    try{
        if(!_.includes(answers.sections, 'social')){
            callback(null, answers);
        }

        inquirer.prompt(
            [
                {
                    name: 'social:name',
                    message: 'Enter the name you want to be used in social:'
                },
                {
                    name: 'social:url',
                    message: 'Enter the URL address you want to be used in social:'
                },
                {
                    name: 'social:image',
                    message: 'Enter image url you want to be used in social:'
                }
            ]).then((e)=>{
                _.assign(answers, e);

                emitter.emit('success', 'Social part has been successfully completed.');

                callback(null, answers);
            })
    }catch(e){
        callback(e.message);
    }
}

/**
 * Prompt function.
 * Main questions.
 */
const promptModule = (callback) =>{
    // 
    // Start the prompt 
    // 
    var prompt = inquirer.createPromptModule();

    questions = [
        {
            name: 'title',
            message: `Enter your title:`,
            validate: function(e){
                if(!e){
                    console.log(chalk.red('Title is required.'));
                    return false;
                }

                return true;
            }
        },
        {
            name: 'keywords',
            message: `Enter your keywords (delimiter: ','):`,
        },
        {
            name: 'description',
            message: 'Enter your description:'
        },
        {
            name: 'follow',
            type: 'confirm',
            default: true,
            message: `Do you want to set 'follow' in robots.txt?`
        },
        {
            name: 'index',
            type: 'confirm',
            default: true,
            message: `Do you want to set 'index' in robots.txt?`
        },
        {
            name: 'googleAnalytics',
            message: 'Enter your GoogleAnalyticsId if you want to add it (leave empty if not): '
        },
        {
            name: 'css',
            message: `Enter your css files (delimiter: ','):`
        },
        {
            name: 'footer',
            message: `Do you want to include 'footer' section?`,
            type: 'confirm',
            default: true
        },
        {
            name: 'header',
            message: `Do you want to include 'header' section?`,
            type: 'confirm',
            default: true
        },
        {
            name: 'sections',
            message: 'Please select sections you want to include in your template:',
            type: 'checkbox',
            choices: [
                    {
                        value: 'social',
                        name: `Select if you want to include 'social' section.`,
                        short: 'social',
                        checked: true
                    },
                    {
                        value: 'cdn',
                        name: `Select if you want to include 'cdn' section.`,
                        short: 'cdn',
                        checked: true
                    },
                    {
                        value: 'fonts',
                        name: `Select if you want to include 'fonts' section.`,
                        short: 'fonts',
                        checked: true
                    },
                    {
                        value: 'favicon',
                        name: `Select if you want to include 'favicon' section.`,
                        short: 'favicon',
                        checked: true
                    },
                    {
                        value: 'afterScripts',
                        name: `Select if you want to include 'after-scripts' section in the end of the page.`,
                        short: 'after-scripts',
                        checked: true
                    },
                    {
                        value: 'beforeScripts',
                        name: `Select if you want to include 'before-scripts' section inside <head></head>.`,
                        short: 'before-scripts',
                        checked: true
                    },
                    {
                        value: 'crossBrowser',
                        name: `Select if you want to include 'cross-browser' section.`,
                        short: 'cross-browser',
                        checked: true
                    }
                    ]
        },
        {
            name: 'itemscopeAndApple',
            message: `Do you want to add 'itemscope' and 'appleMobileWebAppCapable' parameters?`,
            type: 'confirm',
            default: true
        }
    ]

    prompt(questions).then((answers)=>{
        emitter.emit('success', 'First part has been successfully completed.');

        callback(null, answers);

    }).catch((e)=>{
        callback(e.message);
    });
}

/**
 * Register eventEmitter
 */
var emitter = eventEmitter();

/**
 * If package.json doesn't exist or pug-start doesn't exist in it
 */
if(!packageJSON){
    emitter.emit('error', `Package.json hasn't been found`)
}
if(!packageJSON.dependencies || !packageJSON.dependencies["pug-start"]){
    emitter.emit('error', `'pug-start' hasn't been found in package.json. Please run 'npm i --save pug-start'`);
}

/*
 * If directory does not exist, emits an error (last true - emitter.emit('help') )
 */
if(!isDirectory(cli.input[0])){
    emitter.emit('error', 'Template directory must be specified when compiling a pg-cli', true);
}

/**
 * Async waterfall
 */
let waterfall = [];

/**
 * Initialization index.pug
 */
waterfall.push(initIndex);

/**
 * Initialization _base directory
 */
waterfall.push(initBaseDirectory);
/**
 * Questions about template
 */
waterfall.push(promptModule);
/**
 * Initisalization social.pug (prompts sends answers as an argument)
 */
waterfall.push(socialAdd);
/**
 * Initialization config.pug (prompt sends answers as an argument)
 */
waterfall.push(initConfig);
/**
 * Initialization ./sections/footer.pug and ./sections/header.pug (config sends answers as an argument)
 */
waterfall.push(initSections);
/**
 * Initisalization cdn.pug (config sends answers as an argument)
 */
waterfall.push(cdnAdd);

async.waterfall(waterfall, (err, result)=>{
    if(err){
        emitter.emit('error', err);
    }

    emitter.emit('success', 'All parts have been successfully completed.');
});
