'use strict';

let userLat = null;
let userLon = null;
let userHeading = 0;

function calcBearing(lat, lon) {
  if (typeof window.calculateQiblaBearing === 'function') {
    return window.calculateQiblaBearing(lat, lon);
  }
  const rad = (d) => d * (Math.PI / 180);
  const deg = (r) => r * (180 / Math.PI);
  const lat1Rad = rad(lat);
  const lat2Rad = rad(21.4225);
  const dLon = rad(39.8262 - lon);
  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  return (deg(Math.atan2(y, x)) + 360) % 360;
}

function calcDistance(lat, lon) {
  if (typeof window.calculateQiblaDistanceKm === 'function') {
    return window.calculateQiblaDistanceKm(lat, lon);
  }
  const rad = (d) => d * (Math.PI / 180);
  const R = 6371;
  const dLat = rad(21.4225 - lat);
  const dLon = rad(39.8262 - lon);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat)) * Math.cos(rad(21.4225)) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.asin(Math.sqrt(a)));
}

function updateCompass(bearing) {
  const needle = document.getElementById('needle');
  const display = document.getElementById('bearingDisplay');
  if (needle) needle.setAttribute('transform', `translate(200, 200) rotate(${bearing})`);
  if (display) display.textContent = `${Math.round(bearing)}°`;
}

function setStatus(text, stateClass) {
  const txt = document.getElementById('statusText');
  const ind = document.querySelector('.status-indicator');
  if (txt) txt.textContent = text;
  if (ind) ind.className = `status-indicator ${stateClass}`;
}

function updateDisplay() {
  if (userLat === null || userLon === null) return;
  const bearing = calcBearing(userLat, userLon);
  const distance = calcDistance(userLat, userLon);
  updateCompass(bearing);

  const latEl = document.getElementById('latDisplay');
  const lonEl = document.getElementById('lonDisplay');
  const distEl = document.getElementById('distanceDisplay');
  const locEl = document.getElementById('locationNameDisplay');
  if (latEl) latEl.textContent = `${userLat.toFixed(4)}°`;
  if (lonEl) lonEl.textContent = `${userLon.toFixed(4)}°`;
  if (distEl) distEl.textContent = String(distance);
  if (locEl) locEl.textContent = `${userLat.toFixed(2)}°, ${userLon.toFixed(2)}°`;
}

function getLocation() {
  setStatus('Getting location...', 'status-waiting');
  const errEl = document.getElementById('errorMessage');
  if (errEl) errEl.classList.remove('show');

  if (!navigator.geolocation) {
    if (errEl) {
      errEl.textContent = 'Geolocation not supported by your browser. Enter coordinates manually.';
      errEl.classList.add('show');
    }
    setStatus('Geolocation unavailable', 'status-error');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      userLat = pos.coords.latitude;
      userLon = pos.coords.longitude;
      try {
        localStorage.setItem('last_coords', JSON.stringify({ lat: userLat, lng: userLon }));
      } catch (_e) {
        /* ignore */
      }
      updateDisplay();
      setStatus('✓ Location found', 'status-active');
    },
    (err) => {
      if (errEl) {
        errEl.textContent = `Location error: ${err.message}. You can enter coordinates manually.`;
        errEl.classList.add('show');
      }
      setStatus('Location error', 'status-error');
    },
    { timeout: 7000 }
  );
}

function openManualModal() {
  const modal = document.getElementById('manualLocationModal');
  if (!modal) return;
  modal.classList.add('open');
  const latInput = document.getElementById('manualLat');
  const lonInput = document.getElementById('manualLon');
  if (latInput && userLat !== null) latInput.value = String(userLat);
  if (lonInput && userLon !== null) lonInput.value = String(userLon);
  setTimeout(() => latInput?.focus(), 60);
}

function closeManualModal() {
  document.getElementById('manualLocationModal')?.classList.remove('open');
}

