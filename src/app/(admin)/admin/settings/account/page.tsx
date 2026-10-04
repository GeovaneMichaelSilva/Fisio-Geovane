import { redirect } from "next/navigation";

/**
 * Rota antiga — Conta saiu de Configurações.
 */
const AccountSettingsRedirectPage = () => {
	redirect("/admin/account");
};

export default AccountSettingsRedirectPage;
