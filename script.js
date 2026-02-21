window.addEventListener("DOMContentLoaded", () => {
  const img = document.getElementById("sourceImg");
  const originalCanvas = document.getElementById("originalCanvas");
  const cannyCanvas = document.getElementById("cannyCanvas");

  img.onload = () => {
    const w = img.width;
    const h = img.height;

    originalCanvas.width = cannyCanvas.width = w;
    originalCanvas.height = cannyCanvas.height = h;

    const origCtx = originalCanvas.getContext("2d");
    const outCtx = cannyCanvas.getContext("2d");

    origCtx.drawImage(img, 0, 0);

    const srcData = origCtx.getImageData(0, 0, w, h);
    const src = srcData.data;

    // =====================================================
    // 1) GRAYSCALE
    // =====================================================
    const gray = new Float32Array(w * h);

    for (let i = 0; i < w * h; i++) {
      const j = i * 4;
      gray[i] =
        0.299 * src[j] +
        0.587 * src[j + 1] +
        0.114 * src[j + 2];
    }

    // =====================================================
    // 2) GAUSSIAN BLUR (5x5)
    // =====================================================
    const gaussKernel = [
      2, 4, 5, 4, 2,
      4, 9,12, 9, 4,
      5,12,15,12, 5,
      4, 9,12, 9, 4,
      2, 4, 5, 4, 2
    ];
    const gaussDiv = 159;

    const blur = new Float32Array(w * h);

    for (let y = 2; y < h - 2; y++) {
      for (let x = 2; x < w - 2; x++) {
        let sum = 0;
        let k = 0;

        for (let ky = -2; ky <= 2; ky++) {
          for (let kx = -2; kx <= 2; kx++) {
            sum += gray[(y + ky) * w + (x + kx)] * gaussKernel[k++];
          }
        }

        blur[y * w + x] = sum / gaussDiv;
      }
    }

    // =====================================================
    // 3) SOBEL GRADIENT
    // =====================================================
    const gxK = [-1,0,1,-2,0,2,-1,0,1];
    const gyK = [-1,-2,-1,0,0,0,1,2,1];

    const mag = new Float32Array(w * h);
    const dir = new Float32Array(w * h);

    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        let gx = 0, gy = 0, k = 0;

        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const val = blur[(y + ky) * w + (x + kx)];
            gx += val * gxK[k];
            gy += val * gyK[k];
            k++;
          }
        }

        const i = y * w + x;
        mag[i] = Math.hypot(gx, gy);
        dir[i] = Math.atan2(gy, gx);
      }
    }

    // =====================================================
    // 4) NON-MAXIMUM SUPPRESSION
    // =====================================================
    const thin = new Float32Array(w * h);

    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        const angle = dir[i] * (180 / Math.PI);

        let q = 0, r = 0;

        // quantize direction
        if ((angle >= -22.5 && angle < 22.5) || angle >= 157.5 || angle < -157.5) {
          q = mag[i + 1];
          r = mag[i - 1];
        } else if ((angle >= 22.5 && angle < 67.5) || (angle >= -157.5 && angle < -112.5)) {
          q = mag[i + w + 1];
          r = mag[i - w - 1];
        } else if ((angle >= 67.5 && angle < 112.5) || (angle >= -112.5 && angle < -67.5)) {
          q = mag[i + w];
          r = mag[i - w];
        } else {
          q = mag[i - w + 1];
          r = mag[i + w - 1];
        }

        if (mag[i] >= q && mag[i] >= r) {
          thin[i] = mag[i];
        }
      }
    }

    // =====================================================
    // 5) DOUBLE THRESHOLD + HYSTERESIS
    // =====================================================
    const HIGH = 100;
    const LOW = 40;

    const edges = new Uint8ClampedArray(w * h);

    // classify
    for (let i = 0; i < thin.length; i++) {
      if (thin[i] >= HIGH) edges[i] = 255;
      else if (thin[i] >= LOW) edges[i] = 75;
    }

    // hysteresis (very simple version)
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        if (edges[i] === 75) {
          if (
            edges[i - 1] === 255 || edges[i + 1] === 255 ||
            edges[i - w] === 255 || edges[i + w] === 255 ||
            edges[i - w - 1] === 255 || edges[i - w + 1] === 255 ||
            edges[i + w - 1] === 255 || edges[i + w + 1] === 255
          ) {
            edges[i] = 255;
          } else {
            edges[i] = 0;
          }
        }
      }
    }

    // =====================================================
    // RENDER
    // =====================================================
    const out = outCtx.createImageData(w, h);
    const dst = out.data;

    for (let i = 0; i < w * h; i++) {
      const v = edges[i];
      const j = i * 4;
      dst[j] = dst[j + 1] = dst[j + 2] = v;
      dst[j + 3] = 255;
    }

    outCtx.putImageData(out, 0, 0);
  };

  if (img.complete) img.onload();
});