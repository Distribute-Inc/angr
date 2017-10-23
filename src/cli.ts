import * as commander from 'commander'
import {pipe} from 'f-utility'
import {cssToJSON, htmlToJSX} from './converter'

export const cmd = () => (
  commander.description(`convert html + scss + angular component files to a cheap / flimsy React component`)
    .option(`-t, --template [file]`, `gimme a template`)
    .option(`-s, --style [file]`, `gimme a scss file`)
    .option(`-c, --component [file]`, `gimme a component file`)
    .parse(process.argv)
)


export const exe = () => {
  const config = cmd()
  console.log(config, `CONFIG`)
}
