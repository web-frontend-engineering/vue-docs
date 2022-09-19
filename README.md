自动生成.vue组件文档的命令行工具

### 配置 vuedocs.config.js

```
module.exports = {
  include: [
    "components/non-business/basics/c-button.vue",

    "components/non-business/form/c-form.vue",
    "components/non-business/form/c-form-item.vue",
    "components/non-business/form/c-input.vue",
    "components/non-business/form/c-radio.vue",
    "components/non-business/form/c-select.vue",
    "components/non-business/form/c-checkbox.vue",
    "components/non-business/form/c-switch.vue",
  ],
  output: "docs"
}
```

### 使用

```
$ vuedocs
```


### 空组件文档模板

```
### &lt;<!-- name:start --><!-- name:end -->/&gt;

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
<!-- slots:end -->
```