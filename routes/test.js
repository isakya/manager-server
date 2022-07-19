const router = require('koa-router')()
router.get('/test', async (ctx) => {
  ctx.body = '测试通过'
})

module.exports = router