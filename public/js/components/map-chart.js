import transforms from "../transforms.js";

class MapChart extends HTMLElement {
    connectedCallback() {
        this.baseUrl = this.getAttribute('data-url');
        this.transform = transforms[this.getAttribute('data-transform')];
    }

    render(svg) {
        return `
<style>
svg
{
  /* fill: var(--background-disabled-grey); */
  stroke: var(--background-contrast-grey);
  /* stroke: black; */
  stroke-width: 0.35%;
}
</style>
${svg}
`
    }

    initialUpdate(selectedTag) {
        fetch('svg/fr-map.svg')
            .then(response => response.text())
            .then(svg => this.innerHTML = this.render(svg))
            .then(() => this.updateData(selectedTag))
            .then(() => this.getDepartments().forEach(
                elem => this.addEventListenersToDepartment(elem)
            ));
    }

    /**
     * Update the colors of each department to match the data
     * corresponding to the selectedTag
     *
     * Assumes that the transform function returns a list of mappings
     * from departments to the department data, e.g.
     * [
     *     "FR-77": {
     *          "geo_dpt_name": "Seine-et-Marne",
     *          "value": 20735
     *      },
     *     "FR-30": {
     *          "geo_dpt_name": "Gard",
     *          "value": 23
     *      }
     * ]
     *
     * @param selectedTag the selected 'reseau social'
     */
    updateData(selectedTag) {
        fetch(`${this.baseUrl}/${selectedTag}`)
            .then(response => response.json())
            .then(data => this.transform(data))
            .then(data => {
                // Get the range of possible values in the data
                let values = Object.entries(data).map(([key, record]) => record['value'])
                let maxValue = Math.max(...values);
                let valueRange = [0, maxValue];
                // Map it to a color range
                let colorRange = d3.scaleLinear().domain(valueRange).range([
                    this.getMinValueColor(),
                    this.getMaxValueColor()
                ])

                this.getDepartments().forEach(elem => {
                    let dataRecord = data[elem.id];
                    if (dataRecord) {
                        // todo: set a class attribute instead of setting the style directly
                        //  (see .fr-text-label--blue-france for instance? or define a custom style associated to disabled map)
                        elem.style.fill = colorRange(dataRecord['value']);
                    } else {
                        elem.style.fill = this.getDisabledColor();
                    }
                });

                // Make the map visible
                this.querySelector("svg").style.display = null;
            })
    }

    getDepartments() {
        // tinkering to select relevant territories
        if (this.getAttribute('data-transform') === 'percevalMap') {
            return this.querySelectorAll(
                ".subtype-dm:not(#FR-2A):not(#FR-2B):not(#FR-69),.subtype-cmst:not(#FR-69M),.hack-map-perceval"
            )
        } else if (this.getAttribute('data-transform') === 'ppelMap') {
            return this.querySelectorAll(
                ".subtype-dm:not(#FR-69),.subtype-cmst:not(#FR-69M):not(#FR-20R),.subtype-comst,.subtype-com,.subtype-cdom,.subtype-ctuom,.hack-map-ppel"
            )
        } else {
            return this.querySelectorAll(
                ".subtype-dm:not(#FR-2A):not(#FR-2B):not(#FR-69),.subtype-cmst,.subtype-cmst:not(#FR-69M),.subtype-com,.subtype-cdom,.subtype-ctuom,.hack-map-rhone"
            )
        }
    }

    addEventListenersToDepartment(elem) {
        // animation when passing mouse over a department
        elem.addEventListener("mouseover", () => {
            // Move the department to the end of the svg Node, to make sure
            // it's drawn after other departments, to make borders look good
            this.querySelector("svg").appendChild(elem);
            elem.style.stroke = this.getActiveBorderColor();
            elem.setAttribute("stroke-width", '0.7%');
        })
        elem.addEventListener("mouseleave", () => {
            elem.style.stroke = this.getDefaultBorderColor();
            elem.removeAttribute("stroke-width")
        })

        // set an event to update the right-side chart ( <-> makeFakeBarchartRS())
        elem.addEventListener("click", () => {
            let updateChartEvent = new CustomEvent('select-geo-region', {
                detail: {
                    "geo_dpt_name": elem.getAttribute("aria-description"),
                    "geo_iso": elem.id,
                },
                bubbles: true
            });
            this.dispatchEvent(updateChartEvent);
        })
    }

    // See DSFR color documentation:
    // https://gouvfr.atlassian.net/wiki/spaces/DB/pages/910950417/Couleurs+-+utilisation+dans+le+DSFR

    getMinValueColor() {
        return window.getComputedStyle(document.documentElement)
            .getPropertyValue('--background-action-low-blue-france')
    }

    getMaxValueColor() {
        return window.getComputedStyle(document.documentElement)
            .getPropertyValue('--background-action-high-blue-france')
        // .getPropertyValue('--text-title-blue-france')
    }

    getDisabledColor() {
        return window.getComputedStyle(document.documentElement)
            // .getPropertyValue('--background-disabled-grey')
            .getPropertyValue('--text-inverted-grey')
    }

    getActiveBorderColor() {
        return window.getComputedStyle(document.documentElement)
            .getPropertyValue('--border-plain-grey')

    }

    getDefaultBorderColor() {
        return window.getComputedStyle(document.documentElement)
            .getPropertyValue('--background-contrast-grey')
    }

}

customElements.define('map-chart', MapChart);