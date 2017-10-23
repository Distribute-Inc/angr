const fs = require(`fs`)
const {curry} = require(`f-utility`)
const HTML2JSX = require(`htmltojsx`)
const directory = require(`inquirer-file-path`)

const regexValidate = curry((regex, name, expected) => (
  regex.test(expected) ?
  true :
  `${name} is expected`
))

const shouldExist = regexValidate(/.+/)
const shouldBeANumber = regexValidate(/\d+/)

module.exports = function templatedComponentGenerator(plop) {
  plop.setHelper(`html2jsx`, (name, template) => {
    const hatemail = fs.readFileSync(template, `utf8`)
    const converter = new HTML2JSX({
      indent: `  `,
      hideComment: true,
      createClass: false
      // outputClassName: `{{pascalCase name}}`
    })
    const jsx = converter.convert(hatemail)
    return jsx
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
