import Link from "next/link";

import LegalLayout from "@/components/site/LegalLayout";

import type { FC } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Termos de Uso",
	description:
		"Termos de uso do site fisiogeovane.com.br: regras de navegação e responsabilidades.",
	alternates: { canonical: "/termos-de-uso" },
	robots: { index: true, follow: true }
};

const UPDATED = "4 de outubro de 2026";

/**
 * Termos de uso da presença pública do site.
 */
const TermsPage: FC = () => {
	return (
		<LegalLayout title="Termos de Uso" updated={UPDATED}>
			<h2>1. Apresentação</h2>
			<p>
				Estes Termos de Uso regulam o acesso e a utilização do site{" "}
				<strong>fisiogeovane.com.br</strong>, página institucional do
				fisioterapeuta <strong>Geovane Michael da Silva</strong> (Crefito
				549225-F), operada no Brasil.
			</p>
			<p>
				Ao navegar neste site, você declara ter lido e compreendido as regras
				deste documento, em vigor desde <strong>{UPDATED}</strong>.
			</p>

			<h2>2. Aceitação</h2>
			<p>
				O uso do site implica a aceitação destes Termos de Uso e da{" "}
				<Link href="/politica-de-privacidade">Política de Privacidade</Link>. Se
				você não concordar, interrompa a navegação. O acesso continuado após
				atualizações será interpretado como concordância com a versão vigente.
			</p>

			<h2>3. Finalidade do site</h2>
			<p>
				O site tem caráter informativo e institucional: apresenta a marca e
				informações profissionais do fisioterapeuta. O conteúdo publicado não
				substitui consulta, avaliação ou acompanhamento presencial e não
				constitui aconselhamento clínico personalizado à distância.
			</p>

			<h2>4. Regras de uso</h2>
			<p>Ao utilizar o site, você concorda em:</p>
			<ul>
				<li>
					Navegar de forma lícita, respeitosa e compatível com a finalidade
					institucional da página.
				</li>
				<li>
					Não praticar atividades ilegais, abusivas ou que violem direitos de
					terceiros.
				</li>
				<li>
					Não tentar invadir, sobrecarregar, desfigurar ou prejudicar o
					funcionamento do site.
				</li>
				<li>
					Não utilizar robôs ou ferramentas automatizadas para extrair conteúdo
					em massa sem autorização prévia.
				</li>
			</ul>
			<p>
				É permitido compartilhar links para páginas públicas deste site, desde
				que o crédito seja mantido de forma clara.
			</p>

			<h2>5. Propriedade intelectual</h2>
			<p>
				Textos, imagens, marcas, logotipos e demais elementos do site são
				protegidos na medida aplicável pela legislação de propriedade
				intelectual.
			</p>
			<ul>
				<li>
					É permitido citar trechos curtos com indicação da fonte e link para a
					página original.
				</li>
				<li>
					É proibida a reprodução integral, a distribuição comercial ou a
					modificação do conteúdo sem autorização expressa.
				</li>
			</ul>

			<h2>6. Limitação de responsabilidade</h2>
			<p>
				O site é oferecido conforme disponibilidade. Não garantimos
				funcionamento ininterrupto, ausência total de erros ou adequação do
				conteúdo a finalidades específicas.
			</p>
			<p>
				Na extensão permitida pela legislação brasileira, não nos
				responsabilizamos por danos decorrentes do uso ou da impossibilidade de
				uso do site, ressalvadas as hipóteses legais inafastáveis.
			</p>

			<h2>7. Links para sites de terceiros</h2>
			<p>
				O site pode incluir links para destinos externos apenas por conveniência.
				Não controlamos nem endossamos esses sites e não nos responsabilizamos
				por suas políticas ou conteúdos. O acesso a terceiros é por sua conta e
				risco.
			</p>

			<h2>8. Alterações</h2>
			<p>
				Podemos atualizar estes Termos de Uso a qualquer momento. A data da
				última revisão aparece no topo desta página. A versão vigente está em{" "}
				<Link href="/termos-de-uso">Termos de Uso</Link>.
			</p>

			<h2>9. Contato</h2>
			<p>
				Dúvidas sobre estes termos podem ser enviadas para{" "}
				<a href="mailto:contato@fisiogeovane.com.br">
					contato@fisiogeovane.com.br
				</a>
				.
			</p>

			<h2>10. Foro</h2>
			<p>
				Fica eleito o foro da comarca do responsável pela operação do site no
				Brasil, salvo disposição legal de competência diversa em favor do
				consumidor ou titular de dados, quando aplicável.
			</p>
		</LegalLayout>
	);
};

export default TermsPage;
