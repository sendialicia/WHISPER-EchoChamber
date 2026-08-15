import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import type { ScanContent } from "../api/types";

/**
 * Turns a picked/captured image into something worth uploading.
 *
 * A raw phone screenshot is a 1080×2400 PNG at roughly 2–4MB. Resized and
 * re-encoded as JPEG it lands around 200–400KB — about a tenth the payload,
 * with no meaningful loss of legibility for the model reading the text.
 * Worth doing on any connection, and the request cap is 25MB either way.
 */

/** Wide enough to keep small UI text readable after downscaling. */
const TARGET_WIDTH = 1080;
const JPEG_QUALITY = 0.8;

export async function prepareImageForScan(uri: string): Promise<ScanContent> {
  const rendered = await ImageManipulator.manipulate(uri)
    .resize({ width: TARGET_WIDTH })
    .renderAsync();

  const { base64 } = await rendered.saveAsync({
    format: SaveFormat.JPEG,
    compress: JPEG_QUALITY,
    base64: true,
  });

  if (!base64) {
    throw new Error("Couldn't read the image data from that file.");
  }

  if (__DEV__) {
    // A believable screenshot lands around 150–400KB here. A few KB means the
    // capture came out blank, which otherwise only shows up as the model
    // reporting it found nothing interesting.
    const kb = Math.round((base64.length * 3) / 4 / 1024);
    console.log(
      `[scan] image ${rendered.width}×${rendered.height} → ~${kb}KB JPEG`
    );
  }

  return { imageBase64: base64, imageMimeType: "image/jpeg" };
}
