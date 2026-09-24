// Erzeugt einen bcrypt-Hash fürs Admin-Passwort.
// Aufruf: npm run admin:hash-password -- "DeinPasswort"
import bcrypt from "bcryptjs";

const password = process.argv[2];
if (!password) {
  console.error('Bitte ein Passwort angeben: npm run admin:hash-password -- "DeinPasswort"');
  process.exit(1);
}

bcrypt.hash(password, 10).then((hash) => {
  // Base64-kodiert, damit die "$"-Zeichen im bcrypt-Hash nicht von Next.js'
  // .env-Variablenexpansion (z. B. "$2b" würde als Variable "2b" gelesen) verstümmelt werden.
  const encoded = Buffer.from(hash, "utf8").toString("base64");
  console.log("\nADMIN_PASSWORD_HASH als Wert in .env eintragen:\n");
  console.log(encoded);
  console.log();
});
