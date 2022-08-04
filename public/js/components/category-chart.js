import transforms from "../transforms.js";

class CategoryChart extends HTMLElement {
    connectedCallback() {
        this.baseUrl = this.getAttribute('data-url');
        this.transform = transforms[this.getAttribute('data-transform')];
        this.maxResults = Number(this.getAttribute('data-max-results'));
        this.maxRowsPerColumn = 10;
        this.setAttribute('class', 'vbarchart'); // todo: rename vbarchart/hbarchart
        // TODO: Find a better way? by default we have display:inline, so this helps
        //  matching the style of a generic <div> node
        this.style.cssText += 'display:block';
    }

    render(data) {
        let container = this.closest('.chart-container');
        if (data.length === 0) {
            // No data: display a message or hide the chart
            if (container)
                container.style.display = 'none';
            else
                this.innerHTML = `
            <p style="text-align: center;">Données non disponibles</p>
                `
            return
        }

        if (container && container.style.display === 'none')
            container.style.display = 'block';

        this.innerHTML = `
        <div class="fr-grid-row fr-grid-row--center">
            <div class="fr-col chart-col-1"></div>
        </div>
`;
        let currentColumnNumber = 1;

        for (let i = 0; i < data.length; i++) {
            let obj = data[i];
            if ("perc" in obj && obj.perc < 0.001) continue
            if ((i + 1) / this.maxRowsPerColumn > currentColumnNumber) {
                // We are above the maximum number of rows per column: simply create a new column
                currentColumnNumber = Math.floor((i + 1) / this.maxRowsPerColumn) + 1;
                let newColumn = document.createElement("div");
                newColumn.setAttribute("class",
                    `fr-col-12 fr-col-md-5 fr-col-lg fr-col-offset-md-1 chart-col-${currentColumnNumber}`);
                this.querySelector(".fr-grid-row").appendChild(newColumn);
            }
            if ("break" in obj && obj.break === true) {
                d3.select(this)
                    .select(`.chart-col-${currentColumnNumber}`)
                    .append("hr")
                    .attr("class", "fr-mt-4w")
            } else {
                let label = () => {
                    let p = document.createElement("p");
                    if (obj.labelUrl) {
                        let a = document.createElement("a");
                        a.innerText = obj.label;
                        a.href = obj.labelUrl;
                        a.target = "_blank";
                        p.appendChild(a);
                    } else {
                        p.innerText = obj.label;
                    }
                    return p
                }
                d3.select(this)
                    .select(`.chart-col-${currentColumnNumber}`)
                    .append(label)
                    .append("span")
                    .attr("class", "vbarchart-bar-text-val")
                    .text(obj.valueText);

                d3.select(this)
                    .select(`.chart-col-${currentColumnNumber}`)
                    .append("svg")
                    .attr("class", "vbarchart-bar")
                    .attr("width", "100%")
                    .attr("height", 10)
                    .append("rect")
                    .attr("class", "vbarchart-bar-fg")
                    .attr("x", 0)
                    .attr("y", 0)
                    .attr("width", obj.value + "%")
                    .attr("height", 10);
            }
        }

    }

    updateData(startDate, endDate, timespan) {
        let url = '';

        if(transforms.isNumber(timespan) === true) {
            url = `${this.baseUrl}/${timespan}`;
        }
        else if (startDate === null && endDate === null) {  
            url = `${this.baseUrl}`;
        }
        else {
            url = `${this.baseUrl}/${startDate.value}/${endDate.value}`;
        }

        if (this.maxResults) 
            url += `?maxResults=${this.maxResults}`
        fetch(url)
            .then(response => response.json())
            .then(data => this.transform(data))
            .then(data => this.render(data));
    }
}


customElements.define('category-chart', CategoryChart);