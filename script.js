"use strict";

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");
let numId = 0;

class workOut {
  constructor(coords, distance, duration) {
    this.id = ++numId;
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
    this.click = 0;
    this.date = new Date();
  }
  _getDescription() {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
  _click() {
    this.click++;
  }
}
class running extends workOut {
  type = "running";
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._getDescription();
  }
  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class cycling extends workOut {
  type = "cycling";
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);

    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._getDescription();
  }
  calcSpeed() {
    //km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}


class App {
  #map;
  #mapEvent;
  #workOut = [];
  #zoomLevel = 13;
  constructor() {
    this._getPosition();
    form.addEventListener("submit", this._workOut.bind(this));
    inputType.addEventListener("change", this._toggleElevationField);
    containerWorkouts.addEventListener("click", this._goToMarker.bind(this));
    this._getLocalStorage();
  }
  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert(" can't find current position");
        }
      );
    }
  }
  _loadMap(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    const coords = [latitude, longitude];
    this.#map = L.map("map").setView(coords, this.#zoomLevel);
     this.#workOut.forEach((work) => {
       this._renderWorkoutMarker(work);
     });
    L.tileLayer("https://tile.openstreetmap.fr/hot//{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    this.#map.on("click", this._showForm.bind(this));
  }
  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove("hidden");
    inputDistance.focus();
  }
  _hiddenForm() {
    inputCadence.value =
      inputDistance.value =
      inputDuration.value =
      inputElevation.value =
        " ";
    form.style.display = "none";
    form.classList.add("hidden");
    setTimeout(() => (form.style.display = "grid"), 1000);
  }
  _toggleElevationField() {
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
  }
  _workOut(event) {
    event.preventDefault();
    const validation = (...inputs) => inputs.every((inp) => Number(inp));
    const allPositive = (...inputs) => inputs.every((inp) => inp > 0);

    //get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workOut;

    //if workout running create running object
    if (type === "running") {
      const cadence = +inputCadence.value;
      //check if data is valid
      if (
        !validation(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert("inputs must be positive");
      //create running object
      workOut = new running([lat, lng], distance, duration, cadence);
    }
    //if workout cycling create workout object
    if (type === "cycling") {
      const elevationGain = +inputElevation.value;
      //check if data is valid
      if (
        !validation(distance, duration, elevationGain) ||
        !allPositive(distance, duration)
      )
        return alert("inputs must be positive");
      workOut = new cycling([lat, lng], distance, duration, elevationGain);
    }
    //add to workout array
    this.#workOut.push(workOut);
    console.log(workOut);

    //show data in a marker
    this._renderWorkoutMarker(workOut);
    this._renderWorkOut(workOut);

    //hidden form when submit
    this._hiddenForm();

    this._setLocalStorage();
  }
  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 110,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"} ${workout.description}`
      )
      .openPopup();
  }
  _renderWorkOut(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
           <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>`;

    if (workout.type === "running") {
      html += ` <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>`;
    }
    if (workout.type === "cycling") {
      html += `
             <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>`;
    }

    form.insertAdjacentHTML("afterend", html);
  }
  _goToMarker(event) {
    const workOutEl = event.target.closest(".workout");
    if (!workOutEl) return;
    const workout = this.#workOut.find(
      (work) => work.id == workOutEl.dataset.id
    );
    console.log(workout);
    this.#map.setView(workout.coords, this.#zoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }
  _setLocalStorage() {
    localStorage.setItem("workouts", JSON.stringify(this.#workOut));
  }
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem("workouts"));
    this.#workOut = data;
 
    this.#workOut.forEach((work) => {
      this._renderWorkOut(work);
    });
  }
}

const app = new App();
