window.addEventListener("DOMContentLoaded", () => {
  const img = document.getElementById("sourceImg");
  const origCanvas = document.getElementById("origCanvas");
  const edgeCanvas = document.getElementById("edgeCanvas");

  img.onload = () => {
    const w = img.width;
    const h = img.height;

    origCanvas.width = edgeCanvas.width = w;
    origCanvas.height = edgeCanvas.height = h;

    const origCtx = origCanvas.getContext("2d");
    const edgeCtx = edgeCanvas.getContext("2d");

    // draw an image onto the canvas
    origCtx.drawImage(img, 0, 0);

    const srcData = origCtx.getImageData(0, 0, w, h);
    const src = srcData.data;

    // --- convert to grayscale buffer ---
    const gray = new Float32Array(w * h);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        gray[y * w + x] =
          0.299 * src[i] +
          0.587 * src[i + 1] +
          0.114 * src[i + 2];
      }
    }

    const gxKernel = [
      -1, 0, 1,
      -2, 0, 2,
      -1, 0, 1
    ];

    const gyKernel = [
      -1, -2, -1,
       0,  0,  0,
       1,  2,  1
    ];

    const imageDataObj = edgeCtx.createImageData(w, h);  // blank
    const imageData = imageDataObj.data;

    // --- STEP 3: convolution (skip borders) ---
    let biggestMagnitude = 0;
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        let gx = 0;
        let gy = 0;

        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const pixel = gray[(y + ky) * w + (x + kx)];
            gx -= pixel * kx;
            gx += pixel * ky;
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

        const idx = (y * w + x) * 4;
        const edge = Math.min(255, magnitude);

        imageData[idx] = edge;
        imageData[idx + 1] = edge;
        imageData[idx + 2] = edge;
        imageData[idx + 3] = 255;
      }
    }

    edgeCtx.putImageData(imageDataObj, 0, 0);
  };

  if (img.complete) img.onload();
});