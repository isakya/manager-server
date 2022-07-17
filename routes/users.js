const router = require('koa-router')()
const User = require('./../models/userSchema')
const Menu = require('./../models/menuSchema')
const Role = require('./../models/roleSchema')
const Counter = require('./../models/counterSchema')
const util = require('./../utils/util')
const jwt = require('jsonwebtoken')
const md5 = require('md5')
router.prefix('/users')

router.prefix('/users')
router.post('/login', async ctx => {
  try {
    const { userName, userPwd } = ctx.request.body
    /**
     * 返回数据库指定的字段有3种方式
     * 1、'userId userName userEmail state role deptId roleList'
     * 2、{ userId: 1 } 1代表返回 0或不写代表不返回
     * 3、findOne().select('userId')
     */
    const res = await User.findOne({
      userName, userPwd
    }, 'userId userName userEmail state role deptId roleList') // 只返回''里面的字段
    const data = res._doc
    const token = jwt.sign({
      data
    }, 'izumi', { expiresIn: '1d' })
    if (res) {
      data.token = token
      ctx.body = util.success(data)
    } else {
      ctx.body = util.fail('账号或密码不正确')
    }
  } catch (error) {
    ctx.body = util.fail(error.msg)
  }
})

// 用户列表
router.get('/list', async (ctx) => {
  const { userId, userName, state } = ctx.request.query
  const { page, skipIndex } = util.pager(ctx.request.query)
  let params = {}
  if (userId) params.userId = userId
  if (userName) params.userName = userName
  if (state && state !== '0') params.state = state
  try {
    // 根据条件查询所有的用户列表
    const query = User.find(params, { _id: 0, userPwd: 0 })
    let list = await query.skip(skipIndex).limit(page.pageSize)
    const total = await User.countDocuments(params)
    ctx.body = util.success({
      page: {
        ...page,
        total
      },
      list
    })
  } catch (error) {
    ctx.body = uitl.fail(`查询异常:${error.stack}`)
  }
})

router.post('/delete', async (ctx) => {
  // 待删除的用户id数组

  const { userIds } = ctx.request.body
  console.log(userIds)

  /**
   * 如何更新数据库一条或多条数据
   */
  // 方法1：
  // User.updateMany({ $or: [{ userId: 10001 }, { userId: 10002 }] })

  // 方法2：
  // 注意调用数据库方法的时候没有用 await 那就是返回一个query对象，可以继续使用
  const res = await User.updateMany({ userId: { $in: userIds } }, { state: 2 })
  console.log(res, 123123)
  // 如果res.nModified > 0 那么就为更新成功
  if (res.modifiedCount) {
    ctx.body = util.success(res, `共删除成功${res.modifiedCount}条`)
    // 如果能提前结束就提前return结束，不要做else操作，else操作性能会更低点
    return
  }
  ctx.body = util.fail('删除失败')
})

// 用户新增 / 编辑
router.post('/operate', async (ctx) => {
  const { userId, userName, userEmail, mobile, job, state, roleList, deptId, action } = ctx.request.body
  if (action === 'add') {
    if (!userName || !userEmail || !deptId) {
      ctx.body = util.fail('参数错误', util.CODE.PARAM_ERROR)
      return
    }
    const res = await User.findOne({ $or: [{ userName }, { userEmail }] }, '_id userName userEmail')
    if (res) {
      ctx.body = util.fail(`系统检测到有重复的用户，信息如下：${res.userName} - ${res.userEmail}`)
    } else {
      // 让用户id自增长，$inc是把原数据查找处理再 + xxx
      const doc = await Counter.findOneAndUpdate({ _id: 'userId' }, { $inc: { sequence_value: 1 } }, { new: true })
      try {
        // 创建用户
        const user = new User({
          userId: doc.sequence_value,
          userName,
          userPwd: md5('123456'),
          userEmail,
          role: 1, // 默认普通用户，主要：这个跟菜单角色系统是不一样的
          roleList,
          job,
          state,
          deptId,
          mobile
        })
        user.save()
        ctx.body = util.success('', '用户创建成功')
      } catch (error) {
        ctx.body = util.fail(error.stack, '用户创建失败')
      }
    }
  } else {
    if (!deptId) {
      ctx.body = util.fail('部门不能为空', util.CODE.PARAM_ERROR)
      return
    }
    try {
      const res = await User.findOneAndUpdate({ userId }, { mobile, job, state, roleList, deptId })
      ctx.body = util.success('', '更新成功')
    } catch (error) {
      ctx.body = util.fail(error.stack, '更新失败')
    }

  }
})

// 获取全量用户列表
router.get('/all/list', async (ctx) => {
  try {
    const list = await User.find({}, 'userId userName userEmail')
    ctx.body = util.success(list)
  } catch (error) {
    ctx.body = util.fail(error.stack)
  }
})

// 获取用户对应的权限菜单
router.get('/getPermissionList', async (ctx) => {
  let authorization = ctx.request.headers.authorization
  let { data } = util.decoded(authorization)
  let menuList = await getMenuList(data.role, data.roleList)
  ctx.body = util.success(menuList)


})

async function getMenuList(userRole, roleKeys) {
  let rootList = []
  if (userRole === 0) {
    rootList = await Menu.find({}) || []
  } else {
    // 根据用户拥有的角色，获取权限列表
    // 现查找用户对应的角色有哪些
    let roleList = await Role.find({ _id: { $in: roleKeys } })
    let permissionList = []
    roleList.map(role => {
      let { checkedKeys, halfCheckedKeys } = role.permissionList
      permissionList = permissionList.concat([...checkedKeys, ...halfCheckedKeys])
    })
    permissionList = [...new Set(permissionList)]
    rootList = await Menu.find({ _id: { $in: permissionList } })
  }
  return util.getTreeMenu(rootList, null, [])
}

module.exports = router
