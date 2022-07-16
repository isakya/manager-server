const mongoose = require('mongoose')

const deptSchema = mongoose.Schema({
  deptName: String,
  userId: String,
  userName: String,
  userEmail: String,
  parentId: [mongoose.Types.ObjectId],
  updateTime: {
    type: Date,
    default: Date.now()
  },
  createTime: {
    type: Date,
    default: Date.now()
  }
})

/**
 * 参数一：自己写的名字
 * 参数二：定义的用户模型
 * 参数三：映射到数据库中的表名
 * */
module.exports = mongoose.model('depts', deptSchema, 'depts')