const express = require('express')
const router = express.Router()

const db = require('../db')

/**
 * @tags iggn - Statistiques sur les réclamations effectuées par les particuliers auprès de l'IGGN
 */


/**
 * GET /api/iggn/n-reclamations/{year}
 * @tags iggn
 * @summary Nombre de réclamations effectuées par les particuliers auprès de l'IGGN sur l'année sélectionnée
 * @param {number} year.path.required - Année sélectionnée
 * @return {object} 200 - Réponse réussie.
 * @example response - 200 - Exemple de réponse réussie.
 * {
 *   "n_reclamations": 1783
 * }
 * @example response - 404 - Données non disponibles pour l'année choisie
 * {}
 */
router.get('/n-reclamations/:year', (req, res, next) => {
    db
        .query(
            'select n_reclamations from iggn_nb_reclamations where annee=$1',
            [req.params.year]
        )
        .then(result => {
            if (result.rows.length > 0)
                res.send(result.rows[0])
            else
                res.status(404).send({})
        })
        .catch(next)
})

/**
 * GET /api/iggn/perc-manquements/{year}
 * @tags iggn
 * @summary Pourcentage des réclamations de particuliers révélant des manquements déontologiques.
 * @param {number} year.path.required - Année sélectionnée
 * @return {object} 200 - Réponse réussie.
 * @example response - 200 - Exemple de réponse réussie.
 * {
 *   "pourcentage_manquements": 0.1
 * }
 * @example response - 404 - Données non disponibles pour l'année choisie
 * {}
 */
router.get('/perc-manquements/:year', (req, res, next) => {
    db
        .query(
            'select pourcentage_manquements from iggn_pourcentage_manquements where annee=$1',
            [req.params.year]
        )
        .then(result => {
            if (result.rows.length > 0)
                res.send(result.rows[0])
            else
                res.status(404).send({})
        })
        .catch(next)
})

module.exports = router
