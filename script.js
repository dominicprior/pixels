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

    // --- STEP 2: Sobel kernels ---
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

    const output = edgeCtx.createImageData(width, height);
    const dst = output.data;

    // --- STEP 3: convolution (skip borders) ---
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0;
        let gy = 0;

        let k = 0;

        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const pixel = gray[(y + ky) * width + (x + kx)];
            gx += pixel * gxKernel[k];
            gy += pixel * gyKernel[k];
            k++;
          }
        }

        // gradient magnitude
        const magnitude = Math.sqrt(gx * gx + gy * gy);

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