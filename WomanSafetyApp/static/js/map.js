// ================= MAP =================
var map = L.map('map').setView([13.0827, 80.2707], 13);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
}).addTo(map);


// ================= VARIABLES =================
var control = null;
var drawnRoutes = [];
var zoneLayer = L.layerGroup();

var currentLatLng = null;
var endLatLng = null;
var selectingEnd = false;
var userMarker = null;
var destMarker = null;


// ================= DRAW ZONES =================
function drawZones(){
    zoneLayer.clearLayers();

    unsafeZones.forEach(zone => {
        let color = zone.risk == 2 ? "red" :
                    zone.risk == 1 ? "orange" : "yellow";

        L.circle([zone.lat, zone.lng], {
            color: color,
            fillColor: color,
            fillOpacity: 0.5,
            radius: 3000
        }).addTo(zoneLayer);
    });

    zoneLayer.addTo(map);
}


// ================= LIVE LOCATION =================
navigator.geolocation.watchPosition(function(pos){

    currentLatLng = L.latLng(pos.coords.latitude, pos.coords.longitude);

    if (!userMarker) {
        userMarker = L.marker(currentLatLng).addTo(map);
    } else {
        userMarker.setLatLng(currentLatLng);
    }

    if (!map._userMoved) {
        map.setView(currentLatLng, 14);
    }

    if (endLatLng) updateRoute();
});


// ================= ROUTE =================
function updateRoute(){

    if (!currentLatLng || !endLatLng) return;

    if (control) map.removeControl(control);

    drawnRoutes.forEach(line => map.removeLayer(line));
    drawnRoutes = [];

    drawZones();

    control = L.Routing.control({
        waypoints: [currentLatLng, endLatLng],
        addWaypoints: false,
        draggableWaypoints: false,
        show: false,
        createMarker: () => null,
        lineOptions: { styles: [] }
    }).addTo(map);

    control.on('routesfound', function(e) {
        let route = e.routes[0].coordinates;
        drawSmartRoute(route);
    });
}


// ================= SMART ROUTE =================
function drawSmartRoute(route){

    let currentColor = null;
    let segmentPoints = [];

    for (let i = 0; i < route.length; i++) {

        let point = route[i];
        let color = getColor(point);

        if (currentColor === null) {
            currentColor = color;
        }

        if (color !== currentColor) {

            let poly = L.polyline(segmentPoints, {
                color: currentColor,
                weight: 6
            }).addTo(map);

            drawnRoutes.push(poly);
            segmentPoints = [];
            currentColor = color;
        }

        segmentPoints.push([point.lat, point.lng]);
    }

    if (segmentPoints.length > 0) {
        let poly = L.polyline(segmentPoints, {
            color: currentColor,
            weight: 6
        }).addTo(map);

        drawnRoutes.push(poly);
    }
}


// ================= COLOR LOGIC =================
function getColor(point){

    let hasMedium = false;

    for (let zone of unsafeZones) {

        let dist = map.distance(
            [point.lat, point.lng],
            [zone.lat, zone.lng]
        );

        if (zone.risk == 2 && dist < 15000) return "red";
        if (zone.risk == 1 && dist < 4000) hasMedium = true;
    }

    if (hasMedium) return "orange";

    return "blue";
}


// ================= SELECT DEST =================
function selectEnd(){
    selectingEnd = true;
    alert("Click on map to select destination");
}


// ================= MAP CLICK =================
map.on('click', function(e){

    if (!selectingEnd) return;

    endLatLng = e.latlng;

    if (destMarker) map.removeLayer(destMarker);

    destMarker = L.marker(endLatLng)
        .addTo(map)
        .bindPopup("Destination")
        .openPopup();

    selectingEnd = false;

    updateRoute();
});

// ================= SHARE LIVE LOCATION =================
function shareLiveLocation(){

    if (!currentLatLng) {
        alert("Location not available");
        return;
    }

    let lat = currentLatLng.lat;
    let lng = currentLatLng.lng;

    let locationURL = `https://www.google.com/maps?q=${lat},${lng}`;

    let message = `🚨 I need help!\nMy live location:\n${locationURL}`;

    // 🔥 Universal Share (mobile + modern browsers)
    if (navigator.share) {
        navigator.share({
            title: "Emergency SOS",
            text: message,
        });
    } else {
        // fallback: open WhatsApp
        let whatsappURL = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappURL, '_blank');
    }
}

function sendSOS(){

    if (!currentLatLng) {
        alert("Location not available");
        return;
    }

    let lat = currentLatLng.lat;
    let lng = currentLatLng.lng;

    let locationURL = `https://www.google.com/maps?q=${lat},${lng}`;

    let message = `🚨 EMERGENCY!\nI am in danger.\nMy location:\n${locationURL}`;

    // 🔥 Try native share first
    if (navigator.share) {
        navigator.share({
            title: "SOS Alert",
            text: message,
        });
    } else {
        // fallback → WhatsApp
        let whatsappURL = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappURL, '_blank');
    }
}

// ================= CANCEL =================
function cancelRoute(){

    if (control) {
        map.removeControl(control);
        control = null;
    }

    drawnRoutes.forEach(line => map.removeLayer(line));
    drawnRoutes = [];

    zoneLayer.clearLayers();

    if (destMarker) {
        map.removeLayer(destMarker);
        destMarker = null;
    }

    endLatLng = null;
}


// ================= STOP AUTO MOVE =================
map.on('dragstart zoomstart', function(){
    map._userMoved = true;
});

