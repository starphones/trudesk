/*
 *       .                             .o8                     oooo
 *    .o8                             "888                     `888
 *  .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
 *    888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
 *    888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
 *    888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
 *    "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 *  ========================================================================
 *  Author:     Chris Brame
 *  Updated:    1/20/19 4:43 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

const NodeCache = require('node-cache')
const async = require('async')
const path = require('path')
const nconf = require('nconf')
const _ = require('lodash')
const winston = require('../logger')
const moment = require('moment-timezone')

const truCache = {}
let cache

global.env = process.env.NODE_ENV || 'production'

function loadConfig () {
  nconf.file({
    file: path.join(__dirname, '/../../config.yml'),
    format: require('nconf-yaml')
  })

  nconf.defaults({
    base_dir: __dirname
  })
}

let refreshTimer
let lastUpdated = moment.utc().tz(process.env.TIMEZONE || 'America/New_York')

truCache.init = function (callback) {
  cache = new NodeCache({
    checkperiod: 0
  })

  truCache.refreshCache(function () {
    winston.debug('Cache Loaded')
    // restartRefreshClock()

    return callback()
  })
}

function restartRefreshClock () {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }

  lastUpdated = moment()

  refreshTimer = setInterval(function () {
    truCache.refreshCache()
    winston.debug('Refreshing Cache...')
  }, 55 * 60 * 1000)
}

truCache.refreshCache = function (callback) {
  async.waterfall(
    [
      function (done) {
        const ticketSchema = require('../models/ticket')
        ticketSchema.getForCache(function (e, tickets) {
          if (e) return done(e)
          winston.debug('Pulled ' + tickets.length)

          return done(null, tickets)
        })
      },

      function (tickets, cb) {
        async.parallel(
          [
            function (done) {
              const ticketStats = require('./ticketStats')
              ticketStats(tickets, function (err, stats) {
                if (err) return done(err)
                const expire = 3600 // 1 hour
                cache.set('tickets:overview:lastUpdated', stats.lastUpdated, expire)

                cache.set('tickets:overview:e30:ticketCount', stats.e30.tickets, expire)
                cache.set('tickets:overview:e30:closedTickets', stats.e30.closedTickets, expire)
                cache.set('tickets:overview:e30:responseTime', stats.e30.avgResponse, expire)
                cache.set('tickets:overview:e30:responseTimeInProgressToPending', stats.e30.avgInProgressToPending, expire)
                cache.set('tickets:overview:e30:responseTimePendingToInProgress', stats.e30.avgPendingToInProgress, expire)
                cache.set('tickets:overview:e30:responseTimeTodoToResolved', stats.e30.avgTodoToResolved, expire)
                cache.set('tickets:overview:e30:totalResolved', stats.e30.totalResolved, expire)
                cache.set('tickets:overview:e30:totalClosed', stats.e30.totalClosed, expire)
                cache.set('tickets:overview:e30:totalRefunded', stats.e30.totalRefunded, expire)
                cache.set('tickets:overview:e30:totalResolvedOnly', stats.e30.totalResolvedOnly, expire)
                cache.set('tickets:overview:e30:totalTodo', stats.e30.totalTodo, expire)
                cache.set('tickets:overview:e30:totalPending', stats.e30.totalPending, expire)
                cache.set('tickets:overview:e30:totalInProgress', stats.e30.totalInProgress, expire)
                cache.set('tickets:overview:e30:fastestTodoToResolved', stats.e30.fastestTodoToResolved, expire)
                cache.set('tickets:overview:e30:longestTodoToResolved', stats.e30.longestTodoToResolved, expire)
                cache.set('tickets:overview:e30:graphData', stats.e30.graphData, expire)

                cache.set('tickets:overview:e60:ticketCount', stats.e60.tickets, expire)
                cache.set('tickets:overview:e60:closedTickets', stats.e60.closedTickets, expire)
                cache.set('tickets:overview:e60:responseTime', stats.e60.avgResponse, expire)
                cache.set('tickets:overview:e60:responseTimeInProgressToPending', stats.e60.avgInProgressToPending, expire)
                cache.set('tickets:overview:e60:responseTimePendingToInProgress', stats.e60.avgPendingToInProgress, expire)
                cache.set('tickets:overview:e60:responseTimeTodoToResolved', stats.e60.avgTodoToResolved, expire)
                cache.set('tickets:overview:e60:totalResolved', stats.e60.totalResolved, expire)
                cache.set('tickets:overview:e60:totalClosed', stats.e60.totalClosed, expire)
                cache.set('tickets:overview:e60:totalRefunded', stats.e60.totalRefunded, expire)
                cache.set('tickets:overview:e60:totalResolvedOnly', stats.e60.totalResolvedOnly, expire)
                cache.set('tickets:overview:e60:totalTodo', stats.e60.totalTodo, expire)
                cache.set('tickets:overview:e60:totalPending', stats.e60.totalPending, expire)
                cache.set('tickets:overview:e60:totalInProgress', stats.e60.totalInProgress, expire)
                cache.set('tickets:overview:e60:fastestTodoToResolved', stats.e60.fastestTodoToResolved, expire)
                cache.set('tickets:overview:e60:longestTodoToResolved', stats.e60.longestTodoToResolved, expire)
                cache.set('tickets:overview:e60:graphData', stats.e60.graphData, expire)

                cache.set('tickets:overview:e90:ticketCount', stats.e90.tickets, expire)
                cache.set('tickets:overview:e90:closedTickets', stats.e90.closedTickets, expire)
                cache.set('tickets:overview:e90:responseTime', stats.e90.avgResponse, expire)
                cache.set('tickets:overview:e90:responseTimeInProgressToPending', stats.e90.avgInProgressToPending, expire)
                cache.set('tickets:overview:e90:responseTimePendingToInProgress', stats.e90.avgPendingToInProgress, expire)
                cache.set('tickets:overview:e90:responseTimeTodoToResolved', stats.e90.avgTodoToResolved, expire)
                cache.set('tickets:overview:e90:totalResolved', stats.e90.totalResolved, expire)
                cache.set('tickets:overview:e90:totalClosed', stats.e90.totalClosed, expire)
                cache.set('tickets:overview:e90:totalRefunded', stats.e90.totalRefunded, expire)
                cache.set('tickets:overview:e90:totalResolvedOnly', stats.e90.totalResolvedOnly, expire)
                cache.set('tickets:overview:e90:totalTodo', stats.e90.totalTodo, expire)
                cache.set('tickets:overview:e90:totalPending', stats.e90.totalPending, expire)
                cache.set('tickets:overview:e90:totalInProgress', stats.e90.totalInProgress, expire)
                cache.set('tickets:overview:e90:fastestTodoToResolved', stats.e90.fastestTodoToResolved, expire)
                cache.set('tickets:overview:e90:longestTodoToResolved', stats.e90.longestTodoToResolved, expire)
                cache.set('tickets:overview:e90:graphData', stats.e90.graphData, expire)

                cache.set('tickets:overview:e180:ticketCount', stats.e180.tickets, expire)
                cache.set('tickets:overview:e180:closedTickets', stats.e180.closedTickets, expire)
                cache.set('tickets:overview:e180:responseTime', stats.e180.avgResponse, expire)
                cache.set(
                  'tickets:overview:e180:responseTimeInProgressToPending',
                  stats.e180.avgInProgressToPending,
                  expire
                )
                cache.set(
                  'tickets:overview:e180:responseTimePendingToInProgress',
                  stats.e180.avgPendingToInProgress,
                  expire
                )
                cache.set(
                  'tickets:overview:e180:responseTimeTodoToResolved',
                  stats.e180.avgTodoToResolved,
                  expire
                )
                cache.set('tickets:overview:e180:totalResolved', stats.e180.totalResolved, expire)
                cache.set('tickets:overview:e180:totalClosed', stats.e180.totalClosed, expire)
                cache.set('tickets:overview:e180:totalRefunded', stats.e180.totalRefunded, expire)
                cache.set('tickets:overview:e180:totalResolvedOnly', stats.e180.totalResolvedOnly, expire)
                cache.set('tickets:overview:e180:totalTodo', stats.e180.totalTodo, expire)
                cache.set('tickets:overview:e180:totalPending', stats.e180.totalPending, expire)
                cache.set('tickets:overview:e180:totalInProgress', stats.e180.totalInProgress, expire)
                cache.set('tickets:overview:e180:fastestTodoToResolved', stats.e180.fastestTodoToResolved, expire)
                cache.set('tickets:overview:e180:longestTodoToResolved', stats.e180.longestTodoToResolved, expire)
                cache.set('tickets:overview:e180:graphData', stats.e180.graphData, expire)

                cache.set('tickets:overview:e365:ticketCount', stats.e365.tickets, expire)
                cache.set('tickets:overview:e365:closedTickets', stats.e365.closedTickets, expire)
                cache.set('tickets:overview:e365:responseTime', stats.e365.avgResponse, expire)
                cache.set(
                  'tickets:overview:e365:responseTimeInProgressToPending',
                  stats.e365.avgInProgressToPending,
                  expire
                )
                cache.set(
                  'tickets:overview:e365:responseTimePendingToInProgress',
                  stats.e365.avgPendingToInProgress,
                  expire
                )
                cache.set(
                  'tickets:overview:e365:responseTimeTodoToResolved',
                  stats.e365.avgTodoToResolved,
                  expire
                )
                cache.set('tickets:overview:e365:totalResolved', stats.e365.totalResolved, expire)
                cache.set('tickets:overview:e365:totalClosed', stats.e365.totalClosed, expire)
                cache.set('tickets:overview:e365:totalRefunded', stats.e365.totalRefunded, expire)
                cache.set('tickets:overview:e365:totalResolvedOnly', stats.e365.totalResolvedOnly, expire)
                cache.set('tickets:overview:e365:totalTodo', stats.e365.totalTodo, expire)
                cache.set('tickets:overview:e365:totalPending', stats.e365.totalPending, expire)
                cache.set('tickets:overview:e365:totalInProgress', stats.e365.totalInProgress, expire)
                cache.set('tickets:overview:e365:fastestTodoToResolved', stats.e365.fastestTodoToResolved, expire)
                cache.set('tickets:overview:e365:longestTodoToResolved', stats.e365.longestTodoToResolved, expire)
                cache.set('tickets:overview:e365:graphData', stats.e365.graphData, expire)

                return done()
              })
            },
            function (done) {
              const tagStats = require('./tagStats')
              async.parallel(
                [
                  function (c) {
                    tagStats(tickets, 30, function (err, stats) {
                      if (err) return c(err)

                      cache.set('tags:30:usage', stats, 3600)

                      return c()
                    })
                  },
                  function (c) {
                    tagStats(tickets, 60, function (err, stats) {
                      if (err) return c(err)

                      cache.set('tags:60:usage', stats, 3600)

                      return c()
                    })
                  },
                  function (c) {
                    tagStats(tickets, 90, function (err, stats) {
                      if (err) return c(err)

                      cache.set('tags:90:usage', stats, 3600)

                      return c()
                    })
                  },
                  function (c) {
                    tagStats(tickets, 180, function (err, stats) {
                      if (err) return c(err)

                      cache.set('tags:180:usage', stats, 3600)

                      return c()
                    })
                  },
                  function (c) {
                    tagStats(tickets, 365, function (err, stats) {
                      if (err) return c(err)

                      cache.set('tags:365:usage', stats, 3600)

                      return c()
                    })
                  },
                  function (c) {
                    tagStats(tickets, 0, function (err, stats) {
                      if (err) return c(err)

                      cache.set('tags:0:usage', stats, 3600)

                      return c()
                    })
                  }
                ],
                function (err) {
                  return done(err)
                }
              )
            },
            function (done) {
              const quickStats = require('./quickStats')
              quickStats(tickets, function (err, stats) {
                if (err) return done(err)

                cache.set('quickstats:mostRequester', stats.mostRequester, 3600)
                cache.set('quickstats:mostCommenter', stats.mostCommenter, 3600)
                cache.set('quickstats:mostAssignee', stats.mostAssignee, 3600)
                cache.set('quickstats:mostActiveTicket', stats.mostActiveTicket, 3600)

                return done()
              })
            }
          ],
          function (err) {
            tickets = null
            return cb(err)
          }
        )
      }
    ],
    function (err) {
      if (err) return winston.warn(err)
      // Send to parent
      process.send({ cache: cache })

      cache.flushAll()

      if (_.isFunction(callback)) {
        return callback(err)
      }
    }
  )
}

// Fork of Main
;(function () {
  process.on('message', function (message) {
    if (message.name === 'cache:refresh') {
      winston.debug('Refreshing Cache....')
      const now = moment()
      const timeSinceLast = Math.round(moment.duration(now.diff(lastUpdated)).asMinutes())
      if (timeSinceLast < 5) {
        const i = 5 - timeSinceLast
        winston.debug('Cannot refresh cache for another ' + i + ' minutes')
        return false
      }

      truCache.refreshCache(function () {
        winston.debug('Cache Refreshed at ' + lastUpdated.format('hh:mm:ssa'))
        restartRefreshClock()
      })
    }

    if (message.name === 'cache:refresh:force') {
      winston.debug('Forcing Refreshing Cache....')

      truCache.refreshCache(function () {
        winston.debug('Cache Refreshed at ' + lastUpdated.format('hh:mm:ssa'))
        restartRefreshClock()
      })
    }
  })

  loadConfig()
  const db = require('../database')
  db.init(function (err) {
    if (err) return winston.error(err)
    truCache.init(function (err) {
      if (err) {
        winston.error(err)
        throw new Error(err)
      }

      return process.exit(0)
    })
  })
})()

module.exports = truCache
