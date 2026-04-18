/**
 * LSB (Least Significant Bit) Steganography
 * Hides a text message inside an image by modifying the least significant bits of pixel data.
 */

const DELIMITER = '\0\0\0'; // End-of-message marker

/**
 * Encode a secret message into an image using LSB steganography.
 * Returns a Blob of the encoded PNG image.
 */
export async function encodeMessageInImage(imageFile: File, message: string): Promise<Blob> {
  const img = await loadImage(imageFile);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  const binaryMessage = textToBinary(message + DELIMITER);

  if (binaryMessage.length > data.length * 3 / 4) {
    throw new Error('Message is too long for this image. Use a larger image or shorter message.');
  }

  let bitIndex = 0;
  for (let i = 0; i < data.length && bitIndex < binaryMessage.length; i++) {
    // Skip alpha channel (every 4th byte)
    if (i % 4 === 3) continue;

    // Replace LSB with message bit
    data[i] = (data[i] & 0xFE) | parseInt(binaryMessage[bitIndex], 2);
    bitIndex++;
  }

  ctx.putImageData(imageData, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to encode image'));
    }, 'image/png');
  });
}

/**
 * Decode a hidden message from an image using LSB steganography.
 */
export async function decodeMessageFromImage(imageUrl: string): Promise<string> {
  const img = await loadImageFromUrl(imageUrl);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  let binaryString = '';
  for (let i = 0; i < data.length; i++) {
    if (i % 4 === 3) continue; // skip alpha
    binaryString += (data[i] & 1).toString();
  }

  // Convert binary to text and find delimiter
  let message = '';
  for (let i = 0; i < binaryString.length; i += 8) {
    const byte = binaryString.substring(i, i + 8);
    if (byte.length < 8) break;
    const char = String.fromCharCode(parseInt(byte, 2));
    message += char;

    // Check for delimiter
    if (message.endsWith(DELIMITER)) {
      return message.slice(0, -DELIMITER.length);
    }
  }

  return '[No hidden message found]';
}

function textToBinary(text: string): string {
  return text.split('').map(char =>
    char.charCodeAt(0).toString(2).padStart(8, '0')
  ).join('');
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}
