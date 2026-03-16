import imManager from './manager.js'

/**
 * 消息管理类
 */
class MessageManager {
  constructor() {
    this.messages = new Map() // conversationID -> messages array
    this.sendingMessages = new Set()
  }

  /**
   * 获取会话的历史消息
   * @param {string} conversationID - 会话 ID
   * @param {number} count - 消息数量
   * @param {string} startClientMsgID - 起始消息 ID
   */
  async loadHistoryMessages(conversationID, count = 20, startClientMsgID = '') {
    try {
      const messageList = await imManager.getHistoryMessageList(conversationID, count, startClientMsgID)
      this._addMessages(conversationID, messageList)
      return messageList
    } catch (error) {
      console.error('Failed to load history messages:', error)
      throw error
    }
  }

  /**
   * 获取会话的所有消息
   * @param {string} conversationID - 会话 ID
   */
  getMessages(conversationID) {
    return this.messages.get(conversationID) || []
  }

  /**
   * 添加消息到列表
   * @param {string} conversationID - 会话 ID
   * @param {Array} messageList - 消息列表
   */
  _addMessages(conversationID, messageList) {
    if (!this.messages.has(conversationID)) {
      this.messages.set(conversationID, [])
    }
    const messages = this.messages.get(conversationID)

    // 避免重复添加
    const existingIDs = new Set(messages.map(msg => msg.clientMsgID))
    const newMessages = messageList.filter(msg => !existingIDs.has(msg.clientMsgID))

    messages.push(...newMessages)
    this._notifyChange('messagesUpdated', {
      conversationID,
      messages: newMessages
    })
  }

  /**
   * 添加单条新消息
   * @param {Object} message - 消息对象
   */
  addMessage(message) {
    const conversationID = message.conversationID
    if (!conversationID) {
      return
    }

    if (!this.messages.has(conversationID)) {
      this.messages.set(conversationID, [])
    }

    const messages = this.messages.get(conversationID)
    const existingIndex = messages.findIndex(msg => msg.clientMsgID === message.clientMsgID)

    if (existingIndex > -1) {
      // 更新已存在的消息
      messages[existingIndex] = message
    } else {
      // 添加新消息
      messages.push(message)
    }

    this._notifyChange('newMessage', {
      conversationID,
      message
    })
  }

  /**
   * 更新消息状态
   * @param {string} clientMsgID - 客户端消息 ID
   * @param {string} status - 状态
   */
  updateMessageStatus(clientMsgID, status) {
    for (const [conversationID, messages] of this.messages.entries()) {
      const message = messages.find(msg => msg.clientMsgID === clientMsgID)
      if (message) {
        message.status = status
        this._notifyChange('messageStatusUpdated', {
          conversationID,
          message
        })
        break
      }
    }
  }

  /**
   * 发送文本消息
   * @param {string} receiverID - 接收者 ID
   * @param {string} content - 消息内容
   * @param {string} groupID - 群组 ID
   */
  async sendTextMessage(receiverID, content, groupID = '') {
    const sdk = imManager.getSDK()
    if (!sdk) {
      throw new Error('SDK not initialized')
    }

    // 先创建 SDK 消息对象，获取正确的 clientMsgID
    const messageResult = await sdk.createTextMessage(content)
    const sdkMessage = messageResult.data
    const clientMsgID = sdkMessage.clientMsgID

    // 群组会话ID格式: sg_groupID
    const conversationID = groupID ? `sg_${groupID}` : receiverID

    // 创建临时消息对象（使用 SDK 的消息结构）
    const tempMessage = {
      ...sdkMessage,
      conversationID,
      sendID: imManager.getCurrentUser()?.userID || '',
      recvID: receiverID,
      groupID,
      status: 1, // sending
    }

    // 添加到消息列表
    this.addMessage(tempMessage)
    this.sendingMessages.add(clientMsgID)

    try {
      const result = await imManager.sendTextMessage(receiverID, content, groupID)

      // 发送成功后，使用服务器返回的消息更新本地消息
      if (result && result.clientMsgID) {
        this.addMessage(result)
      }

      this.sendingMessages.delete(clientMsgID)
      return result
    } catch (error) {
      this.updateMessageStatus(clientMsgID, 3) // failed
      this.sendingMessages.delete(clientMsgID)
      throw error
    }
  }

  /**
   * 发送图片消息
   * @param {string} receiverID - 接收者 ID
   * @param {File} file - 图片文件
   * @param {string} groupID - 群组 ID
   */
  async sendImageMessage(receiverID, file, groupID = '') {
    const sdk = imManager.getSDK()
    if (!sdk) {
      throw new Error('SDK not initialized')
    }

    // 先创建 SDK 消息对象，获取正确的 clientMsgID
    const messageResult = await sdk.createImageMessageByFile({
      file,
      sourcePath: file.name
    })
    const sdkMessage = messageResult.data
    const clientMsgID = sdkMessage.clientMsgID

    // 群组会话ID格式: sg_groupID
    const conversationID = groupID ? `sg_${groupID}` : receiverID

    // 创建临时消息对象（使用 SDK 的消息结构）
    const tempMessage = {
      ...sdkMessage,
      conversationID,
      sendID: imManager.getCurrentUser()?.userID || '',
      recvID: receiverID,
      groupID,
      status: 1, // sending
    }

    this.addMessage(tempMessage)
    this.sendingMessages.add(clientMsgID)

    try {
      const result = await imManager.sendImageMessage(receiverID, file, groupID)

      // 发送成功后，使用服务器返回的消息更新本地消息
      if (result && result.clientMsgID) {
        this.addMessage(result)
      }

      this.sendingMessages.delete(clientMsgID)
      return result
    } catch (error) {
      this.updateMessageStatus(clientMsgID, 3) // failed
      this.sendingMessages.delete(clientMsgID)
      throw error
    }
  }

