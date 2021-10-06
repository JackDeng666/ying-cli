#! /usr/bin/env node

const mainFn = require('..')
const {program} = require('commander')
const version = require('../package.json').version

// 基础用法 添加单个命令动作
// program
//   .command('create')
//   .alias('crt')
//   .description('创建项目，后面跟项目名')
//   .action(() => {
//     console.log('create')
//   })
// 多个命令保存容器中
const actionsMap = {
  create: {
    alias: 'crt',
    des: '创建项目，后面跟项目名',
    examples: ['ying-cli|y-cli create|crt <projectName>']
  }
}
Object.keys(actionsMap).forEach((action) => {
  program
    .command(action)
    .alias(actionsMap[action].alias)
    .description(actionsMap[action].des)
    .action(() => {
      mainFn(action, process.argv.slice(3))
    })
})

program.on('--help', () => {
  console.log('示例：')
  Object.keys(actionsMap).forEach((action) => {
    actionsMap[action].examples.forEach((item) => {
      console.log("  " + item)
    })
  })
})

program.version(version).parse(process.argv)
