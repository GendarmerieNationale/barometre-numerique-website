const express = require('express')
const router = express.Router()

const db = require('../db')
const {getStartDate} = require("./utils");

// TODO: validate urls and args with https://joi.dev/ ? some other libraries include express-validator, but it's less used

/**
 * @tags ma-gendarmerie - Service de contact numérique de la Gendarmerie Nationale
 */

/**
 * GET /api/ma-gendarmerie/n-contact-total
 * @tags ma-gendarmerie
 * @summary Nombre total de prise de contact en ligne sur le site https://www.gendarmerie.interieur.gouv.fr/
 * @return {object} 200 - Réponse réussie.
 * @example response - 200 - Exemple de réponse réussie.
 * {
 *   "n_contact_total": 516957
 * }
 */
router.get('/n-contact-total', (req, res, next) => {
    db
        .query(`select n_contact as n_contact_total from easiware_n_contacts_total`)
        .then(result => res.send(result.rows[0]))
        .catch(next)
})

/**
 * GET /api/ma-gendarmerie/n-contact-category/{timespan}
 * @tags ma-gendarmerie
 * @summary Nombre de prise de contact par motifs (information, victime, signaler)
 * @param {string} timespan.path.required - enum:month,year
 * @return {object} 200 - Réponse réussie.
 * @example response - 200 - Exemple de réponse réussie.
 * [
 *   {
 *     "category": "demande_info",
 *     "n_contact": 6864
 *   },
 *   {
 *     "category": "victime",
 *     "n_contact": 3204
 *   },
 *   {
 *     "category": "signalement",
 *     "n_contact": 2426
 *   }
 * ]
 */
router.get('/n-contact-category/:timespan', (req, res, next) => {
    let {startDate, endDate} = getStartDate(req.params.timespan);
    db
        .query(
            'select category, sum(n_contact) as n_contact\n' +
            'from easiware_n_contacts_category\n' +
            'where $1\n <= month and month < $2' +
            'group by category\n' +
            'order by n_contact desc\n',
            [startDate, endDate]
        )
        .then(result => res.send(result.rows))
        .catch(next);
})

/**
 * GET /api/ma-gendarmerie/n-contact-timeline/{timespan}
 * @tags ma-gendarmerie
 * @summary Nombre de prise de contact par unité de temps (jour si la période sélectionnée est la semaine ou le mois,
 *          mois si la période sélectionnée est l'année)
 * @param {string} timespan.path.required - enum:week,month,year
 * @return {object} 200 - Réponse réussie.
 * @example response - 200 - Exemple de réponse réussie.
 * [
 *    {
 *         "time_dim": "2020-11-01",
 *         "cnt": 23116
 *     },
 *     {
 *         "time_dim": "2020-12-01",
 *         "cnt": 13977
 *     },
 *     {
 *         "time_dim": "2021-01-01",
 *         "cnt": 11024
 *     },
 *     {
 *         "time_dim": "2021-02-01",
 *         "cnt": 9896
 *     }
 * ]
 */
router.get('/n-contact-timeline/:timespan', (req, res, next) => {
    let {startDate, endDate} = getStartDate(req.params.timespan);
    let query = '';
    if (req.params.timespan === 'week' || req.params.timespan === 'month')
        query = 'select date as time_dim, n_contact as cnt ' +
            'from easiware_n_contacts_date ' +
            'where $1  <= date and date < $2 ' +
            'order by time_dim asc';
    else if (req.params.timespan === 'year')
        query = 'select date_trunc(\'month\', date)::date as time_dim, ' +
            '       sum(n_contact) as cnt ' +
            'from easiware_n_contacts_date ' +
            'where $1  <= date and date < $2' +
            'group by time_dim ' +
            'order by time_dim asc ';
    else
        throw Error('timespan should be week, month or year');
    db
        .query(query, [startDate, endDate])
        .then(result => res.send(result.rows))
        .catch(next);
})

/**
 * GET /api/ma-gendarmerie/affluence/daily-affluence
 * @tags ma-gendarmerie
 * @summary Affluence sur le site https://www.gendarmerie.interieur.gouv.fr/ (nombre de personnes par heure)
 * @return {object} 200 - Réponse réussie.
 * @example response - 200 - Exemple de réponse réussie.
 * [
 *     {
 *         "hour": 3,
 *         "n_contact": 3283
 *     },
 *     {
 *         "hour": 14,
 *         "n_contact": 34565
 *     },
 *     {
 *         "hour": 18,
 *         "n_contact": 32775
 *     }
 * ]
 */
router.get('/affluence/daily-affluence', (req, res, next) => {
    db
        .query(
            'select hour, n_contact as n_contact\n' +
            'from easiware_n_contacts_hour\n'
        )
        .then(result => res.send(result.rows))
        .catch(next);
})

module.exports = router