function submitManualLocation() {
  const lat = parseFloat(document.getElementById('manualLat')?.value.trim() || '');
  const lon = parseFloat(document.getElementById('manualLon')?.value.trim() || '');
  if (isNaN(lat) || lat < -90 || lat > 90) {
    window.showToast?.('Please enter a valid latitude (-90 to 90)', 'warning');
    return;
  }
  if (isNaN(lon) || lon < -180 || lon > 180) {
    window.showToast?.('Please enter a valid longitude (-180 to 180)', 'warning');
    return;
  }
  userLat = lat;
  userLon = lon;
  try {
    localStorage.setItem('last_coords', JSON.stringify({ lat, lng: lon }));
  } catch (_e) {
    /* ignore */
  }
  closeManualModal();
  updateDisplay();
  setStatus('✓ Manual location set', 'status-active');
  window.showToast?.('Coordinates updated successfully!', 'success');
}

function shareLocation() {
  if (userLat === null || userLon === null) {
    window.showToast?.('Please get your location first', 'warning');
    return;
  }
  const text = `I'm at ${userLat.toFixed(4)}°, ${userLon.toFixed(4)}°. Qibla direction: ${Math.round(calcBearing(userLat, userLon))}°`;
  if (navigator.share) {
    navigator.share({ title: 'My Qibla Direction', text }).catch(() => {});
  } else {
    navigator.clipboard?.writeText(text);
    window.showToast?.('Qibla coordinates copied to clipboard! 📋', 'success');
  }
}

function handleOrientation(e) {
  let heading = null;
  if (e.webkitCompassHeading !== undefined && e.webkitCompassHeading !== null) {
    heading = e.webkitCompassHeading;
  } else if (e.alpha !== null && e.alpha !== undefined) {
    heading = (360 - e.alpha) % 360;
  }
  if (heading !== null) {
    userHeading = heading;
    const hd = document.getElementById('headingDisplay');
    if (hd) hd.textContent = String(Math.round(userHeading));
  }
}

function requestCompassPermission() {
  if (
    typeof DeviceOrientationEvent !== 'undefined' &&
    typeof DeviceOrientationEvent.requestPermission === 'function'
  ) {
    DeviceOrientationEvent.requestPermission()
      .then((permissionState) => {
        if (permissionState === 'granted') {
          window.addEventListener('deviceorientation', handleOrientation, true);
          document.getElementById('compassPermBtn')?.classList.add('hidden');
          window.showToast?.('Live compass enabled! 🧭', 'success');
        } else {
          window.showToast?.('Orientation permission was denied.', 'warning');
        }
      })
      .catch(() => {
        window.showToast?.('Unable to enable compass orientation.', 'warning');
      });
  } else if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', handleOrientation, true);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  try {
    const raw = localStorage.getItem('last_coords');
    if (raw) {
      const c = JSON.parse(raw);
      if (c && typeof c.lat === 'number' && typeof c.lng === 'number') {
        userLat = c.lat;
        userLon = c.lng;
        updateDisplay();
        setStatus('✓ Saved location loaded', 'status-active');
      }
    }
  } catch (_e) {
    /* ignore */
  }

  document.getElementById('findLocBtn')?.addEventListener('click', getLocation);
  document.getElementById('openManualBtn')?.addEventListener('click', openManualModal);
  document.getElementById('compassPermBtn')?.addEventListener('click', requestCompassPermission);
  document.getElementById('shareLocBtn')?.addEventListener('click', shareLocation);
  document.getElementById('cancelManualBtn')?.addEventListener('click', closeManualModal);
  document.getElementById('applyManualBtn')?.addEventListener('click', submitManualLocation);

  if (
    typeof DeviceOrientationEvent !== 'undefined' &&
    typeof DeviceOrientationEvent.requestPermission === 'function'
  ) {
    document.getElementById('compassPermBtn')?.classList.remove('hidden');
  } else if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', handleOrientation, true);
  }
});
