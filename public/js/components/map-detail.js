import transforms from "../transforms.js";

class MapDetail extends HTMLElement {
    connectedCallback() {
        this.baseUrl = this.getAttribute('data-url');
        this.selectedRenderFct = this.getAttribute('data-render-fct');

        let renderFunctions = {
            'perceval': this.renderPerceval,
            'pre-plainte-en-ligne': this.renderPPEL,
            'twitter': this.renderTwitter,
            'service-public-plus': this.renderSPPlus,
        };
        this.render = renderFunctions[this.selectedRenderFct];
    }

    updateData(selectedGeoIso) {
        // <HACKISH>
        if (this.selectedRenderFct === 'perceval') {
            if (selectedGeoIso === 'FR-RHONE') {
                selectedGeoIso = 'FR-69'
            }
        }
        // </HACKISH>
        fetch(`${this.baseUrl}/${selectedGeoIso}`)
            .then(response => response.json())
            .then(data => this.innerHTML = this.render(data))
    }

    // Page specific code - display a different map detail for reseaux sociaux,
    // service public +, etc

    renderPerceval(data) {
        function getText(data) {
            if (!data['n_signalements'])
                return `<p>Pas de données dans ce territoire</p>`;

            if (data['geo_dpt_iso'])
                return `
                        <p class="fr-display-xs">
                          ${transforms.formatNumber(data['n_signalements'])}
                        </p>
                        <p>
                        ${data['n_signalements'] > 1 ? 'signalements' : 'signalement'}
                        dans ce territoire
                        </p>
                        `;

            // No geo_dpt_iso -> national data
            return `
                    <p class="fr-display-xs">
                          ${transforms.formatNumber(data['n_signalements'])}
                    </p>
                    <p>signalements au total</p>
                    `;
        }

        return `<p>${getText(data)}</p>`
    }

    renderPPEL(data) {
        function getText(data) {
            if (!data['n_preplaintes'])
                return `<p>Pas de données dans ce territoire</p>`;

            if (data['geo_dpt_iso'])
                return `
                        <p class="fr-display-xs">
                          ${transforms.formatNumber(data['n_preplaintes'])}
                        </p>
                        <p>
                        ${data['n_preplaintes'] > 1 ? 'pré-plaintes déposées' : 'pré-plainte déposée'}
                        dans ce territoire
                        </p>
                        `;

            // No geo_dpt_iso -> national data
            return `
                    <p class="fr-display-xs">
                          ${transforms.formatNumber(data['n_preplaintes'])}
                    </p>
                    <p>pré-plaintes déposées au total</p>
                    `;
        }

        return `<p>${getText(data)}</p>`
    }

    renderTwitter(data) {
        // No data in this region
        if (data.length === 0)
            return `<p>Pas de données disponibles</p>`

        if (data.length > 1)
            console.warn(`Map detail element got more data than expected (this should be only 1 twitter record): ${data}`)

        let {n_followers, n_tweets, page_name, page_url} = data[0];
        return `
<p class="fr-display-xs">${formatNumber(n_followers)}</p>
<p>
    abonnements au compte Twitter<br>
    <a href="${page_url}" target="_blank">${page_name}</a>
</p>
<br>
<p class="fr-display-xs">${formatNumber(n_tweets)}</p>
<p>
    Tweets
</p>
`
    }

    renderSPPlus(data) {
        function getTextSPPlus(data) {
            if (!data['exp_count'])
                return `<p>Aucune expérience partagée dans ce territoire</p>`;

            if (data['geo_dpt_iso'])
                return `
                        <p class="fr-display-xs">${data['exp_count']}</p>
                        <p>
                        ${data['exp_count'] > 1 ? 'expériences partagées' : 'expérience partagée'}
                        dans ce territoire
                        </p>
                        `;

            // No geo_dpt_iso -> national data
            return `
                    <p class="fr-display-xs">${data['exp_count']}</p>
                    <p>expériences non rattachées à un département</p>
                    `;
        }

        return `<p>${getTextSPPlus(data)}</p>`
    }
}

customElements.define('map-detail', MapDetail);