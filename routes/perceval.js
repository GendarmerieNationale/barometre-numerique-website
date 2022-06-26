const express = require('express')
const router = express.Router()

const db = require('../db')
const {getStartDate} = require("./utils");

/**
 * @tags perceval - Plateforme de signalement de fraude à la carte bancaire
 */


/**
 * GET /api/perceval/n-signalements-total
 * @tags perceval
 * @summary Nombre total de signalements effectués sur la plateforme Perceval,
 *  depuis son lancement début 2020.
 * @return {object} 200 - Réponse réussie.
 * @example response - 200 - Exemple de réponse réussie.
 * {
 *   "n_signalements_total": 516957
 * }
 */
router.get('/n-signalements-total', (req, res, next) => {
    db
        .query('select sum(count) as n_signalements_total from perceval_monthly')
        .then(result => res.send(result.rows[0]))
        .catch(next)
})

/**
 * GET /api/perceval/signalements-timeline/{timespan}
 * @tags perceval
 * @summary Nombre de signalements et montants totaux par unité de temps
 *          (jour si la période sélectionnée est la semaine ou le mois,
 *          mois si la période sélectionnée est l'année)
 * @param {string} timespan.path.required - enum:week,month,year
 * @return {object} 200 - Réponse réussie.
 * @example response - 200 - Exemple de réponse réussie.
 * [
 *   {
 *     "time_dim": "2022-01-25",
 *     "n_signalements": 1000,
 *     "amount": 500000.5
 *   },
 *   {
 *     "time_dim": "2022-01-26",
 *     "n_signalements": 1001,
 *     "amount": 500000.0
 *   }
 * ]
 */
// todo: fix request with timespan=year
router.get('/signalements-timeline/:timespan', (req, res, next) => {
    let {startDate, endDate} = getStartDate(req.params.timespan, new Date('2022-02-01T11:00:00.000Z'));
    let time_sql_col = '';
    if (req.params.timespan === 'week' || req.params.timespan === 'month')
        time_sql_col = 'date';
    else if (req.params.timespan === 'year')
        time_sql_col = 'month';
    else
        throw Error('timespan should be week, month or year')
    db
        .query(
            `select ${time_sql_col} as time_dim, ` +
            '   sum(count) as n_signalements, sum(amount) as amount ' +
            'from perceval_daily ' +
            'where $1 <= date and date < $2' +
            'group by time_dim ' +
            'order by time_dim asc',
            [startDate, endDate]
        )
        .then(result => res.send(result.rows))
        .catch(next)
})


/**
 * GET /api/perceval/montant-moyen
 * @tags perceval
 * @summary Montant moyen des signalements, depuis le lancement de la plateforme
 * @return {object} 200 - Réponse réussie.
 * @example response - 200 - Exemple de réponse réussie.
 * {
 *   "montant_moy": 350.4
 * }
 */
router.get('/montant-moyen', (req, res, next) => {
    db
        .query('select avg(avg_amount) as montant_moy from perceval_monthly')
        .then(result => res.send(result.rows[0]))
        .catch(next)
})

/**
 * GET /api/perceval/age-category/{timespan}
 * @tags perceval
 * @summary Nombre de signalements par catégorie d'age de la victime
 * @param {string} timespan.path.required - enum:month,year
 * @return {object} 200 - Réponse réussie.
 * @example response - 200 - Exemple de réponse réussie.
 * [
 *   {
 *     "age_cat": "00",
 *     "n_signalements": 0
 *   },
 *   {
 *     "age_cat": "15-24",
 *     "n_signalements": 1500
 *   }
 * ]
 */
router.get('/age-category/:timespan', (req, res, next) => {
    let {startDate, endDate} = getStartDate(req.params.timespan, new Date('2022-02-01T11:00:00.000Z'));
    db
        .query(
            'select age_cat, sum(count) as n_signalements ' +
            'from perceval_age_cat ' +
            'where $1 <= month and month < $2 ' +
            'group by age_cat ' +
            'order by age_cat asc',
            [startDate, endDate]
        )
        // <HACKISH>
        // Before:
        // .then(result => res.send(result.rows))
        // After:
        .then(result => {
            result.rows[0].age_cat = "00-14"
            res.send(result.rows)
        })
        // </HACKISH>
        .catch(next);
})

/**
 * GET /api/perceval/map
 * @tags perceval
 * @summary Origine géographique des signalements
 * @return {object} 200 - Réponse réussie.
 * @example response - 200 - Exemple de réponse réussie.
 */
router.get('/map', (req, res, next) => {
    db
        .query(
            'select dpt_code, geo_dpt_iso, ' +
            '   geo_dpt_name, sum(count) as n_signalements ' +
            'from perceval_geo ' +
            'group by dpt_code, geo_dpt_iso, geo_dpt_name ' +
            'order by n_signalements desc'
        )
        .then(result => res.send(result.rows))
        .catch(next);
})

/**
 * GET /api/perceval/map-detail/{geoIso}
 * @tags perceval
 * @summary Nombre de signalements dans un département choisi
 * @param {string} geoIso.path.required - Un code [ISO 3166-2:FR](https://en.wikipedia.org/wiki/ISO_3166-2:FR)
 *          pour identifier le département ou le territoire d'outre-mer
 *          Par exemple, `FR-78` pour 'Les Yvelines' ou `FR-971` pour 'Guadeloupe'. Pour les comptes nationaux,
 *          utiliser `gn`.
 * @return {object} 200 - Réponse réussie.
 * @example response - 200 - Exemple de réponse réussie.
 */
router.get('/map-detail/:geoIso', (req, res, next) => {
    let query = '';
    let params = [];
    if (req.params.geoIso === 'gn') {
        query = 'select sum(count) as n_signalements ' +
            'from perceval_geo ';
    } else {
        query = 'select dpt_code, geo_dpt_iso, ' +
            '   geo_dpt_name, sum(count) as n_signalements ' +
            'from perceval_geo ' +
            'where geo_dpt_iso = $1 ' +
            'group by dpt_code, geo_dpt_iso, geo_dpt_name ';
        params = [req.params.geoIso];
    }

    db
        .query(query, params)
        .then(result => res.send(result.rowCount > 0 ? result.rows[0] : {}))
        .catch(next);
})

module.exports = router
