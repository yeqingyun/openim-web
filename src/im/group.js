import imManager from './manager.js'

/**
 * 群组管理类
 */
class GroupManager {
  constructor() {
    this.groups = new Map()
    this.currentGroup = null
  }

  /**
   * 加载群组列表
   */
  async loadGroups() {
    try {
      const data = await imManager.getJoinedGroupList()
      if (data && Array.isArray(data)) {
        data.forEach(group => {
          this.groups.set(group.groupID, group)
        })
        this._notifyChange('groupsLoaded', Array.from(this.groups.values()))
        return Array.from(this.groups.values())
      }
      return []
    } catch (error) {
      console.error('Failed to load groups:', error)
      throw error
    }
  }

  /**
   * 获取所有群组
   */
  getAllGroups() {
    return Array.from(this.groups.values())
  }

  /**
   * 根据 groupID 获取群组
   * @param {string} groupID - 群组 ID
   */
  getGroup(groupID) {
    return this.groups.get(groupID)
  }

  /**
   * 设置当前群组
   * @param {string} groupID - 群组 ID
   */
  setCurrentGroup(groupID) {
    this.currentGroup = this.groups.get(groupID)
    return this.currentGroup
  }

  /**
   * 获取当前群组
   */
  getCurrentGroup() {
    return this.currentGroup
  }

  /**
   * 添加或更新群组
   * @param {Object} group - 群组对象
   */
  updateGroup(group) {
    if (group.groupID) {
      this.groups.set(group.groupID, group)
      this._notifyChange('groupUpdated', group)
    }
  }

  /**
   * 移除群组
   * @param {string} groupID - 群组 ID
   */
  removeGroup(groupID) {
    if (this.groups.has(groupID)) {
      this.groups.delete(groupID)
      if (this.currentGroup?.groupID === groupID) {
        this.currentGroup = null
      }
      this._notifyChange('groupRemoved', groupID)
    }
  }

  /**
   * 获取群组的显示名称
   * @param {Object} group - 群组对象
   */
  getGroupDisplayName(group) {
    if (!group) return ''
    return group.groupName || group.groupID || ''
  }

  /**
   * 获取群组的会话ID
   * @param {string} groupID - 群组 ID
   */
  getConversationID(groupID) {
    // OpenIM 群组会话ID格式: sg_groupID
    return `sg_${groupID}`
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
   * 清空所有群组
   */
  clear() {
    this.groups.clear()
    this.currentGroup = null
  }
}

// 导出单例
export const groupManager = new GroupManager()
export default groupManager
