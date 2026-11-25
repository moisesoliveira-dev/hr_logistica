/* Conteúdo extraído de https://hr.log.br/ — edite aqui para atualizar o site todo. */

/* Telefones, WhatsApp, e-mail, endereço, redes e unidades são editados no portal (Contatos e redes). */
export const company = {
  name: "HR da Amazônia",
  tagline: "Soluções Logísticas",
} as const;

export type NavLink = { label: string; href: string; external?: boolean };
export type NavItem = NavLink | { label: string; children: NavLink[] };

export const nav: NavItem[] = [
  { label: "Início", href: "/" },
  {
    label: "Institucional",
    children: [
      { label: "Quem Somos", href: "/quem-somos" },
      { label: "Onde Estamos", href: "/onde-estamos" },
      { label: "HR Armazéns Gerais", href: "/hr-da-amazonia" },
      { label: "Nossa Frota", href: "/nossa-frota" },
      { label: "Eficácia", href: "/eficacia" },
      { label: "Ambiental", href: "/ambiental" },
    ],
  },
  {
    label: "O que Fazemos",
    children: [
      { label: "Nossos Serviços", href: "/nossos-servicos" },
      { label: "Armazenagem de Mercadorias", href: "/servico/armazenagem-de-mercadorias" },
      { label: "Cabotagem", href: "/servico/cabotagem" },
      { label: "Cargas Fracionadas", href: "/servico/cargas-fracionadas" },
      { label: "Cargas Fechadas", href: "/servico/cargas-fechadas" },
      { label: "Cargas de Produtos Perigosos", href: "/servico/cargas-de-produtos-perigosos" },
      { label: "Transporte Multimodal", href: "/servico/transporte-multimodal" },
    ],
  },
  {
    label: "Contato",
    children: [
      { label: "Fale Conosco", href: "/fale-conosco" },
      { label: "Acompanhe sua carga", href: "/rastreamento" },
      { label: "HR NEWS", href: "/hr-news" },
    ],
  },
];

export type Detail = {
  slug: string;
  title: string;
  short: string;
  image: string;
  paragraphs: string[];
  bullets?: { title: string; items: string[] };
};

