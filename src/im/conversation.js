import imManager from './manager.js'

/**
 * 会话管理类
 */
class ConversationManager {
  constructor() {
    this.conversations = new Map()
    this.currentConversation = null
    this.unreadCount = 0
  }

  /**
   * 加载会话列表
   */
  async loadConversations() {
    try {
      const data = await imManager.getConversationList()
      if (data && data.conversations) {
        data.conversations.forEach(conv => {
          this.conversations.set(conv.conversationID, conv)
        })
        this._updateUnreadCount()
        return data.conversations
      }
      return []
    } catch (error) {
      console.error('Failed to load conversations:', error)
      throw error
    }
  }

  /**
   * 获取所有会话
   */
  getAllConversations() {
    return Array.from(this.conversations.values())
  }

  /**
   * 根据会话 ID 获取会话
   * @param {string} conversationID - 会话 ID
   */
  getConversation(conversationID) {
    return this.conversations.get(conversationID)
  }

  /**
   * 设置当前会话
   * @param {string} conversationID - 会话 ID
   */
  setCurrentConversation(conversationID) {
    this.currentConversation = this.conversations.get(conversationID)
    return this.currentConversation
  }

  /**
   * 获取当前会话
   */
  getCurrentConversation() {
    return this.currentConversation
  }

  /**
   * 更新会话信息
   * @param {Object} conversation - 会话对象
   */
  updateConversation(conversation) {
    if (conversation.conversationID) {
      this.conversations.set(conversation.conversationID, conversation)
      this._updateUnreadCount()
      this._notifyChange('conversationUpdated', conversation)
    }
  }

  /**
   * 添加新会话
   * @param {Object} conversation - 会话对象
   */
  addConversation(conversation) {
    if (conversation.conversationID && !this.conversations.has(conversation.conversationID)) {
      this.conversations.set(conversation.conversationID, conversation)
      this._updateUnreadCount()
      this._notifyChange('newConversation', conversation)
    }
  }

  /**
   * 获取未读消息总数
   */
  getUnreadCount() {
    return this.unreadCount
  }

  /**
   * 获取会话的未读数
   * @param {string} conversationID - 会话 ID
   */
  getConversationUnreadCount(conversationID) {
    const conv = this.conversations.get(conversationID)
    return conv ? conv.unreadCount || 0 : 0
  }

  /**
   * 更新未读总数
   */
  _updateUnreadCount() {
    this.unreadCount = Array.from(this.conversations.values())
      .reduce((sum, conv) => sum + (conv.unreadCount || 0), 0)
    this._notifyChange('unreadCountChanged', this.unreadCount)
  }

  /**
   * 标记会话已读
   * @param {string} conversationID - 会话 ID
   */
  async markConversationRead(conversationID) {
    try {
      const sdk = imManager.getSDK()
      if (sdk) {
        await sdk.markConversationMessageAsRead(conversationID)
        const conv = this.conversations.get(conversationID)
        if (conv) {
          conv.unreadCount = 0
          this._updateUnreadCount()
          this._notifyChange('conversationUpdated', conv)
        }
      }
    } catch (error) {
      console.error('Failed to mark conversation as read:', error)
      throw error
    }
  }

  /**
   * 删除会话
   * @param {string} conversationID - 会话 ID
   */
  async deleteConversation(conversationID) {
    try {
      const sdk = imManager.getSDK()
      if (sdk) {
        await sdk.deleteConversation(conversationID)
        this.conversations.delete(conversationID)
        if (this.currentConversation?.conversationID === conversationID) {
          this.currentConversation = null
        }
        this._updateUnreadCount()
        this._notifyChange('conversationDeleted', conversationID)
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error)
      throw error
    }
  }

  /**
   * 获取会话的显示名称
   * @param {Object} conversation - 会话对象
   */
  getConversationDisplayName(conversation) {
    if (!conversation) return ''
    return conversation.showName || conversation.conversationID || ''
  }

  /**
   * 获取会话的显示头像
   * @param {Object} conversation - 会话对象
   */
  getConversationFaceURL(conversation) {
    if (!conversation) return ''
    return conversation.faceURL || ''
  }

  /**
   * 判断是否为群聊
   * @param {Object} conversation - 会话对象
   */
  isGroupConversation(conversation) {
    return conversation?.conversationType === 2 // 2 表示群聊
  }

  /**
   * 判断是否为单聊
   * @param {Object} conversation - 会话对象
   */
  isSingleConversation(conversation) {
    return conversation?.conversationType === 1 // 1 表示单聊
  }

  /**
   * 注册变更监听
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
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
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
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
   * 清空所有会话
   */
  clear() {
    this.conversations.clear()
    this.currentConversation = null
    this.unreadCount = 0
  }
}

// 导出单例
export const conversationManager = new ConversationManager()
export default conversationManager
