import Link from "next/link";

import LegalLayout from "@/components/site/LegalLayout";

import type { FC } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Política de Privacidade",
	description:
		"Política de privacidade do site fisiogeovane.com.br: como tratamos dados de visitantes.",
	alternates: { canonical: "/politica-de-privacidade" },
	robots: { index: true, follow: true }
};

const UPDATED = "4 de outubro de 2026";

/**
 * Política de privacidade da presença pública do site.
 */
const PrivacyPage: FC = () => {
	return (
		<LegalLayout title="Política de Privacidade" updated={UPDATED}>
			<h2>1. Apresentação</h2>
			<p>
				Esta Política de Privacidade descreve como o site{" "}
				<strong>fisiogeovane.com.br</strong> trata informações de visitantes. O
				site apresenta a atuação profissional do fisioterapeuta{" "}
				<strong>Geovane Michael da Silva</strong> (Crefito 549225-F), no Brasil.
			</p>
			<p>
				Esta versão está em vigor desde <strong>{UPDATED}</strong>. Ao navegar
				neste site, você declara ter ciência deste documento.
			</p>

			<h2>2. Quais dados podem ser coletados</h2>
			<p>
				Na navegação das páginas públicas, podem ser tratados dados técnicos
				mínimos necessários à entrega do site, por exemplo:
			</p>
			<ul>
				<li>
					<strong>Dados de navegação:</strong> páginas acessadas, tipo de
					dispositivo ou navegador, endereço IP aproximado e horários de acesso,
					quando registrados pela infraestrutura de hospedagem.
				</li>
				<li>
					<strong>Dados que você envia por e-mail:</strong> se escrever para o
					contato indicado neste site, trataremos o conteúdo da mensagem e os
					dados que você incluir (como nome e e-mail) para responder.
				</li>
			</ul>
			<p>
				As páginas públicas deste site não pedem cadastro de visitantes nem
				publicam formulários de coleta além do contato por e-mail indicado.
			</p>

			<h2>3. Para que usamos os dados</h2>
			<p>Utilizamos as informações descritas acima para:</p>
			<ul>
				<li>Manter o site disponível e seguro.</li>
				<li>Responder mensagens enviadas ao e-mail de contato.</li>
				<li>Cumprir obrigações legais ou atender solicitações válidas.</li>
			</ul>
			<p>
				Não vendemos dados pessoais. Prestadores de hospedagem podem processar
				dados técnicos apenas na medida necessária para operar o site, com
				expectativa de confidencialidade e proteção adequada.
			</p>

			<h2>4. Cookies</h2>
			<p>
				As páginas públicas podem usar cookies ou tecnologias semelhantes
				estritamente necessárias ao funcionamento do site. Não utilizamos, nestas
				páginas, publicidade comportamental nem redes de anúncios.
			</p>
			<p>
				Você pode limitar cookies nas configurações do navegador; isso pode
				afetar algumas funções básicas de navegação.
			</p>

			<h2>5. Direitos do titular</h2>
			<p>
				Nos termos da legislação brasileira de proteção de dados (LGPD), você
				pode, quando aplicável, solicitar confirmação de tratamento, acesso,
				correção, eliminação ou informações sobre o uso de dados pessoais
				relacionados a este site.
			</p>
			<p>
				Solicitações serão analisadas em prazo razoável e podem exigir confirmação
				de identidade.
			</p>

			<h2>6. Contato</h2>
			<p>
				Dúvidas sobre esta política ou solicitações relacionadas a dados pessoais
				podem ser enviadas para{" "}
				<a href="mailto:contato@fisiogeovane.com.br">
					contato@fisiogeovane.com.br
				</a>
				.
			</p>

			<h2>7. Atualizações</h2>
			<p>
				Podemos revisar esta Política de Privacidade quando o site ou nossas
				práticas forem alterados. A data da última atualização aparece no topo
				desta página. A versão vigente está em{" "}
				<Link href="/politica-de-privacidade">Política de Privacidade</Link>.
			</p>

			<h2>8. Segurança</h2>
			<p>
				Adotamos medidas razoáveis para proteger o site e as comunicações, como o
				uso de HTTPS. Nenhum ambiente digital é absolutamente imune a incidentes,
				mas buscamos reduzir riscos de forma proporcional ao tipo de dado
				tratado.
			</p>
		</LegalLayout>
	);
};

export default PrivacyPage;