export const services: Detail[] = [
  {
    slug: "armazenagem-de-mercadorias",
    title: "Armazenagem de Mercadorias",
    short: "Estoque mais perto do cliente, com qualidade e segurança.",
    image: "/fotos/armazem-03.jpg",
    paragraphs: [
      "Este serviço é oferecido a todos os nossos clientes em nosso maior Centro de Distribuição, situado na cidade de Manaus, associado às nossas unidades logísticas espalhadas em todo o país.",
      "Desta forma, os produtos transportados por nossa empresa têm a possibilidade de ficarem armazenados em uma de nossas unidades de forma temporária a curto, médio e longo prazos, conforme acordado em contrato, proporcionando maior proximidade do estoque do cliente, com qualidade e segurança, dando todo o suporte para soluções logísticas inteligentes que oferecemos.",
    ],
  },
  {
    slug: "cabotagem",
    title: "Cabotagem",
    short: "Contêineres pelos portos, com segurança até o destino final.",
    image: "/fotos/sede-01.jpg",
    paragraphs: [
      "O serviço de CABOTAGEM é oferecido por meio do transporte de containers no âmbito portuário. Coletamos as mercadorias e as entregamos com SEGURANÇA e QUALIDADE no seu destino final.",
    ],
    bullets: {
      title: "Principais vantagens",
      items: [
        "Menor custo unitário do serviço contratado",
        "Menor índice de avarias dos produtos transportados",
        "Menor índice de sinistros de seguros",
        "Redução do desgaste das malhas rodoviárias do país",
        "Redução de acidentes nas estradas",
        "Menor consumo de combustíveis",
        "Menor índice de poluição",
      ],
    },
  },
  {
    slug: "cargas-fracionadas",
    title: "Cargas Fracionadas",
    short: "Transporte compartilhado, com foco no eixo sudeste-norte.",
    image: "/fotos/armazem-02.jpg",
    paragraphs: [
      "Nesse tipo de serviço o cliente contrata o transporte de produtos compartilhados com outros tipos de produtos e clientes. Este serviço é ideal para ocasiões nas quais a quantidade de produtos transportados não seja suficiente para atingir a contratação dos serviços de transporte de carga tipo lotação.",
      "Assim, nessa modalidade de serviço atuamos principalmente no eixo sudeste-norte, viabilizando a vinda de produtos para a Região Norte.",
    ],
  },
  {
    slug: "cargas-fechadas",
    title: "Cargas Fechadas",
    short: "Lotação completa e exclusiva para a sua carga.",
    image: "/fotos/frota-02.jpg",
    paragraphs: [
      "Nessa modalidade de serviço o cliente contrata o transporte de carga em container, carreta aberta ou baú, ou ainda rodotrem, com a lotação completa e exclusiva.",
    ],
  },
  {
    slug: "cargas-de-produtos-perigosos",
    title: "Cargas de Produtos Perigosos",
    short: "Dentro das normas e leis vigentes, com as licenças ambientais.",
    image: "/fotos/frota-01.jpg",
    paragraphs: [
      "Transportamos produtos que obedecem à classificação de perigosos em obediência às normas e leis vigentes no Brasil, incluindo as licenças ambientais.",
      "Temos ampla experiência no transporte e armazenamento de produtos como carboreto, tintas e catalisadores, entre vários outros.",
    ],
    bullets: {
      title: "Licenças e certificações",
      items: [
        "PF (Polícia Federal) — Transporte de Químicos e Controlados (CRC/CLF)",
        "IBAMA — Certificado de Regularidade",
        "IPAAM — Licença de Instalação e Operação",
        "SEMMAS (Secretaria de Meio Ambiente) — PIA e CRC",
        "ANTT — Cadastro Geral e OTM",
        "SEFAZ — Fiel Depositário",
        "ISO 9001/2015 (Tramitação) e SASSMAQ (Tramitação)",
        "AVCB (Corpo de Bombeiros)",
      ],
    },
  },
  {
    slug: "transporte-multimodal",
    title: "Transporte Multimodal",
    short: "Rodoviário, fluvial e ferroviário combinados até o destino.",
    image: "/fotos/sede-03.jpg",
    paragraphs: [
      "Com 20 anos de experiência nessa solução, buscamos cada vez mais aprimorar nossos métodos para satisfação dos nossos clientes, tornando o nosso principal foco de serviço.",
      "O Transporte Multimodal se dá quando é exigida para o transporte do bem mais de uma modalidade de tráfego até o destino, combinando trechos rodoviários, fluviais e ferroviários. No rodo-fluvial, por exemplo, a carga viaja pela estrada e também via balsa ou navio, dependendo da localidade.",
      "Além do transporte interestadual e intermunicipal, de acordo com a sua necessidade realizamos trabalho de coleta, armazenagem e distribuição das cargas transportadas, inclusive redespachando para outras localidades brasileiras.",
    ],
  },
];

export const solutions: Detail[] = [
  {
    slug: "cargas-perigosas",
    title: "Cargas Perigosas",
    short: "Transporte de cargas químicas e substâncias controladas, com segurança também para alimentos, medicamentos e outros produtos de alto valor agregado.",
    image: "/fotos/frota-01.jpg",
    paragraphs: [
      "Atuamos no transporte de cargas químicas, garantindo a segurança na logística de transportes de substâncias e produtos de alto valor agregado que necessitem de cuidados especiais, desde o armazenamento à embalagem.",
    ],
  },
  {
    slug: "armazens-gerais",
    title: "Armazéns Gerais",
    short: "Centro de Distribuição e Armazenamento com aproximadamente 10.000 m² e dezenas de docas para carga e descarga.",
    image: "/fotos/armazem-01.jpg",
    paragraphs: [
      "Nosso Centro de Distribuição e Armazenamento conta com uma infraestrutura de aproximadamente 10.000 m², com dezenas de docas para carga e descarga e área de armazenagem com milhares de posições “pallets” verticalizadas.",
      "Toda área é coberta por sistema de segurança eletrônica e vigilância noturna, para o conforto e proteção das cargas que passam por nós.",
    ],
  },
  {
    slug: "entrega-programada",
    title: "Entrega Programada",
    short: "Postos em cidades estratégicas e política de frete seguro: prazos definidos conforme a demanda do cliente.",
    image: "/fotos/frota-03.jpg",
    paragraphs: [
      "Nossos postos distribuídos em cidades estratégicas do Brasil e nossa política de frete seguro possibilitam um padrão de entrega diferenciado. Nossos prazos são definidos conforme a demanda do cliente, melhorando sempre o tempo de deslocamento com datas pré-agendadas para a carga chegar ao seu destino final.",
      "Os sistemas de gerenciamento de risco Buonny e Quadeo garantem nossa entrega, possibilitando aos nossos parceiros, como a Swiss Re Corporate Solutions e a Golden Service, o monitoramento e rastreamento das cargas de nossos clientes.",
    ],
  },
];

