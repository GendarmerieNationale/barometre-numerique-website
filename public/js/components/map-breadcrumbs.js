class MapBreadcrumbs extends HTMLElement {
    render(text) {
        return `
<style>
#map-rs-ariane
{
  text-align: left;
}

#map-rs-ariane a
{
  font-size: 95%;
}
</style>
<div id="map-rs-ariane">
    <ol class="fr-breadcrumb__list">
        <li>
            <a id="map-back-to-france" class="fr-breadcrumb__link" href="#">France</a>
        </li>
        <li>
            <a class="fr-breadcrumb__link" aria-current="page">
                <div id="selected-map-region-title">${text}</div>
            </a>
        </li>
    </ol>
</div>
`
    }

    updateText(text) {
        this.innerHTML = this.render(text);
        let backToFranceBtn = this.querySelector("#map-back-to-france");
        backToFranceBtn.addEventListener('click', this.onBackToFranceClick);
    }

    onBackToFranceClick(event) {
        this.dispatchEvent(new CustomEvent('back-to-france', {bubbles: true}));
        event.preventDefault();
    }


}

customElements.define('map-breadcrumbs', MapBreadcrumbs);

