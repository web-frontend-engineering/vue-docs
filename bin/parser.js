const parse = require('@babel/parser').parse
const traverse = require('@babel/traverse').default
const types = require('@babel/types')
const generate = require("@babel/generator")
const compiler = require('vue-template-compiler')

// 遍历模板抽象数
const traverserTemplateAst = (ast, visitor = {}) => {
  function traverseArray(array, parent) {
    array.forEach(child => {
      traverseNode(child, parent)
    })
  }

  function traverseNode(node, parent) {
    visitor.enter && visitor.enter(node, parent)
    visitor[node.tag] && visitor[node.tag](node, parent)
    node.children && traverseArray(node.children, node)
    visitor.exit && visitor.exit(node, parent)
  }

  traverseNode(ast, null)
}

function parser(vueast) {
  // console.log(vueast)
  let {descriptor: {template, script: {content}}, errors} = vueast

  let ast = parse(content, {
    allowImportExportEverywhere: true,
    sourceType: 'module'
  })
  // console.log("jsast:", ast)

  let componentInfo = {
    name: undefined,
    desc: undefined,
    props: undefined,
    methods: undefined,
    events: undefined,
    slots: undefined
  }

  traverse(ast, {
    MemberExpression(path) {
      // 判断是不是event
      if (path.node.property.name === '$emit') {
        let event = extractEvents(path)
        !componentInfo.events && (componentInfo.events = {})
        if (componentInfo.events[event.name]) {
          componentInfo.events[event.name].desc = event.desc ? event.desc : componentInfo.events[event.name].desc
        } else {
          componentInfo.events[event.name] = event
        }
      }
    },
    ExportDefaultDeclaration(path) {
      if (path.node.leadingComments) {
        componentInfo.desc = path.node.leadingComments.map(item => {
          if (item.type === 'CommentLine') {
            return item.value.trim()
          } else {
            return item.value.split('\n').map(item => item.replace(/[\s\*]/g, '')).filter(Boolean)
          }
        }).toString()
      }

      path.node.declaration.properties.forEach(item => {
        switch (item.key.name) {
          case 'props':
            componentInfo.props = extractProps(item) // 提取 props
            break
          case 'methods':
            componentInfo.methods = extractMethods(item)  // 提取 methods
            break
          case 'name':
            componentInfo.name = item.value.value // 获取组件名称
            break
          default:
            break
        }
      })
    }
  })

  var template2 = compiler.compile(template.content, {
    preserveWhitespace: false,
    comments: true
  })

  // 遍历模板抽象数
  traverserTemplateAst(template2.ast, {
    slot(node, parent) {
      !componentInfo.slots && (componentInfo.slots = {})
      let index = parent.children.findIndex(item => item === node)
      let desc = '--', name = 'default'
      if (index > 0) {
        let tag = parent.children[index - 1]
        if (tag.isComment) {
          desc = tag.text.trim()
        }
      }
      if (node.slotName) name = node.attrsMap.name
      componentInfo.slots[name] = {
        name,
        desc
      }
    }
  })

  // console.log(componentInfo)
  return componentInfo
}

// 提取Props
const extractProps = (node) => {
  let props = {}

  // 获取Props类型
  function getPropType(node) {
    if (types.isIdentifier(node)) {
      return node.name
    } else if (types.isArrayExpression(node)) {
      return node.elements.map(item => item.name).join('、')
    } else {
      return 'Any'
    }
  }

  // 获取Props默认值
  function getDefaultVal(node) {
    if (types.isRegExpLiteral(node) || types.isBooleanLiteral(node) || types.isNumericLiteral(node) || types.isStringLiteral(node)) {
      return node.value
    } else if (types.isFunctionExpression(node) || types.isArrowFunctionExpression(node) || types.isObjectMethod(node)) {
      try {
        let code = generate.default(types.isObjectMethod(node) ? node.body : node).code
        let fun = eval(`0,${types.isObjectMethod(node) ? 'function ()' : ''} ${code}`)
        return JSON.stringify(fun())
      } catch (error) {
      }
    }
  }

  // 遍历 Props
  node.value.properties && node.value.properties.forEach(prop => {
    // console.log(prop)
    let {key: {name}, leadingComments, value} = prop
    props[name] = {name}

    if (leadingComments) {
      props[name].desc = leadingComments.map(item => {
        if (item.type === 'CommentLine') {
          return item.value.trim()
        } else {
          return item.value.split('\n').map(item => item.replace(/[\s\*]/g, '')).filter(Boolean)
        }
      }).toString()
    }

    // 如果是标识或数组 说明只声明了类型
    if (types.isIdentifier(value) || types.isArrayExpression(value)) {
      props[name].type = getPropType(value)
    } else if (types.isObjectExpression(value)) {
      value.properties.map(item => {
        let node = item
        if (types.isObjectProperty(item)) node = item.value
        if (item.key.name === 'type') {
          props[name].type = getPropType(item.value)
        } else if (item.key.name === 'default') {
          props[name][item.key.name] = getDefaultVal(node)
        } else if (item.key.name === 'validator') {
          //  props[name][item.key.name] = getValidator(node)
        } else if (item.key.name === 'required') {
          props[name][item.key.name] = item.value.value
        }
      })
    }
  })
  return props
}

// 提取Methods
const extractMethods = (node) => {
  let methods = {}
  node.value.properties.forEach(item => {
    if (types.isObjectMethod(item) && /^[^_]/.test(item.key.name)) {
      methods[item.key.name] = {
        name: item.key.name,
        async: item.async
      }
    } else if (types.isObjectProperty(item) && types.isFunctionExpression(item.value)) {
      methods[item.key.name] = {
        name: item.key.name,
        async: item.value.async
      }
    } else {
      return
    }
    if (item.leadingComments) {
      let comment = item.leadingComments[item.leadingComments.length - 1]
      if (comment.type === 'CommentLine') {
        methods[item.key.name].desc = comment.value.trim()
      } else {
        // 提取方法返回值
        let res = comment.value.match(/(@returns)[\s]*(.*)/)
        if (res) {
          methods[item.key.name].res = res[2]
        }
        // 提取方法说明
        let desc = comment.value.match(/\*\s*[^@]\s*(.*)/)
        if (desc) {
          methods[item.key.name].desc = desc[1]
        }
        // console.log("comment.value:", comment.value)
        // 提取参数说明
        let matches = [...comment.value.matchAll(/(@param)[\s]*{([a-zA-Z]*)}[\s]*(\w*)(.*)/g)]
        // console.log("matches:", matches)
        for (const matche of matches) {
          // console.log("matche:", matche)
          !methods[item.key.name].params && (methods[item.key.name].params = [])
          methods[item.key.name].params.push({
            name: matche[3],
            type: matche[2],
            desc: matche[4].trim()
          })
        }
      }
    }
  })
  return methods
}

// 提取Events
const extractEvents = (path) => {
  // 第一个元素是事件名称
  const eventName = path.parent.arguments[0]
  let comments = path.parentPath.parent.leadingComments

  return {
    name: eventName.value,
    desc: comments
      ? comments.map(item => {
        if (item.type === 'CommentLine') {
          return item.value.trim()
        } else {
          return item.value.split('\n').map(item => item.replace(/[\s\*]/g, '')).filter(Boolean)
        }
      }).toString()
      : '--'
  }
}

module.exports = {
  parser,
}