addEventListener('DOMContentLoaded', async function () {
    const activities = new ActivitesList("[name='activities-list']");
    const date = new DateChanger("[name='date-changer']", 1);
    const circle = new WeekGraphic("[name='circle-graphic']");
    
    const week = await getWeekData(1);
    date.update(week.week_number, week.week_start, week.week_end);
    activities.update(week.activities);
    circle.update(week.week_minutes, week.week_goal);

    date.onChange = async (week) => {
        const currWeek = await getWeekData(week);
        activities.update(currWeek.activities);
        date.update(currWeek.week_number, currWeek.week_start, currWeek.week_end);
        circle.update(currWeek.week_minutes, currWeek.week_goal);
    }
})

class WeekGraphic {
    containerHTML;
    weekMinutesHTML;
    tipHTML;

    circleHTML;
    radius;
    circumference;

    constructor (query) {
        this.containerHTML = document.querySelector(`${query}`);
        this.circleHTML = this.containerHTML.querySelector(`[name='svg-value'] circle`);
        this.weekMinutesHTML = this.containerHTML.querySelector(`[name='week-minutes']`);
        this.tipHTML = document.querySelector(`[name='week-tip']`);
        
        this.radius = this.circleHTML.r.baseVal.value;
        this.circumference = this.radius * 2 * Math.PI;

        this.circleHTML.style.strokeDasharray = `${this.circumference} ${this.circumference}`;
        this.circleHTML.style.strokeDashoffset = `${this.circumference}`;
    }

    update(currMinutes, weekGoal) {
        this.weekMinutesHTML.innerText = currMinutes;
        this.setProgress((currMinutes / weekGoal) * 100);

        if (currMinutes >= weekGoal) {
            this.tipHTML.innerHTML = "¡Haz completado tu meta semanal! Recuerda que siempre puedes cambiar tu meta <span class='sw-week-graphic__tip-focus'>aquí</span>"
        } else {
            this.tipHTML.innerHTML = "Tip: si realizas <span class='sw-week-graphic__tip-focus'>20m</span> de actividad física en los próximos días podrás cumplir tu meta semanal"
        }
    }

    setProgress(percent) {
        const per = percent / 2;
        const offset = this.circumference - per / 100 * this.circumference;
        this.circleHTML.style.strokeDashoffset = offset;
    }
}

class DateChanger {
    weekNumber;
    changer;
    week;
    weekRange;
    prev;
    next;
    onChange;

    constructor(changerQuery, week) {
        this.changer = document.querySelector(changerQuery);
        this.prev = this.changer.querySelector("[name='date-prev']");
        this.next = this.changer.querySelector("[name='date-next']");
        this.week = this.changer.querySelector("[name='date-week']")
        this.weekRange = this.changer.querySelector("[name='date-range']");
        
        this.setWeekNumber(week);
        this.prev.addEventListener("click", this.onPrevClicked.bind(this))
        this.next.addEventListener("click", this.onNextClicked.bind(this))
    }

    update(weekNumber, weekStart, weekEnd) {
        this.week.innerText = `Semana #${weekNumber}`;
        this.weekRange.innerText = `${weekStart} - ${weekEnd}`;
    }

    setWeekNumber(num) {
        this.weekNumber = num;

        if (num <= 1) {
            this.prev.disabled = true;
        } else {
            this.prev.disabled = false;
        }

        if (num >= 50) {
            this.next.disabled = true;
        } else {
            this.next.disabled = false;
        }
    }

    onNextClicked(e) {
        this.setWeekNumber(this.weekNumber + 1);
        if (this.onChange) {
            this.onChange(this.weekNumber);
        }
    }
    
    onPrevClicked(e) {
        this.setWeekNumber(this.weekNumber - 1);
        if (this.onChange) {
            this.onChange(this.weekNumber);
        }
    }
}

class ActivitesList {
    parent;

    constructor (parent) {
        this.parent = document.querySelector(parent);
    }

    update(activities) {
        this.parent.innerHTML = "";

        if (activities.length > 0) {
            activities.forEach(activity => {
                this.addActivity(activity);
            })
        } else {
            this.addEmptyState("No haz realizado actividades en los últimos días");
        }
    }

    getActivityName(code) {
        const dict = {
            sprint: "Carrera en exterior", 
            exercise: "Fuerza", 
            water: "Natación",
            hiking: "Senderismo"
        }

        return dict[code] || "Libre"
    }

    addActivity(activity) {
        const container = document.createElement("div");
        const template = `
        <div class="sw-week-activity">
            <div class="sw-week-activity__head">
                <div class="sw-week-activity__title-date">
                    <h3 class="sw-week-activity__title">
                        <span class="material-symbols-outlined">${activity.name}</span>
                        ${this.getActivityName(activity.name)}
                    </h3>
                    <p class="sw-week-activity__date">${activity.date}</p>
                </div>
                <div class="sw-week-activity__minutes">
                    <p class="sw-week-activity__minutes-value">${activity.minutes}</p>
                    <p class="sw-week-activity__minutes-label">minutos</p>
                </div>
            </div>
            <div class="sw-week-activity__details-list" name="details-list"></div>
        </div>
        `
        container.innerHTML = template;

        // Placeholder validation
        if (activity.name === "sprint" || activity.name === "hiking") {
            activity?.details.forEach(detail => {
                this.addActivityDetail(container, detail);
            })
        } else {
            container.querySelector("[name='details-list']").remove()
        }

        this.parent.appendChild(container.firstElementChild);
    }

    addActivityDetail(parent, detail) {
        const container = parent.querySelector("[name='details-list']")

        const template = `
        <div class="sw-week-activity__detail">
            <p class="sw-week-activity__detail-label">${detail.name}:</p>
            <p class="sw-week-activity__detail-value">${detail.value}</p>
        </div>
        `
        
        container.innerHTML += template;
    }

    addEmptyState(text) {
        this.parent.innerHTML = "";
        const template = `
        <div class="sw-empty">
            <span class="material-symbols-outlined sw-empty__icon">mood_bad</span>
            <p class="sw-empty__text">${text}</p>
        </div>
        `
        this.parent.innerHTML = template;
    }
}

class Spinner {
    spinner;

    constructor(query) {
        this.spinner = document.querySelector(query);
    }

    show() {
        this.spinner.classList.add("show");
    }
    
    hide() {
        // Timeout for aesthetics
        setTimeout(() => {
            this.spinner.classList.remove("show");
        }, 250);
    }
}

async function getWeekData(weekNumber) {
    const spinner = new Spinner("[name='spinner']");

    const API = "https://api.json-generator.com/templates"
    const TOKEN = "mx82f3uc8lwnoxwdwdk2zwgpgcbaby0oh1tr2lzm"

    spinner.show();
    return fetch(`${API}/vwyJDFC8CTDo/data?access_token=${TOKEN}`)
    .then(res => res.json())
    .then(data => {
        spinner.hide();
        return data[weekNumber - 1]
    })
}