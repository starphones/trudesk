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

const _ = require('lodash')
const async = require('async')
const moment = require('moment')
const winston = require('winston')
const timeUtils = require('../helpers/time')

const ticketSchema = require('../models/ticket')

const ex = {}

function buildGraphData (arr, days, callback) {
  const graphData = []
  if (arr.length < 1) {
    return callback(graphData)
  }
  const today = moment()
    .hour(23)
    .minute(59)
    .second(59)
  const timespanArray = []
  for (let i = days; i--; ) {
    timespanArray.push(i)
  }

  arr = _.map(arr, function (i) {
    return moment(i.date).format('YYYY-MM-DD')
  })

  let counted = _.countBy(arr)

  for (let k = 0; k < timespanArray.length; k++) {
    const obj = {}
    const day = timespanArray[k]
    const d = today.clone().subtract(day, 'd')
    obj.date = d.format('YYYY-MM-DD')

    obj.value = counted[obj.date] === undefined ? 0 : counted[obj.date]

    graphData.push(obj)
  }

  counted = null

  return callback(graphData)
}

function buildAvgResponse (ticketArray, startStatuses, endStatuses, callback) {
  const cbObj = {}
  const $ticketAvg = []
  const normalizedStartStatuses = _.map(startStatuses || [], s => s.toLowerCase().replace(/\s+/g, ''))
  const normalizedEndStatuses = _.map(endStatuses || [], s => s.toLowerCase().replace(/\s+/g, ''))

  const extractStatusName = historyItem => {
    if (!historyItem) return null

    if (_.isString(historyItem.action) && historyItem.action.indexOf('ticket:set:status:') === 0) {
      return historyItem.action.replace('ticket:set:status:', '').trim().toLowerCase()
    }

    if (_.isString(historyItem.description)) {
      const match = historyItem.description.match(/status set to:\s*(.+)$/i)
      if (match && match[1]) return match[1].trim().toLowerCase()
    }

    return null
  }

  const normalizeStatus = status => (status || '').toLowerCase().replace(/\s+/g, '')

  const getBusinessSecondsBetween = (startMoment, endMoment) => {
    if (!startMoment || !endMoment || !startMoment.isValid() || !endMoment.isValid()) return 0
    if (endMoment.isBefore(startMoment)) return 0

    // Sum only weekday duration between start and end.
    let cursor = startMoment.clone()
    let seconds = 0

    while (cursor.isBefore(endMoment)) {
      const endOfDay = cursor
        .clone()
        .endOf('day')
        .add(1, 'second')
      const chunkEnd = endOfDay.isBefore(endMoment) ? endOfDay : endMoment

      // 0 = Sunday, 6 = Saturday
      const day = cursor.day()
      if (day !== 0 && day !== 6) {
        seconds += chunkEnd.diff(cursor, 'seconds')
      }

      cursor = chunkEnd
    }

    return Math.max(0, seconds)
  }

  for (let i = 0; i < ticketArray.length; i++) {
    const ticket = ticketArray[i]
    if (ticket.history === undefined || ticket.history.length < 1) continue

    const statusHistory = _.chain(ticket.history)
      .map(function (h) {
        return {
          status: extractStatusName(h),
          date: h && h.date ? moment(h.date) : null
        }
      })
      .filter(function (h) {
        return h.status && h.date && h.date.isValid()
      })
      .sortBy(function (h) {
        return h.date.valueOf()
      })
      .value()

    if (statusHistory.length < 1) continue

    const todoEvent = _.find(statusHistory, function (h) {
      return normalizedStartStatuses.indexOf(normalizeStatus(h.status)) !== -1
    })
    if (!todoEvent) continue

    const pendingEvent = _.find(statusHistory, function (h) {
      return normalizedEndStatuses.indexOf(normalizeStatus(h.status)) !== -1 && h.date.isSameOrAfter(todoEvent.date)
    })
    if (!pendingEvent) continue

    const diff = getBusinessSecondsBetween(todoEvent.date, pendingEvent.date)
    if (diff < 0) continue
    $ticketAvg.push(diff)
  }

  if (_.size($ticketAvg) < 1) {
    cbObj.avgResponse = timeUtils.formatDurationWords(0)
    return callback(cbObj)
  }

  const ticketAvgTotal = _.reduce(
    $ticketAvg,
    function (m, x) {
      return m + x
    },
    0
  )

  const avgSeconds = Math.round(ticketAvgTotal / _.size($ticketAvg))
  cbObj.avgResponse = timeUtils.formatDurationWords(avgSeconds)

  return callback(cbObj)
}

