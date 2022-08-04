const express = require('express')
const router = express.Router()

const db = require('../db')
const {getStartDate, getBetweenDateEasiWar} = require("./utils");

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
 * GET /api/ma-gendarmerie/n-contact-category/{start_date}/{end_date}
 * @tags ma-gendarmerie
 * @summary Nombre de prise de contact par motifs (information, victime, signaler)
 * @param {string} start_date.path.required - Date de début de la période sélectionnée au format YYYY-MM-DD.
 * @param {string} end_date.path.required - Date de fin de la période sélectionnée au format YYYY-MM-DD.
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
router.get('/n-contact-category/:start_date/:end_date', (req, res, next) => {
    let startDate = req.params.start_date;
    let endDate = req.params.end_date;

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
 * GET /api/ma-gendarmerie/n-contact-timeline/{start_date}/{end_date}
 * @tags ma-gendarmerie
 * @summary Nombre de prise de contact par unité de temps (jour si la période sélectionnée est la semaine ou le mois,
 *          mois si la période sélectionnée est l'année)
 * @param {string} start_date.path.required - Date de début de la période au format YYYY-MM-DD
 * @param {string} end_date.path.required - Date de fin de la période au format YYYY-MM-DD
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
router.get('/n-contact-timeline/:start_date/:end_date', (req, res, next) => {
    let startDate = req.params.start_date;
    let endDate = req.params.end_date;
    let timeDim = getBetweenDateEasiWar(startDate, endDate);

    db
        .query(
            `select ${timeDim} as time_dim, sum(n_contact) as cnt\n` +
            'from easiware_n_contacts_date\n' +
            'where $1 <= date and date < $2\n' +
            'group by time_dim order by time_dim asc\n',
            [startDate, endDate]
        )
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
