const STORAGE_NAME = 'entities';

Vue.component('popup', {
    props: ['data', 'index'],
    template: '<div class="popup">' +
        '<a v-bind:href="data.url">{{data.name}}</a>' +
        '<div class="coords">' +
        '<span>LAT : {{data.lat}}</span>' +
        '<span>LNG : {{data.lng}}</span>' +
        '</div>' +
        '<button class="btn danger" onclick="deleteObject()"><span>Удалить</span></button>' +
        '<div v-if="data.type === \'circle\'">' +
        '<label>' +
        '    Радиус:' +
        '    <input type="number" min="100" max="1000000" step="1000" v-bind:value="data.radius" onchange="changeRadius(this.value)"/>' +
        '</label>' +
        '</div>' +
        '<label><span>LAT:</span><input v-bind:value="data.lat" onblur="changeLat(this.value)"/></label>' +
        '<label><span>LNG:</span><input v-bind:value="data.lng" onblur="changeLng(this.value)"/></label>' +
        '<label><span>Имя:</span><input v-bind:value="data.name" onblur="changeName(this.value)"/></label>' +
        '</div>'
});

function deleteObject() {
    entities.splice(activeIndex, 1);
    updateMarkers(entities);
}

function changeRadius(newRadius) {
    if (newRadius.toString() === "") {
        return
    }
    entities[activeIndex].radius = newRadius;
    updateActive();
}

function changeLat(newLat) {
    if (newLat.toString() === "") {
        return
    }
    entities[activeIndex].lat = newLat;
    updateActive();
}

function changeLng(newLng) {
    if (newLng.toString() === "") {
        return
    }
    entities[activeIndex].lng = newLng;
    updateActive();
}

function changeName(newName) {
    if (newName.toString() === "") {
        return
    }
    entities[activeIndex].name = newName;
}

var map = L.map('map', {
    center: [65, 100],
    minZoom: 2,
    zoom: 3
})

map.on('click', function (e) {
    const location = e.latlng;
    switch (creating) {
        case 'circle':
            entities.push({
                "name": "New Circle",
                "url": "http://www.okenit.ru/",
                "lat": location.lat,
                "lng": location.lng,
                "type": "circle",
                "radius": 60000
            });
            break;
        case 'marker':
            entities.push({
                "name": "New Marker",
                "url": "http://www.okenit.ru/",
                "lat": location.lat,
                "lng": location.lng,
                "type": "marker"
            });
            break;
        default:
            return;
    }
    updateMarkers(entities);
    stopCreating();
});

let currentLayer = L.featureGroup();
map.addLayer(currentLayer);

let entities = JSON.parse(localStorage.getItem(STORAGE_NAME));
if (entities == null) {
    entities = []
} else {
    console.log(entities);
}
updateMarkers(entities);

let activeIndex = null;
let activeObject = null;
let creating = null;

L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: ['a', 'b', 'c']
}).addTo(map)

function decorate(object) {
    object.bindPopup(
        "<div id=\"main\">\n" +
        "    <popup v-bind:data='entities[" + object.originDataIndex + "]' v-bind:index='" + object.originDataIndex + "'></popup>\n" +
        "</div>")
        .addTo(currentLayer)
        .on('click', () => {
            activeIndex = object.originDataIndex;
            activeObject = object;
            setTimeout(() => {createVue();}, 250)
        });
}

function updateActive() {
    var newLatLng = new L.LatLng(entities[activeIndex].lat, entities[activeIndex].lng);
    activeObject.setLatLng(newLatLng);
    if (entities[activeIndex].type === 'circle') {
        activeObject.setRadius(entities[activeIndex].radius);
    }
}

function updateMarkers(entities) {
    map.removeLayer(currentLayer);
    currentLayer = L.featureGroup();
    for (let i = 0; i < entities.length; ++i) {
        switch (entities[i].type) {
            case 'marker':
                let marker = L.marker([entities[i].lat, entities[i].lng]);
                marker.originDataIndex = i
                decorate(marker);
                break;
            case 'circle':
                let circle = L.circle([entities[i].lat, entities[i].lng], {
                    color: 'red',
                    fillColor: '#f03',
                    fillOpacity: 0.5,
                    radius: entities[i].radius
                })
                circle.originDataIndex = i
                decorate(circle)
                break;
        }
    }
    map.addLayer(currentLayer);
}

function createVue() {
    new Vue({
        el: '#main',
        data: {
            entities: entities
        }
    });
}

function save() {
    console.log("Сохранение");
    localStorage.setItem(STORAGE_NAME, JSON.stringify(entities));
}

function load() {
    console.log("Загрузка");
    entities = JSON.parse(localStorage.getItem(STORAGE_NAME));
    updateMarkers(entities);
}

function loadDefault() {
    console.log("Загрузка по-умолчанию");
    entities = [...markers];
    updateMarkers(entities);
}

function clearMap() {
    console.log("Очистка");
    entities = [];
    updateMarkers(entities);
}

function createCircle() {
    creating = 'circle';
    document.getElementById('map').classList.add("crosshair");
}

function createMarker() {
    creating = 'marker';
    document.getElementById('map').classList.add("crosshair");
}

function stopCreating() {
    creating = null;
    document.getElementById('map').classList.remove("crosshair");
}

document.onkeydown = function (evt) {
    if ("key" in evt) {
        if (evt.key === "Escape" || evt.key === "Esc") {
            stopCreating();
        }
    }
};
