# 自动生成.vue组件文档的命令行工具

### 使用

第一步：安装

```
npm install vuedocs -g
```

第二步：在项目根目录配置`vuedocs.config.js`文件

```
module.exports = {
  // 需要解析文件
  include: [
    "components/non-business/basics/c-button.vue",
  ],
  // 生成文档的目录
  output: "docs"
}
```

第三步：执行命令

```
$ vuedocs
```

#### 参考

https://www.qetool.com/scripts/view/13532.html