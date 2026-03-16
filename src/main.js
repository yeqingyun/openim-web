import imManager from './im/manager.js'
import conversationManager from './im/conversation.js'
import messageManager from './im/message.js'
import groupManager from './im/group.js'

/**
 * 平台枚举（与 @openim/client-sdk 保持一致）
 */
const Platform = {
  iOS: 1,
  Android: 2,
  Windows: 3,
  MacOSX: 4,
  Web: 5,
  Linux: 7,
  AndroidPad: 8,
  iPad: 9
}

/**
 * 检测当前运行平台
 * 当 web 应用打包为 Android/iOS 应用时，需要正确识别平台
 */
function detectPlatform() {
  // 检测是否在 Cordova/Capacitor 环境中
  if (typeof window !== 'undefined' && window.cordova) {
    const device = window.cordova.plugins?.Device?.device || window.device
    if (device) {
      if (device.platform === 'Android') return Platform.Android
      if (device.platform === 'iOS' || device.platform === 'iPhone' || device.platform === 'iPad') return Platform.iOS
    }
  }

  // 检测 Capacitor 环境
  if (typeof window !== 'undefined' && window.Capacitor) {
    const { Capacitor } = window
    if (Capacitor.getPlatform() === 'android') return Platform.Android
    if (Capacitor.getPlatform() === 'ios') return Platform.iOS
  }

  // 通过 UserAgent 检测（作为后备方案）
  if (typeof navigator !== 'undefined') {
    const userAgent = navigator.userAgent || ''
    if (/Android/i.test(userAgent)) return Platform.Android
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) return Platform.iOS
  }

  // 默认返回 Web 平台
  return Platform.Web
}

/**
 * 应用主类
 */
class App {
  constructor() {
    this.elements = {}
    this.state = {
      currentConversation: null,
      messageList: [],
      isLoading: false,
      currentTab: 'conversations', // 'conversations' or 'groups'
      cacheKey: 'openim_login_cache',
      cacheExpiry: 24 * 60 * 60 * 1000 // 1天（毫秒）
    }
  }

  /**
   * 初始化应用
   */
  async init() {
    this._cacheElements()
    this._bindEvents()
    this._setupIMListeners()
    this._setupConversationListeners()
    this._setupGroupListeners()
    this._setupMessageListeners()

    // 检查缓存并尝试自动登录
    await this._checkAndAutoLogin()
  }

  /**
   * 缓存 DOM 元素
   */
  _cacheElements() {
    // 页面
    this.elements.loginPage = document.getElementById('login-page')
    this.elements.chatPage = document.getElementById('chat-page')

    // 登录表单
    this.elements.loginForm = document.getElementById('login-form')
    this.elements.serverUrl = document.getElementById('server-url')
    this.elements.wsUrl = document.getElementById('ws-url')
    this.elements.userId = document.getElementById('user-id')
    this.elements.userToken = document.getElementById('user-token')
    this.elements.loginError = document.getElementById('login-error')

    // 侧边栏
    this.elements.conversationList = document.getElementById('conversation-list')
    this.elements.groupList = document.getElementById('group-list')
    this.elements.conversationSearch = document.getElementById('conversation-search')
    this.elements.currentUserAvatar = document.getElementById('current-user-avatar')
    this.elements.currentUserName = document.getElementById('current-user-name')
    this.elements.connectionStatus = document.getElementById('connection-status')
    this.elements.logoutBtn = document.getElementById('logout-btn')

    // Tab 相关状态
    this.state.currentTab = 'conversations' // 'conversations' or 'groups'

    // 聊天区域
    this.elements.noConversation = document.getElementById('no-conversation')
    this.elements.conversationView = document.getElementById('conversation-view')
    this.elements.chatAvatar = document.getElementById('chat-avatar')
    this.elements.chatAvatarText = document.getElementById('chat-avatar-text')
    this.elements.chatName = document.getElementById('chat-name')
    this.elements.chatStatus = document.getElementById('chat-status')
    this.elements.chatMessages = document.getElementById('chat-messages')
    this.elements.messagesLoading = document.getElementById('messages-loading')
    this.elements.messageInput = document.getElementById('message-input')
    this.elements.sendBtn = document.getElementById('send-btn')
    this.elements.clearHistoryBtn = document.getElementById('clear-history-btn')

    // Toast 和对话框
    this.elements.toast = document.getElementById('toast')
    this.elements.toastMessage = document.getElementById('toast-message')
    this.elements.confirmDialog = document.getElementById('confirm-dialog')
    this.elements.confirmTitle = document.getElementById('confirm-title')
    this.elements.confirmMessage = document.getElementById('confirm-message')
    this.elements.confirmOk = document.getElementById('confirm-ok')
    this.elements.confirmCancel = document.getElementById('confirm-cancel')
  }

