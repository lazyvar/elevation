// Bootstrap — will be filled in Task 11
const canvas = document.getElementById('sim-canvas');
const ctx = canvas.getContext('2d');

function resize() {
  canvas.width = canvas.clientWidth * devicePixelRatio;
  canvas.height = canvas.clientHeight * devicePixelRatio;
  ctx.scale(devicePixelRatio, devicePixelRatio);
}

window.addEventListener('resize', resize);
resize();

// Placeholder: draw background to verify canvas works
ctx.fillStyle = '#1a1a2e';
ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
ctx.fillStyle = '#e0e0e0';
ctx.font = '24px system-ui';
ctx.textAlign = 'center';
ctx.fillText('Elevation — Loading...', canvas.clientWidth / 2, canvas.clientHeight / 2);
