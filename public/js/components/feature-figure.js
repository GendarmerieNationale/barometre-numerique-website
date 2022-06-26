import transforms from "../transforms.js";

class FeatureFigure extends HTMLElement {
    connectedCallback() {
        this.baseUrl = this.getAttribute('data-url');
        // in the response data, get the 'value' field by default, or a user-specified one
        this.field = this.getAttribute('data-field') || 'value';
        // also get an optional transform function, to compute and format the figure directly,
        // (useful if the data is more complex)
        this.customTransform = this.getAttribute('data-transform');

        this.displaySize = this.getAttribute('data-display-size') || 'xl';
        this.render('...');

        // This element can be inside a <chart-parent> or not. If it is the case, let
        // the chart-parent make the first updateData, with the right selectedTag.
        if (this.closest('chart-parent') === null)
            this.updateData('');
    }

    transform(data) {
        if (this.customTransform && this.getAttribute('data-field'))
            return transforms[this.customTransform](data[this.field]);

        if (this.customTransform)
            return transforms[this.customTransform](data);

        return transforms.formatNumber(data[this.field]);
    }

    updateData(selectedTag) {
        let url = selectedTag ? `${this.baseUrl}/${selectedTag}` : this.baseUrl;
        fetch(url)
            .then(response => response.json())
            .then(data => this.transform(data))
            .then(text => this.render(text));
    }

    render(text) {
        // todo: remove duplicate code and wrap all charts in a single class
        let container = this.closest('.chart-container');
        if (!text) {
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
          <div class="fr-display-${this.displaySize}">${text}</div>
`
    }
}

customElements.define('feature-figure', FeatureFigure);