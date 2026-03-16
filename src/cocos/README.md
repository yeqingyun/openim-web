# Cocos Creator 2.4.7 环境模拟

这个目录包含了 Cocos Creator 2.4.7 的环境模拟层，用于在非 Cocos Creator 环境中模拟 Cocos Creator 的核心 API。

## 简介

Cocos Creator 环境模拟层提供了一个轻量级的 `cc` 全局对象，包含了 Cocos Creator 2.4.7 的核心 API 和类，让依赖 Cocos Creator 的业务代码可以在普通的 Web 环境中运行，而无需修改业务代码。

## 主要功能

### 核心类

- **`cc.Node`** - 节点类，支持层级结构、变换、组件等
- **`cc.Scene`** - 场景类，继承自 Node
- **`cc.Component`** - 组件基类
- **`cc.Sprite`** - 精灵组件
- **`cc.Label`** - 标签组件
- **`cc.Button`** - 按钮组件
- **`cc.Widget`** - 对齐组件
- **`cc.Layout`** - 布局组件
- **`cc.ScrollView`** - 滚动视图组件
- **`cc.EditBox`** - 输入框组件
- **`cc.RichText`** - 富文本组件
- **`cc.SpriteFrame`** - 精灵帧
- **`cc.Texture2D`** - 纹理
- **`cc.Animation`** - 动画组件
- **`cc.AnimationClip`** - 动画片段
- **`cc.Prefab`** - 预制体
- **`cc.Asset`** - 资源基类

### 数据类

- **`cc.Vec2`** - 二维向量
- **`cc.Size`** - 尺寸
- **`cc.Color`** - 颜色
- **`cc.Rect`** - 矩形

### 核心模块

- **`cc.macro`** - 宏定义和常量
- **`cc.sys`** - 系统信息
- **`cc.loader`** - 资源加载器
- **`cc.audioEngine`** - 音频引擎
- **`cc.view`** - 视口管理
- **`cc.director`** - 导演（场景管理）
- **`cc.scheduler`** - 调度器

### 工具函数

- **`cc.instantiate(node)`** - 实例化节点
- **`cc.find(path)`** - 查找节点
- **`cc.class(prototype)`** - 定义类
- **`cc.clone(obj)`** - 克隆对象

### 存储管理

- **`cc.storage.setItem(key, value)`** - 保存数据
- **`cc.storage.getItem(key)`** - 获取数据
- **`cc.storage.removeItem(key)`** - 删除数据
- **`cc.storage.clear()`** - 清空所有数据

## 使用方式

### 1. 引入模拟层

在 HTML 文件中引入 `cocos-2.4.7-shim.js`：

```html
<!DOCTYPE html>
<html>
<head>
  <title>My App</title>
  <!-- Cocos Creator 环境模拟 -->
  <script src="/src/cocos/cocos-2.4.7-shim.js"></script>
</head>
<body>
  <script>
    // 现在可以使用 cc 全局对象
    const node = new cc.Node();
    node.name = 'MyNode';
    node.setPosition(100, 100);

    // 查找节点
    const foundNode = cc.find('/Canvas/MyNode');

    // 使用组件
    const sprite = new cc.Sprite();
    node.addComponent(sprite);

    // 使用存储
    cc.storage.setItem('key', { value: 123 });
    const data = cc.storage.getItem('key');
  </script>
</body>
</html>
```

### 2. 在模块中使用

由于 `cc` 已经作为全局对象注入，可以在任何模块中直接使用：

```javascript
// my-module.js
export function createNode() {
  const node = new cc.Node();
  node.name = 'Player';
  node.setPosition(cc.winSize.width / 2, cc.winSize.height / 2);
  return node;
}

export function loadScene() {
  const scene = new cc.Scene();
  const canvas = new cc.Node();
  canvas.name = 'Canvas';
  scene.addChild(canvas);
  cc.director.runScene(scene);
}
```

### 3. 创建自定义组件

```javascript
// PlayerController.js
export class PlayerController extends cc.Component {
  onLoad() {
    console.log('PlayerController loaded');
    this.speed = 300;
  }

  update(dt) {
    // 每帧更新逻辑
    const pos = this.node.getPosition();
    this.node.setPosition(pos.x + this.speed * dt, pos.y);
  }
}

// 使用
const player = new cc.Node();
player.name = 'Player';
const controller = new PlayerController();
player.addComponent(controller);
```

## API 差异说明

这是一个轻量级的模拟层，为了在普通 Web 环境中运行，以下功能进行了简化：

### 1. 渲染相关

- 没有实际的 Canvas/WebGL 渲染
- 节点的可见性、变换等属性仅作为数据存储
- 精灵组件不实际绘制图片

### 2. 资源加载

- `cc.loader.load()` 系列方法为简化实现
- 不实际加载图片、音频等资源
- 返回空的资源对象

### 3. 动作系统

- `runAction()` 等方法为简化实现
- 不执行实际的动画效果

### 4. 事件系统

- `cc.eventManager` 为简化实现
- 不实际处理触摸、键盘等输入事件

### 5. 调度器

- `cc.scheduler` 支持基本的定时回调
- 需要手动调用 `scheduler.update(dt)` 来驱动

## 兼容性

- 支持所有现代浏览器
- 不依赖 Cocos Creator 引擎
- 可以与 Vite、Webpack 等构建工具一起使用

## 扩展和自定义

如果需要扩展或修改模拟层的行为，可以编辑 `cocos-2.4.7-shim.js` 文件。

### 添加新的组件

```javascript
// 在 cocos-2.4.7-shim.js 中添加
class MyCustomComponent extends cc.Component {
  constructor() {
    super()
    this._myProperty = 'default'
  }

  get myProperty() { return this._myProperty }
  set myProperty(value) { this._myProperty = value }

  onLoad() {
    console.log('Custom component loaded')
  }

  update(dt) {
    // 自定义更新逻辑
  }
}

// 添加到 cc 对象
cc.MyCustomComponent = MyCustomComponent
```

### 添加新的全局函数

```javascript
// 添加工具函数
cc.utils = {
  formatNumber: (num) => num.toLocaleString(),
  formatDate: (date) => date.toISOString(),
  // ... 更多工具函数
}
```

## 注意事项

1. 这个模拟层仅用于开发和测试目的
2. 对于需要实际渲染的项目，请使用完整的 Cocos Creator 引擎
3. 某些高级功能（如物理引擎、粒子系统等）未在此模拟层中实现
4. 如果业务代码使用了未模拟的 API，可能需要进一步扩展

## 示例代码

查看项目根目录的 `index.html` 和 `src/main.js` 了解如何在实际项目中使用。

## 版本

- Cocos Creator 版本: 2.4.7
- 模拟层版本: 1.0.0

## 许可

MIT License
