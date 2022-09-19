#!/usr/bin/env node

const path = require('path')
const fs = require('fs')
const {parse} = require('@vue/compiler-sfc')
const {parser} = require('./parser')
const {RenderMd} = require("./render")

let defaultMarkDown =
  `### &lt;<!-- name:start --><!-- name:end -->/&gt;

<!-- desc:start -->
<!-- desc:end -->

### Props
<!-- props:start -->
<!-- props:end -->

### Methods
<!-- methods:start -->
<!-- methods:end -->

### Events
<!-- events:start -->
<!-- events:end -->

### Slots
<!-- slots:start -->
<!-- slots:end -->`

let config = {
  include: [],
  exclude: [],
  output: ""
}
let configFilePath = path.resolve("./vuedoc.config.js")

fs.access(configFilePath, function (err) {
  if (err && err.code == "ENOENT") {
    start(config)
    return
  }

  let userConfig = require(configFilePath)
  start(Object.assign(config, userConfig))
})

function start(config) {
  // console.log("config:", config)
  let {include, output} = config

  include.forEach(filePath => {
    let fileName = path.basename(filePath, path.extname(filePath))
    console.log("file -> ", filePath, fileName)

    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        console.error('读取文件失败:', err)
        return
      }

      let info = parser(parse(data))
      // console.log('info:', info)

      fs.readFile(`./docs/${fileName}.md`, 'utf-8', (err, data) => {
        // console.log(err, data)
        let lines = []
        if (err) {
          data = defaultMarkDown
        }

        lines = data.split("\n")
        // console.log("lines:", lines)

        let text = new RenderMd(info, {
          props: {name: '参数', desc: '说明', type: '类型', default: '默认值'},
          methods: {name: '方法名', desc: '说明', params: '参数', res: '返回值'},
          events: {name: '事件名称', desc: '说明'},
          slots: {name: 'name', desc: '说明'}
        }).render(lines)

        fs.writeFile(`./${output}/${fileName}.md`, text, () => {

        })
      })
    })
  })
}