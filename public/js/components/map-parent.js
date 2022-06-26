class MapParent extends HTMLElement {
    connectedCallback() {
        let tagSelectGroup = this.querySelector('tag-select-group');
        let defaultTag = tagSelectGroup ? tagSelectGroup.getAttribute('data-default-tag') : '';

        // Left side: the map chart
        let mapChart = this.querySelector('map-chart');
        mapChart.initialUpdate(defaultTag);
        // Listen for updates from the tag select group...
        this.addEventListener('update-data', (event) => {
            mapChart.updateData(event.detail.tag);
        })

        // Right side: details of the selected geo region
        let breadcrumbs = this.querySelector('map-breadcrumbs');
        let rightSideChartTitle = this.querySelector('chart-title');
        let rightSideMapDetail = this.querySelector('map-detail');
        if (breadcrumbs && rightSideChartTitle && rightSideMapDetail) {
            breadcrumbs.updateText('')
            rightSideChartTitle.updateTitle('Compte National')
            rightSideMapDetail.updateData('gn');

            // ... and from the map itself
            this.addEventListener('select-geo-region', (event) => {
                breadcrumbs.updateText(event.detail['geo_dpt_name']);
                rightSideChartTitle.updateTitle(event.detail['geo_dpt_name']);
                rightSideMapDetail.updateData(event.detail['geo_iso']);
            })
            this.addEventListener('back-to-france', (event) => {
                breadcrumbs.updateText('');
                rightSideChartTitle.updateTitle('Compte National');
                rightSideMapDetail.updateData('gn');
            })
        }
    }

}

customElements.define('map-parent', MapParent);