/**
 * Sort an Array of Objects according to a chosen key.
 *
 * @param array - Example:
 * [
 *  { name: 'Bob', count: 3 },
 *  { name: 'Alice', count: 5 },
 *  { name: 'Jack', count: 4 },
 * ]
 * @param sortKey - The key according to which the array should be sorted
 * @param ascending - Sort in ascending order (true by default)
 * @return {*}
 * @example
 * If sortKey === 'count', the result would be:
 * [
 *  { name: 'Bob', count: 3 },
 *  { name: 'Jack', count: 4 },
 *  { name: 'Alice', count: 5 },
 * ]
 * If sortKey === 'name', the result would be:
 * [
 *  { name: 'Alice', count: 5 },
 *  { name: 'Bob', count: 3 },
 *  { name: 'Jack', count: 4 },
 * ]
 */
function sortArrayOfObjects(array, sortKey, ascending = true) {
    if (ascending)
        return array.sort((a, b) => a[sortKey] > b[sortKey]);
    return array.sort((a, b) => a[sortKey] < b[sortKey]);
}

function replaceLabel(data, oldValue, newValue) {
    data.forEach(x => {
        if (x.label === oldValue)
            x.label = newValue
    })
}

/**
 *
 * @param number
 * @returns {string} A number formatted French style (spaces every 3 digits)
 */
function formatNumber(number) {
    return new Intl.NumberFormat('fr-FR').format(Math.floor(number));
}

function formatPercentage(number) {
    return new Intl.NumberFormat('fr-FR', {style: 'percent'}).format(number);
}

function formatEuro(number) {
    return new Intl.NumberFormat('fr-FR', {style: 'currency', currency: 'EUR'}).format(number);
}

function formatDuration(data) {
    if (data.hours) {
        console.log(`Duration exceeded what was expected (should be no more than 59min): ${data}`)
        return `...`
    }
    let {minutes, seconds, milliseconds} = data;
    return `${minutes} min. ${seconds} s.`;
}

function formatTimelineLabels(labels, timespan) {
    // Depending on the total timespan for the chart (day, week, year, ..),
    // the labels (hour of the day, day, month, ..) will be formatted differently
    let timeLabelTransforms = {
        'day': (utc_date) => {
            let hour = (new Date(utc_date)).getUTCHours();
            return `${hour}h`.padStart(3, '0');
        },
        'daily-affluence': (hour) => {
            // TODO: special case to remove? used for bnum affluence
            return `${hour}h`.padStart(3, '0');
        },
        'week': (date_str) => {
            let date = new Date(date_str);
            return date.toLocaleDateString('fr-FR', {
                weekday: 'short',
                day: 'numeric',
                month: 'numeric',
                year: 'numeric'
            });
        },
        'month': (date_str) => {
            let date = new Date(date_str);
            return date.toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'numeric',
                year: 'numeric'
            });
        },
        'year': (date_str) => {
            let date = new Date(date_str);
            return date.toLocaleDateString('fr-FR', {
                month: 'short',
                year: 'numeric'
            });
        },
    }
    return labels.map(x => timeLabelTransforms[timespan](x));
}

/**
 *
 * @param data Array of objects, e.g.:
 *    [
 *      {"motif":"Recrutement","cnt":40},
 *      {"motif":"Démarche administrative","cnt":48}
 *    ]
 * @param labelKey e.g. 'motif'
 * @param valueKey e.g. 'cnt', the key of the 'value' column
 * @param totalKey (optional) - name of the total value, if we want to obtain a percentage per row
 * @returns {*} data formatted for the vertical bar chart, with percentages.
 *  By default, the percentage is computed across the whole category chart:
 *      % for row i = values[i] / sum(values).
 *  If totalKey is specified however, the percentage is computed with a row-specific total:
 *      % for row i = values[i] / total[i]
 */
function formatForVerticalBarChart(data, labelKey, valueKey, totalKey = null) {
    let valuesTotalSum = data.reduce((prev, next) => prev + next[valueKey], 0) // sum the value items;
    data.forEach(x => {
        let total = totalKey ? x[totalKey] : valuesTotalSum;
        x.label = x[labelKey]
        // TODO: refactor bar chart to allow value to be the actual count value
        //  (and move valueText logic to bar chart as well)
        x.originalValue = x[valueKey]
        x.perc = x[valueKey] / total
        x.value = (100 * x.perc).toFixed(1)
        x.valueText = (100 * x.perc).toFixed(1) + '%'
    });
    return data
}