  /**
   * 生成客户端消息 ID
   */
  _generateClientMsgID() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 获取消息的文本内容
   * @param {Object} message - 消息对象
   */
  getMessageText(message) {
    if (!message) return ''

    // 尝试从 textElem 获取文本内容
    if (message.textElem && message.textElem.content) {
      return message.textElem.content
    }

    // 尝试解析 content (JSON 字符串)
    if (message.content) {
      try {
        const parsed = JSON.parse(message.content)
        if (parsed.text) return parsed.text
        if (parsed.content) return parsed.content
      } catch {
        // 如果不是 JSON，直接返回
        if (typeof message.content === 'string' && message.content.length < 100) {
          return message.content
        }
      }
    }

    // 根据 contentType 返回默认文本
    switch (message.contentType) {
      case 101: // 文本消息
        return ''
      case 102: // 图片消息
        return '[图片]'
      case 103: // 语音消息
        return '[语音]'
      case 104: // 视频消息
        return '[视频]'
      case 105: // 文件消息
        return '[文件]'
      case 106: // 位置消息
        return '[位置]'
      case 107: // 自定义消息
        return '[自定义消息]'
      case 108: // 合并消息
        return '[聊天记录]'
      case 109: // 名片消息
        return '[名片]'
      case 110: // 表情消息
        return '[表情]'
      case 111: // 引用消息
        return '[引用消息]'
      default:
        return '[未知消息]'
    }
  }

  /**
   * 解析会话的最新消息文本
   * @param {string} latestMsg - JSON 字符串格式的消息
   */
  parseLatestMessage(latestMsg) {
    if (!latestMsg) return ''

    try {
      const parsed = JSON.parse(latestMsg)

      // 检查文本消息
      if (parsed.textElem && parsed.textElem.content) {
        return parsed.textElem.content
      }

      // 检查图片消息
      if (parsed.contentType === 102) {
        return '[图片]'
      }

      // 检查语音消息
      if (parsed.contentType === 103) {
        return '[语音]'
      }

      // 检查视频消息
      if (parsed.contentType === 104) {
        return '[视频]'
      }

      // 检查文件消息
      if (parsed.contentType === 105) {
        return '[文件]'
      }

      return '[消息]'
    } catch {
      return latestMsg
    }
  }

  /**
   * 格式化消息时间
   * @param {number} timestamp - 时间戳
   */
  formatMessageTime(timestamp) {
    if (!timestamp) return ''

    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date

    // 今天
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    }

    // 昨天
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    if (date.toDateString() === yesterday.toDateString()) {
      return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    }

    // 一周内
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      return weekdays[date.getDay()] + ' ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    }

    // 更早
    return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) + ' ' +
      date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  /**
   * 判断是否显示时间戳
   * @param {Object} currentMessage - 当前消息
   * @param {Object} previousMessage - 上一条消息
   */
  shouldShowTime(currentMessage, previousMessage) {
    if (!previousMessage) return true
    if (!currentMessage || !currentMessage.sendTime) return false

    const timeDiff = currentMessage.sendTime - (previousMessage.sendTime || 0)
    // 如果时间差超过 5 分钟，显示时间戳
    return timeDiff > 5 * 60 * 1000
  }

  /**
   * 注册变更监听
   */
  onChange(event, callback) {
    if (!this.changeListeners) {
      this.changeListeners = new Map()
    }
    if (!this.changeListeners.has(event)) {
      this.changeListeners.set(event, [])
    }
    this.changeListeners.get(event).push(callback)
  }

  /**
   * 移除变更监听
   */
  offChange(event, callback) {
    if (this.changeListeners && this.changeListeners.has(event)) {
      const listeners = this.changeListeners.get(event)
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  /**
   * 通知变更
   */
  _notifyChange(event, data) {
    if (this.changeListeners && this.changeListeners.has(event)) {
      this.changeListeners.get(event).forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in ${event} callback:`, error)
        }
      })
    }
  }

  /**
   * 清空指定会话的消息
   * @param {string} conversationID - 会话 ID
   */
  clearMessages(conversationID) {
    this.messages.delete(conversationID)
  }

  /**
   * 清空所有消息
   */
  clearAll() {
    this.messages.clear()
    this.sendingMessages.clear()
  }
}

// 导出单例
export const messageManager = new MessageManager()
export default messageManager
