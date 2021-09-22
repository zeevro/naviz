window.addEventListener("load", () => {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js");
  }
});

var currentCoords = null;
var currentWaypoint = null;

function loadWaypoints() {
  fetch('points.json')
    .then(response => response.json())
    .then(points => {
      let listContainer = document.getElementById('waypointList');
      points.sort((a, b) => a.name.localeCompare(b.name));
      points.forEach(p => {
        let elem = document.createElement('div');
        elem.classList.add('waypoint')
        Object.assign(elem.dataset, p);
        elem.innerText = p.name;
        let arrow = document.createElement('div');
        arrow.classList.add('arrow');
        arrow.innerHTML = '&uarr;'
        elem.appendChild(arrow);
        // let distance = document.createElement('span');
        // distance.classList.add('distance');
        // elem.appendChild(distance);
        listContainer.appendChild(elem);
      })
    });
}

function convertUnit(src, dst, val) {
  const conversions = {
    'km-nm': x => x / 1.852,
    'km-mi': x => x / 1.60934,
    'mps-kts': x => x * 1.94384,
    'mps-mph': x => x * 2.23694,
    'mps-kph': x => x * 3.6,
    'm-ft': x => x * 3.28084
  }

  if (src == dst) return val;

  return conversions[src + '-' + dst](val);
}

function unitValue(value, unit, wbr) {
  return value + (wbr ? '<wbr>' : '') + '<span class="unit">' + unit + '</span>';
}

function etaStr(distance, speed) {
  if (!distance || !speed) return '--';
  let eta = Math.round((distance * 1000) / speed); // Distance is given in km but we need meters because our speed is in m/s.
  let ret = (eta < 3600) ? unitValue(eta % 60, 's') : '';
  if (eta = Math.floor(eta / 60)) {
    ret = unitValue(eta % 60, 'm') + '<wbr>' + ret;
    if (eta = Math.floor(eta / 60)) {
      ret = unitValue(eta % 60, 'h') + '<wbr>' + ret;
    }
  }
  return ret;
}

function showWaypointPicker() {
  // let distanceUnit = localStorage.getItem('distance_unit');
  if (currentCoords !== null) {
    let waypointElems = document.querySelectorAll('div.waypoint');
    waypointElems.forEach(elem => {
      let distance = GreatCircle.distance(currentCoords.latitude, currentCoords.longitude, elem.dataset.lat, elem.dataset.lon);
      let bearing = GreatCircle.bearing(currentCoords.latitude, currentCoords.longitude, elem.dataset.lat, elem.dataset.lon) - currentCoords.heading;
      elem.style.order = Math.round(distance * 10000);
      elem.querySelector('.arrow').style.transform = 'rotate(' + bearing + 'deg)';
      // elem.querySelector('.distance').innerHTML = '(' + formatNumber(convertUnit('km', distanceUnit, distance)) + '&nbsp;' + distanceUnit + ')';
    });
  }
  filterWaypoints('');
  document.getElementById('waypointSearch').value = '';
  document.getElementById('waypointList').scrollTop = 0;
  document.getElementById('waypointPickerModal').classList.add('active');
}

function filterWaypoints(text) {
  text = text.trim()
  let waypoints = document.querySelectorAll('.waypoint');
  if (!text.length) {
    waypoints.forEach(elem => elem.classList.remove('hide'));
    return;
  }
  waypoints.forEach(elem => {
    if (elem.dataset.name.match(text)) elem.classList.remove('hide');
    else elem.classList.add('hide');
  });
}

function formatNumber(n, decimals) {
  if (Number(decimals) != decimals) decimals = 1;
  let exp = 10 ** decimals;
  return Math.round(n * exp) / exp;
}

function rotateArrow(deg) {
  document.getElementById('arrow').setAttribute('transform', 'rotate(' + deg + ' 100 100)');
}

