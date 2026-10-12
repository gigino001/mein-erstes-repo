import { NextResponse } from "next/server";

// Einfache, eigenständige HTML-Seite (kein Next.js-Layout) für die
// Freischalten-/Ablehnen-Links aus der Bewertungs-Mail — der Klick landet
// im Browser, nicht in der App, daher hier bewusst kein <Link>/Layout.
export function moderationResultPage(opts: { title: string; message: string; tone: "success" | "info" | "error" }) {
  const color = opts.tone === "success" ? "#a8475a" : opts.tone === "error" ? "#c0392b" : "#4b5a63";
  const html = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${opts.title} — coco lashes</title>
</head>
<body style="font-family: Arial, sans-serif; background: #f3e3e0; margin: 0; padding: 40px 20px; display: flex; justify-content: center;">
  <div style="max-width: 420px; background: white; border-radius: 20px; padding: 36px 32px; text-align: center;">
    <p style="font-style: italic; font-size: 22px; margin: 0 0 20px; color: #16232b;">coco lashes</p>
    <h1 style="font-size: 20px; color: ${color}; margin: 0 0 12px;">${opts.title}</h1>
    <p style="color: #4b5a63; line-height: 1.5; margin: 0;">${opts.message}</p>
  </div>
</body>
</html>`;
  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
