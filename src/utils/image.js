const MAX_NOTIFICATION_IMAGE_LENGTH = 250 * 1024;

export function compressImageToBase64(source, maxWidth = 800, quality = 0.75) {
  return new Promise((resolve, reject) => {
    if (!source) {
      resolve("");
      return;
    }

    const loadImage = (sourceUrl) => {
      const image = new Image();
      image.onload = () => {
        if (!image.naturalWidth || !image.naturalHeight) {
          reject(new Error("The selected image has invalid dimensions."));
          return;
        }

        let scale = Math.min(1, maxWidth / image.naturalWidth);
        for (let attempt = 0; attempt < 30; attempt += 1) {
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
          canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
          const context = canvas.getContext("2d");
          if (!context) {
            reject(new Error("Image compression is unavailable in this browser."));
            return;
          }

          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          const compressed = canvas.toDataURL("image/jpeg", quality);
          if (compressed !== "data:," && compressed.length < MAX_NOTIFICATION_IMAGE_LENGTH) {
            resolve(compressed);
            return;
          }
          scale *= 0.8;
        }
        reject(new Error("The image could not be compressed below 250 KB."));
      };
      image.onerror = () => reject(new Error("The selected image could not be decoded."));
      image.src = sourceUrl;
    };

    if (typeof source === "string") {
      loadImage(source);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("The selected image could not be read."));
        return;
      }
      loadImage(reader.result);
    };
    reader.onerror = () => reject(new Error("The selected image could not be read."));
    reader.readAsDataURL(source);
  });
}
