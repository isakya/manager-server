const Koa = require('koa')
const app = new Koa()
const views = require('koa-views')
const json = require('koa-json')
const onerror = require('koa-onerror')
const bodyparser = require('koa-bodyparser')
const logger = require('koa-logger')
const log4js = require('./utils/log4j.js')
const router = require('koa-router')()
// 校验token中间件
const koajwt = require('koa-jwt')
const util = require('./utils/util')

const users = require('./routes/users')
const menus = require('./routes/menus')
const roles = require('./routes/roles')
const depts = require('./routes/depts')
const leave = require('./routes/leave')
const test = require('./routes/test')

const cors = require('@koa/cors')
app.use(cors())  // 放到最前面，引用以后

require('./config/db')
// error handler
onerror(app)

// middlewares
app.use(bodyparser({
  enableTypes: ['json', 'form', 'text']
}))
app.use(json())
app.use(logger())
app.use(require('koa-static')(__dirname + '/public'))

app.use(views(__dirname + '/views', {
  extension: 'pug'
}))

// logger
app.use(async (ctx, next) => {
  log4js.info(`get params:${JSON.stringify(ctx.request.query)}`)
  log4js.info(`post params:${JSON.stringify(ctx.request.body)}`)
  await next().catch((err) => {
    if (err.status === 401) {
      ctx.status = 200
      ctx.body = util.fail('Token认证失败', util.CODE.AUTH_ERROR)
    } else {
      throw err
    }
  })
})
// 校验是否有效
app.use(koajwt({ secret: 'izumi' }).unless({
  path: [/^\/api\/users\/login/] // 排除登陆接口
}))
router.prefix('/api')

router.use(users.routes(), users.allowedMethods())
router.use(menus.routes(), menus.allowedMethods())
router.use(roles.routes(), roles.allowedMethods())
router.use(depts.routes(), depts.allowedMethods())
router.use(leave.routes(), leave.allowedMethods())
router.use(test.routes(), test.allowedMethods())

app.use(router.routes(), router.allowedMethods())
// error-handling
app.on('error', (err, ctx) => {
  log4js.error(`${err.stack}`)
})

module.exports = app
