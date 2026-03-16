import { getSDK, CbEvents } from '@openim/client-sdk'

class IMManager {
  constructor() {
    this.sdk = null
    this.loginStatus = false
    this.currentUser = null
    this.listeners = new Map()
  }

  /**
   * 初始化 SDK
   */
  async init() {
    try {
      console.log('[IM] Starting SDK initialization...')

      if (!this.sdk) {
        console.log('[IM] Creating SDK instance...')
        this.sdk = getSDK()
        console.log('[IM] SDK instance created')
        this._setupEventListeners()
      }

      window.IMSDK = this.sdk // 暴露 SDK 实例到全局，方便调试

      console.log('[IM] SDK initialized successfully')
      return true
    } catch (error) {
      console.error('[IM] Failed to initialize SDK:', error)
      throw error
    }
  }

  /**
   * 登录 - 使用 InitAndLoginConfig 格式，一次性完成初始化和登录
   */
  async login(userID, token, platformID, apiAddr, wsAddr) {
    try {
      if (!this.sdk) {
        throw new Error('SDK not initialized')
      }

      console.log('[IM] Calling login with:', { userID, platformID, apiAddr, wsAddr })

      // 使用 InitAndLoginConfig 格式，一次性完成初始化和登录
      const result = await this.sdk.login({
        userID,
        token,
        platformID,
        apiAddr,
        wsAddr
      })

      console.log('[IM] Login result:', result)
      console.log('[IM] Login successful:', userID)
      this.loginStatus = true
      this.currentUser = { userID }
      this._emit('loginSuccess', { userID })
      return true
    } catch (error) {
      console.error('[IM] Login failed:')
      console.error('Error object:', error)
      console.error('Error message:', error?.message)
      console.error('Error name:', error?.name)
2
      // 检查是否有 SDK 特定的错误码
      if (error?.errCode !== undefined) {
        console.error('SDK Error Code:', error.errCode)
      }
      if (error?.errMsg !== undefined) {
        console.error('SDK Error Message:', error.errMsg)
      }

      this._emit('loginError', error)
      throw error
    }
  }

  /**
   * 登出
   */
  async logout() {
    try {
      if (this.sdk && this.loginStatus) {
        await this.sdk.logout()
        this.loginStatus = false
        this.currentUser = null
        console.log('[IM] Logout successful')
        this._emit('logoutSuccess')
      }
      return true
    } catch (error) {
      console.error('[IM] Logout failed:', error)
      throw error
    }
  }

  /**
   * 获取会话列表
   */
  async getConversationList() {
    try {
      if (!this.loginStatus) {
        throw new Error('Not logged in')
      }
      const result = await this.sdk.getConversationListSplit({
        offset: 0,
        count: 100
      })
      console.log('[IM] Conversation list result:', result)
      return result.data || []
    } catch (error) {
      console.error('[IM] Failed to get conversation list:', error)
      throw error
    }
  }

  /**
   * 获取已加入的群组列表
   */
  async getJoinedGroupList(offset = 0, count = 100) {
    try {
      if (!this.loginStatus) {
        throw new Error('Not logged in')
      }
      const result = await this.sdk.getJoinedGroupListPage({
        offset,
        count
      })
      console.log('[IM] Joined group list result:', result)
      return result.data || []
    } catch (error) {
      console.error('[IM] Failed to get joined group list:', error)
      throw error
    }
  }


  /**
   * 获取消息列表
   */
  async getHistoryMessageList(conversationID, count = 20, startClientMsgID = '') {
    try {
      if (!this.loginStatus) {
        throw new Error('Not logged in')
      }
      const result = await this.sdk.getAdvancedHistoryMessageList({
        conversationID,
        count,
        startClientMsgID,
        viewType: 0
      })
      return result.data?.messageList || []
    } catch (error) {
      console.error('[IM] Failed to get history messages:', error)
      throw error
    }
  }

  /**
   * 发送文本消息
   */
  async sendTextMessage(receiverID, content, groupID = '') {
    try {
      if (!this.loginStatus) {
        throw new Error('Not logged in')
      }

      const messageResult = await this.sdk.createTextMessage(content)
      const message = messageResult.data

      const result = await this.sdk.sendMessage({
        recvID: groupID ? "" : receiverID,
        groupID: groupID,
        message
      })

      return result.data
    } catch (error) {
      console.error('[IM] Failed to send message:', error)
      throw error
    }
  }