export const about = {
  text: [
    "A melhor operadora de logística da Amazônia Ocidental, que trabalha com foco no transporte rodo-fluvial e cabotagem para todo o Brasil. Fundada em 1997, nossa empresa visa a excelência na prestação dos serviços e a melhoria contínua dos nossos processos.",
    "Para isso, contamos com o ideal logístico ecoeficiente, direcionado ao compromisso com nossos colaboradores, clientes e com a sociedade em geral, por meio de ações norteadas para a preservação do meio ambiente.",
    "Nossa matriz está localizada estrategicamente em Manaus, capital do Estado do Amazonas, onde se situa um dos maiores e melhores parques industriais do mundo — o Pólo Industrial de Manaus. Nossa estrutura própria conta com uma área superior a 42.000 m², entre área construída e de pátio.",
    "Temos Unidades de Distribuição em Belém (PA), Boa Vista (RR), Codó (MA), Goiânia (GO) e Guarulhos (SP), que atuam como entrepostos para todas as regiões do Brasil e países da América Latina, como Guiana Inglesa, Guiana Francesa e Venezuela.",
  ],
  mission: "Fazer do ato de Transportar uma experiência agradável, que gere bons resultados aos clientes, sócios e colaboradores, aliando conhecimento, confiança, agilidade e tecnologia.",
  vision: "Ser referência na consolidação logística da Amazônia com o Brasil e Países Vizinhos até 2025.",
  values: ["Clareza", "Civismo", "Dignidade Família", "Fé", "Engajamento"],
};

export const stats = [
  { value: 1997, prefix: "", suffix: "", label: "ano de fundação", plain: true },
  { value: 42000, prefix: "+", suffix: " m²", label: "de área construída e pátio" },
  { value: 300, prefix: "+", suffix: "", label: "veículos na frota" },
  { value: 5000, prefix: "+", suffix: "", label: "posições pallet verticalizadas" },
];

export const testimonials = [
  {
    name: "Valdenir Magalhães",
    role: "Diretor Presidente da Amazon Aço",
    quote: "Nossa parceria com HRLog é de longas datas, iniciamos pequenos transportando somente aqui na capital para pequenas lojas, com o crescimento do negócio hoje exportamos nosso principal produto para todo o Brasil, nos últimos 5 anos. Com certeza a HRLog contribui muito para o nosso negócio, ela vem numa crescente operacional impressionante, o que deixa a nossa parceria cada vez mais sólida e promissora.",
  },
  {
    name: "Hugo Willian",
    role: "Gerente Geral da HR da Amazônia",
    quote: "Atualmente estamos vivendo um tempo de muita inovação, para driblar a crise estamos usando da nossa criatividade, da nossa expertise e nossa cultura interna para manter o propósito e os avanços nos nossos negócios. Nesse mercado sabemos que somente os fortes sobrevivem.",
  },
];

export const quote = {
  text: "As metas indicam aquilo que uma unidade de negócios deseja alcançar; estratégia é um plano de como chegar lá.",
  author: "Philip Kotler",
};