/**
 *
 * @param data Array of objects, e.g.:
 *    [
 *      {"motif":"Recrutement","cnt":40},
 *      {"motif":"Démarche administrative","cnt":48}
 *    ]
 * @param labelKey e.g. 'motif'
 * @param valueKey e.g. 'cnt'
 * @returns {*} data formatted for the horizontal bar chart: 2 arrays of labels and values
 */
function formatForHorizontalBarChart(data, labelKey, valueKey) {
    let labels = data.map(x => (x[labelKey]));
    let values = data.map(x => (x[valueKey]));
    return {
        'labels': labels,
        'values': values,
    }
}

function formatForMap(data, valueKey) {
    return Object.fromEntries(data.map(record => (
        // reformat data into a dictionary with geo_dpt_iso as key, and the rest as data
        [record['geo_dpt_iso'],
            {
                'geo_dpt_name': record['geo_dpt_name'],
                'value': record[valueKey],
            }]
    )))
}

function recrutementFeminisationPercentage(data, statut) {
    let n_femmes, n_hommes, percentage;
    data.forEach(x => {
        if (x.statut === statut && x.genre === 'femme')
            n_femmes = x.effectifs;
        else if (x.statut === statut && x.genre === 'homme')
            n_hommes = x.effectifs;
    })
    if (n_femmes > 0 && n_hommes > 0) {
        percentage = n_femmes / (n_femmes + n_hommes);
        return formatPercentage(percentage)
    }
    return ''
}