const init = function (tickets, callback) {
  let $tickets = []
  ex.e30 = {}
  ex.e60 = {}
  ex.e90 = {}
  ex.e180 = {}
  ex.e365 = {}
  ex.lifetime = {}
  ex.lastUpdated = moment.utc()
  const today = moment()
    .hour(23)
    .minute(59)
    .second(59)
  const e30 = today.clone().subtract(30, 'd')
  const e60 = today.clone().subtract(60, 'd')
  const e90 = today.clone().subtract(90, 'd')
  const e180 = today.clone().subtract(180, 'd')
  // e365 = today.clone().subtract(365, 'd');

  async.series(
    [
      function (done) {
        if (tickets) {
          $tickets = _.cloneDeep(tickets)

          return done()
        }

        winston.debug('No Tickets sent to cache (Pulling...)')
        ticketSchema.getForCache(function (err, tickets) {
          if (err) return done(err)

          $tickets = tickets

          return done()
        })
      },
      function (done) {
        async.series(
          {
            e365: function (c) {
              ex.e365.tickets = $tickets

              ex.e365.closedTickets = _.chain(ex.e365.tickets)
                .map('status')
                .filter(function (v) {
                  return v === 3
                })
                .value()

              buildGraphData(ex.e365.tickets, 365, function (graphData) {
                ex.e365.graphData = graphData

                // Get average Response
                buildAvgResponse(ex.e365.tickets, ['todo'], ['pending'], function (obj) {
                  ex.e365.avgResponse = obj.avgResponse
                  buildAvgResponse(ex.e365.tickets, ['in progress', 'inprogress'], ['pending'], function (obj2) {
                    ex.e365.avgInProgressToPending = obj2.avgResponse
                    buildAvgResponse(ex.e365.tickets, ['pending'], ['in progress', 'inprogress'], function (obj3) {
                      ex.e365.avgPendingToInProgress = obj3.avgResponse
                      ex.e365.tickets = _.size(ex.e365.tickets)
                      ex.e365.closedTickets = _.size(ex.e365.closedTickets)

                      // Remove all tickets more than 180 days
                      const t180 = e180.toDate().getTime()
                      $tickets = _.filter($tickets, function (t) {
                        return t.date > t180
                      })

                      return c()
                    })
                  })
                })
              })
            },
            e180: function (c) {
              ex.e180.tickets = $tickets

              ex.e180.closedTickets = _.chain(ex.e180.tickets)
                .map('status')
                .filter(function (v) {
                  return v === 3
                })
                .value()

              buildGraphData(ex.e180.tickets, 180, function (graphData) {
                ex.e180.graphData = graphData

                buildAvgResponse(ex.e180.tickets, ['todo'], ['pending'], function (obj) {
                  ex.e180.avgResponse = obj.avgResponse
                  buildAvgResponse(ex.e180.tickets, ['in progress', 'inprogress'], ['pending'], function (obj2) {
                    ex.e180.avgInProgressToPending = obj2.avgResponse
                    buildAvgResponse(ex.e180.tickets, ['pending'], ['in progress', 'inprogress'], function (obj3) {
                      ex.e180.avgPendingToInProgress = obj3.avgResponse
                      ex.e180.tickets = _.size(ex.e180.tickets)
                      ex.e180.closedTickets = _.size(ex.e180.closedTickets)

                      // Remove all tickets more than 90 days
                      const t90 = e90.toDate().getTime()
                      $tickets = _.filter($tickets, function (t) {
                        return t.date > t90
                      })

                      return c()
                    })
                  })
                })
              })
            },
            e90: function (c) {
              ex.e90.tickets = $tickets

              ex.e90.closedTickets = _.chain(ex.e90.tickets)
                .map('status')
                .filter(function (v) {
                  return v === 3
                })
                .value()

              buildGraphData(ex.e90.tickets, 90, function (graphData) {
                ex.e90.graphData = graphData

                buildAvgResponse(ex.e90.tickets, ['todo'], ['pending'], function (obj) {
                  ex.e90.avgResponse = obj.avgResponse
                  buildAvgResponse(ex.e90.tickets, ['in progress', 'inprogress'], ['pending'], function (obj2) {
                    ex.e90.avgInProgressToPending = obj2.avgResponse
                    buildAvgResponse(ex.e90.tickets, ['pending'], ['in progress', 'inprogress'], function (obj3) {
                      ex.e90.avgPendingToInProgress = obj3.avgResponse
                      ex.e90.tickets = _.size(ex.e90.tickets)
                      ex.e90.closedTickets = _.size(ex.e90.closedTickets)

                      // Remove all tickets more than 60 days
                      const t60 = e60.toDate().getTime()
                      $tickets = _.filter($tickets, function (t) {
                        return t.date > t60
                      })

                      return c()
                    })
                  })
                })
              })
            },
            e60: function (c) {
              ex.e60.tickets = $tickets

              ex.e60.closedTickets = _.chain(ex.e60.tickets)
                .map('status')
                .filter(function (v) {
                  return v === 3
                })
                .value()

              buildGraphData(ex.e60.tickets, 60, function (graphData) {
                ex.e60.graphData = graphData

                buildAvgResponse(ex.e60.tickets, ['todo'], ['pending'], function (obj) {
                  ex.e60.avgResponse = obj.avgResponse
                  buildAvgResponse(ex.e60.tickets, ['in progress', 'inprogress'], ['pending'], function (obj2) {
                    ex.e60.avgInProgressToPending = obj2.avgResponse
                    buildAvgResponse(ex.e60.tickets, ['pending'], ['in progress', 'inprogress'], function (obj3) {
                      ex.e60.avgPendingToInProgress = obj3.avgResponse
                      ex.e60.tickets = _.size(ex.e60.tickets)
                      ex.e60.closedTickets = _.size(ex.e60.closedTickets)

                      // Remove all tickets more than 30 days
                      const t30 = e30.toDate().getTime()
                      $tickets = _.filter($tickets, function (t) {
                        return t.date > t30
                      })

                      return c()
                    })
                  })
                })
              })
            },
            e30: function (c) {
              ex.e30.tickets = $tickets

              ex.e30.closedTickets = _.chain(ex.e30.tickets)
                .map('status')
                .filter(function (v) {
                  return v === 3
                })
                .value()

              buildGraphData(ex.e30.tickets, 30, function (graphData) {
                ex.e30.graphData = graphData

                buildAvgResponse(ex.e30.tickets, ['todo'], ['pending'], function (obj) {
                  ex.e30.avgResponse = obj.avgResponse
                  buildAvgResponse(ex.e30.tickets, ['in progress', 'inprogress'], ['pending'], function (obj2) {
                    ex.e30.avgInProgressToPending = obj2.avgResponse
                    buildAvgResponse(ex.e30.tickets, ['pending'], ['in progress', 'inprogress'], function (obj3) {
                      ex.e30.avgPendingToInProgress = obj3.avgResponse
                      ex.e30.tickets = _.size(ex.e30.tickets)
                      ex.e30.closedTickets = _.size(ex.e30.closedTickets)

                      return c()
                    })
                  })
                })
              })
            }
          },
          function (err) {
            return done(err)
          }
        )
      }
    ],
    function (err) {
      $tickets = null
      return callback(err, ex)
    }
  )
}

module.exports = init