  /**
   * 发送图片消息
   */
  async sendImageMessage(receiverID, file, groupID = '') {
    try {
      if (!this.loginStatus) {
        throw new Error('Not logged in')
      }

      const messageResult = await this.sdk.createImageMessageByFile({
        file,
        sourcePath: file.name
      })
      const message = messageResult.data

      const result = await this.sdk.sendMessage({
        recvID: groupID ? "" : receiverID,
        groupID: groupID,
        message
      })

      return result.data
    } catch (error) {
      console.error('[IM] Failed to send image message:', error)
      throw error
    }
  }

  /**
   * 标记会话已读
   */
  async markConversationRead(conversationID) {
    try {
      if (this.sdk) {
        await this.sdk.markConversationMessageAsRead(conversationID)
      }
    } catch (error) {
      console.error('[IM] Failed to mark conversation as read:', error)
      throw error
    }
  }

  /**
   * 删除会话
   */
  async deleteConversation(conversationID) {
    try {
      if (this.sdk) {
        await this.sdk.deleteConversation(conversationID)
      }
    } catch (error) {
      console.error('[IM] Failed to delete conversation:', error)
      throw error
    }
  }

  /**
   * 设置事件监听
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(callback)
  }

  /**
   * 移除事件监听
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event)
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  /**
   * 触发事件
   */
  _emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`[IM] Error in ${event} callback:`, error)
        }
      })
    }
  }

  /**
   * 设置 SDK 事件监听
   */
  _setupEventListeners() {
    // 连接状态变化
    this.sdk.on(CbEvents.OnConnecting, () => {
      console.log('[IM] Connecting...')
      this._emit('connectionChange', 'connecting')
    })

    this.sdk.on(CbEvents.OnConnectSuccess, () => {
      console.log('[IM] Connected successfully')
      this._emit('connectionChange', 'connected')
    })

    this.sdk.on(CbEvents.OnConnectFailed, (data) => {
      console.error('[IM] Connection failed:', data)
      this._emit('connectionChange', 'failed')
    })

    // 新消息
    this.sdk.on(CbEvents.OnRecvNewMessage, (data) => {
      console.log('[IM] New message received:', data)
      // SDK 返回的数据可能包含 data.data 包装层，需要提取实际消息
      const message = data?.data || data
      this._emit('newMessage', message)
    })

    this.sdk.on(CbEvents.OnRecvNewMessages, (data) => {
      // data 本身就是数组，不是 { data: [] } 格式
      const messages = Array.isArray(data) ? data : (data?.data || [])

      messages.forEach((msg) => {
        // 如果消息没有 conversationID，需要根据 sessionType 和 groupID/recvID 生成
        if (!msg.conversationID) {
          if (msg.sessionType === 3 && msg.groupID) {
            // 群聊会话ID格式: sg_groupID
            msg.conversationID = `sg_${msg.groupID}`
          } else if (msg.sessionType === 1 && msg.recvID) {
            // 单聊会话ID就是 recvID
            msg.conversationID = msg.recvID
          }
        }

        this._emit('newMessage', msg)
      })
    })

    // 会话更新
    this.sdk.on(CbEvents.OnConversationChanged, (data) => {
      console.log('[IM] Conversation changed:', data)
      this._emit('conversationChanged', data)
    })

    // 新会话
    this.sdk.on(CbEvents.OnNewConversation, (data) => {
      console.log('[IM] New conversation:', data)
      this._emit('newConversation', data)
    })

    // 用户信息更新
    this.sdk.on(CbEvents.OnSelfInfoUpdated, (data) => {
      console.log('[IM] Self info updated:', data)
      this._emit('userInfoUpdated', data)
    })

    // 被踢下线
    this.sdk.on(CbEvents.OnKickedOffline, () => {
      console.log('[IM] Kicked offline')
      this._emit('kickedOffline')
    })

    // Token 过期
    this.sdk.on(CbEvents.OnUserTokenExpired, () => {
      console.log('[IM] User token expired')
      this._emit('tokenExpired')
    })

    // Token 无效
    this.sdk.on(CbEvents.OnUserTokenInvalid, () => {
      console.log('[IM] User token invalid')
      this._emit('tokenInvalid')
    })
  }

  /**
   * 获取当前登录用户信息
   */
  getCurrentUser() {
    return this.currentUser
  }

  /**
   * 检查是否已登录
   */
  isLoggedIn() {
    return this.loginStatus
  }

  /**
   * 获取 SDK 实例
   */
  getSDK() {
    return this.sdk
  }
}

// 导出单例
export const imManager = new IMManager()
export default imManager