export const clients = [
  ["FC Oliveira", "cliente-fc-oliveira.png"],
  ["Cargill", "cliente-cargill.png"],
  ["Petrobras", "cliente-petrobras.png"],
  ["Amazon Aço", "cliente-amazon-aco.png"],
  ["Sinobras", "sinobras.jpg"],
  ["Star Química", "star-quimica.jpg"],
  ["Caloi", "logo-caloi.png"],
  ["Voith", "voith.jpg"],
].map(([name, file]) => ({ name, logo: `/clientes/${file}` }));

export const news = [
  {
    slug: "suframa-otimiza-processos-digitais",
    title: "Suframa otimiza processos digitais",
    date: "14/06/2017",
    image: "/fotos/distrito-industrial.jpg",
    excerpt: "Tramitação de documentos na SUFRAMA ocorrerá apenas na forma digital.",
    source: "http://site.suframa.gov.br/noticias/tramitacao-de-documentos-na-suframa-ocorrera-apenas-na-forma-digital",
    body: [
      "Tramitação de documentos na SUFRAMA ocorrerá apenas na forma digital.",
      "Autarquia institui o Sistema Eletrônico de Informações (SEI) como sistema oficial de gestão de processos e documentos eletrônicos, como forma de eliminar o uso do papel e substituir processos físicos por digitais.",
      "Após a publicação da Portaria nº 174, no Boletim de Serviço Extra nº 94/2017, o Sistema Eletrônico de Informações (SEI) passou a ser utilizado, desde segunda-feira (5), como sistema oficial de gestão de processos e documentos eletrônicos da SUFRAMA. Com isso, a tramitação de memorandos, portarias, ofícios e despachos, entre outros, será feita, exclusivamente, através do SEI. A medida atende o Decreto nº 8.539, de 9 de outubro de 2015, que determinou o uso de meio eletrônico para a tramitação de documentos nos órgãos e entidades da administração pública direta, autárquica e fundacional.",
      "O superintendente adjunto Executivo, substituto, Carlito de Holanda Sobrinho, ressaltou que este é um momento histórico para a instituição e lembrou que a SUFRAMA foi a primeira instituição na Região Norte, em março de 2016, a assinar acordo de cooperação técnica para implantar o SEI e aderir ao Processo Eletrônico Nacional (PEN), visando à eliminação do papel e à substituição de processos físicos por digitais. “A utilização do SEI nos permitirá redução de despesas e economia de tempo, bem como trará maior eficiência e eficácia à gestão como um todo, inserindo a SUFRAMA no rol de instituições que já trabalham com essa ferramenta de grande importância no âmbito do governo federal”, avaliou Sobrinho.",
      "A implantação do SEI na SUFRAMA foi realizada por meio do Grupo de Trabalho (GT) instituído pela Portaria nº 159, de 17 março de 2016, e prorrogado pela Portaria nº 137, de 9 de maio de 2017. Com a mudança do sistema, a recepção de documentos externos por meio do Protocolo Geral da SUFRAMA foi transferida para o hall da autarquia, seguindo orientação da Portaria Interministerial nº 1.677/2015, do Ministério da Justiça e Ministério do Planejamento, Orçamento e Gestão.",
      "O vice-presidente do GT de implantação, Billidins Ramos, explicou que o SEI permitirá ao público externo a opção de enviar documentos já digitalizados diretamente aos setores da SUFRAMA, desafogando o setor de Protocolo. “Por exemplo, um fornecedor que precisa enviar uma fatura à Coordenação Geral de Recursos Logísticos pode fazê-lo por meio digital, via e-mail, diretamente ao setor, sem a necessidade de se deslocar até a SUFRAMA e passar pelo setor de Protocolo”, observou.",
      "O Sistema Eletrônico de Informações (SEI), desenvolvido pelo Tribunal Regional Federal da 4ª Região (TRF4), é um sistema de gestão de processos e documentos eletrônicos, com interface amigável e práticas inovadoras de trabalho.",
      "O SEI foi escolhido como a solução de processo eletrônico no âmbito do projeto Processo Eletrônico Nacional (PEN), iniciativa conjunta de órgãos e entidades de diversas esferas da administração pública, com o intuito de construir uma infraestrutura pública de processos e documentos administrativos eletrônicos.",
    ],
  },
];
