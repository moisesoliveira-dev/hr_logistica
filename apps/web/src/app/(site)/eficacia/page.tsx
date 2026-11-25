import type { Metadata } from "next";
import { CompanyPage } from "@/components/company-page";

export const metadata: Metadata = { title: "Eficácia" };

export default function Eficacia() {
  return (
    <CompanyPage
      title="Eficácia" heading="Eficácia Transportes" subtitle="Especializada em cargas fracionadas"
      image="/fotos/sede-06.jpg" photo="/fotos/armazem-02.jpg"
      paragraphs={[
        "A Eficácia Transportes é uma empresa do Grupo HR que atua em parceria com a HR da Amazônia desde 2007.",
        "Especializada em cargas fracionadas, a Eficácia Transportes oferece suporte no transporte de produtos para todas as regiões do país com a agilidade, segurança e confiabilidade que o segmento logístico necessita.",
      ]}
    />
  );
}
