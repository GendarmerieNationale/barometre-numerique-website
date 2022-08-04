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

function getBetweenDate(startDate, endDate) {
    const date1 = new Date(startDate);
    const date2 = new Date(endDate);
    const difference_in_Time = date2.getTime() - date1.getTime();
    const difference_in_Days = difference_in_Time / (1000 * 3600 * 24);
    
    if (difference_in_Days < 365)
        return 'date'
    else
        return 'month'
}

function getBetweenDateTime(startDate, endDate) {
    const date1 = new Date(startDate);
    const date2 = new Date(endDate);
    const difference_in_Time = date2.getTime() - date1.getTime();
    const difference_in_Days = difference_in_Time / (1000 * 3600 * 24);
    
    if (difference_in_Days < 2)
        return 'datetime'
    else if (difference_in_Days < 30)
        return 'datetime::date'
    else if (difference_in_Days < 365)
        return 'datetime::date'
    else
        return 'date_trunc(\'month\',datetime)::date'
}

function getBetweenHour(startDate, endDate) {
    const date1 = new Date(startDate);
    const date2 = new Date(endDate);
    const difference_in_Time = date2.getTime() - date1.getTime();
    const difference_in_Days = difference_in_Time / (1000 * 3600 * 24);
    
    if (difference_in_Days < 2)
        return 'hour'
    else if (difference_in_Days < 30)
        return 'day'
    else if (difference_in_Days < 365)
        return 'day'
    else
        return 'month'
}

function getBetweenDateEasiWar(startDate, endDate) {
    const date1 = new Date(startDate);
    const date2 = new Date(endDate);
    const difference_in_Time = date2.getTime() - date1.getTime();
    const difference_in_Days = difference_in_Time / (1000 * 3600 * 24);

    if (difference_in_Days < 365)
        return 'date'
    else
        return 'date_trunc(\'month\', date)::date'
}

module.exports = {
    getStartDate: getStartDate,
    getBetweenDate: getBetweenDate,
    getBetweenDateTime: getBetweenDateTime,
    getBetweenHour: getBetweenHour,
    getBetweenDateEasiWar: getBetweenDateEasiWar
}