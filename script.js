window.addEventListener("DOMContentLoaded", () => {
  const img = document.getElementById("sourceImg");
  const originalCanvas = document.getElementById("originalCanvas");
  const bwCanvas = document.getElementById("bwCanvas");

  img.onload = () => {
    const width = img.width;
    const height = img.height;

    // Size canvases
    originalCanvas.width = bwCanvas.width = width;
    originalCanvas.height = bwCanvas.height = height;

    const origCtx = originalCanvas.getContext("2d");
    const bwCtx = bwCanvas.getContext("2d");

    // Draw original image
    origCtx.drawImage(img, 0, 0);

    // Get pixel data
    const imageData = origCtx.getImageData(0, 0, width, height);
    const data = imageData.data; // Uint8ClampedArray

    // Convert to grayscale
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // luminance formula
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;

      data[i] = gray;     // R
      data[i + 1] = gray; // G
      data[i + 2] = gray; // B
      // data[i + 3] is alpha — leave unchanged
    }

    // Put modified pixels into second canvas
    bwCtx.putImageData(imageData, 0, 0);
  };

  // Important: trigger load if cached
  if (img.complete) img.onload();
});
