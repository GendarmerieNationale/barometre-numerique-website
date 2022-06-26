class ChartParent extends HTMLElement {
    connectedCallback() {
        let tagSelectGroup = this.querySelector('tag-select-group');
        let defaultTag = tagSelectGroup ? tagSelectGroup.getAttribute('data-default-tag') : '';

        let categoryCharts = this.querySelectorAll('category-chart');
        categoryCharts.forEach(chart => {
            // Update chart with initial data
            // (the children category-chart elements should already exist and be connected to the DOM)
            chart.updateData(defaultTag);

            this.addEventListener('update-data', (event) => {
                chart.updateData(event.detail.tag);
            })
        });

        let timelineCharts = this.querySelectorAll('timeline-chart');
        timelineCharts.forEach(chart => {
            chart.updateData(defaultTag);
            this.addEventListener('update-data', (event) => {
                chart.updateData(event.detail.tag);
            })
        });

        let featureFigures = this.querySelectorAll('feature-figure');
        featureFigures.forEach(featFigure => {
            featFigure.updateData(defaultTag);
            this.addEventListener('update-data', (event) => {
                featFigure.updateData(event.detail.tag);
            })
        });

    }

}

customElements.define('chart-parent', ChartParent);