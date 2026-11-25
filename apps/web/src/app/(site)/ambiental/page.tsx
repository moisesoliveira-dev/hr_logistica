import type { Metadata } from "next";
import { CompanyPage } from "@/components/company-page";

export const metadata: Metadata = { title: "Ambiental" };

export default function Ambiental() {
  return (
    <CompanyPage
      title="Ambiental" heading="Ambiental Distribuidora" subtitle="Sustentabilidade na cadeia logística"
      image="/fotos/frota-03.jpg" photo="/fotos/sede-03.jpg"
      paragraphs={[
        "Uma das nossas premissas é, sem dúvida, a preocupação com a distribuição de perecíveis e sustentabilidade dentro da cadeia logística. Para nós do Grupo HR, isso significa atuar com o pensamento estratégico voltado para a melhoria das entregas de produtos e também a qualidade de vida da sociedade, promovendo a continuidade do nosso negócio e abrangendo todo o complexo ramo da logística.",
        "Nesse intuito, a Ambiental Distribuidora veio como estímulo para buscar novos resultados e ganhar mercado na América Latina, bem como fornecer e distribuir produtos de varejo e da indústria de alimentos, e destinar todas as avarias de perecíveis, bem como de cargas transportadas, para o descarte correto, além de reciclarmos papel e incentivarmos as ações de educação ambiental em nossas mídias internas e externas.",
      ]}
    />
  );
}