function updateNavData() {
  let speedUnit = localStorage.getItem('speed_unit'),
      distanceUnit = localStorage.getItem('distance_unit'),
      altitudeUnit = localStorage.getItem('altitude_unit');

  document.getElementById('speed').innerHTML = currentCoords.speed === null ? '--' : unitValue(Math.round(convertUnit('mps', speedUnit, currentCoords.speed)), speedUnit, true);
  document.getElementById('heading').innerHTML = currentCoords.heading === null ? '--' : Math.round(currentCoords.heading) + '&deg;';
  document.getElementById('altitude').innerHTML = currentCoords.altitude === null ? '--' : unitValue(Math.round(convertUnit('m', altitudeUnit, currentCoords.altitude)), altitudeUnit, true);

  if (currentWaypoint === null) {
    document.getElementById('waypointBtn').innerHTML = 'Waypoint';
  } else {
    document.getElementById('waypointBtn').innerHTML = currentWaypoint.name;
  }

  if (currentWaypoint === null || currentCoords === null) {
    document.getElementById('bearing').innerHTML = '--';
    document.getElementById('distance').innerHTML = '--';
    document.getElementById('eta').innerHTML = '--';
    rotateArrow(0);
  } else {
    let bearing = GreatCircle.bearing(currentCoords.latitude, currentCoords.longitude, currentWaypoint.lat, currentWaypoint.lon) - currentCoords.heading;
    let distance = GreatCircle.distance(currentCoords.latitude, currentCoords.longitude, currentWaypoint.lat, currentWaypoint.lon);
    document.getElementById('bearing').innerHTML = Math.round(bearing + 360) % 360 + '&deg;';
    document.getElementById('distance').innerHTML = unitValue(formatNumber(convertUnit('km', distanceUnit, distance)), distanceUnit, true);
    document.getElementById('eta').innerHTML = etaStr(distance, currentCoords.speed);
    rotateArrow(bearing);
  }
}

function startLocationWatcher() {
  navigator.geolocation.watchPosition(
    position => {
      // currentCoords = position.coords;
      currentCoords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        altitude: position.coords.altitude,
        speed: position.coords.speed >= 1 ? position.coords.speed : 0,
        heading: position.coords.speed >= 1 ? position.coords.heading : 0
      }
      updateNavData();
    },
    console.error,
    {
      enableHighAccuracy: true,
      maximumAge: 0
    }
  );
}

function handleLocationPermission(permissionStatus) {
  if (permissionStatus.state == 'granted') {
    startLocationWatcher();
    return;
  }

  permissionStatus.addEventListener('change', e => handleLocationPermission(e.target));

  if (permissionStatus.state == 'prompt') {
    document.getElementById('locationPermissionBtn').addEventListener('click', e => {
      e.target.closest('.modal').classList.remove('active');
      navigator.geolocation.getCurrentPosition(() => null);
    });
    document.getElementById('locationPermissionModal').classList.add('active');
    return;
  }

  // permissionStatus.state == 'denied'
  document.getElementById('locationPermissionDeniedModal').classList.add('active');

  navigator.geolocation.getCurrentPosition(() => null, () => document.getElementById('locationPermissionModal').classList.add('active'));
}

function showSettings() {
  document.getElementById('settingsModal').classList.add('active');
}

function initApp() {
  let unit_defaults = {
    speed_unit: 'kts',
    distance_unit: 'nm',
    altitude_unit: 'ft'
  }

  for (k in unit_defaults) {
    if (localStorage.getItem(k) === null) {
      localStorage.setItem(k, unit_defaults[k]);
    }
  }

  document.querySelectorAll('.modal .close').forEach(elem => {
    elem.addEventListener('click', e => {
      e.target.closest('.modal').classList.remove('active');
    })
  });

  document.querySelector('#waypointPickerModal .reset').addEventListener('click', e => {
    currentWaypoint = null;
    updateNavData();
  });

  document.getElementById('waypointList').addEventListener('click', e => {
    e.target.closest('.modal').classList.remove('active');
    currentWaypoint = e.target.dataset;
    updateNavData();
  });

  document.getElementById('waypointSearch').addEventListener('input', e => {
    filterWaypoints(e.target.value);
  });

  document.getElementById('waypointBtn').addEventListener('click', showWaypointPicker);

  document.querySelectorAll('#settingsModal input[type="radio"]').forEach(elem => {
    if (localStorage.getItem(elem.name) == elem.value) {
      elem.checked = true;
    }

    elem.addEventListener('click', e => {
      localStorage.setItem(e.target.name, e.target.value);
      updateNavData();
    })
  });

  document.getElementById('settingsBtn').addEventListener('click', showSettings);

  loadWaypoints();

  navigator.permissions.query({name: 'geolocation'}).then(handleLocationPermission);

  if ('wakeLock' in navigator) wakeLock = navigator.wakeLock.request('screen').catch(console.error);
}

initApp();
