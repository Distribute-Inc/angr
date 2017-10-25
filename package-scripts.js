const germs = require(`germs`)
const {name} = require(`./package.json`)
module.exports = germs.build(name, {
  // build: `tsc`,
  makePlopfile: [
    `tsc src/plopfile.ts`,
    `-m commonjs`,
    `--lib dom,es2015,es2016,es2017`,
    `--strict`,
    `-t ES2016`,
    `--typeRoots typings,node_modules/@types`,
    `--types node,f-utility,htmltojsx,inquirer-file-path`,
    `&& mv src/plopfile.js .`
  ].join(` `)
})
