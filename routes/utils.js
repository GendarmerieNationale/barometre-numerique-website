/**
 * @param timespan: can be 'day', 'week', 'month', or 'year'
 * @param endDate TODO only tmp, until we refactor the timeline requests
 * @returns {{endDate: Date, startDate: Date}} now() minus timespan, now()
 */
function getStartDate(timespan, endDate = null) {
    endDate = endDate || new Date('2022-05-01T11:00:00.000Z');
    let startDate = new Date(endDate)
    if (timespan === 'day')
        startDate.setHours(0)
    else if (timespan === 'week')
        startDate.setDate(startDate.getDate() - 7)
    else if (timespan === 'month')
        startDate.setMonth(startDate.getMonth() - 1)
    else if (timespan === 'year')
        startDate.setFullYear(startDate.getFullYear() - 1)
    else
        throw new Error('Wrong timespan parameter (supported: day, week, month, year)')
    return {startDate, endDate}
}

module.exports = {
    getStartDate: getStartDate
}