const express = require('express')
const router = express.Router()

const db = require('../db')
const {getBetweenDate} = require("./utils");


/**
 * @tags service-public-plus - Expériences concernant la GN et déposées sur ServicePublic+ (ex-VoxUsagers)
 */

/**
 * GET /api/service-public-plus/total
 * @tags service-public-plus
 * @summary Quelque métriques sur toutes les expériences
 * @return {object} 200 - Réponse réussie.
 * @example response - 200 - Exemple de réponse réussie.
 * {
 *   "exp_count": 471,
 *   "exp_pos_count": 371,
 *   "exp_moy_count": 23,
 *   "exp_neg_count": 77,
 *   "exp_answered_count": 458,
 *   "avg_days_to_response": 12.353711790393014,
 *   "p75_days_to_response": 11
 * }
 */
router.get('/total', (req, res, next) => {
    db
        .query('SELECT exp_count, exp_pos_count, exp_moy_count, exp_neg_count,' +
            ' exp_answered_count, avg_days_to_response, p75_days_to_response' +
            ' FROM exp_total')
        .then(result => res.send(result.rows[0]))
        .catch(next)
})

/**
 * GET /api/service-public-plus/map
 * @tags service-public-plus
 * @summary Nombre d'expériences dans chacun des départements.
 * @return {object} 200 - Réponse réussie.
 * @example response - 200 - Exemple de réponse réussie. Les expériences pour lesquelles `geo_dpt_iso = null` n'ont pas de département associé.
 * [
 *   {
 *     "geo_dpt_iso": null,
 *     "geo_dpt_name": null,
 *     "exp_count": 311
 *   },
 *   {
 *     "geo_dpt_iso": "FR-972",
 *     "geo_dpt_name": "Martinique",
 *     "exp_count": 3
 *   }
 * ]
 */
router.get('/map', (req, res, next) => {
    db
        .query(
            'select geo_dpt_iso, geo_dpt_name, exp_count ' +
            'from exp_geo where geo_dpt_iso is not NULL'
        )
        .then(result => res.send(result.rows))
        .catch(next)
})

/**
 * GET /api/service-public-plus/map-detail/{geoIso}
 * @tags service-public-plus
 * @summary Nombre d'expériences dans un département choisi.
 * @param {string} geoIso.path.required - Un code [ISO 3166-2:FR](https://en.wikipedia.org/wiki/ISO_3166-2:FR)
 *          pour identifier le département ou le territoire d'outre-mer
 *          Par exemple, `FR-78` pour 'Les Yvelines' ou `FR-971` pour 'Guadeloupe'. Pour les comptes nationaux,
 *          utiliser `gn`.
 * @return {object} 200 - Réponse réussie.
 * @example response - 200 - Exemple de réponse réussie.
 * {
 *   "geo_dpt_iso": "FR-971",
 *   "geo_dpt_name": "Guadeloupe",
 *   "exp_count": 2
 * }
 */
router.get('/map-detail/:geoIso', (req, res, next) => {
    let query = '';
    let params = [];
    if (req.params.geoIso === 'gn') {
        query = 'select geo_dpt_iso, geo_dpt_name, exp_count ' +
            'from exp_geo where geo_dpt_iso is NULL';
    } else {
        query = 'select geo_dpt_iso, geo_dpt_name, exp_count ' +
            'from exp_geo where geo_dpt_iso = $1';
        params = [req.params.geoIso];
    }
    db
        .query(
            query, params
        )
        .then(result => res.send(result.rowCount > 0? result.rows[0] : {}))
        .catch(next)
})

/**
 * GET /api/service-public-plus/timeline/{start_date}/{end_date}
 * @tags service-public-plus
 * @summary Nombre d'expériences par jour ou par mois, sur une période choisie.
 * @param {string} start_date.path.required - Date de début de la période, au format YYYY-MM-DD.
 * @param {string} end_date.path.required - Date de fin de la période, au format YYYY-MM-DD.
 * @return {object} 200 - Réponse réussie.
 * @example response - 200 - Exemple de réponse réussie.
 * [
 *   {
 *     "time_dim": "2020-11-01",
 *     "exp_count": 7
 *   },
 *   {
 *     "time_dim": "2020-12-01",
 *     "exp_count": 11
 *   }
 * ]
 */
router.get('/timeline/:start_date/:end_date', (req, res, next) => {
    let startDate = req.params.start_date;
    let endDate = req.params.end_date
    let time_sql_col = getBetweenDate(startDate, endDate);

    db
        .query(
            `select ${time_sql_col} as time_dim, sum(exp_count) as exp_count ` +
            'from exp_count_day ' +
            'where $1  <= date and date < $2 ' +
            'group by time_dim ' +
            'order by time_dim asc',
            [startDate, endDate]
        )
        .then(result => res.send(result.rows))
        .catch(next)
})

/**
 * GET /api/service-public-plus/structure
 * @tags service-public-plus
 * @summary Nombre total d'expériences par 'Typologie structure'
 *      (e.g. 'Service en ligne Perceval', 'Brigade de gendarmerie', etc)
 * @return {object} 200 - Réponse réussie.
 * @example response - 200 - Exemple de réponse réussie.
 * [
 *   {
 *     "typologie_structure": "Brigade de gendarmerie",
 *     "exp_count": 219
 *   },
 *   {
 *     "typologie_structure": "Pré-plainte en ligne (PPEL)",
 *     "exp_count": 11
 *   }
 * ]
 */
router.get('/structure', (req, res, next) => {
    db
        .query('SELECT typologie_structure, exp_count FROM exp_typologie ORDER BY exp_count DESC')
        .then(result => res.send(result.rows))
        .catch(next)
})

/**
 * GET /api/service-public-plus/tags
 * @tags service-public-plus
 * @summary Notes supplémentaires associées aux expériences.
 * @return {object} 200 - Réponse réussie.
 * @example response - 200 - Exemple de réponse réussie. 'total_count' = nombre total d'expériences déposées
 *          (avec ou sans tag)
 * [
 *   {
 *     "tag": "tag_accessibilite",
 *     "pos_count": 153,
 *     "neg_count": 34,
 *     "total_count": 471
 *   },
 *   {
 *     "tag": "tag_explication",
 *     "pos_count": 166,
 *     "neg_count": 30,
 *     "total_count": 471
 *   }
 * ]
 */
router.get('/tags', (req, res, next) => {
    db
        .query('SELECT tag, pos_count, med_count, neg_count, total_count FROM exp_tags')
        .then(result => res.send(result.rows))
        .catch(next)
})

module.exports = router
