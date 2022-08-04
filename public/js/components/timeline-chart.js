import transforms from "../transforms.js";

class TimelineChart extends HTMLElement {
    connectedCallback() {
        this.baseUrl = this.getAttribute('data-url');
        this.labelKey = this.getAttribute('data-label-key');
        this.valueKey = this.getAttribute('data-value-key');
        this.transform = transforms[this.getAttribute('data-transform')];
        // by default, display a Y axis
        this.displayYAxis = true;
        if (this.getAttribute('data-display-y-axis'))
            this.displayYAxis = JSON.parse(this.getAttribute('data-display-y-axis'));

        this.setAttribute('class', 'hbarchart');
        this.style.cssText += 'display:block; height:250px';

        // When the color theme changes (light/dark), update the chart with the new colors
        let htmlRoot = document.querySelector('html');
        let observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.attributeName === 'data-fr-scheme') {
                    let chart = Chart.getChart(this.querySelector('canvas'));
                    if (chart) {
                        let data = chart.data.datasets[0].data;
                        let labels = chart.data.labels;
                        chart.destroy();
                        this.makeHorizontalBarChart(data, labels);
                    }
                }
            })
        });
        observer.observe(htmlRoot, {attributes: true});
    }

    updateData(startDate, endDate, timespan) {
        let  url = '';

        if (timespan === 'daily-affluence') {
            url = `${this.baseUrl}`;
        }
        else {
            url = `${this.baseUrl}/${startDate.value}/${endDate.value}`;
        }

        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.length === 0) {
                    // In case there is no data
                    this.innerHTML = `
                        <p style="text-align: center;">Données non disponibles</p>
                        `
                    return;
                }

                // If we are updating a previous chart, destroy it to clean up any associated event listeners
                let previousChart = Chart.getChart(this.querySelector('canvas'));
                if (previousChart)
                    previousChart.destroy();

                this.innerHTML = `<canvas></canvas>`;
                let {labels, values} = transforms.formatForHorizontalBarChart(
                    data, `${this.labelKey}`, `${this.valueKey}`
                );
                const tag = transforms.getTimespanBetweenDate(startDate, endDate);
                labels = transforms.formatTimelineLabels(labels, tag);
                this.makeHorizontalBarChart(values, labels)
            })
            .catch(e => console.error(e));
    }

    makeHorizontalBarChart(data, labels) {
        Chart.defaults.font.family = "'Marianne','arial','sans-serif'";
        Chart.defaults.font.size = 12;
        Chart.defaults.color = window.getComputedStyle(document.documentElement).getPropertyValue('--text-default-grey');

        const chartData = {
            labels: labels,
            datasets: [{
                label: 'My First dataset',
                backgroundColor: window.getComputedStyle(document.documentElement).getPropertyValue('--text-title-blue-france'),
                borderColor: window.getComputedStyle(document.documentElement).getPropertyValue('--text-title-blue-france'),
                barPercentage: 0.98,
                categoryPercentage: 0.98,
                borderWidth: 0,
                borderRadius: 7,
                borderSkipped: false,
                data: data,
            }]
        };

        let ticksConfig = this.displayYAxis ? {count: 4, precision: 0} : {display: false};
        const config = {
            type: 'bar',
            data: chartData,
            options: {
                locale: 'fr-FR',
                maintainAspectRatio: false,
                animation: {
                    duration: 0
                },
                scales: {
                    x: {
                        grid: {
                            display: false,
                            drawBorder: false
                        },
                    },
                    y: {
                        grid: {
                            display: false,
                            drawBorder: false
                        },
                        ticks: ticksConfig
                    }
                },
                plugins: {
                    tooltip: {
                        enabled: false
                    },
                    legend: {
                        display: false
                    }
                },
            }
        };

        return new Chart(this.querySelector('canvas'), config);
    }
}


customElements.define('timeline-chart', TimelineChart);