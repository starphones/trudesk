const timeUtils = {}

timeUtils.formatDurationWords = function (seconds) {
  const totalSeconds = Math.max(0, parseInt(seconds, 10) || 0)

  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const mins = Math.floor((totalSeconds % 3600) / 60)

  if (days > 0) {
    const parts = [`${days} ${days === 1 ? 'Day' : 'Days'}`]
    if (hours > 0) parts.push(`${hours} ${hours === 1 ? 'Hour' : 'Hours'}`)
    if (mins > 0) parts.push(`${mins} ${mins === 1 ? 'Min' : 'Mins'}`)
    return parts.join(' ')
  }

  if (hours > 0) {
    const parts = [`${hours} ${hours === 1 ? 'Hour' : 'Hours'}`]
    if (mins > 0) parts.push(`${mins} ${mins === 1 ? 'Min' : 'Mins'}`)
    return parts.join(' ')
  }

  return `${mins} ${mins === 1 ? 'Min' : 'Mins'}`
}

module.exports = timeUtils
