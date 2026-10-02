import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const ALGO = "aes-256-gcm";

function getKey() {
	const secret = process.env.AUTH_SECRET;
	if (!secret) {
		throw new Error("AUTH_SECRET is not set");
	}
	return createHash("sha256").update(secret).digest();
}

/**
 * Criptografa texto sensível (ex.: refresh_token do Google).
 * Formato: base64(iv).base64(tag).base64(ciphertext)
 */
export function encryptSecret(plain: string): string {
	const iv = randomBytes(12);
	const cipher = createCipheriv(ALGO, getKey(), iv);
	const encrypted = Buffer.concat([
		cipher.update(plain, "utf8"),
		cipher.final()
	]);
	const tag = cipher.getAuthTag();
	return `${iv.toString("base64")}.${tag.toString("base64")}.${encrypted.toString("base64")}`;
}

/**
 * Descriptografa valor gerado por encryptSecret.
 */
export function decryptSecret(payload: string): string {
	const [ivB64, tagB64, dataB64] = payload.split(".");
	if (!ivB64 || !tagB64 || !dataB64) {
		throw new Error("Payload criptografado inválido.");
	}
	const decipher = createDecipheriv(ALGO, getKey(), Buffer.from(ivB64, "base64"));
	decipher.setAuthTag(Buffer.from(tagB64, "base64"));
	const decrypted = Buffer.concat([
		decipher.update(Buffer.from(dataB64, "base64")),
		decipher.final()
	]);
	return decrypted.toString("utf8");
}
