import * as fs from 'fs'
import {
  // I,
  alterFirstIndex,
  alterLastIndex,
  curry,
  K,
  map,
  pipe,
  reduce,
  split,
  trim
} from 'f-utility'
// import {trace} from 'xtrace'
import * as HTML2JSX from 'htmltojsx'
import * as filePath from 'inquirer-file-path'

export default function templatedComponentGenerator(plop) {
  const thingHas = curry((thing: any, x: string): boolean => thing.includes(x))
  const regexValidate = curry((regex: any, name: string, expected: string): boolean | string => (
    regex.test(expected) ?
    true :
    `${name} is expected`
  ))

  const shouldExist = regexValidate(/.+/)
  // const shouldBeANumber = regexValidate(/\d+/)

  const prepend = curry((before: string, x: string): string => before + x)
  const append = curry((after: string, x: string): string => x + after)

  // removeFromEndOfString(1, 'what!') => 'what'
  // removeFromEndOfString(-1, 'what!') => 'what'
  // removeFromEndOfString(-2, 'what!') => 'wha'
  const removeFromEndOfString = curry(
    (offset: number, x: string): string => x.substr(0, x.length - Math.abs(offset))
  )
  // removeLast('what!') => 'what'
  const removeLast = removeFromEndOfString(-1)
  const removeLastTwo = removeFromEndOfString(-2)

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
  const splitTwice = curry((d1: string, d2: string, x: string): string[][]  => {
    // check to see if there's a prop on x
    const has = thingHas(x)
    // shortcut early
    if (!x || !has(d1) || !has(d2)) {
      return []
    }
    return pipe(
      trim,
      split(d1),
      map(pipe(
        trim,
        split(d2),
        map(trim)
      ))
    )(x)
  })
  const DELIMITERS = Object.freeze({
    COMMA: `,`,
    COLON: `:`
  })

  const splitOnCommasThenColons = splitTwice(DELIMITERS.COMMA, DELIMITERS.COLON)

  // this is what ultimately formats the content that we print in the proptypes / interface
  const formatLines = curry(
    (delim, arr) => reduce(
      (x, [k, v]) => x + `\n  ${k}: ${v}${delim}`,
      ``,
      arr
    )
  )

  // # typescript

  plop.setHelper(`typescript`, pipe(
    splitOnCommasThenColons,
    // silly typescript likes semi-colons
    formatLines(`;`)
  ))

  /**
   * a clunky but workable typescript-to-proptype conversion
   * limited. doesn't do complex types yet
   * @function convertTSToPropTypes
   * @param {String} v - a string representing a typescript literal
   * @returns {String} a string that is the proptype representation of the same thing (hopefully?)
   */
  const convertTSToPropTypes = pipe(
    (v: string): string => {
      // later maybe we can add shapes or whatever
      if (v === `object`) {
        return `any`
      }
      // silly proptypes, making me remember this
      if (v === `boolean`) {
        return `bool`
      }
      const unchangedTypes = [
        `string`,
        `any`,
        `number`
      ]
      if (unchangedTypes.includes(v)) {
        return v
      }
      if (v.indexOf(`[]`) > -1) {
        return `arrayOf(PropTypes.${removeLastTwo(v)})`
      }
    },
    prepend(`PropTypes.`)
  )

  // addRequirement(['butts?', 'PropTypes.number']) => [`butts`, `PropTypes.number`]
  // addRequirement(['butts', 'PropTypes.number']) => [`butts`, `PropTypes.number.isRequired`]
  const addRequirement = ([k, v]: [string, string]): [string, string] => {
    const last = k.length - 1
    const isCurious = k[last] === `?`
    return (
      isCurious ?
      [removeLast(k), v] :
      [k, append(`.isRequired`, v)]
    )
  }

  const fixArray = (k: string): string => (
    k.indexOf(`[]`) > -1 ?
      removeLastTwo(k) :
      k
  )

  const propTypify = map(pipe(
    // convert TS tuples to proptypes,
    alterLastIndex(convertTSToPropTypes),
    // add `isRequired` to any key that ends in a ?
    addRequirement,
    // remove `[]` from any array key
    alterFirstIndex(fixArray)
  ))

  plop.setHelper(`proptypes`, pipe(
    splitOnCommasThenColons,
    // convert typescript interface dealies to proptypes
    propTypify,
    // convert to a writeable format
    formatLines(DELIMITERS.COMMA),
    // remove the last character, which is a comma
    removeLast
  ))

  // make a hatemail converter
  const hatemailToJSX = new HTML2JSX({
    indent: `  `,
    hideComment: true,
    createClass: false
  })
  plop.setHelper(`html2jsx`, (name, template) => {
    // grab our template
    // TODO: make this async?
    const hatemail = fs.readFileSync(template, `utf8`)
    return hatemailToJSX.convert(hatemail)
  })
  // this is our file inspector prompt
  plop.setPrompt(`filePath`, filePath)
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
        validate: K(true)
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
  })
}
