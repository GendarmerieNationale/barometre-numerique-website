class StartEndCalendar extends HTMLElement {
    constructor() {
        super();

        this.dateStart = "";
        this.dateEnd = "";
        this.timespan = "";
    }

    connectedCallback() {
        this.dateStart = this.getAttribute('date-start');
        this.dateEnd = this.getAttribute('date-end');
        this.timespan = this.getAttribute('timespan');

        this.render();

        if (this.dateStart === null) {
            this.startDate(this.timespan);
            this.endDate();
        }
        else {
            this.querySelector("input[id='input-calendar-start']").value = this.dateStart;
            this.querySelector("input[id='input-calendar-end']").value = this.dateEnd;
        }
    }

    startDate(timespan) {
        const date = new Date();
        const input = this.querySelector("input[id='input-calendar-start']");
        const inputMax = this.querySelector("input[id='input-calendar-end']");

        if (timespan === 'day')
            date.setHours(0)
        else if (timespan === 'week')
            date.setDate(date.getDate() - 7)
        else if (timespan === 'month')
            date.setMonth(date.getMonth() - 1)
        else if (timespan === 'year')
            date.setFullYear(date.getFullYear() - 1)

        input.value = date.toISOString().split('T')[0];

        this.addEventListener('change', () => {
            inputMax.min = input.value;

            if (input.value > inputMax.value)
                inputMax.value = input.value;
        });
    }

    endDate() {
        const date = new Date();
        const input = this.querySelector("input[id='input-calendar-end']");
        const inputMin = this.querySelector("input[id='input-calendar-start']");

        input.value = date.toISOString().split('T')[0];
        input.min = inputMin.value;
    }

    render() {
        this.innerHTML = `
        <div class="fr-grid-row fr-grid-row--gutters fr-grid-row--center">
            <div class="fr-input-group">
                <label class="fr-label" for="text-input-calendar-start">
                Date de début
                </label>
                <div class="fr-input-wrap fr-fi-calendar-line">
                <input class="fr-input" type="date" id="input-calendar-start" name="text-input-calendar-start">
                </div>
            </div>
            <div class="fr-input-group fr-ml-1w">
                <label class="fr-label" for="text-input-calendar-end">
                Date de fin
                </label>
                <div class="fr-input-wrap fr-fi-calendar-line">
                <input class="fr-input" type="date" id="input-calendar-end" name="text-input-calendar-end">
                </div>
            </div>
        </div>
        `;
    }
}

customElements.define('start-end-calendar', StartEndCalendar);
