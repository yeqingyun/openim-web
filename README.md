# OpenIM Web Client

一个简单易用的 OpenIM 即时通讯网页客户端，基于 `@imam-inter/wasm-client-sdk` 实现。

## 功能特性

- 用户登录/登出
- 会话列表展示
- 实时消息收发
- 文本消息发送
- 图片消息发送
- 消息历史记录查看
- 连接状态显示
- 未读消息提醒

## 安装依赖

```bash
npm install
```

## 运行项目

```bash
npm run dev
```

项目将在 `http://localhost:3000` 启动。

## 使用说明

### 登录

在登录页面填写以下信息：

- **服务器地址**: OpenIM 服务器 API 地址 (例如: `http://your-server:10002`)
- **WebSocket 地址**: OpenIM WebSocket 地址 (例如: `ws://your-server:10001`)
- **用户 ID**: 你的用户 ID
- **用户 Token**: 你的用户 Token

### 获取 Token

你需要通过 OpenIM 服务器 API 获取用户 Token。可以使用 OpenIM 提供的管理工具或 API 来创建用户并获取 Token。

### 功能说明

1. **会话列表**: 左侧显示所有会话，点击选择会话
2. **发送消息**: 在底部输入框输入消息，按 Enter 发送
3. **发送图片**: 点击图片图标选择图片文件发送
4. **清空记录**: 点击聊天头部的清空图标清空当前会话记录

## 项目结构

```
openim-web/
├── index.html              # 主页面
├── package.json            # 项目配置
├── vite.config.js          # Vite 配置
├── src/
│   ├── main.js             # 应用主逻辑
│   ├── im/
│   │   ├── manager.js      # SDK 管理器
│   │   ├── conversation.js # 会话管理
│   │   └── message.js      # 消息管理
│   └── styles/
│       └── main.css        # 样式文件
└── README.md               # 说明文档
```

## 技术栈

- **Vite**: 构建工具
- **@imam-inter/wasm-client-sdk**: OpenIM WASM SDK
- **原生 JavaScript**: 无框架依赖

## 注意事项

1. 确保 OpenIM 服务器地址和 WebSocket 地址正确
2. 用户 Token 需要从 OpenIM 服务器获取
3. WebSocket 连接需要服务器支持跨域或配置代理
4. 图片消息功能需要服务器支持文件上传

## 开发建议

如果需要配置代理解决跨域问题，可以在 `vite.config.js` 中添加：

```js
export default defineConfig({
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://your-server:10002',
        changeOrigin: true
      }
    }
  }
})
```

## 许可证

MIT
