/**
 * Cocos Creator 2.4.7 环境模拟层
 * 用于在非 Cocos Creator 环境中模拟 Cocos Creator 的核心 API
 * 让业务代码可以在普通 Web 环境中运行
 */

(function(global) {
  'use strict'

  // Cocos Creator 版本
  const ENGINE_VERSION = '2.4.7'

  // 宏定义
  const macro = {
    // 设备相关
    ORIENTATION_PORTRAIT: 1,
    ORIENTATION_LANDSCAPE_LEFT: 2,
    ORIENTATION_LANDSCAPE_RIGHT: 3,

    // 像素格式
    PIXEL_FORMAT_RGBA8888: 0,
    PIXEL_FORMAT_RGB888: 1,
    PIXEL_FORMAT_RGB565: 2,
    PIXEL_FORMAT_A8: 3,
    PIXEL_FORMAT_I8: 4,
    PIXEL_FORMAT_AI88: 5,
    PIXEL_FORMAT_RGBA4444: 6,
    PIXEL_FORMAT_RGB5A1: 7,
    PIXEL_FORMAT_PVRTC4: 8,
    PIXEL_FORMAT_PVRTC2: 9,
    PIXEL_FORMAT_ETC1: 10,
    PIXEL_FORMAT_S3TC_DXT1: 11,
    PIXEL_FORMAT_S3TC_DXT3: 12,
    PIXEL_FORMAT_S3TC_DXT5: 13,
    PIXEL_FORMAT_ATC_RGB4: 14,
    PIXEL_FORMAT_ATC_RGBA8: 15,
    PIXEL_FORMAT_ATC_RGBA4: 16,
    PIXEL_FORMAT_RGBA16F: 17,
    PIXEL_FORMAT_RGB16F: 18,
    PIXEL_FORMAT_RGBA32F: 19,
    PIXEL_FORMAT_RGB32F: 20,

    // 节点标签
    TAG_INVALID: -1,

    // 渲染类型
    RENDER_TYPE_WEBGL: 0,
    RENDER_TYPE_CANVAS: 1,

    // 文本类型
    TEXT_TYPE_LEFT: 0,
    TEXT_TYPE_RIGHT: 1,
    TEXT_TYPE_CENTER: 2,

    // 事件相关
    TOUCH_BEZIER: 1,
    TOUCH_TIMEOUT: 2,
    MAX_TOUCHES: 5,

    // 引擎配置
    ENABLE_TRANSPARENT_CANVAS: false,
    ENABLE_WEBGL_ANTIALIAS: true,
    ENABLE_WEBGL_DEPTH_TEST: true,
    ENABLE_WEBGL_STENCIL_TEST: true,

    // 加速
    ENABLE_TILEMAP_COLLISION_DETECTION: true,

    // 音效
    ENABLE_AUDIO_STEREO: true,

    // UI
    ENABLE_RETINA: true,

    // 版本
    ENGINE_VERSION: ENGINE_VERSION,
    SUPPORT_TEXTURE_FORMATS: ['png', 'jpg', 'jpeg', 'webp', 'pvr', 'pkm', 'etc', 's3tc'],
  }

  // 系统信息
  const sys = {
    platform: null,
    browserType: null,
    browserVersion: null,
    language: 'zh-CN',
    os: 'Unknown OS',
    osVersion: '0.0.0',
    networkType: 'wifi',

    // 容器
    container: null,

    // 配置
    config: {},

    // 平台检测
    isNative: false,
    isMobile: false,
    isBrowser: true,

    // 能力检测
    supportsWebAudio: !!(window.AudioContext || window.webkitAudioContext),
    supportsWebGL: (function() {
      try {
        const canvas = document.createElement('canvas')
        return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      } catch (e) {
        return false
      }
    })(),
    supportsWebSocket: typeof WebSocket !== 'undefined',

    // 屏幕信息
    windowPixelResolution: {
      width: window.innerWidth,
      height: window.innerHeight
    },
    devicePixelRatio: window.devicePixelRatio || 1,

    // 本地存储
    localStorage: (function() {
      try {
        return window.localStorage
      } catch (e) {
        return null
      }
    })(),

    // 平台检测
    _checkPlatform: function() {
      const ua = navigator.userAgent

      if (/Android/i.test(ua)) {
        this.platform = sys.ANDROID
        this.isMobile = true
        this.os = 'Android'
      } else if (/iPhone|iPad|iPod/i.test(ua)) {
        this.platform = sys.IOS
        this.isMobile = true
        this.os = 'iOS'
      } else if (/Windows/i.test(ua)) {
        this.platform = sys.WINDOWS
        this.os = 'Windows'
      } else if (/Mac/i.test(ua)) {
        this.platform = sys.MACOS
        this.os = 'OS X'
      } else if (/Linux/i.test(ua)) {
        this.platform = sys.LINUX
        this.os = 'Linux'
      } else {
        this.platform = sys.UNKNOWN_PLATFORM
        this.os = 'Unknown OS'
      }

      // 浏览器检测
      if (/Chrome/i.test(ua) && !/Edge|OPR/i.test(ua)) {
        this.browserType = sys.BROWSER_TYPE_CHROME
        this.browserVersion = ua.match(/Chrome\/(\d+\.\d+\.\d+\.\d+)/)?.[1] || '0.0.0'
      } else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) {
        this.browserType = sys.BROWSER_TYPE_SAFARI
        this.browserVersion = ua.match(/Version\/(\d+\.\d+)/)?.[1] || '0.0'
      } else if (/Firefox/i.test(ua)) {
        this.browserType = sys.BROWSER_TYPE_FIREFOX
        this.browserVersion = ua.match(/Firefox\/(\d+\.\d+)/)?.[1] || '0.0'
      } else if (/Edge/i.test(ua)) {
        this.browserType = sys.BROWSER_TYPE_EDGE
        this.browserVersion = ua.match(/Edge\/(\d+\.\d+\.\d+\.\d+)/)?.[1] || '0.0.0'
      } else if (/MSIE|Trident/i.test(ua)) {
        this.browserType = sys.BROWSER_TYPE_IE
        this.browserVersion = ua.match(/(?:MSIE |rv:)(\d+\.\d+)/)?.[1] || '0.0'
      } else {
        this.browserType = sys.BROWSER_TYPE_WECHAT
      }
    },

    // 垃圾回收（Web 环境不需要）
    garbageCollect: function() {
      // Web 环境中不需要手动垃圾回收
    },

    // 重启 VM（Web 环境不支持）
    restartVM: function() {
      console.warn('sys.restartVM is not supported in web environment')
    },

    // 获取平台
    getPlatform: function() {
      return this.platform
    },

    // 初始化
    init: function() {
      this._checkPlatform()
    }
  }

  // 平台常量
  sys.WINDOWS = 0
  sys.MACOS = 1
  sys.LINUX = 2
  sys.ANDROID = 3
  sys.IOS = 4
  sys.UNKNOWN_PLATFORM = 5

  sys.BROWSER_TYPE_WECHAT = 'wechat'
  sys.BROWSER_TYPE_ANDROID = 'androidbrowser'
  sys.BROWSER_TYPE_IE = 'ie'
  sys.BROWSER_TYPE_QQ = 'qq'
  sys.BROWSER_TYPE_MOBILE_QQ = 'mqqbrowser'
  sys.BROWSER_TYPE_UC = 'ucbrowser'
  sys.BROWSER_TYPE_360 = '360browser'
  sys.BROWSER_TYPE_BAIDU_APP = 'baiduboxapp'
  sys.BROWSER_TYPE_BAIDU = 'baidubrowser'
  sys.BROWSER_TYPE_SOGOU = 'sogou'
  sys.BROWSER_TYPE_LIEBAO = 'liebao'
  sys.BROWSER_TYPE_MIUI = 'miuibrowser'
  sys.BROWSER_TYPE_HUAWEI = 'huaweibrowser'
  sys.BROWSER_TYPE_UC_SPECIAL = 'ucbs'
  sys.BROWSER_TYPE_DINGTALK = 'dingtalk'
  sys.BROWSER_TYPE_BUTIE = 'butie'
  sys.BROWSER_TYPE_ALIPAY = 'alipay'
  sys.BROWSER_TYPE_APPLE = 'safari'
  sys.BROWSER_TYPE_QQ_BROWSER_LITE = 'qqbrowserlite'

  // Vec2 向量类
  class Vec2 {
    constructor(x = 0, y = 0) {
      this.x = x
      this.y = y
    }

    clone() {
      return new Vec2(this.x, this.y)
    }

    equals(other) {
      return this.x === other.x && this.y === other.y
    }

    toString() {
      return `(${this.x}, ${this.y})`
    }

    add(v) {
      return new Vec2(this.x + v.x, this.y + v.y)
    }

    sub(v) {
      return new Vec2(this.x - v.x, this.y - v.y)
    }

    mult(scalar) {
      return new Vec2(this.x * scalar, this.y * scalar)
    }

    mag() {
      return Math.sqrt(this.x * this.x + this.y * this.y)
    }

    normalize() {
      const m = this.mag()
      if (m > 0) {
        return new Vec2(this.x / m, this.y / m)
      }
      return new Vec2(0, 0)
    }

    static ZERO = new Vec2(0, 0)
    static ONE = new Vec2(1, 1)
    static UNIT_X = new Vec2(1, 0)
    static UNIT_Y = new Vec2(0, 1)
  }

  // Size 尺寸类
  class Size {
    constructor(width = 0, height = 0) {
      this.width = width
      this.height = height
    }

    clone() {
      return new Size(this.width, this.height)
    }

    equals(other) {
      return this.width === other.width && this.height === other.height
    }

    static ZERO = new Size(0, 0)
    static ONE = new Size(1, 1)
  }

  // Color 颜色类
  class Color {
    constructor(r = 255, g = 255, b = 255, a = 255) {
      this.r = r
      this.g = g
      this.b = b
      this.a = a
    }

    clone() {
      return new Color(this.r, this.g, this.b, this.a)
    }

    equals(other) {
      return this.r === other.r && this.g === other.g &&
             this.b === other.b && this.a === other.a
    }

    toCSS() {
      return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a / 255})`
    }

    static WHITE = new Color(255, 255, 255, 255)
    static BLACK = new Color(0, 0, 0, 255)
    static TRANSPARENT = new Color(0, 0, 0, 0)
    static GRAY = new Color(127, 127, 127, 255)
    static RED = new Color(255, 0, 0, 255)
    static GREEN = new Color(0, 255, 0, 255)
    static BLUE = new Color(0, 0, 255, 255)
  }

  // Rect 矩形类
  class Rect {
    constructor(x = 0, y = 0, width = 0, height = 0) {
      this.x = x
      this.y = y
      this.width = width
      this.height = height
    }

    clone() {
      return new Rect(this.x, this.y, this.width, this.height)
    }

    equals(other) {
      return this.x === other.x && this.y === other.y &&
             this.width === other.width && this.height === other.height
    }

    contains(point) {
      return point.x >= this.x && point.x <= this.x + this.width &&
             point.y >= this.y && point.y <= this.y + this.height
    }

    static ZERO = new Rect(0, 0, 0, 0)
  }

  // 节点类
  class Node {
    constructor() {
      this._name = ''
      this._children = []
      this._parent = null
      this._position = new Vec2(0, 0)
      this._scaleX = 1
      this._scaleY = 1
      this._rotationX = 0
      this._rotationY = 0
      this._skewX = 0
      this._skewY = 0
      this._anchorX = 0.5
      this._anchorY = 0.5
      this._contentSize = new Size(0, 0)
      this._visible = true
      this._localZOrder = 0
      this._globalZOrder = 0
      this._tag = macro.TAG_INVALID
      this._userData = null
      this._userObject = null
      this._running = false
      this._active = true
      this._opacity = 255
      this._cascadeOpacity = false
      this._color = new Color(255, 255, 255, 255)
      this._cascadeColor = false
      this._components = []
    }

    // 属性访问器
    get name() { return this._name }
    set name(value) { this._name = value }

    get children() { return this._children }
    get parent() { return this._parent }

    get x() { return this._position.x }
    set x(value) { this._position.x = value }
    get y() { return this._position.y }
    set y(value) { this._position.y = value }

    get position() { return this._position }
    set position(value) {
      this._position.x = value.x
      this._position.y = value.y
    }

    get scaleX() { return this._scaleX }
    set scaleX(value) { this._scaleX = value }
    get scaleY() { return this._scaleY }
    set scaleY(value) { this._scaleY = value }

    get rotation() { return this._rotationX }
    set rotation(value) {
      this._rotationX = value
      this._rotationY = value
    }
    get rotationX() { return this._rotationX }
    set rotationX(value) { this._rotationX = value }
    get rotationY() { return this._rotationY }
    set rotationY(value) { this._rotationY = value }

    get skewX() { return this._skewX }
    set skewX(value) { this._skewX = value }
    get skewY() { return this._skewY }
    set skewY(value) { this._skewY = value }

    get anchorX() { return this._anchorX }
    set anchorX(value) { this._anchorX = value }
    get anchorY() { return this._anchorY }
    set anchorY(value) { this._anchorY = value }

    get width() { return this._contentSize.width }
    set width(value) { this._contentSize.width = value }
    get height() { return this._contentSize.height }
    set height(value) { this._contentSize.height = value }
    get contentSize() { return this._contentSize }
    set contentSize(value) {
      this._contentSize.width = value.width
      this._contentSize.height = value.height
    }

    get visible() { return this._visible }
    set visible(value) { this._visible = value }

    get localZOrder() { return this._localZOrder }
    set localZOrder(value) { this._localZOrder = value }
    get globalZOrder() { return this._globalZOrder }
    set globalZOrder(value) { this._globalZOrder = value }

    get zIndex() { return this._localZOrder }
    set zIndex(value) { this._localZOrder = value }

    get tag() { return this._tag }
    set tag(value) { this._tag = value }

    get userData() { return this._userData }
    set userData(value) { this._userData = value }

    get userObject() { return this._userObject }
    set userObject(value) { this._userObject = value }

    get running() { return this._running }
    get active() { return this._active }
    set active(value) { this._active = value }

    get opacity() { return this._opacity }
    set opacity(value) { this._opacity = value }

    get cascadeOpacity() { return this._cascadeOpacity }
    set cascadeOpacity(value) { this._cascadeOpacity = value }

    get color() { return this._color }
    set color(value) {
      this._color.r = value.r
      this._color.g = value.g
      this._color.b = value.b
      this._color.a = value.a
    }

    get cascadeColor() { return this._cascadeColor }
    set cascadeColor(value) { this._cascadeColor = value }

    // 方法
    addChild(child, localZOrder = null, tag = null) {
      if (child._parent) {
        child._parent.removeChild(child)
      }
      child._parent = this
      this._children.push(child)
      if (localZOrder !== null) {
        child.localZOrder = localZOrder
      }
      if (tag !== null) {
        child.tag = tag
      }
      if (this._running) {
        child.onEnter()
      }
    }

    getChildByTag(tag) {
      return this._children.find(child => child.tag === tag)
    }

    getChildByName(name) {
      return this._children.find(child => child.name === name)
    }

    getChildByUUID(uuid) {
      // 简化实现，不支持 UUID
      return null
    }

    getChildren() {
      return this._children
    }

    getChildByUuid(uuid) {
      return this.getChildByUUID(uuid)
    }

    removeFromParent(cleanup = true) {
      if (this._parent) {
        this._parent.removeChild(this, cleanup)
      }
    }

    removeChild(child, cleanup = true) {
      const index = this._children.indexOf(child)
      if (index !== -1) {
        this._children.splice(index, 1)
        child._parent = null
        if (cleanup && this._running) {
          child.onExit()
        }
      }
    }

    removeAllChildren(cleanup = true) {
      this._children.forEach(child => {
        child._parent = null
        if (cleanup && this._running) {
          child.onExit()
        }
      })
      this._children = []
    }

    removeAllChildrenWithCleanup(cleanup) {
      this.removeAllChildren(cleanup)
    }

    sortAllChildren() {
      this._children.sort((a, b) => a.localZOrder - b.localZOrder)
    }

    reorderChild(child, localZOrder) {
      child.localZOrder = localZOrder
      this.sortAllChildren()
    }

    setLocalZOrder(localZOrder) {
      this._localZOrder = localZOrder
      if (this._parent) {
        this._parent.sortAllChildren()
      }
    }

    setGlobalZOrder(globalZOrder) {
      this._globalZOrder = globalZOrder
    }

    getRotation() {
      return this._rotationX
    }

    setRotation(rotation) {
      this._rotationX = rotation
      this._rotationY = rotation
    }

    getPosition() {
      return this._position.clone()
    }

    setPosition(x, y) {
      if (typeof x === 'object') {
        this._position.x = x.x
        this._position.y = x.y
      } else {
        this._position.x = x
        this._position.y = y
      }
    }

    getScaleX() {
      return this._scaleX
    }

    setScaleX(scaleX) {
      this._scaleX = scaleX
    }

    getScaleY() {
      return this._scaleY
    }

    setScaleY(scaleY) {
      this._scaleY = scaleY
    }

    setScale(scaleX, scaleY = scaleX) {
      this._scaleX = scaleX
      this._scaleY = scaleY
    }

    getScale() {
      return this._scaleX
    }

    getAnchorPoint() {
      return new Vec2(this._anchorX, this._anchorY)
    }

    setAnchorPoint(x, y) {
      if (typeof x === 'object') {
        this._anchorX = x.x
        this._anchorY = x.y
      } else {
        this._anchorX = x
        this._anchorY = y
      }
    }

    getContentSize() {
      return this._contentSize.clone()
    }

    setContentSize(width, height) {
      if (typeof width === 'object') {
        this._contentSize.width = width.width
        this._contentSize.height = width.height
      } else {
        this._contentSize.width = width
        this._contentSize.height = height
      }
    }

    isVisible() {
      return this._visible
    }

    setVisible(visible) {
      this._visible = visible
    }

    runAction(action) {
      // 简化实现
      return action
    }

    stopAllActions() {
      // 简化实现
    }

    stopAction(action) {
      // 简化实现
    }

    stopActionByTag(tag) {
      // 简化实现
    }

    getActionByTag(tag) {
      // 简化实现
      return null
    }

    getNumberOfRunningActions() {
      return 0
    }

    onEnter() {
      this._running = true
    }

    onExit() {
      this._running = false
    }

    onEnterTransitionDidFinish() {
      // 简化实现
    }

    onExitTransitionDidStart() {
      // 简化实现
    }

    cleanup() {
      // 简化实现
    }

    getComponent(className) {
      return this._components.find(c => c.constructor.name === className)
    }

    addComponent(component) {
      this._components.push(component)
      component.node = this
      return component
    }

    removeComponent(component) {
      const index = this._components.indexOf(component)
      if (index !== -1) {
        this._components.splice(index, 1)
        component.node = null
      }
    }

    removeAllComponents() {
      this._components.forEach(c => c.node = null)
      this._components = []
    }

    convertToWorldSpace(point) {
      let worldPos = point.clone()
      let current = this
      while (current) {
        worldPos = worldPos.add(current._position)
        current = current._parent
      }
      return worldPos
    }

    convertToNodeSpace(point) {
      let nodePos = point.clone()
      let current = this
      while (current) {
        nodePos = nodePos.sub(current._position)
        current = current._parent
      }
      return nodePos
    }

    convertToWorldSpaceAR(point) {
      // 简化实现
      return this.convertToWorldSpace(point)
    }

    convertToNodeSpaceAR(point) {
      // 简化实现
      return this.convertToNodeSpace(point)
    }
  }

  // Scene 场景类
  class Scene extends Node {
    constructor() {
      super()
      this._name = 'Scene'
      this._activeInHierarchy = true
      this._autoReleaseAssets = false
    }

    get activeInHierarchy() { return this._activeInHierarchy }

    get autoReleaseAssets() { return this._autoReleaseAssets }
    set autoReleaseAssets(value) { this._autoReleaseAssets = value }

    loadScene() {
      // 简化实现
    }
  }

  // Component 组件类
  class Component {
    constructor() {
      this.node = null
      this._enabled = true
    }

    get name() {
      return this.constructor.name
    }

    get enabled() { return this._enabled }
    set enabled(value) { this._enabled = value }

    update(dt) {
      // 子类重写
    }

    lateUpdate(dt) {
      // 子类重写
    }

    onLoad() {
      // 子类重写
    }

    start() {
      // 子类重写
    }

    onEnable() {
      // 子类重写
    }

    onDisable() {
      // 子类重写
    }

    onDestroy() {
      // 子类重写
    }
  }

  // Sprite 精灵组件
  class Sprite extends Component {
    constructor() {
      super()
      this._spriteFrame = null
      this._type = 0
      this._fillType = 0
      this._fillCenter = new Vec2(0.5, 0.5)
      this._fillStart = 0
      this._fillRange = 0
      this._trim = false
      this._sizeMode = 1
    }

    static Type = {
      SIMPLE: 0,
      SLICED: 1,
      TILED: 2,
      FILLED: 3
    }

    static FillType = {
      HORIZONTAL: 0,
      VERTICAL: 1,
      RADIAL: 2
    }

    static SizeMode = {
      TRIMMED: 0,
      RAW: 1,
      CUSTOM: 2
    }

    get spriteFrame() { return this._spriteFrame }
    set spriteFrame(value) { this._spriteFrame = value }

    get type() { return this._type }
    set type(value) { this._type = value }

    get fillType() { return this._fillType }
    set fillType(value) { this._fillType = value }

    get fillCenter() { return this._fillCenter }
    set fillCenter(value) {
      this._fillCenter.x = value.x
      this._fillCenter.y = value.y
    }

    get fillStart() { return this._fillStart }
    set fillStart(value) { this._fillStart = value }

    get fillRange() { return this._fillRange }
    set fillRange(value) { this._fillRange = value }

    get trim() { return this._trim }
    set trim(value) { this._trim = value }

    get sizeMode() { return this._sizeMode }
    set sizeMode(value) { this._sizeMode = value }
  }

  // Label 标签组件
  class Label extends Component {
    constructor() {
      super()
      this._string = ''
      this._fontSize = 40
      this._fontFamily = 'Arial'
      this._lineHeight = 40
      this._overflow = 0
      this._enableWrapText = true
      this._font = null
      this._horizontalAlign = 1
      this._verticalAlign = 1
      this._actualFontSize = 40
      this._spacingX = 0
      this._cacheMode = 0
    }

    static Overflow = {
      NONE: 0,
      CLAMP: 1,
      SHRINK: 2,
      RESIZE_HEIGHT: 3
    }

    static HorizontalAlign = {
      LEFT: 0,
      CENTER: 1,
      RIGHT: 2
    }

    static VerticalAlign = {
      TOP: 0,
      CENTER: 1,
      BOTTOM: 2
    }

    static CacheMode = {
      NONE: 0,
      BITMAP: 1,
      CHAR: 2
    }

    get string() { return this._string }
    set string(value) { this._string = String(value) }

    get fontSize() { return this._fontSize }
    set fontSize(value) { this._fontSize = value }

    get fontFamily() { return this._fontFamily }
    set fontFamily(value) { this._fontFamily = value }

    get lineHeight() { return this._lineHeight }
    set lineHeight(value) { this._lineHeight = value }

    get overflow() { return this._overflow }
    set overflow(value) { this._overflow = value }

    get enableWrapText() { return this._enableWrapText }
    set enableWrapText(value) { this._enableWrapText = value }

    get font() { return this._font }
    set font(value) { this._font = value }

    get horizontalAlign() { return this._horizontalAlign }
    set horizontalAlign(value) { this._horizontalAlign = value }

    get verticalAlign() { return this._verticalAlign }
    set verticalAlign(value) { this._verticalAlign = value }

    get actualFontSize() { return this._actualFontSize }
    set actualFontSize(value) { this._actualFontSize = value }

    get spacingX() { return this._spacingX }
    set spacingX(value) { this._spacingX = value }

    get cacheMode() { return this._cacheMode }
    set cacheMode(value) { this._cacheMode = value }
  }

  // Button 按钮组件
  class Button extends Component {
    constructor() {
      super()
      this._normalSprite = null
      this._pressedSprite = null
      this._hoverSprite = null
      this._disabledSprite = null
      this._clickEvents = []
      this._interactable = true
      this._transition = 2
      this._normalColor = new Color(255, 255, 255, 255)
      this._pressedColor = new Color(200, 200, 200, 255)
      this._hoverColor = new Color(255, 255, 255, 255)
      this._disabledColor = new Color(120, 120, 120, 255)
      this._duration = 0.1
      this._zoomScale = 1.2
      this._target = null
    }

    static Transition = {
      NONE: 0,
      COLOR: 1,
      SPRITE: 2,
      SCALE: 3
    }

    static EventType = {
      CLICK: 'click',
      TOUCH_END: 'touchend'
    }

    get normalSprite() { return this._normalSprite }
    set normalSprite(value) { this._normalSprite = value }

    get pressedSprite() { return this._pressedSprite }
    set pressedSprite(value) { this._pressedSprite = value }

    get hoverSprite() { return this._hoverSprite }
    set hoverSprite(value) { this._hoverSprite = value }

    get disabledSprite() { return this._disabledSprite }
    set disabledSprite(value) { this._disabledSprite = value }

    get clickEvents() { return this._clickEvents }

    get interactable() { return this._interactable }
    set interactable(value) { this._interactable = value }

    get transition() { return this._transition }
    set transition(value) { this._transition = value }

    get normalColor() { return this._normalColor }
    set normalColor(value) { this._normalColor = value }

    get pressedColor() { return this._pressedColor }
    set pressedColor(value) { this._pressedColor = value }

    get hoverColor() { return this._hoverColor }
    set hoverColor(value) { this._hoverColor = value }

    get disabledColor() { return this._disabledColor }
    set disabledColor(value) { this._disabledColor = value }

    get duration() { return this._duration }
    set duration(value) { this._duration = value }

    get zoomScale() { return this._zoomScale }
    set zoomScale(value) { this._zoomScale = value }

    get target() { return this._target }
    set target(value) { this._target = value }
  }

  // Widget 对齐组件
  class Widget extends Component {
    constructor() {
      super()
      this._isAlignTop = false
      this._isAlignBottom = false
      this._isAlignLeft = false
      this._isAlignRight = false
      this._isAbsHorizontalCenter = false
      this._isAbsVerticalCenter = false
      this._top = 0
      this._bottom = 0
      this._left = 0
      this._right = 0
      this._horizontalCenter = 0
      this._verticalCenter = 0
      this._isAbsLeft = false
      this._isAbsRight = false
      this._isAbsTop = false
      this._isAbsBottom = false
      this._isAbsHorizontalCenter = false
      this._isAbsVerticalCenter = false
      this._target = null
      this._alignMode = 0
    }

    static AlignMode = {
      TOP_LEFT: 0,
      TOP_CENTER: 1,
      TOP_RIGHT: 2,
      LEFT_TOP: 3,
      LEFT_CENTER: 4,
      LEFT_BOTTOM: 5,
      BOTTOM_LEFT: 6,
      BOTTOM_CENTER: 7,
      BOTTOM_RIGHT: 8,
      CENTER_TOP: 9,
      CENTER: 10,
      CENTER_BOTTOM: 11,
      RIGHT_TOP: 12,
      RIGHT_CENTER: 13,
      RIGHT_BOTTOM: 14
    }

    get isAlignTop() { return this._isAlignTop }
    set isAlignTop(value) { this._isAlignTop = value }

    get isAlignBottom() { return this._isAlignBottom }
    set isAlignBottom(value) { this._isAlignBottom = value }

    get isAlignLeft() { return this._isAlignLeft }
    set isAlignLeft(value) { this._isAlignLeft = value }

    get isAlignRight() { return this._isAlignRight }
    set isAlignRight(value) { this._isAlignRight = value }

    get isAbsHorizontalCenter() { return this._isAbsHorizontalCenter }
    set isAbsHorizontalCenter(value) { this._isAbsHorizontalCenter = value }

    get isAbsVerticalCenter() { return this._isAbsVerticalCenter }
    set isAbsVerticalCenter(value) { this._isAbsVerticalCenter = value }

    get top() { return this._top }
    set top(value) { this._top = value }

    get bottom() { return this._bottom }
    set bottom(value) { this._bottom = value }

    get left() { return this._left }
    set left(value) { this._left = value }

    get right() { return this._right }
    set right(value) { this._right = value }

    get horizontalCenter() { return this._horizontalCenter }
    set horizontalCenter(value) { this._horizontalCenter = value }

    get verticalCenter() { return this._verticalCenter }
    set verticalCenter(value) { this._verticalCenter = value }

    get target() { return this._target }
    set target(value) { this._target = value }

    get alignMode() { return this._alignMode }
    set alignMode(value) { this._alignMode = value }

    updateAlignment() {
      // 简化实现
    }
  }

  // Layout 布局组件
  class Layout extends Component {
    constructor() {
      super()
      this._resize = 0
      this._layoutType = 0
      this._cellSize = new Size(40, 40)
      this._startAxis = 0
      this._paddingLeft = 0
      this._paddingRight = 0
      this._paddingTop = 0
      this._paddingBottom = 0
      this._spacingX = 0
      this._spacingY = 0
      this._verticalDirection = 0
      this._horizontalDirection = 0
      this._alignmentX = 0
      this._alignmentY = 0
    }

    static Type = {
      NONE: 0,
      HORIZONTAL: 1,
      VERTICAL: 2,
      GRID: 3
    }

    static ResizeMode = {
      NONE: 0,
      CONTAINER: 1,
      CHILDREN: 2
    }

    static HorizontalDirection = {
      LEFT_TO_RIGHT: 0,
      RIGHT_TO_LEFT: 1
    }

    static VerticalDirection = {
      TOP_TO_BOTTOM: 0,
      BOTTOM_TO_TOP: 1
    }

    static AxisDirection = {
      HORIZONTAL: 0,
      VERTICAL: 1
    }

    static Alignment = {
      TOP_LEFT: 0,
      TOP_CENTER: 1,
      TOP_RIGHT: 2,
      LEFT_TOP: 3,
      LEFT_CENTER: 4,
      LEFT_BOTTOM: 5,
      BOTTOM_LEFT: 6,
      BOTTOM_CENTER: 7,
      BOTTOM_RIGHT: 8,
      CENTER_TOP: 9,
      CENTER: 10,
      CENTER_BOTTOM: 11,
      RIGHT_TOP: 12,
      RIGHT_CENTER: 13,
      RIGHT_BOTTOM: 14
    }

    get resize() { return this._resize }
    set resize(value) { this._resize = value }

    get layoutType() { return this._layoutType }
    set layoutType(value) { this._layoutType = value }

    get cellSize() { return this._cellSize }
    set cellSize(value) {
      this._cellSize.width = value.width
      this._cellSize.height = value.height
    }

    get startAxis() { return this._startAxis }
    set startAxis(value) { this._startAxis = value }

    get paddingLeft() { return this._paddingLeft }
    set paddingLeft(value) { this._paddingLeft = value }

    get paddingRight() { return this._paddingRight }
    set paddingRight(value) { this._paddingRight = value }

    get paddingTop() { return this._paddingTop }
    set paddingTop(value) { this._paddingTop = value }

    get paddingBottom() { return this._paddingBottom }
    set paddingBottom(value) { this._paddingBottom = value }

    get spacingX() { return this._spacingX }
    set spacingX(value) { this._spacingX = value }

    get spacingY() { return this._spacingY }
    set spacingY(value) { this._spacingY = value }

    get verticalDirection() { return this._verticalDirection }
    set verticalDirection(value) { this._verticalDirection = value }

    get horizontalDirection() { return this._horizontalDirection }
    set horizontalDirection(value) { this._horizontalDirection = value }

    get alignmentX() { return this._alignmentX }
    set alignmentX(value) { this._alignmentX = value }

    get alignmentY() { return this._alignmentY }
    set alignmentY(value) { this._alignmentY = value }

    updateLayout() {
      // 简化实现
    }
  }

  // ScrollView 滚动视图组件
  class ScrollView extends Component {
    constructor() {
      super()
      this._content = null
      this._horizontal = true
      this._vertical = true
      this._inertia = true
      this._brake = 0.15
      this._elastic = true
      this._bounceDuration = 0.5
      this._scrollEvents = []
      this._cancelInnerEvents = true
      this._autoScrolling = false
    }

    static EventType = {
      SCROLL_TO_TOP: 'scroll-to-top',
      SCROLL_TO_BOTTOM: 'scroll-to-bottom',
      SCROLL_TO_LEFT: 'scroll-to-left',
      SCROLL_TO_RIGHT: 'scroll-to-right',
      SCROLLING: 'scrolling',
      SCROLL_ENDED: 'scroll-ended',
      TOUCH_UP: 'touch-up',
      SCROLL_BEGAN: 'scroll-began'
    }

    get content() { return this._content }
    set content(value) { this._content = value }

    get horizontal() { return this._horizontal }
    set horizontal(value) { this._horizontal = value }

    get vertical() { return this._vertical }
    set vertical(value) { this._vertical = value }

    get inertia() { return this._inertia }
    set inertia(value) { this._inertia = value }

    get brake() { return this._brake }
    set brake(value) { this._brake = value }

    get elastic() { return this._elastic }
    set elastic(value) { this._elastic = value }

    get bounceDuration() { return this._bounceDuration }
    set bounceDuration(value) { this._bounceDuration = value }

    get scrollEvents() { return this._scrollEvents }

    get cancelInnerEvents() { return this._cancelInnerEvents }
    set cancelInnerEvents(value) { this._cancelInnerEvents = value }

    scrollToBottom(timeInSeconds, attenuated = true) {
      // 简化实现
    }

    scrollToTop(timeInSeconds, attenuated = true) {
      // 简化实现
    }

    scrollToLeft(timeInSeconds, attenuated = true) {
      // 简化实现
    }

    scrollToRight(timeInSeconds, attenuated = true) {
      // 简化实现
    }

    scrollToOffset(offset, timeInSeconds, attenuated = true) {
      // 简化实现
    }

    getScrollOffset() {
      return new Vec2(0, 0)
    }

    getMaxScrollOffset() {
      return new Vec2(0, 0)
    }

    stopAutoScroll() {
      // 简化实现
    }
  }

  // EditBox 输入框组件
  class EditBox extends Component {
    constructor() {
      super()
      this._string = ''
      this._placeholder = ''
             this._background = null
      this._fontSize = 20
      this._lineHeight = 20
      this._fontColor = new Color(255, 255, 255, 255)
      this._placeholderFontColor = new Color(255, 255, 255, 255)
      this._maxLength = 20
      this._inputFlag = 0
      this._inputMode = 0
      this._returnType = 0
      this._editingDidBegan = []
      this._textChanged = []
      this._editingDidEnded = []
      this._editingReturn = []
      this._stayOnBlur = false
    }

    static InputFlag = {
      DEFAULT: 0,
      PASSWORD: 1,
      SENSITIVE: 2,
      INITIAL_CAPS_WORD: 3,
      INITIAL_CAPS_SENTENCE: 4,
      INITIAL_CAPS_ALL_CHARACTERS: 5,
      LOWERCASE_ALL_CHARACTERS: 6
    }

    static InputMode = {
      ANY: 0,
      EMAIL_ADDR: 1,
      NUMERIC: 2,
      PHONE_NUMBER: 3,
      URL: 4,
      DECIMAL: 5,
      SINGLE_LINE: 6
    }

    static KeyboardReturnType = {
      DEFAULT: 0,
      DONE: 1,
      SEND: 2,
      SEARCH: 3,
      GO: 4,
      NEXT: 5
    }

    get string() { return this._string }
    set string(value) { this._string = String(value) }

    get placeholder() { return this._placeholder }
    set placeholder(value) { this._placeholder = value }

    get background() { return this._background }
    set background(value) { this._background = value }

    get fontSize() { return this._fontSize }
    set fontSize(value) { this._fontSize = value }

    get lineHeight() { return this._lineHeight }
    set lineHeight(value) { this._lineHeight = value }

    get fontColor() { return this._fontColor }
    set fontColor(value) { this._fontColor = value }

    get placeholderFontColor() { return this._placeholderFontColor }
    set placeholderFontColor(value) { this._placeholderFontColor = value }

    get maxLength() { return this._maxLength }
    set maxLength(value) { this._maxLength = value }

    get inputFlag() { return this._inputFlag }
    set inputFlag(value) { this._inputFlag = value }

    get inputMode() { return this._inputMode }
    set inputMode(value) { this._inputMode = value }

    get returnType() { return this._returnType }
    set returnType(value) { this._returnType = value }

    get editingDidBegan() { return this._editingDidBegan }
    get textChanged() { return this._textChanged }
    get editingDidEnded() { return this._editingDidEnded }
    get editingReturn() { return this._editingReturn }

    get stayOnBlur() { return this._stayOnBlur }
    set stayOnBlur(value) { this._stayOnBlur = value }

    focus() {
      // 简化实现
    }

    blur() {
      // 简化实现
    }

    isFocused() {
      return false
    }
  }

  // RichText 富文本组件
  class RichText extends Component {
    constructor() {
      super()
      this._string = ''
      this._horizontalAlign = 0
      this._fontSize = 40
      this._fontFamily = 'Arial'
      this._fontColor = new Color(255, 255, 255, 255)
      this._maxWidth = 0
      this._lineHeight = 40
      this._imageAtlas = null
      this._handleImageClick = null
      this._fontFamily = 'Arial'
    }

    static HorizontalAlign = {
      LEFT: 0,
      CENTER: 1,
      RIGHT: 2
    }

    get string() { return this._string }
    set string(value) { this._string = String(value) }

    get horizontalAlign() { return this._horizontalAlign }
    set horizontalAlign(value) { this._horizontalAlign = value }

    get fontSize() { return this._fontSize }
    set fontSize(value) { this._fontSize = value }

    get fontFamily() { return this._fontFamily }
    set fontFamily(value) { this._fontFamily = value }

    get fontColor() { return this._fontColor }
    set fontColor(value) { this._fontColor = value }

    get maxWidth() { return this._maxWidth }
    set maxWidth(value) { this._maxWidth = value }

    get lineHeight() { return this._lineHeight }
    set lineHeight(value) { this._lineHeight = value }

    get imageAtlas() { return this._imageAtlas }
    set imageAtlas(value) { this._imageAtlas = value }
  }

  // SpriteFrame 精灵帧
  class SpriteFrame {
    constructor() {
      this._texture = null
      this._rect = new Rect(0, 0, 0, 0)
      this._offset = new Vec2(0, 0)
      this._originalSize = new Size(0, 0)
      this._rotated = false
      this._capInsets = [0, 0, 0, 0]
    }

    get texture() { return this._texture }
    set texture(value) { this._texture = value }

    get rect() { return this._rect }
    set rect(value) {
      this._rect.x = value.x
      this._rect.y = value.y
      this._rect.width = value.width
      this._rect.height = value.height
    }

    get offset() { return this._offset }
    set offset(value) {
      this._offset.x = value.x
      this._offset.y = value.y
    }

    get originalSize() { return this._originalSize }
    set originalSize(value) {
      this._originalSize.width = value.width
      this._originalSize.height = value.height
    }

    get rotated() { return this._rotated }
    set rotated(value) { this._rotated = value }

    get capInsets() { return this._capInsets }
    set capInsets(value) { this._capInsets = value }

    clone() {
      const frame = new SpriteFrame()
      frame._texture = this._texture
      frame._rect = this._rect.clone()
      frame._offset = this._offset.clone()
      frame._originalSize = this._originalSize.clone()
      frame._rotated = this._rotated
      frame._capInsets = [...this._capInsets]
      return frame
    }
  }

  // Texture2D 纹理
  class Texture2D {
    constructor() {
      this._url = ''
      this._width = 0
      this._height = 0
      this._format = 0
      this._pixelFormat = 0
    }

    get url() { return this._url }
    set url(value) { this._url = value }

    get width() { return this._width }
    get height() { return this._height }
    get pixelFormat() { return this._pixelFormat }
    get format() { return this._format }

    initWithData(data, pixelFormat, pixelsWidth, pixelsHeight) {
      // 简化实现
      return true
    }

    destroy() {
      // 简化实现
    }

    static PixelFormat = {
      RGBA8888: 0,
      RGB888: 1,
      RGB565: 2,
      A8: 3,
      I8: 4,
      AI88: 5,
      RGBA4444: 6,
      RGB5A1: 7,
      PVRTC4: 8,
      PVRTC2: 9,
      ETC1: 10,
      S3TC_DXT1: 11,
      S3TC_DXT3: 12,
      S3TC_DXT5: 13,
      ATC_RGB4: 14,
      ATC_RGBA8: 15,
      ATC_RGBA4: 16,
      RGBA16F: 17,
      RGB16F: 18,
      RGBA32F: 19,
      RGB32F: 20,
      // 默认
      DEFAULT: 0
    }
  }

  // Animation 动画组件
  class Animation extends Component {
    constructor() {
      super()
      this._defaultClip = null
      this._clips = []
      this._playOnLoad = false
    }

    get defaultClip() { return this._defaultClip }
    set defaultClip(value) { this._defaultClip = value }

    get clips() { return this._clips }
    set clips(value) { this._clips = value }

    get playOnLoad() { return this._playOnLoad }
    set playOnLoad(value) { this._playOnLoad = value }

    play(name, loop = false) {
      // 简化实现
      return null
    }

    stop(name) {
      // 简化实现
    }

    pause(name) {
      // 简化实现
    }

    resume(name) {
      // 简化实现
    }

    getClips() {
      return this._clips
    }

    addClip(clip) {
      this._clips.push(clip)
    }

    removeClip(clip) {
      const index = this._clips.indexOf(clip)
      if (index !== -1) {
        this._clips.splice(index, 1)
      }
    }

    getState(name) {
      // 简化实现
      return null
    }
  }

  // AnimationClip 动画片段
  class AnimationClip {
    constructor() {
      this._name = ''
      this._sample = 60
      this._speed = 1
      this._duration = 0
      this._curveData = {}
      this._events = []
    }

    get name() { return this._name }
    set name(value) { this._name = value }

    get sample() { return this._sample }
    set sample(value) { this._sample = value }

    get speed() { return this._speed }
    set speed(value) { this._speed = value }

    get duration() { return this._duration }
    set duration(value) { this._duration = value }

    get curveData() { return this._curveData }
    set curveData(value) { this._curveData = value }

    get events() { return this._events }
    set events(value) { this._events = value }

    createWithSpriteFrames(spriteFrames, sample) {
      const clip = new AnimationClip()
      clip._sample = sample || 60
      return clip
    }
  }

  // Prefab 预制体
  class Prefab {
    constructor() {
      this._data = null
    }

    get data() { return this._data }
    set data(value) { this._data = value }

    create() {
      // 简化实现
      return null
    }
  }

  // Asset 资源基类
  class Asset {
    constructor() {
      this._uuid = ''
      this._name = ''
      this._nativeUrl = ''
    }

    get uuid() { return this._uuid }
    set uuid(value) { this._uuid = value }

    get name() { return this._name }
    set name(value) { this._name = value }

    get nativeUrl() { return this._nativeUrl }
    set nativeUrl(value) { this._nativeUrl = value }

    isValid() {
      return true
    }

    addRef() {
      // 简化实现
    }

    decRef() {
      // 简化实现
    }

    destroy() {
      // 简化实现
    }
  }

  // Loader 资源加载器
  const loader = {
    // 加载资源
    load(resources, callback, progressCallback) {
      // 简化实现
      if (callback) {
        setTimeout(() => callback(null, []), 0)
      }
    },

    // 加载单个资源
    loadRes(url, component, callback) {
      // 简化实现
      if (callback) {
        setTimeout(() => callback(null, null), 0)
      }
    },

    // 加载多个资源
    loadResArray(urls, component, callback) {
      // 简化实现
      if (callback) {
        setTimeout(() => callback(null, []), 0)
      }
    },

    // 加载目录
    loadResDir(url, component, callback, progressCallback) {
      // 简化实现
      if (callback) {
        setTimeout(() => callback(null, []), 0)
      }
    },

    // 获取资源
    getRes(url) {
      return null
    },

    // 释放资源
    release(url) {
      // 简化实现
    },

    // 释放所有资源
    releaseAll() {
      // 简化实现
    },

    // 获取依赖
    getDependsRecursively(asset) {
      return []
    },

    // 设置资源路径
    setResPath(path) {
      // 简化实现
    },

    // 获取资源路径
    getResPath() {
      return ''
    }
  }

  // AudioEngine 音频引擎
  const audioEngine = {
    // 播放音乐
    playMusic(url, loop = false) {
      return 0
    },

    // 停止音乐
    stopMusic() {
      // 简化实现
    },

    // 暂停音乐
    pauseMusic() {
      // 简化实现
    },

    // 恢复音乐
    resumeMusic() {
      // 简化实现
    },

    // 播放音效
    playEffect(url, loop = false) {
      return 0
    },

    // 停止音效
    stopEffect(audioID) {
      // 简化实现
    },

    // 停止所有音效
    stopAllEffects() {
      // 简化实现
    },

    // 暂停音效
    pauseEffect(audioID) {
      // 简化实现
    },

    // 暂停所有音效
    pauseAllEffects() {
      // 简化实现
    },

    // 恢复音效
    resumeEffect(audioID) {
      // 简化实现
    },

    // 恢复所有音效
    resumeAllEffects() {
      // 简化实现
    },

    // 设置音乐音量
    setMusicVolume(volume) {
      // 简化实现
    },

    // 获取音乐音量
    getMusicVolume() {
      return 1.0
    },

    // 设置音效音量
    setEffectsVolume(volume) {
      // 简化实现
    },

    // 获取音效音量
    getEffectsVolume() {
      return 1.0
    },

    // 预加载音效
    preloadEffect(url) {
      // 简化实现
    },

    // 卸载音效
    unloadEffect(url) {
      // 简化实现
    },

    // 是否正在播放音乐
    isMusicPlaying() {
      return false
    },

    // 设置音乐循环
    setMusicLoop(loop) {
      // 简化实现
    }
  }

  // View 视口管理
  const view = {
    // 设计分辨率
    _designResolutionSize: new Size(960, 640),
    // 实际分辨率
    _frameSize: new Size(window.innerWidth, window.innerHeight),
    // 策略
    _resolutionPolicy: null,
    // 可见区域
    _visibleRect: null,

    get designResolution() {
      return this._designResolutionSize
    },

    get frameSize() {
      return this._frameSize
    },

    get visibleRect() {
      if (!this._visibleRect) {
        this._visibleRect = {
          x: 0,
          y: 0,
          width: this._frameSize.width,
          height: this._frameSize.height
        }
      }
      return this._visibleRect
    },

    get canvasSize() {
      return this._frameSize
    },

    get viewport() {
      return {
        x: 0,
        y: 0,
        w: this._frameSize.width,
        h: this._frameSize.height
      }
    },

    get scale() {
      return 1
    },

    setDesignResolutionSize(width, height, policy) {
      this._designResolutionSize.width = width
      this._designResolutionSize.height = height
      this._resolutionPolicy = policy
    },

    getDesignResolutionSize() {
      return this._designResolutionSize.clone()
    },

    setFrameSize(width, height) {
      this._frameSize.width = width
      this._frameSize.height = height
    },

    getFrameSize() {
      return this._frameSize.clone()
    },

    getVisibleSize() {
      return this._frameSize.clone()
    },

    getVisibleRect() {
      return this.visibleRect
    },

    getVisibleOrigin() {
      return { x: 0, y: 0 }
    },

    setResolutionPolicy(policy) {
      this._resolutionPolicy = policy
    },

    getResolutionPolicy() {
      return this._resolutionPolicy
    },

    adjustViewPort() {
      // 简化实现
    },

    resizeWithBrowserSize(enable) {
      // 简化实现
    }
  }

  // Director 导演类
  const director = {
    // 场景
    _runningScene: null,
    _nextScene: null,
    _scenesStack: [],

    // FPS
    _FPS: 60,
    _secondsPerFrame: 1 / 60,

    // 状态
    _isPaused: false,
    _isRunning: false,

    // delta 时间
    _deltaTime: 0,

    // 投影
    _projection: 0,

    // 获取 FPS
    getAnimationInterval() {
      return this._secondsPerFrame
    },

    setAnimationInterval(value) {
      this._secondsPerFrame = value
      this._FPS = 1 / value
    },

    getFPS() {
      return this._FPS
    },

    // 获取 delta 时间
    getDeltaTime() {
      return this._deltaTime
    },

    // 暂停
    pause() {
      this._isPaused = true
    },

    // 恢复
    resume() {
      this._isPaused = false
    },

    // 是否暂停
    isPaused() {
      return this._isPaused
    },

    // 运行场景
    runScene(scene) {
      if (this._runningScene) {
        this._scenesStack.push(this._runningScene)
      }
      this._runningScene = scene
      scene.onEnter()
    },

    // 替换场景
    replaceScene(scene) {
      if (this._runningScene) {
        this._runningScene.onExit()
      }
      this._runningScene = scene
      scene.onEnter()
    },

    // 推入场景
    pushScene(scene) {
      this._scenesStack.push(this._runningScene)
      this._runningScene = scene
      scene.onEnter()
    },

    // 弹出场景
    popScene() {
      if (this._scenesStack.length > 0) {
        this._runningScene.onExit()
        this._runningScene = this._scenesStack.pop()
        this._runningScene.onEnter()
      }
    },

    // 获取当前场景
    getRunningScene() {
      return this._runningScene
    },

    // 获取场景栈
    getScenesStack() {
      return this._scenesStack
    },

    // 主循环
    mainLoop() {
      if (this._isPaused) return

      // 计算 delta 时间
      this._deltaTime = this._secondsPerFrame

      // 更新调度器
      if (this._runningScene) {
        // 简化实现
      }
    },

    // 获取调度器
    getScheduler() {
      return scheduler
    },

    // 获取动作管理器
    getActionManager() {
      return null
    },

    // 转换坐标
    convertToGL(point) {
      return point
    },

    convertToUI(point) {
      return point
    }
  }

  // Scheduler 调度器
  const scheduler = {
    // 时间缩放
    _timeScale: 1,

    // 定时回调列表
    _schedules: [],

    // 获取时间缩放
    getTimeScale() {
      return this._timeScale
    },

    // 设置时间缩放
    setTimeScale(timeScale) {
      this._timeScale = timeScale
    },

    // 调度定时回调
    schedule(callback, interval, repeat, delay, paused, target) {
      const schedule = {
        callback,
        interval: interval || 0,
        repeat: repeat || 0,
        delay: delay || 0,
        paused: paused || false,
        target: target || null,
        elapsed: 0,
        times: 0
      }
      this._schedules.push(schedule)
      return schedule
    },

    // 调度更新回调
    scheduleUpdateForTarget(target, priority, paused) {
      const schedule = {
        callback: target.update ? target.update.bind(target) : null,
        interval: 0,
        repeat: -1,
        delay: 0,
        paused: paused || false,
        target: target,
        elapsed: 0,
        times: 0
      }
      this._schedules.push(schedule)
      return schedule
    },

    // 取消调度
    unschedule(callback, target) {
      this._schedules = this._schedules.filter(s =>
        s.target !== target || s.callback !== callback
      )
    },

    // 取消目标的所有调度
    unscheduleAllForTarget(target) {
      this._schedules = this._schedules.filter(s => s.target !== target)
    },

    // 取消所有调度
    unscheduleAll() {
      this._schedules = []
    },

    // 暂停目标
    pauseTarget(target) {
      this._schedules.forEach(s => {
        if (s.target === target) {
          s.paused = true
        }
      })
    },

    // 恢复目标
    resumeTarget(target) {
      this._schedules.forEach(s => {
        if (s.target === target) {
          s.paused = false
        }
      })
    },

    // 是否暂停
    isTargetPaused(target) {
      const schedule = this._schedules.find(s => s.target === target)
      return schedule ? schedule.paused : false
    },

    // 更新
    update(dt) {
      dt *= this._timeScale
      this._schedules.forEach(schedule => {
        if (schedule.paused) return

        schedule.elapsed += dt

        if (schedule.delay > 0 && schedule.elapsed < schedule.delay) {
          return
        }

        if (schedule.elapsed >= schedule.interval) {
          schedule.elapsed = 0
          schedule.times++

          if (schedule.callback) {
            schedule.callback(dt)
          }

          if (schedule.repeat >= 0 && schedule.times > schedule.repeat) {
            this.unschedule(schedule.callback, schedule.target)
          }
        }
      })
    }
  }

  // 实例化节点
  function instantiate(node) {
    if (!node) return null

    // 简化实现：直接克隆节点
    const cloned = Object.create(Object.getPrototypeOf(node))
    Object.assign(cloned, node)
    cloned._parent = null
    cloned._children = node._children.map(child => {
      const childClone = instantiate(child)
      childClone._parent = cloned
      return childClone
    })

    return cloned
  }

  // 查找节点
  function find(path) {
    if (!path || typeof path !== 'string') return null

    const parts = path.split('/').filter(p => p)
    if (parts.length === 0) return null

    let result = null

    // 从当前场景开始查找
    const scene = director.getRunningScene()
    if (scene) {
      result = _findNode(scene, parts)
    }

    return result
  }

  // 递归查找节点
  function _findNode(node, pathParts, index = 0) {
    if (index >= pathParts.length) return node

    const name = pathParts[index]
    const child = node.children.find(c => c.name === name)

    if (child) {
      return _findNode(child, pathParts, index + 1)
    }

    // 在子节点中继续查找
    for (let c of node.children) {
      const found = _findNode(c, pathParts, index)
      if (found) return found
    }

    return null
  }

  // 初始化系统
  sys.init()

  // 创建全局 cc 对象
  const cc = {
    // 版本
    ENGINE_VERSION: ENGINE_VERSION,

    // 核心类
    Node: Node,
    Scene: Scene,
    Component: Component,
    Sprite: Sprite,
    Label: Label,
    Button: Button,
    Widget: Widget,
    Layout: Layout,
    ScrollView: ScrollView,
    EditBox: EditBox,
    RichText: RichText,
    SpriteFrame: SpriteFrame,
    Texture2D: Texture2D,
    Animation: Animation,
    AnimationClip: AnimationClip,
    Prefab: Prefab,
    Asset: Asset,

    // 数据类
    Vec2: Vec2,
    Size: Size,
    Color: Color,
    Rect: Rect,

    // 模块
    macro: macro,
    sys: sys,
    loader: loader,
    audioEngine: audioEngine,
    view: view,
    director: director,

    // 单例
    _renderContext: null,
    _canvas: null,

    // 工具函数
    instantiate: instantiate,
    find: find,
    class: function(prototype) {
      // 简化实现
      return function() {
        if (prototype.ctor) {
          prototype.ctor.apply(this, arguments)
        }
      }
    },
    isFunction: function(obj) {
      return typeof obj === 'function'
    },
    isNumber: function(obj) {
      return typeof obj === 'number'
    },
    isString: function(obj) {
      return typeof obj === 'string'
    },
    isObject: function(obj) {
      return typeof obj === 'object' && obj !== null
    },
    isArray: function(obj) {
      return Array.isArray(obj)
    },
    isUndefined: function(obj) {
      return obj === undefined
    },
    clone: function(obj) {
      if (!obj || typeof obj !== 'object') return obj
      return JSON.parse(JSON.stringify(obj))
    },

    // 日志
    log: console.log.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    info: console.info.bind(console),

    // 游戏配置
    game: {
      config: {},
      run: function(config, onStarted) {
        this.config = config
        // 创建运行场景
        const scene = new cc.Scene()
        director._runningScene = scene
        director._isRunning = true

        if (onStarted) {
          onStarted()
        }
      }
    },

    // 事件管理器
    eventManager: {
      addListener: function(listener, nodeOrPriority) {
        // 简化实现
      },
      removeListener: function(listener) {
        // 简化实现
      },
      removeAllListeners: function() {
        // 简化实现
      },
      setPriority: function(listener, fixedPriority) {
        // 简化实现
      },
      enableCustomAcceleration: true
    },

    // 动作管理
    actionManager: {
      addAction: function(action, target, paused) {
        // 简化实现
      },
      removeAllActions: function() {
        // 简化实现
      },
      removeAllActionsFromTarget: function(target) {
        // 简化实现
      }
    },

    // 屏幕适配
    screen: {
      windowSize: new Size(window.innerWidth, window.innerHeight),
      fullscreen: function() {
        // 简化实现
      }
    },

    // 存储管理
    storage: {
      setItem: function(key, value) {
        try {
          localStorage.setItem(key, JSON.stringify(value))
        } catch (e) {
          console.warn('localStorage.setItem failed:', e)
        }
      },
      getItem: function(key) {
        try {
          const value = localStorage.getItem(key)
          return value ? JSON.parse(value) : null
        } catch (e) {
          console.warn('localStorage.getItem failed:', e)
          return null
        }
      },
      removeItem: function(key) {
        try {
          localStorage.removeItem(key)
        } catch (e) {
          console.warn('localStorage.removeItem failed:', e)
        }
      },
      clear: function() {
        try {
          localStorage.clear()
        } catch (e) {
          console.warn('localStorage.clear failed:', e)
        }
      }
    },

    // 随机数
    rnd: {
      seed: Date.now(),
      random0To1: function() {
        return Math.random()
      },
      randomMinus1To1: function() {
        return Math.random() * 2 - 1
      },
      random: function() {
        return Math.random()
      },
      scale: function(seed, min, max) {
        return min + (max - min) * seed
      },
      seedRandom: function(seed) {
        this.seed = seed
      }
    },

    // 颜色常量
    color: function(r, g, b, a) {
      return new Color(r, g, b, a)
    },

    p: function(x, y) {
      return new Vec2(x, y)
    },

    size: function(w, h) {
      return new Size(w, h)
    },

    rect: function(x, y, w, h) {
      return new Rect(x, y, w, h)
    }
  }

  // 将 cc 对象导出到全局
  global.cc = cc

  // 同时导出 window.cc
  if (typeof window !== 'undefined') {
    window.cc = cc
  }

  // 打印初始化信息
  console.log(`[Cocos Creator Shim] Version ${ENGINE_VERSION} initialized`)

})(typeof window !== 'undefined' ? window : global)
