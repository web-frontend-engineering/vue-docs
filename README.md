# 自动生成.vue组件文档的命令行工具

### 使用

第一步：安装

```
npm install @zengbin/vuedocs -g
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

S：程序员最讨厌的事情之二，第一是写文档，第二就是别人没有写文档。有没有直接根据vue组件生成文档的呢？

T：借助Node环境编写一个命令行工具，应用于有自动生成.vue文档需求的场景，实现写代码即写文档。

A：实现：分析代码 -> 提取信息 -> 写入.md文件 -> 读取.md文件解析生成文档。

R：
  
  * 结果：从前端工程化方案来说，通过工具自动生成文档，解决了不想写文档，没有文档让人讨厌的事情。
  * 数据：从提升研发效率来说，自动生成文档肯定是比手动写文档更快。
  * 技术：从可维护性的角度来说，研发更愿意主动在源码中写好注释，代码即文档，更有利于项目的维护。
  * 成长：从成长方面来说，掌握.vue文件自动生成文档，即掌握c/c++,java,javascript,actionscript等编程语言生成API文档的原理。

#### 参考

https://www.qetool.com/scripts/view/13532.html
