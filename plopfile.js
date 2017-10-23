const fs = require(`fs`)
const {join, fromPairs, I, K, curry, pipe, reduce, map, split, merge} = require(`f-utility`)
const {trace} = require(`xtrace`)
const HTML2JSX = require(`htmltojsx`)
const directory = require(`inquirer-file-path`)

const regexValidate = curry((regex, name, expected) => (
  regex.test(expected) ?
  true :
  `${name} is expected`
))

const shouldExist = regexValidate(/.+/)
const shouldBeANumber = regexValidate(/\d+/)

const prepend = curry((before, x) => before + x)
const append = curry((after, x) => x + after)

const addRequirement = curry((k, v) => (
  k[k.length - 1] === `?` ?
  v :
  append(`.isRequired`, v)
))

const unchangedTypes = [
  `boolean`,
  `string`,
  `any`,
  `void`,
  `number`
]
const convertTSToPropTypes = pipe(
  (v) => {
    if (v === `object`) {
      return `any`
    }
    if (unchangedTypes.includes(v)) {
      return v
    }
    if (v.indexOf(`[]`) > -1) {
      return `arrayOf(PropTypes.${v})`
    }
  },
  prepend(`PropTypes.`)
)

const doubleSplit = curry((d1, d2, x) => {
  if (!x) {
    return []
  }
  if (x.indexOf(d1) === -1 || x.indexOf(d2) === -1) {
    return []
  }
  return map(split(d2), split(d1, x) || [])
})

const j2 = (x) => JSON.stringify(x, null, 2)
const reduceToStrings = reduce((x, [k, v]) => x + `\n  ${k}: ${v},`, ``)

module.exports = function templatedComponentGenerator(plop) {
  plop.setHelper(`proptypes`, pipe(
    doubleSplit(`,`, `:`),
    map(([k, v]) => [k, addRequirement(k, convertTSToPropTypes(v))]),
    reduceToStrings,
    (x) => x.substr(0, x.length - 1)
  ))
  plop.setHelper(`typescript`, (props) => {
    const converted = pipe(
      // split(`,`),
      doubleSplit(`,`, `:`),
      reduceToStrings
      // map(([k, v]) => `  ${k}: ${v}`),
      // join(`\n`),
      // trace(`what is this?!?!?!`)
    )(props)
    // console.log(`props`, props, converted)
    return converted.substr(0, converted.length - 1)
    // return props
  })
  plop.setHelper(`html2jsx`, (name, template) => {
    const hatemail = fs.readFileSync(template, `utf8`)
    const converter = new HTML2JSX({
      indent: `  `,
      hideComment: true,
      createClass: false
    })
    return converter.convert(hatemail)
  })
  plop.setPrompt(`directory`, directory)
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
        type: `directory`,
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
