export async function uploadToImgbb(
  jpegBuffer: Buffer,
  filename: string
): Promise<string> {
  const apiKey = process.env.IMGBB_API_KEY;
  if (!apiKey) {
    throw new Error("IMGBB_API_KEY не настроен");
  }

  const base64 = jpegBuffer.toString("base64");

  const form = new FormData();
  form.append("image", base64);
  form.append("name", filename);

  const resp = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: "POST",
    body: form,
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`imgbb upload failed (${resp.status}): ${text}`);
  }

  const data = await resp.json();
  return data.data.url; // direct CDN URL
}
