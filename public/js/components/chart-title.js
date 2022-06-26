class ChartTitle extends HTMLElement {
    render(title) {
        return `
<style>
#map-rs-desc
{
  text-align: left;
  padding-top: 10%;
}
</style>
          <p id="map-rs-desc">${title}</p>
`
    }

    updateTitle(title) {
        this.innerHTML = this.render(title);
    }
}

customElements.define('chart-title', ChartTitle);