  /**
   * 绑定事件
   */
  _bindEvents() {
    // 登录表单
    this.elements.loginForm.addEventListener('submit', (e) => {
      e.preventDefault()
      this._handleLogin()
    })

    // 登出按钮
    this.elements.logoutBtn.addEventListener('click', () => {
      this._handleLogout()
    })

    // Tab 切换
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this._handleTabSwitch(e.target.dataset.tab)
      })
    })

    // 会话搜索
    this.elements.conversationSearch.addEventListener('input', (e) => {
      this._handleConversationSearch(e.target.value)
    })

    // 发送消息
    this.elements.sendBtn.addEventListener('click', () => {
      this._handleSendMessage()
    })

    this.elements.messageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        this._handleSendMessage()
      }
    })

    this.elements.messageInput.addEventListener('input', (e) => {
      this._autoResizeTextarea(e.target)
    })

    // 清空聊天记录
    this.elements.clearHistoryBtn.addEventListener('click', () => {
      this._showConfirmDialog('清空聊天记录', '确定要清空当前会话的聊天记录吗？', () => {
        this._handleClearHistory()
      })
    })

    // 对话框按钮
    this.elements.confirmCancel.addEventListener('click', () => {
      this._hideConfirmDialog()
    })

    this.elements.confirmOk.addEventListener('click', () => {
      if (this.elements.confirmDialog._callback) {
        this.elements.confirmDialog._callback()
      }
      this._hideConfirmDialog()
    })

    this.elements.confirmDialog.addEventListener('click', (e) => {
      if (e.target === this.elements.confirmDialog) {
        this._hideConfirmDialog()
      }
    })
  }

  /**
   * 设置 IM 监听器
   */
  _setupIMListeners() {
    // 连接状态变化
    imManager.on('connectionChange', (status) => {
      this._updateConnectionStatus(status)
      // 连接失败时清除缓存并返回登录页
      if (status === 'failed') {
        this._clearLoginCache()
        conversationManager.clear()
        messageManager.clearAll()
        groupManager.clear()
        this._showLoginPage()
        this._showToast('连接失败，请重新登录')
      }
    })

    // 登录成功
    imManager.on('loginSuccess', (data) => {
      this._showChatPage()
    })

    // 登录失败
    imManager.on('loginError', (error) => {
      this._showLoginError(error.message || '登录失败，请检查您的凭据')
    })

    // 新消息
    imManager.on('newMessage', (data) => {
      messageManager.addMessage(data)
    })

    // 被踢下线
    imManager.on('kickedOffline', () => {
      this._showToast('您已在其他设备登录，被强制下线')
      this._showLoginPage()
    })

    // Token 过期
    imManager.on('tokenExpired', () => {
      this._showToast('Token 已过期，请重新登录')
      this._showLoginPage()
    })
  }

  /**
   * 设置会话监听器
   */
  _setupConversationListeners() {
    // 会话更新
    conversationManager.onChange('conversationUpdated', (conversation) => {
      this._renderConversationItem(conversation)
    })

    // 新会话
    conversationManager.onChange('newConversation', (conversation) => {
      this._addConversationItem(conversation)
    })

    // 会话删除
    conversationManager.onChange('conversationDeleted', (conversationID) => {
      this._removeConversationItem(conversationID)
    })

    // 未读数变化
    conversationManager.onChange('unreadCountChanged', (count) => {
      // 可以在这里更新全局未读数显示
    })
  }

  /**
   * 设置群组监听器
   */
  _setupGroupListeners() {
    // 群组加载完成
    groupManager.onChange('groupsLoaded', (groups) => {
      this._renderGroupList(groups)
    })

    // 群组更新
    groupManager.onChange('groupUpdated', (group) => {
      this._renderGroupItem(group)
    })

    // 群组移除
    groupManager.onChange('groupRemoved', (groupID) => {
      this._removeGroupItem(groupID)
    })
  }

  /**
   * 设置消息监听器
   */
  _setupMessageListeners() {
    // 消息更新
    messageManager.onChange('messagesUpdated', (data) => {
      if (this.state.currentConversation?.conversationID === data.conversationID) {
        this._appendMessages(data.messages)
      }
    })

    // 新消息
    messageManager.onChange('newMessage', (data) => {
      if (this.state.currentConversation?.conversationID === data.conversationID) {
        this._appendMessage(data.message)
      }
    })

    // 消息状态更新
    messageManager.onChange('messageStatusUpdated', (data) => {
      if (this.state.currentConversation?.conversationID === data.conversationID) {
        this._updateMessageStatus(data.message)
      }
    })
  }

  /**
   * 处理登录
   */
  async _handleLogin() {
    const serverUrl = this.elements.serverUrl.value.trim()
    const wsUrl = this.elements.wsUrl.value.trim()
    const userId = this.elements.userId.value.trim()
    const token = this.elements.userToken.value.trim()

    if (!serverUrl || !wsUrl || !userId || !token) {
      this._showLoginError('请填写所有必填字段')
      return
    }

    this._setLoginLoading(true)
    this._hideLoginError()

    try {
      // 初始化 SDK（创建 SDK 实例）
      await imManager.init()

      // 检测当前平台
      const platformID = detectPlatform()
      console.log('[App] Detected platform:', platformID, '(platformID)')

      // 登录（传入所有参数，使用检测到的 platformID）
      await imManager.login(userId, token, platformID, serverUrl, wsUrl)

      // 保存登录缓存
      this._saveLoginCache({ serverUrl, wsUrl, userId, token })

      // 更新用户信息显示
      this._updateUserInfo(userId)

      // 加载会话列表
      await this._loadConversations()

      // 加载群组列表
      await this._loadGroups()

    } catch (error) {
      console.error('Login error:', error)
      // 登录失败时清除缓存的登录信息
      this._clearLoginCache()
      this._showLoginError(error.message || '登录失败，请检查您的配置')
    } finally {
      this._setLoginLoading(false)
    }
  }

  /**
   * 处理登出
   */
  async _handleLogout() {
    this._showConfirmDialog('退出登录', '确定要退出登录吗？', async () => {
      try {
        await imManager.logout()
        // 清除登录缓存
        this._clearLoginCache()
        conversationManager.clear()
        messageManager.clearAll()
        groupManager.clear()
        this._showLoginPage()
      } catch (error) {
        console.error('Logout error:', error)
        this._showToast('登出失败')
      }
    })
  }

  /**
   * 加载会话列表
   */
  async _loadConversations() {
    try {
      const conversations = await conversationManager.loadConversations()
      this._renderConversationList(conversations)
    } catch (error) {
      console.error('Failed to load conversations:', error)
    }
  }

  /**
   * 渲染会话列表
   */
  _renderConversationList(conversations) {
    this.elements.conversationList.innerHTML = ''

    if (conversations.length === 0) {
      this.elements.conversationList.innerHTML = `
        <div class="empty-state">
          <p>暂无会话</p>
        </div>
      `
      return
    }

    conversations.forEach(conv => {
      this._addConversationItem(conv)
    })
  }

  /**
   * 添加会话项
   */
  _addConversationItem(conversation) {
    // 检查是否已存在
    const existingItem = this.elements.conversationList.querySelector(
      `[data-conversation-id="${conversation.conversationID}"]`
    )
    if (existingItem) {
      existingItem.remove()
    }

    const item = document.createElement('div')
    item.className = 'conversation-item'
    item.dataset.conversationID = conversation.conversationID

    const displayName = conversationManager.getConversationDisplayName(conversation)
    const avatarText = displayName.charAt(0).toUpperCase()
    const unreadCount = conversationManager.getConversationUnreadCount(conversation.conversationID)
    const lastMessage = conversation.latestMsg || ''
    const time = conversation.latestMsgSendTime ? messageManager.formatMessageTime(conversation.latestMsgSendTime) : ''

    item.innerHTML = `
      <div class="conversation-avatar">
        ${avatarText}
      </div>
      <div class="conversation-info">
        <div class="conversation-name">${this._escapeHtml(displayName)}</div>
        <div class="conversation-preview">${this._escapeHtml(messageManager.parseLatestMessage(lastMessage))}</div>
      </div>
      <div class="conversation-meta">
        <span class="conversation-time">${time}</span>
        ${unreadCount > 0 ? `<span class="unread-badge">${unreadCount > 99 ? '99+' : unreadCount}</span>` : ''}
      </div>
    `

    item.addEventListener('click', () => {
      this._selectConversation(conversation.conversationID)
    })

    this.elements.conversationList.prepend(item)
  }

  /**
   * 渲染会话项更新
   */
  _renderConversationItem(conversation) {
    const item = this.elements.conversationList.querySelector(
      `[data-conversation-id="${conversation.conversationID}"]`
    )
    if (item) {
      // 更新未读数
      const unreadBadge = item.querySelector('.unread-badge')
      const unreadCount = conversationManager.getConversationUnreadCount(conversation.conversationID)

      if (unreadCount > 0) {
        if (!unreadBadge) {
          const meta = item.querySelector('.conversation-meta')
          const badge = document.createElement('span')
          badge.className = 'unread-badge'
          meta.appendChild(badge)
        } else {
          unreadBadge.style.display = 'flex'
        }
        item.querySelector('.unread-badge').textContent = unreadCount > 99 ? '99+' : unreadCount
      } else if (unreadBadge) {
        unreadBadge.style.display = 'none'
      }

      // 更新最新消息
      const preview = item.querySelector('.conversation-preview')
      const lastMessage = conversation.latestMsg || ''
      preview.textContent = messageManager.parseLatestMessage(lastMessage)

      // 更新时间
      const timeSpan = item.querySelector('.conversation-time')
      if (conversation.latestMsgSendTime) {
        timeSpan.textContent = messageManager.formatMessageTime(conversation.latestMsgSendTime)
      }
    }
  }

  /**
   * 移除会话项
   */
  _removeConversationItem(conversationID) {
    const item = this.elements.conversationList.querySelector(
      `[data-conversation-id="${conversationID}"]`
    )
    if (item) {
      item.remove()
      if (this.state.currentConversation?.conversationID === conversationID) {
        this._showNoConversation()
      }
    }
  }

  /**
   * 选择会话
   */
  async _selectConversation(conversationID) {
    // 更新选中状态
    document.querySelectorAll('.conversation-item').forEach(item => {
      item.classList.toggle('active', item.dataset.conversationID === conversationID)
    })

    // 获取会话信息
    const conversation = conversationManager.setCurrentConversation(conversationID)
    if (!conversation) {
      return
    }

    this.state.currentConversation = conversation

    // 更新聊天头部
    const displayName = conversationManager.getConversationDisplayName(conversation)
    const avatarText = displayName.charAt(0).toUpperCase()
    this.elements.chatName.textContent = displayName
    this.elements.chatAvatarText.textContent = avatarText

    // 显示聊天区域
    this.elements.noConversation.style.display = 'none'
    this.elements.conversationView.style.display = 'flex'

    // 标记已读
    conversationManager.markConversationRead(conversationID)

    // 加载消息
    await this._loadMessages(conversationID)
  }

  /**
   * 加载消息
   */
  async _loadMessages(conversationID) {
    this.elements.messagesLoading.style.display = 'flex'
    this.elements.chatMessages.innerHTML = ''

    try {
      const messages = await messageManager.loadHistoryMessages(conversationID, 50)
      this._renderMessages(messages)
    } catch (error) {
      console.error('Failed to load messages:', error)
      this.elements.chatMessages.innerHTML = `
        <div class="empty-state">
          <p>加载消息失败</p>
        </div>
      `
    } finally {
      this.elements.messagesLoading.style.display = 'none'
    }
  }

  /**
   * 渲染消息列表
   */
  _renderMessages(messages) {
    const container = document.createElement('div')
    container.className = 'messages-container'

    let lastMessage = null

    // 按顺序渲染，最老的消息在上面，最新的在下面
    messages.forEach(msg => {
      const showTime = messageManager.shouldShowTime(msg, lastMessage)

      if (showTime && msg.sendTime) {
        const timeDiv = document.createElement('div')
        timeDiv.className = 'message-time-divider'
        timeDiv.innerHTML = `<span>${messageManager.formatMessageTime(msg.sendTime)}</span>`
        container.appendChild(timeDiv)
      }

      container.appendChild(this._createMessageElement(msg))
      lastMessage = msg
    })

    this.elements.chatMessages.appendChild(container)
    this._scrollToBottom()
  }

  /**
   * 创建消息元素
   */
  _createMessageElement(message) {
    try {
      const isSelf = message.isSend || message.sendID === imManager.getCurrentUser()?.userID
      const isSending = message.status === 'sending'
      const isFailed = message.status === 'failed'

      const bubble = document.createElement('div')
      bubble.className = `message-group ${isSelf ? 'self' : 'other'}`
      bubble.dataset.clientMsgID = message.clientMsgID

      if (isSending) bubble.classList.add('message-sending')
      if (isFailed) bubble.classList.add('message-failed')

      const content = messageManager.getMessageText(message)
      const avatarText = (message.senderNickname || 'U').charAt(0).toUpperCase()

      bubble.innerHTML = `
        <div class="message-bubble ${isSelf ? 'self' : 'other'}">
          <div class="message-bubble-avatar">${avatarText}</div>
          <div class="message-bubble-content">
            <div class="message-content">${this._escapeHtml(content)}</div>
            ${isFailed ? '<div class="message-status">发送失败</div>' : ''}
          </div>
        </div>
      `

      return bubble
    } catch (error) {
      console.error('[Main] _createMessageElement error:', error)
      const errorDiv = document.createElement('div')
      errorDiv.className = 'message-group other'
      errorDiv.textContent = '消息解析错误: ' + error.message
      return errorDiv
    }
  }

  /**
   * 追加消息
   */
  _appendMessages(messages) {
    if (!messages || messages.length === 0) return

    const container = this.elements.chatMessages.querySelector('.messages-container')
    if (!container) {
      this._renderMessages(messages)
      return
    }

    messages.forEach(msg => {
      container.appendChild(this._createMessageElement(msg))
    })

    this._scrollToBottom()
  }

  /**
   * 追加单条消息
   */
  _appendMessage(message) {
    // 确保聊天区域可见
    if (this.elements.noConversation.style.display !== 'none') {
      this.elements.noConversation.style.display = 'none'
      this.elements.conversationView.style.display = 'flex'
    }

    // 确保 chatMessages 元素存在
    if (!this.elements.chatMessages) {
      return
    }

    // 如果有多个 messages-container，只保留第一个有内容的，其他的删除
    const containers = this.elements.chatMessages.querySelectorAll('.messages-container')
    if (containers.length > 1) {
      let keptContainer = null
      containers.forEach(c => {
        if (c.children.length > 0 && !keptContainer) {
          keptContainer = c
        } else {
          c.remove()
        }
      })
    }

    // 获取或创建消息容器
    let container = this.elements.chatMessages.querySelector('.messages-container')
    if (!container) {
      container = document.createElement('div')
      container.className = 'messages-container'
      this.elements.chatMessages.appendChild(container)
    }

    const lastMessage = container.lastElementChild
    const showTime = messageManager.shouldShowTime(message, lastMessage?.dataset)

    if (showTime && message.sendTime) {
      const timeDiv = document.createElement('div')
      timeDiv.className = 'message-time-divider'
      timeDiv.innerHTML = `<span>${messageManager.formatMessageTime(message.sendTime)}</span>`
      container.appendChild(timeDiv)
    }

    const messageEl = this._createMessageElement(message)
    container.appendChild(messageEl)

    this._scrollToBottom()
  }

  /**
   * 更新消息状态
   */
  _updateMessageStatus(message) {
    const messageEl = this.elements.chatMessages.querySelector(
      `[data-client-msg-id="${message.clientMsgID}"]`
    )
    if (messageEl) {
      messageEl.classList.remove('message-sending')
      if (message.status === 'failed') {
        messageEl.classList.add('message-failed')
      }
    }
  }

  /**
   * 处理发送消息
   */
  async _handleSendMessage() {
    const content = this.elements.messageInput.value.trim()
    if (!content || !this.state.currentConversation) {
      return
    }

    const conversation = this.state.currentConversation

    try {
      if (conversationManager.isGroupConversation(conversation)) {
        await messageManager.sendTextMessage('', content, conversation.groupID)
      } else {
        await messageManager.sendTextMessage(conversation.userID, content)
      }

      this.elements.messageInput.value = ''
      this._autoResizeTextarea(this.elements.messageInput)
    } catch (error) {
      console.error('Failed to send message:', error)
      this._showToast('发送失败：' + (error.message || '未知错误'))
    }
  }

  /**
   * 处理发送图片
   */
  async _handleImageSend(file) {
    if (!file || !this.state.currentConversation) {
      return
    }

    const conversation = this.state.currentConversation

    try {
      if (conversationManager.isGroupConversation(conversation)) {
        await messageManager.sendImageMessage('', file, conversation.groupID)
      } else {
        await messageManager.sendImageMessage(conversation.userID, file)
      }

      this._showToast('图片发送成功')
    } catch (error) {
      console.error('Failed to send image:', error)
      this._showToast('发送图片失败：' + (error.message || '未知错误'))
    }
  }

  /**
   * 清空聊天记录
   */
  _handleClearHistory() {
    if (!this.state.currentConversation) return

    const conversationID = this.state.currentConversation.conversationID
    messageManager.clearMessages(conversationID)

    const container = this.elements.chatMessages.querySelector('.messages-container')
    if (container) {
      container.innerHTML = ''
    }

    this._showToast('聊天记录已清空')
  }

  /**
   * 搜索会话
   */
  _handleConversationSearch(query) {
    const items = this.elements.conversationList.querySelectorAll('.conversation-item')
    const searchTerm = query.toLowerCase().trim()

    items.forEach(item => {
      const name = item.querySelector('.conversation-name').textContent.toLowerCase()
      item.style.display = name.includes(searchTerm) ? 'flex' : 'none'
    })
  }

  /**
   * 显示聊天页面
   */
  _showChatPage() {
    this.elements.loginPage.style.display = 'none'
    this.elements.chatPage.style.display = 'block'
  }

  /**
   * 显示登录页面
   */
  _showLoginPage() {
    this.elements.chatPage.style.display = 'none'
    this.elements.loginPage.style.display = 'flex'
    this.state.currentConversation = null
    this._showNoConversation()
  }

  /**
   * 显示无会话状态
   */
  _showNoConversation() {
    this.elements.noConversation.style.display = 'flex'
    this.elements.conversationView.style.display = 'none'
    this.state.currentConversation = null
  }

  /**
   * 更新用户信息
   */
  _updateUserInfo(userId) {
    this.elements.currentUserName.textContent = userId
    this.elements.currentUserAvatar.textContent = userId.charAt(0).toUpperCase()
  }

  /**
   * 更新连接状态
   */
  _updateConnectionStatus(status) {
    const statusEl = this.elements.connectionStatus
    const statusText = statusEl.querySelector('.status-text')

    statusEl.classList.remove('connected', 'connecting')

    switch (status) {
      case 'connected':
        statusEl.classList.add('connected')
        statusText.textContent = '已连接'
        break
      case 'connecting':
        statusEl.classList.add('connecting')
        statusText.textContent = '连接中'
        break
      default:
        statusText.textContent = '未连接'
    }
  }

  /**
   * 设置登录加载状态
   */
  _setLoginLoading(loading) {
    const btn = this.elements.loginForm.querySelector('button[type="submit"]')
    const btnText = btn.querySelector('.btn-text')
    const btnLoading = btn.querySelector('.btn-loading')

    btn.disabled = loading
    btnText.style.display = loading ? 'none' : 'inline'
    btnLoading.style.display = loading ? 'inline' : 'none'
  }

  /**
   * 显示登录错误
   */
  _showLoginError(message) {
    this.elements.loginError.textContent = message
    this.elements.loginError.style.display = 'block'
  }

  /**
   * 隐藏登录错误
   */
  _hideLoginError() {
    this.elements.loginError.style.display = 'none'
  }

  /**
   * 自动调整文本框高度
   */
  _autoResizeTextarea(textarea) {
    textarea.style.height = 'auto'
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
  }

  /**
   * 滚动到底部
   */
  _scrollToBottom() {
    requestAnimationFrame(() => {
      this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight
    })
  }

  /**
   * 显示 Toast
   */
  _showToast(message, duration = 3000) {
    this.elements.toastMessage.textContent = message
    this.elements.toast.style.display = 'block'

    setTimeout(() => {
      this.elements.toast.style.display = 'none'
    }, duration)
  }

  /**
   * 显示确认对话框
   */
  _showConfirmDialog(title, message, callback) {
    this.elements.confirmTitle.textContent = title
    this.elements.confirmMessage.textContent = message
    this.elements.confirmDialog._callback = callback
    this.elements.confirmDialog.style.display = 'flex'
  }

  /**
   * 隐藏确认对话框
   */
  _hideConfirmDialog() {
    this.elements.confirmDialog.style.display = 'none'
    delete this.elements.confirmDialog._callback
  }

  /**
   * HTML 转义
   */
  _escapeHtml(text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  /**
   * 处理 Tab 切换
   */
  _handleTabSwitch(tab) {
    this.state.currentTab = tab

    // 更新 tab 按钮状态
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab)
    })

    // 切换列表显示
    if (tab === 'conversations') {
      this.elements.conversationList.style.display = 'block'
      this.elements.groupList.style.display = 'none'
      this.elements.conversationSearch.placeholder = '搜索会话...'
    } else {
      this.elements.conversationList.style.display = 'none'
      this.elements.groupList.style.display = 'block'
      this.elements.conversationSearch.placeholder = '搜索群组...'
    }
  }

  /**
   * 加载群组列表
   */
  async _loadGroups() {
    try {
      const groups = await groupManager.loadGroups()
      this._renderGroupList(groups)
    } catch (error) {
      console.error('Failed to load groups:', error)
    }
  }

  /**
   * 渲染群组列表
   */
  _renderGroupList(groups) {
    this.elements.groupList.innerHTML = ''

    if (groups.length === 0) {
      this.elements.groupList.innerHTML = `
        <div class="empty-state">
          <p>暂无群组</p>
        </div>
      `
      return
    }

    groups.forEach(group => {
      this._addGroupItem(group)
    })
  }

  /**
   * 添加群组项
   */
  _addGroupItem(group) {
    // 检查是否已存在
    const existingItem = this.elements.groupList.querySelector(
      `[data-group-id="${group.groupID}"]`
    )
    if (existingItem) {
      existingItem.remove()
    }

    const item = document.createElement('div')
    item.className = 'group-item'
    item.dataset.groupID = group.groupID

    const displayName = groupManager.getGroupDisplayName(group)
    const avatarText = displayName.charAt(0).toUpperCase()
    const memberCount = group.memberCount || 0

    item.innerHTML = `
      <div class="group-avatar">
        ${avatarText}
      </div>
      <div class="group-info">
        <div class="group-name">${this._escapeHtml(displayName)}</div>
        <div class="group-preview">${memberCount} 位成员</div>
      </div>
    `

    item.addEventListener('click', () => {
      this._selectGroup(group.groupID)
    })

    this.elements.groupList.appendChild(item)
  }

  /**
   * 渲染群组项更新
   */
  _renderGroupItem(group) {
    const item = this.elements.groupList.querySelector(
      `[data-group-id="${group.groupID}"]`
    )
    if (item) {
      const displayName = groupManager.getGroupDisplayName(group)
      const nameEl = item.querySelector('.group-name')
      if (nameEl) {
        nameEl.textContent = displayName
      }

      const memberCount = group.memberCount || 0
      const previewEl = item.querySelector('.group-preview')
      if (previewEl) {
        previewEl.textContent = `${memberCount} 位成员`
      }
    }
  }

  /**
   * 移除群组项
   */
  _removeGroupItem(groupID) {
    const item = this.elements.groupList.querySelector(
      `[data-group-id="${groupID}"]`
    )
    if (item) {
      item.remove()
      if (this.state.currentGroup?.groupID === groupID) {
        this._showNoConversation()
      }
    }
  }

  /**
   * 选择群组
   */
  async _selectGroup(groupID) {
    // 更新选中状态
    document.querySelectorAll('.group-item').forEach(item => {
      item.classList.toggle('active', item.dataset.groupID === groupID)
    })
    document.querySelectorAll('.conversation-item').forEach(item => {
      item.classList.remove('active')
    })

    // 获取群组信息
    const group = groupManager.setCurrentGroup(groupID)
    if (!group) {
      return
    }

    this.state.currentGroup = group

    // 获取群组对应的会话ID
    const conversationID = groupManager.getConversationID(groupID)

    // 尝试从会话列表中获取现有会话，如果不存在则创建临时会话对象
    let conversation = conversationManager.getConversation(conversationID)

    if (!conversation) {
      // 创建临时会话对象用于群聊
      conversation = {
        conversationID: conversationID,
        conversationType: 2, // 2 表示群聊
        groupID: groupID,
        showName: group.groupName || groupID,
        faceURL: group.faceURL || '',
        unreadCount: 0
      }
    }

    this.state.currentConversation = conversation

    // 更新聊天头部
    const displayName = groupManager.getGroupDisplayName(group)
    const avatarText = displayName.charAt(0).toUpperCase()
    this.elements.chatName.textContent = displayName
    this.elements.chatAvatarText.textContent = avatarText
    this.elements.chatStatus.textContent = `${group.memberCount || 0} 位成员`

    // 显示聊天区域
    this.elements.noConversation.style.display = 'none'
    this.elements.conversationView.style.display = 'flex'

    // 尝试加载群组会话的消息
    await this._loadMessages(conversationID)
  }

  /**
   * 检查缓存并自动登录
   */
  async _checkAndAutoLogin() {
    const cachedData = this._getLoginCache()

    if (!cachedData) {
      // 没有缓存或已过期，显示登录页
      this._showLoginPage()
      return
    }

    // 填充登录表单（用于调试，实际不需要显示）
    this.elements.serverUrl.value = cachedData.serverUrl
    this.elements.wsUrl.value = cachedData.wsUrl
    this.elements.userId.value = cachedData.userId
    this.elements.userToken.value = cachedData.token

    this._setLoginLoading(true)
    this._hideLoginError()

    try {
      // 初始化 SDK
      await imManager.init()

      // 检测当前平台
      const platformID = detectPlatform()
      console.log('[App] Detected platform:', platformID, '(platformID)')

      // 使用缓存信息登录（使用检测到的 platformID）
      await imManager.login(cachedData.userId, cachedData.token, platformID, cachedData.serverUrl, cachedData.wsUrl)

      // 更新缓存时间
      this._saveLoginCache(cachedData)

      // 更新用户信息显示
      this._updateUserInfo(cachedData.userId)

      // 加载会话列表
      await this._loadConversations()

      // 加载群组列表
      await this._loadGroups()

      // 显示聊天页面
      this._showChatPage()

    } catch (error) {
      console.error('Auto login error:', error)
      // 自动登录失败，清除缓存并显示登录页
      this._clearLoginCache()
      this._showLoginPage()
      this._showToast('自动登录失败，请重新登录')
    } finally {
      this._setLoginLoading(false)
    }
  }

  /**
   * 保存登录缓存
   */
  _saveLoginCache(loginData) {
    try {
      const cacheData = {
        ...loginData,
        timestamp: Date.now()
      }
      localStorage.setItem(this.state.cacheKey, JSON.stringify(cacheData))
    } catch (error) {
      console.error('Failed to save login cache:', error)
    }
  }

  /**
   * 获取登录缓存
   */
  _getLoginCache() {
    try {
      const cachedStr = localStorage.getItem(this.state.cacheKey)
      if (!cachedStr) {
        return null
      }

      const cachedData = JSON.parse(cachedStr)
      const now = Date.now()

      // 检查是否过期
      if (now - cachedData.timestamp > this.state.cacheExpiry) {
        this._clearLoginCache()
        return null
      }

      return cachedData
    } catch (error) {
      console.error('Failed to get login cache:', error)
      return null
    }
  }

  /**
   * 清除登录缓存
   */
  _clearLoginCache() {
    try {
      localStorage.removeItem(this.state.cacheKey)
    } catch (error) {
      console.error('Failed to clear login cache:', error)
    }
  }
}

// 创建并初始化应用
const app = new App()
app.init()
