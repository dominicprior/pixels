window.addEventListener("DOMContentLoaded", () => {
  const originalCanvas = document.getElementById("originalCanvas");

  const width = 400;
  const height = 400;
  originalCanvas.width = width;
  originalCanvas.height = height;
  const origCtx = originalCanvas.getContext("2d");

  const gray = new Float32Array(width * height);

  const output = origCtx.createImageData(width, height);
  const dst = output.data;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const xx = x % 20 > 10;
      const yy = y % 20 > 10;
      const relx = x - width / 2;
      const rely = y - width / 2;
      const on = relx * relx + rely * rely < 22500 ? xx : yy;
      const k = on ? 200 : 100;
      dst[idx] = k;
      dst[idx + 1] = k;
      dst[idx + 2] = k;
      dst[idx + 3] = 255;
    }
  }

  origCtx.putImageData(output, 0, 0);
});
