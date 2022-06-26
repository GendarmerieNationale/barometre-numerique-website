const tagLabels = {
    'day': '1 jour',
    'week': '1 sem.',
    'month': '1 mois',
    'year': '1 an',
    'twitter': 'Twitter',
    'facebook': 'Facebook',
}

class TagSelectGroup extends HTMLElement {
    connectedCallback() {
        this.tags = this.getTags(this.getAttribute('data-tags'));
        this.innerHTML = this.render();

        // Listen for clicks on the buttons
        this.selectButtons = this.querySelectorAll('a');
        this.selectButtons.forEach(
            btn => btn.addEventListener('click', this.selectTimespan.bind(this))
        );
    }

    selectTimespan(event) {
        let selectedTag = event.target.getAttribute('data-tag');
        this.selectButtons.forEach(btn => btn.setAttribute("aria-pressed", "false"));
        // Update chart data
        let updateChartEvent = new CustomEvent('update-data', {
            detail: {tag: selectedTag},
            bubbles: true
        });
        this.dispatchEvent(updateChartEvent);
        // Remove the 'go to page top' default behavior
        event.preventDefault();
    }

    getTags(dataTags) {
        if (dataTags == null)
            // If data-tags is not specified, return an empty list (this will render an empty <ul>)
            return [];

        if (dataTags.startsWith('years:')) {
            let years = dataTags.replace('years:', '');
            let startYear, endYear;
            if (years.includes('+')) {
                // If data-tags is something like 'years:2015+',
                // return all years between 2015 to today.
                startYear = parseInt(years.replace('+', ''), 10);
                endYear = (new Date()).getFullYear();
            } else {
                // If data-tags is something like 'years:2015-2020',
                // return all years between 2015 and 2020.
                [startYear, endYear] = years.split('-');
                startYear = parseInt(startYear, 10);
                endYear = parseInt(endYear, 10);
            }
            let tags = [];
            for (let y = startYear; y <= endYear; y++) tags.push(y);
            return tags
        }

        return dataTags.split(',');
    }

    getLabel(tag) {
        if (typeof (tag) === 'number')
            // In case the tag is a number (e.g. a year: 2015, 2016, ...), use it as a label as well
            return tag

        // otherwise, use a more readable label
        return tagLabels[tag]
    }

    render() {
        return `
        <ul class='fr-tags-group period-tags'>
          ${this.tags.map(tag => `
            <li>
              <a href="#" 
                class="fr-tag fr-tag--sm" 
                aria-pressed="${this.getAttribute('data-default-tag') === `${tag}`}"
                target="_self"
                data-tag="${tag}">
                ${this.getLabel(tag)}
              </a>
            </li>
          `).join('')}
        </ul>
        `
    }
}

customElements.define('tag-select-group', TagSelectGroup);