export default {
    // Standard transforms
    formatForHorizontalBarChart,
    formatTimelineLabels,
    formatNumber,
    formatEuro,
    formatDuration,

    // Specific transforms for a single chart
    maGendarmerieNContactMotif: function (data) {
        let tag = {
            "demande_info": "Je m'informe",
            "signalement": "Je signale",
            "victime": "Je suis victime",
        };

        data.forEach(x => x.category = tag[x.category]);
        data = formatForVerticalBarChart(data, 'category', 'n_contact');
        return data
    },
    percevalAgeCat: function (data) {
        data = formatForVerticalBarChart(data, 'age_cat', 'n_signalements');
        // data.forEach(x => x['valueText'] = formatNumber(x['originalValue']));
        return data
    },
    percevalMap: function (data) {
        return formatForMap(data, 'n_signalements');
    },
    ppelPersonType: function (data) {
        let tag = {
            "physique": "Personne physique",
            "morale": "Personne morale",
            "unknown": "Inconnu",
        };
        data.forEach(x => x.type_personne_label = tag[x.type_personne]);
        data = formatForVerticalBarChart(data, 'type_personne_label', 'n_preplaintes');
        return data
    },
    ppelMap: function (data) {
        return formatForMap(data, 'n_preplaintes');
    },
    siteWebCategoryVille: function (data) {
        data = formatForVerticalBarChart(data, 'geo_city', 'n_visits');
        return data
    },
    siteWebCategoryRegion: function (data) {
        data = formatForVerticalBarChart(data, 'geo_region_name', 'n_visits');
        replaceLabel(data, null, 'Inconnu');
        return data
    },
    siteWebCategoryPays: function (data) {
        data = formatForVerticalBarChart(data, 'geo_country', 'n_visits');
        return data
    },
    siteWebSousSites: function (data) {
        data = formatForVerticalBarChart(data, 'subsite', 'n_visits');
        replaceLabel(data, 'N/A', 'Autres');
        return data
    },
    siteWebSources: function (data) {
        data = formatForVerticalBarChart(data, 'src', 'n_visits');
        replaceLabel(data, 'N/A', 'Autres');
        return data
    },
    siteWebCategoryDevice: function (data) {
        data = formatForVerticalBarChart(data, 'device_type', 'n_visits');
        replaceLabel(data, 'N/A', 'Autres');
        return data
    },
    siteWebCategoryOS: function (data) {
        data = formatForVerticalBarChart(data, 'os_group', 'n_visits');
        replaceLabel(data, 'N/A', 'Autres');
        return data
    },
    siteWebCategoryBrowser: function (data) {
        data = formatForVerticalBarChart(data, 'browser_group', 'n_visits');
        replaceLabel(data, 'N/A', 'Autres');
        return data
    },
    recrutementFichesMetiers: function (data) {
        // Filter out fiches métiers with ver few visits, since they were probably not really used
        data = data.filter(x => x['n_visits'] > 10);
        data = formatForVerticalBarChart(data, 'metier_name', 'n_visits');
        return data
    },
    recrutementFeminisation: function (data) {
        // Filter out 'civil' data
        data = data.filter(x => x.statut === 'militaire');
        // Create an object with one entry per 'métier' category
        let dataByCategory = {};
        data.forEach(x => dataByCategory[x.categorie] = {n_hommes: 0, n_femmes: 0});
        data.forEach(x => {
            if (x.genre === 'femme')
                dataByCategory[x.categorie].n_femmes = x.effectifs;
            else if (x.genre === 'homme')
                dataByCategory[x.categorie].n_hommes = x.effectifs;
        })
        // Return an array with one entry per 'métier' category, and the right labels for
        // the category chart component
        let result = Object.entries(dataByCategory).map(
            ([category, {n_hommes, n_femmes}]) => {
                let perc = n_femmes / (n_femmes + n_hommes);
                return {
                    'label': category,
                    'perc': perc,
                    'value': (100 * perc).toFixed(0),
                    'valueText': (100 * perc).toFixed(0) + '%'
                }
            });
        // result = sortArrayOfObjects(result, 'perc', false);
        // <HACKISH>
        let hackish_result = [];
        for (const x of result) {
            if (x.label === 'Officier de gendarmerie') {
                hackish_result.push(x)
                break
            }
        }
        for (const x of result) {
            if (x.label === 'Sous-officier de gendarmerie') {
                hackish_result.push(x)
                break
            }
        }
        hackish_result.push({break: true})
        for (const x of result) {
            if (x.label === 'Officier du corps technique et administratif') {
                hackish_result.push(x)
                break
            }
        }
        for (const x of result) {
            if (x.label === 'Sous-officier du corps de soutien technique et administratif de la gendarmerie') {
                hackish_result.push(x)
                break
            }
        }
        hackish_result.push({break: true})
        for (const x of result) {
            if (x.label === 'Gendarme adjoint volontaire') {
                hackish_result.push(x)
                break
            }
        }
        // </HACKISH>
        return hackish_result
    },
    recrutementFeminisationPercMilitaire: function (data) {
        return recrutementFeminisationPercentage(data, 'militaire');
    },
    recrutementFeminisationPercCivil: function (data) {
        return recrutementFeminisationPercentage(data, 'civil');
    },
    socialNetworkMap: function (data) {
        return formatForMap(data, 'n_followers');
    },
    socialNetworkFollowers: function (data) {
        data = formatForVerticalBarChart(data, 'page_name', 'n_followers');
        data.forEach(x => x.valueText = formatNumber(x.originalValue));
        data.forEach(x => x.labelUrl = x.page_url)
        return data
    },
    spplusPercentageResponse: function (data) {
        return formatPercentage(data['exp_answered_count'] / data['exp_count']);
    },
    spplusMap: function (data) {
        // todo: fix corse, the map does not accept FR-2A or FR-2B...
        return formatForMap(data, 'exp_count');
    },
    spplusStructures: function (data) {
        data = formatForVerticalBarChart(data, 'typologie_structure', 'exp_count');
        data.forEach(x => x['valueText'] = formatNumber(x['originalValue']));
        return data
    },
    spplusTags: function (data) {
        let tagNames = {
            'tag_accessibilite': 'Accessibilité',
            'tag_explication': 'Explication',
            'tag_relation': 'Relation',
            'tag_reactivite': 'Réactivité',
            'tag_simplicite': 'Simplicité',
        }
        data.forEach(x => {
            x['tagName'] = tagNames[x['tag']];
            x['total_tag_count'] = x['pos_count'] + x['med_count'] + x['neg_count'];
        });
        data = formatForVerticalBarChart(data, 'tagName', 'pos_count', 'total_tag_count');
        data = sortArrayOfObjects(data, 'perc', false);
        return data
    },
    iggnManquements: function (data) {
        if (Object.entries(data).length === 0)
            return [];

        let categoryData = [
            {label: "Manquements non-avérés", value: 1 - data.pourcentage_manquements},
            {label: "Manquements avérés", value: data.pourcentage_manquements},
        ];
        return formatForVerticalBarChart(categoryData, 'label', 'value')
    },
}