const axios = require('axios')
const inquirer = require('inquirer')
const ora = require('ora')
const chalk = require('chalk')
const compressing = require('compressing')

const fs = require("fs")
const http = require('http')
const copyFile = require('./copyFile')
const delFile = require('./delFile')

let userName = 'JackDeng666', repoName = null, tagName = null, dirName = null, delOrigin = false
const spinner = ora()

module.exports = async function (argvs) {
  dirName = argvs[0]
  // 选择默认操作还是自定义操作
  const questionList = [
    {
      type: 'list',
      name: 'select',
      message: '请选择',
      choices: [
        { name: '默认github用户：JackDeng666', value: 1 },
        { name: '其他', value: 2 }
      ]
    },
    {
      type: 'input',
      name: 'userName',
      message: '请输入用户名',
      default: 'JackDeng666',
      when(preAn) {
        return preAn.select == 2
      }
    }
  ]
  fs.existsSync(`./${dirName}`) && questionList.unshift({
    type: 'confirm',
    name: 'delOrigin',
    message: '此目录已存在，下载模板后是否删除，否将合并'
  })
  const ret = await inquirer.prompt(questionList)
  delOrigin = ret.delOrigin
  // 查询仓库
  if (ret.select == 2) {
    userName = ret.userName
  }
  await getRepos()
}

// 查询仓库
async function getRepos() {
  spinner.text = chalk.yellow('正在查询仓库信息')
  spinner.start()
  let url = `https://api.github.com/users/${userName}/repos`
  try {
    const { data } = await axios.get(url)
    let arr = data.map(item => item.name)
    if (arr.length == 0) {
      spinner.warn('该用户可能没有开源仓库')
    } else {
      spinner.stop()
      selectRepos(arr)
    }
  } catch (error) {
    spinner.fail(chalk.red('查询失败，用户名可能不存在'))
  }
}

// 选择仓库
async function selectRepos(arr) {
  // 选择仓库
  let repo = await inquirer.prompt([{
    type: 'list',
    name: 'repoName',
    message: '请选择仓库',
    choices: arr
  }])
  // 查询版本标签
  repoName = repo.repoName
  await getTags()
}

// 查询版本标签
async function getTags() {
  spinner.text = chalk.yellow('正在查询版本标签信息')
  spinner.start()
  let url = `https://api.github.com/repos/${userName}/${repoName}/tags`
  const { data } = await axios.get(url)
  // 没有版本标签
  if (data.length == 0) {
    spinner.info(chalk.blue('无版本标签，将直接下载模板最新代码'))
    downLoad()
  } else {
    spinner.stop()
    selectTags(data.map(item => item.name))
  }
}

// 选择版本标签
async function selectTags(tags) {
  // 有版本标签，则选择标签
  let tag = await inquirer.prompt([{
    type: 'list',
    name: 'tagName',
    message: '请选择版本',
    choices: tags
  }])
  tagName = tag.tagName
  downLoad()
}

// 下载模板
async function downLoad() {
  spinner.text = chalk.yellow('正在下载模板...')
  spinner.start()
  let url = tagName ?
    `https://codeload.github.com/${userName}/${repoName}/zip/refs/tags/${tagName}`
    :
    `https://codeload.github.com/${userName}/${repoName}/zip/refs/heads/master`
  let res = await axios({
    method: "get",
    url,
    responseType: "arraybuffer",
    // 下载进度无用
    // onDownloadProgress: (evt) => {
    //   console.log(evt)
    //   spinner.text = `正在下载模板...${parseInt((evt.loaded / evt.total) * 100)}%`
    // }
  })
  // 保存下载压缩包
  let fileName = `${repoName}-y-cli`
  fs.writeFileSync(`./${fileName}.zip`, res.data, "binary")
  // 原文件存在是否删除
  delOrigin && delFile(`./${dirName}`)
  // 解压并转移文件
  await compressing.zip.uncompress(`${fileName}.zip`, `${fileName}`);
  let sourcePath = `./${fileName}`
  fs.readdir(`./${fileName}`, function (err, files) {
    sourcePath += `/${files[0]}`
    copyFile(sourcePath, `./${dirName}`)
    // 删除压缩包和解压内容
    delFile(`./${fileName}`)
    fs.unlinkSync(`./${fileName}.zip`)
    spinner.succeed(chalk.green('导入模板完成'))
  })
}