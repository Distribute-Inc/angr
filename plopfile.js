"use strict";
const fs = require("fs");
const f_utility_1 = require("f-utility");
// import {trace} from 'xtrace'
const HTML2JSX = require("htmltojsx");
const filePath = require("inquirer-file-path");
module.exports = function templatedComponentGenerator(plop) {
    const thingHas = f_utility_1.curry((thing, x) => thing.includes(x));
    const regexValidate = f_utility_1.curry((regex, name, expected) => (regex.test(expected) ?
        true :
        `${name} is expected`));
    const shouldExist = regexValidate(/.+/);
    // const shouldBeANumber = regexValidate(/\d+/)
    const prepend = f_utility_1.curry((before, x) => before + x);
    const append = f_utility_1.curry((after, x) => x + after);
    // removeFromEndOfString(1, 'what!') => 'what'
    // removeFromEndOfString(-1, 'what!') => 'what'
    // removeFromEndOfString(-2, 'what!') => 'wha'
    const removeFromEndOfString = f_utility_1.curry((offset, x) => x.substr(0, x.length - Math.abs(offset)));
    // removeLast('what!') => 'what'
    const removeLast = removeFromEndOfString(-1);
    const removeLastTwo = removeFromEndOfString(-2);
    /**
     * like x.split(d1).map((y) => y.split(d2)) but cleaner
     * this enforces the pattern we use to get props / types from the command-line
     * @function splitTwice
     * @param {String} d1 - first delimiter to split on
     * @param {String} d2 - second delimiter to split on
     * @param {String} x - a string that looks like "crap:cool,butts:what" (or other delimiters)
     * @returns {Array} the original string, but split first on d1, then split on d2 (and trimmmed)
     * @example
     * const input = "a:number,b:string,c?:any,d:boolean"
     * splitTwice(input)
     * // prints: [
     * //   [`a`, `number`],
     * //   [`b`, `string`],
     * //   [`c?`, `any`],
     * //   [`d`, `boolean`]
     * // ]
     */
    const splitTwice = f_utility_1.curry((d1, d2, x) => {
        // check to see if there's a prop on x
        const has = thingHas(x);
        // shortcut early
        if (!x || !has(d1) || !has(d2)) {
            return [];
        }
        return f_utility_1.pipe(f_utility_1.trim, f_utility_1.split(d1), f_utility_1.map(f_utility_1.pipe(f_utility_1.trim, f_utility_1.split(d2), f_utility_1.map(f_utility_1.trim))))(x);
    });
    const DELIMITERS = Object.freeze({
        COMMA: `,`,
        COLON: `:`
    });
    const splitOnCommasThenColons = splitTwice(DELIMITERS.COMMA, DELIMITERS.COLON);
    // this is what ultimately formats the content that we print in the proptypes / interface
    const formatLines = f_utility_1.curry((delim, arr) => f_utility_1.reduce((x, [k, v]) => x + `\n  ${k}: ${v}${delim}`, ``, arr));
    // # typescript
    plop.setHelper(`typescript`, f_utility_1.pipe(splitOnCommasThenColons, 
    // silly typescript likes semi-colons
    formatLines(`;`)));
    /**
     * a clunky but workable typescript-to-proptype conversion
     * limited. doesn't do complex types yet
     * @function convertTSToPropTypes
     * @param {String} v - a string representing a typescript literal
     * @returns {String} a string that is the proptype representation of the same thing (hopefully?)
     */
    const convertTSToPropTypes = f_utility_1.pipe((v) => {
        // later maybe we can add shapes or whatever
        if (v === `object`) {
            return `any`;
        }
        // silly proptypes, making me remember this
        if (v === `boolean`) {
            return `bool`;
        }
        const unchangedTypes = [
            `string`,
            `any`,
            `number`
        ];
        if (thingHas(unchangedTypes, v)) {
            return v;
        }
        if (v.indexOf(`[]`) > -1) {
            return `arrayOf(PropTypes.${removeLastTwo(v)})`;
        }
    }, prepend(`PropTypes.`));
    // addRequirement(['butts?', 'PropTypes.number']) => [`butts`, `PropTypes.number`]
    // addRequirement(['butts', 'PropTypes.number']) => [`butts`, `PropTypes.number.isRequired`]
    const addRequirement = ([k, v]) => {
        const last = k.length - 1;
        const isCurious = k[last] === `?`;
        return (isCurious ?
            [removeLast(k), v] :
            [k, append(`.isRequired`, v)]);
    };
    const fixArray = (k) => (k.indexOf(`[]`) > -1 ?
        removeLastTwo(k) :
        k);
    const propTypify = f_utility_1.map(f_utility_1.pipe(
    // convert TS tuples to proptypes,
    f_utility_1.alterLastIndex(convertTSToPropTypes), 
    // add `isRequired` to any key that ends in a ?
    addRequirement, 
    // remove `[]` from any array key
    f_utility_1.alterFirstIndex(fixArray)));
    plop.setHelper(`proptypes`, f_utility_1.pipe(splitOnCommasThenColons, 
    // convert typescript interface dealies to proptypes
    propTypify, 
    // convert to a writeable format
    formatLines(DELIMITERS.COMMA), 
    // remove the last character, which is a comma
    removeLast));
    // make a hatemail converter
    const hatemailToJSX = new HTML2JSX({
        indent: `  `,
        hideComment: true,
        createClass: false
    });
    plop.setHelper(`html2jsx`, (name, template) => {
        // grab our template
        // TODO: make this async?
        const hatemail = fs.readFileSync(template, `utf8`);
        return hatemailToJSX.convert(hatemail);
    });
    // this is our file inspector prompt
    plop.setPrompt(`filePath`, filePath);
    // this is our core generator
    plop.setGenerator(`react2angular`, {
        description: `generate a component which works in both React & Angular`,
        prompts: [
            {
                type: `input`,
                name: `name`,
                message: `What is the name of your component?`,
                validate: shouldExist(`name`)
            },
            {
                type: `filePath`,
                name: `template`,
                message: `Where is the html template for this component stored?`,
                validate: shouldExist(`template`),
                basePath: plop.getPlopfilePath()
            },
            {
                type: `input`,
                name: `types`,
                message: `Supply a string that represents proptypes / interface: a:number,b:any,c:string`,
                validate: f_utility_1.K(true)
            }
        ],
        actions: [
            {
                type: `add`,
                // TODO: convert this to be also-an-input
                path: `{{dashCase name}}.tsx`,
                templateFile: `templates/angular-react-component.hbs`,
                abortOnFail: true
            }
        ]
    });
};
