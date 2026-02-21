window.addEventListener("DOMContentLoaded", () => {
  const img = document.getElementById("sourceImg");
  const originalCanvas = document.getElementById("originalCanvas");
  const edgeCanvas = document.getElementById("edgeCanvas");

  img.onload = () => {
    const width = img.width;
    const height = img.height;

    originalCanvas.width = edgeCanvas.width = width;
    originalCanvas.height = edgeCanvas.height = height;

    const origCtx = originalCanvas.getContext("2d");
    const edgeCtx = edgeCanvas.getContext("2d");

    // Draw original
    origCtx.drawImage(img, 0, 0);

    const srcData = origCtx.getImageData(0, 0, width, height);
    const src = srcData.data;

    // --- STEP 1: convert to grayscale buffer ---
    const gray = new Float32Array(width * height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        gray[y * width + x] =
          0.299 * src[i] +
          0.587 * src[i + 1] +
          0.114 * src[i + 2];
      }
    }


    const output = edgeCtx.createImageData(width, height);
    const dst = output.data;
    const size = 1;  // full size of the kernel is 2*size+1

    // --- STEP 3: convolution (skip borders) ---
    let biggestMagnitude = 0;
    for (let y = size; y < height - size; y++) {
      for (let x = size; x < width - size; x++) {
        let gx = 0;
        let gy = 0;

        let k = 0;

        for (let ky = -size; ky <= size; ky++) {
          for (let kx = -size; kx <= size; kx++) {
            const pixel = gray[(y + ky) * width + (x + kx)];
            gx -= pixel * kx;
            gx += pixel * ky;
            k++;
          }
        }

        if (gx < 0) {
          gx = 0;
        }
        const magnitude = gx * 0.45;

        if (magnitude > biggestMagnitude) {
          biggestMagnitude = magnitude;
          console.log(biggestMagnitude);
        }

        const idx = (y * width + x) * 4;
        const edge = Math.min(255, magnitude);

        dst[idx] = edge;
        dst[idx + 1] = edge;
        dst[idx + 2] = edge;
        dst[idx + 3] = 255;
      }
    }

    // --- STEP 4: draw result ---
    edgeCtx.putImageData(output, 0, 0);
  };

  if (img.complete) img.onload();
});