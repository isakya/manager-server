/**
 * 日志存储
 * @author isakay
 */

const log4js = require('log4js')

const levels = {
  'trace': log4js.levels.TRACE,
  'debug': log4js.levels.DEBUG,
  'info': log4js.levels.INFO,
  'warn': log4js.levels.WARN,
  'error': log4js.levels.ERROR,
  'fatal': log4js.levels.FATAL,
}

log4js.configure({
  appenders: {
    // 使用console输出
    console: { type: 'console' },
    // 输出到文件当中
    info: {
      type: 'file',
      filename: 'logs/all-logs.log'
    },
    error: {
      type: 'dateFile',
      filename: 'logs/log',
      pattern: 'yyyy-MM-dd.log',
      alwaysIncludePattern: true // 设置文件名称为 filename + pattern
    }
  },
  categories: {
    // 默认debug级别
    default: { appenders: ['console'], level: 'debug' },
    info: {
      appenders: ['info', 'console'],
      level: 'info'
    },
    // 报错时是error级别
    error: {
      appenders: ['error', 'console'],
      level: 'error'
    }
  }
})

/**
 * 日志输出，level为debug
 * @param {string} content 
 */
exports.debug = (content) => {
  let logger = log4js.getLogger()
  logger.level = levels.debug
  logger.debug(content)
}

/**
 * 日志输出，level为error
 * @param {string} content 
 */
exports.error = (content) => {
  let logger = log4js.getLogger('error')
  logger.level = levels.error
  logger.error(content)
}

/**
 * 日志输出，level为info
 * @param {string} content 
 */
exports.info = (content) => {
  let logger = log4js.getLogger('info')
  logger.level = levels.info
  logger.info(content)
}