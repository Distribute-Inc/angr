const fs = require(`fs`)
const {
  trim,
  alterLastIndex,
  K,
  curry,
  pipe,
  reduce,
  map,
  split
} = require(`f-utility`)
const thingHas = curry((thing, x) => thing.includes(x))
// const {trace} = require(`xtrace`)
const HTML2JSX = require(`htmltojsx`)
const directory = require(`inquirer-file-path`)

const regexValidate = curry((regex, name, expected) => (
  regex.test(expected) ?
  true :
  `${name} is expected`
))

const shouldExist = regexValidate(/.+/)
// const shouldBeANumber = regexValidate(/\d+/)

const prepend = curry((before, x) => before + x)
const append = curry((after, x) => x + after)

const removeLast = (x) => x.substr(0, x.length - 1)

const addRequirement = ([k, v]) => {
  const last = k.length - 1
  const isCurious = k[last] === `?`
  return (
    isCurious ?
    [removeLast(k), v] :
    [k, append(`.isRequired`, v)]
  )
}

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

/*
 this enforces the pattern we use to get props / types from the command-line
 input: "a:number,b:string,c?:any,d:boolean"
 output: [
   [`a`, `number`],
   [`b`, `string`],
   [`c?`, `any`],
   [`d`, `boolean`]
 ]
 */
const doubleSplit = curry((d1, d2, x) => {
  // check to see if there's a prop on x
  const has = thingHas(x)
  // shortcut early
  if (!x || !has(d1) || !has(d2)) {
    return []
  }
  // like x.split(d1).map((y) => y.split(d2)) but cleaner
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

const j2 = (x) => JSON.stringify(x, null, 2)
const reduceToStrings = reduce((x, [k, v]) => x + `\n  ${k}: ${v},`, ``)

module.exports = function templatedComponentGenerator(plop) {
  plop.setHelper(`proptypes`, pipe(
    // split first on commas, then colons
    doubleSplit(`,`, `:`),
    // convert TS tuples to proptypes,
    map(alterLastIndex(convertTSToPropTypes)),
    // add `isRequired` to any key that ends in a ?
    map(addRequirement),
    // convert to a writeable format
    reduceToStrings,
    // remove the last character, which is a comma
    removeLast
  ))
  plop.setHelper(`typescript`, pipe(
      // split first on commas, then colons
      doubleSplit(`,`, `:`),
      // convert to a writeable format
      reduceToStrings,
      // remove the last character, which is a comma
      removeLast
    )
  )
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
