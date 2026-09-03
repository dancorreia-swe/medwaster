type BlockNoteText = {
  type: "text";
  text: string;
};

type BlockNoteBlock = {
  type: "paragraph" | "heading" | "bulletListItem";
  content: BlockNoteText[];
  props?: { level: 1 | 2 | 3 };
};

const sectionHeadings = new Set([
  "INTRODUÇÃO",
  "CLASSIFICAÇÃO DOS RESÍDUOS DE SAÚDE",
  "Grupo A – Biológicos",
  "Subdivisões do Grupo A:",
  "Grupo B – Químicos",
  "Subdivisões do Grupo B:",
  "Grupo C – Radioativos",
  "Grupo D – Resíduos comuns",
  "Grupo E – Perfurocortantes",
  "Locais de Geração dos Resíduos de Serviços de Saúde",
  "Manejo e Descarte Correto dos RSS",
  "Procedimentos específicos para cada grupo",
  "Grupo D – Comuns",
  "IMPACTOS DO MANEJO INADEQUADO, CONSEQUÊNCIAS E IMPACTOS AMBIENTAIS",
  "Gerenciamento adequado de resíduos: importância e benefícios",
  "Estratégias para Redução dos Impactos",
  "Capacitação",
  "Conscientização",
  "Uso de Tecnologias Sustentáveis",
  "Uso de Materiais Biodegradáveis",
  "Monitoramento Ambiental",
  "Principais aspectos do monitoramento ambiental",
  "Quem realiza o monitoramento",
  "Frequência do monitoramento",
  "Políticas e Fiscalização",
  "TRILHA",
  "Perguntas para a trilha",
]);

const toBlockNote = (text: string): BlockNoteBlock[] =>
  text
    .split("\n")
    .filter((line) => line.length > 0)
    .map((line) => {
      if (line.startsWith("• ")) {
        return {
          type: "bulletListItem",
          content: [{ type: "text", text: line.slice(2) }],
        };
      }

      if (sectionHeadings.has(line)) {
        return {
          type: "heading",
          props: { level: line === "INTRODUÇÃO" || line === "TRILHA" || line === "CLASSIFICAÇÃO DOS RESÍDUOS DE SAÚDE" ? 1 : 2 },
          content: [{ type: "text", text: line }],
        };
      }

      return {
        type: "paragraph",
        content: [{ type: "text", text: line }],
      };
    });

const texto01 = `INTRODUÇÃO

Você sabia que os resíduos gerados em hospitais, clínicas, laboratórios e outros serviços de saúde podem representar riscos à saúde humana e ao meio ambiente quando não são manejados corretamente?

Conhecidos como Resíduos de Serviços de Saúde (RSS), esses materiais diferem do lixo comum por poderem conter agentes infecciosos, substâncias químicas perigosas ou materiais radioativos. O descarte inadequado desses resíduos pode causar acidentes ocupacionais, contaminação do solo e da água, além de contribuir para a disseminação de doenças.

Por isso, o gerenciamento adequado dos RSS é fundamental para garantir a segurança dos profissionais, da população e do meio ambiente, devendo seguir normas e procedimentos específicos em todas as etapas do manejo e descarte.

Este aplicativo tem como objetivo apresentar, de forma clara, prática e interativa, informações sobre os resíduos de serviços de saúde (RSS), abordando sua classificação, locais de geração, formas adequadas de manuseio, segregação, acondicionamento e descarte. Além disso, busca informar e orientar profissionais da saúde, estudantes e a comunidade em geral sobre a importância do gerenciamento correto desses resíduos, contribuindo para a prevenção de riscos à saúde pública, à segurança dos trabalhadores e à preservação do meio ambiente.

Por meio de recursos educativos e conteúdos atualizados, o aplicativo promove o aprendizado e a conscientização sobre as boas práticas no manejo dos resíduos de serviços de saúde, fortalecendo a responsabilidade socioambiental e o cumprimento das normas vigentes.`;

const texto02 = `Os Resíduos de Serviços de Saúde (RSS) constituem uma categoria de resíduos sólidos gerados em diversas atividades relacionadas ao atendimento à saúde humana e animal. Sua classificação e gerenciamento são regulamentados por legislações específicas no Brasil, como a Resolução da Diretoria Colegiada (RDC) nº 222/2018 da Agência Nacional de Vigilância Sanitária (ANVISA) e a Resolução nº 358/2005 do Conselho Nacional do Meio Ambiente (CONAMA) (BRASIL, 2018; BRASIL, 2005).

De acordo com a RDC nº 222/2018, os RSS são definidos como "resíduos gerados nos serviços de saúde, compreendendo os resíduos produzidos em hospitais, clínicas, laboratórios, ambulatórios, consultórios médicos e odontológicos, serviços de medicina veterinária, farmácias, unidades de pronto atendimento, entre outros". Essa definição abrange um vasto conjunto de materiais, desde aqueles que apresentam risco biológico, químico ou radioativo até resíduos comuns equiparados aos domiciliares.

A gestão inadequada desses resíduos representa um sério risco à saúde pública e ao meio ambiente, podendo causar a disseminação de agentes infecciosos e contaminantes químicos. O correto manejo é necessário para minimizar os impactos ambientais e proteger a saúde dos profissionais de saúde, dos pacientes e da população em geral (OLIVEIRA FILHO, COSTA; SOUZA, 2024).

A Resolução RDC nº 222/2018 elenca uma série de estabelecimentos que são considerados geradores de RSS. Esses locais, por sua natureza, produzem resíduos que exigem manuseio, tratamento e descarte diferenciados. Entre as principais fontes geradoras, destacam-se:

• Serviços de atendimento médico e hospitalar: hospitais, clínicas, ambulatórios e pronto-socorros que geram resíduos como seringas, luvas, gazes contaminadas, tecidos orgânicos, fluidos corporais e materiais perfurocortantes.
• Laboratórios de análises clínicas: locais onde são coletadas e analisadas amostras biológicas, produzindo tubos de ensaio com sangue, placas de Petri, lâminas e outros materiais que podem conter microrganismos patogênicos.
• Consultórios odontológicos: geram resíduos como agulhas, brocas, resíduos de amálgama e algodão contaminado.
• Serviços de medicina veterinária: abrangem clínicas, hospitais e laboratórios veterinários, que produzem resíduos similares aos do atendimento humano, como tecidos animais, luvas e materiais cirúrgicos.
• Farmácias e drogarias: geram principalmente resíduos de medicamentos vencidos ou impróprios para uso, que podem ser perigosos se descartados incorretamente.
• Serviços de acupuntura e tatuagem: geram agulhas e outros materiais perfurocortantes que exigem descarte seguro para evitar a transmissão de doenças infecciosas.

O gerenciamento eficaz dos RSS, desde a separação na fonte até a disposição final, é crucial para a saúde humana e ambiental, conforme a legislação vigente e discutido na literatura acadêmica (OLIVEIRA FILHO, COSTA; SOUZA, 2024; SILVEIRA et al., 2023).

Reflexão: Por que a segregação correta dos RSS no momento da geração é considerada uma das etapas mais importantes do gerenciamento desses resíduos?`;

const texto03 = `CLASSIFICAÇÃO DOS RESÍDUOS DE SAÚDE

Os Resíduos de Serviços de Saúde (RSS) constituem uma categoria diversificada de materiais descartados, provenientes de atividades relacionadas à atenção à saúde humana ou animal, incluindo pesquisa, ensino e desenvolvimento. A correta segregação e classificação desses resíduos são etapas primordiais na gestão ambiental e sanitária, visando à proteção da saúde pública e do meio ambiente.

Grupo A – Biológicos
O Grupo A engloba os resíduos que apresentam risco potencial de infecção devido à presença de agentes biológicos, como microrganismos (bactérias, vírus, fungos, parasitas), príons e toxinas capazes de causar doenças em seres humanos ou animais. A identificação e o manejo adequado desses resíduos são cruciais para a prevenção de contaminações e a interrupção de cadeias de transmissão de infecções.

Subdivisões do Grupo A:
Para fins de manejo e tratamento, o Grupo A é subdividido em categorias mais específicas, considerando o risco e a natureza do material:
• A1 - Resíduos com possível presença de agentes biológicos de Classe de Risco 4 ou que apresentem alto risco de infecção: Incluem, mas não se limitam a, culturas e estoques de microrganismos; resíduos de vacinas de microrganismos vivos atenuados; resíduos resultantes de atenção à saúde de indivíduos ou animais com suspeita ou confirmação de infecção por agentes biológicos de Classe de Risco 4 (ex: Ebola, Marburg); e bolsas transfusionais vazias ou com volume residual.
• A2 - Resíduos que contêm agentes biológicos de Classe de Risco 3: Abrangem carcaças, peças anatômicas, vísceras e outros resíduos provenientes de animais submetidos a processos de experimentação com agentes de Classe de Risco 3; ou de animais que foram inoculados com microrganismos patogênicos de Classe de Risco 3.
• A3 - Peças anatômicas: Destina-se a partes do corpo humano (membros, órgãos, tecidos) resultantes de procedimentos cirúrgicos, necropsias ou amputações, sem a presença de risco biológico adicional que as enquadre em A1 ou A2.
• A4 - Resíduos que não apresentam risco biológico adicional: São resíduos classificados nessa categoria por não apresentarem risco biológico adicional, incluindo bolsas de sangue e hemocomponentes inviáveis para uso, materiais de hemodiálise que não contenham agentes de Classe de Risco 3 ou 4 e resíduos de laboratórios de análises clínicas com presença de sangue ou outros líquidos corpóreos, mas sem risco biológico adicional. Essa classificação não significa que o material se torne seguro após tratamento.
• A5 - Resíduos de tecidos, órgãos e fluidos com risco de príons: São materiais provenientes de pacientes ou animais suspeitos ou confirmados de contaminação por príons, com risco biológico específico. A destinação específica, incluindo incineração quando aplicável, deve seguir a RDC nº 222/2018 e ser realizada em tecnologia licenciada ou autorizada.

Grupo B – Químicos
Resíduos que contêm substâncias químicas que podem representar risco à saúde pública ou ao meio ambiente, independentemente de serem inflamáveis, corrosivos, reativos ou tóxicos:
• Medicamentos (citotóxicos, hormônios, antineoplásicos, imunossupressores, antirretrovirais, etc.);
• Desinfetantes, saneantes, agentes de limpeza e reagentes de laboratório
• Efluentes de revelação de filmes e de equipamentos automatizados de análises clínicas;
• Resíduos contendo metais pesados;

Subdivisões do Grupo B:
Para fins de manejo, o Grupo B é subdividido conforme a natureza e toxicidade das substâncias químicas, já que cada tipo possui riscos diferentes e exige tratamentos e destinos específicos para evitar contaminação ambiental e química:
• B1: Medicamentos e insumos farmacêuticos vencidos, contaminados ou proibidos;
• B2: Produtos de higiene ou cosméticos vencidos / em desuso;
• B3: Reagentes, solventes, desinfetantes, desinfestantes;
• B4: Resíduos industriais como tintas, óleos, vernizes, graxas.

Grupo C – Radioativos
Resíduos contendo ou contaminados por radionuclídeos em quantidade superior aos limites de eliminação, definidos pela Comissão Nacional de Energia Nuclear (CNEN), que não podem ser reutilizados.
• Materiais contendo ou contaminados por radionuclídeos provenientes de medicina nuclear, radioterapia e atividades de pesquisa;
• Rejeitos radioativos de laboratórios, como seringas, compressas e equipos contaminados.
• A radiografia convencional e a tomografia computadorizada não geram, por si só, resíduos radioativos do Grupo C.

Grupo D – Resíduos comuns
São resíduos sem risco biológico, químico ou radiológico, semelhantes ao lixo domiciliar:
• Papel, restos alimentares, fraldas, gesso, varrição e materiais de escritório.
• Algodão ou materiais de hemostasia com pouca quantidade de sangue contido

O grupo D possui uma subdivisão que visa facilitar o manejo e a destinação adequada dos resíduos que não apresentam risco biológico, químico ou radiológico:
• Recicláveis: materiais que podem ser reaproveitados, como papel, papelão, plásticos e metais.
• Não recicláveis: materiais que devem ser destinados a aterros sanitários, como restos alimentares contaminados, fraldas e gesso.

Grupo E – Perfurocortantes
São materiais capazes de cortar ou perfurar, contaminados ou não, e que oferecem risco de acidentes e infecção:
• Agulhas, bisturis, lâminas;
• Lancetas, ampolas de vidro, micropipetas, lamínulas e todos os utensílios de vidro quebrados no laboratório (pipetas, tubos de coleta sanguínea, placas de Petri).

Locais de Geração dos Resíduos de Serviços de Saúde
Compreender os locais de geração dos Resíduos de Serviços de Saúde (RSS) vai além de uma simples listagem. É essencial aprofundar o entendimento sobre as dinâmicas e particularidades de cada ambiente para um gerenciamento verdadeiramente eficaz e seguro. A natureza dos procedimentos realizados e o perfil dos geradores influenciam diretamente a quantidade, a composição e o potencial de risco dos resíduos produzidos.

Os serviços assistenciais são o epicentro da geração de RSS, refletindo a constante demanda por cuidados de saúde. A diversidade de especialidades e o fluxo ininterrupto de pacientes e procedimentos resultam em um volume expressivo e uma complexidade inerente aos resíduos gerados.

• Hospitais: O Grande Gerador Multifacetado
Em um hospital, a produção de RSS é onipresente. No pronto-socorro, a urgência e a imprevisibilidade resultam em grande volume de materiais do Grupo A (biológicos), como curativos saturados de sangue, luvas contaminadas e amostras de fluidos corporais. Nos blocos cirúrgicos, além de tecidos e órgãos (Grupo A), há uma intensa geração de perfurocortantes (Grupo E), como bisturís e agulhas de sutura, e resíduos de medicamentos (Grupo B). Nas enfermarias e UTIs, a rotina de cuidados com pacientes acamados gera constantemente luvas, seringas, equipos e sondas, muitos deles contaminados. Os laboratórios clínicos são fontes primárias do Grupo A (culturas, amostras de sangue) e do Grupo B (reagentes químicos, soluções de desinfecção). A complexidade do gerenciamento hospitalar reside na necessidade de segregação imediata em cada ponto de geração, garantindo a segurança de pacientes e profissionais.

• Clínicas e Consultórios: A Especificidade na Geração
Mesmo em menor escala que um hospital, cada tipo de clínica ou consultório possui um perfil de resíduos característico. Os consultórios odontológicos são notórios pela geração de resíduos do Grupo A (algodão com sangue, dentes extraídos) e do Grupo E (agulhas de anestesia, brocas). Clínicas de fisioterapia podem gerar menos resíduos de alto risco, focando mais em materiais comuns (Grupo D) e alguns perfurocortantes (agulhas de acupuntura, se utilizadas). A vigilância e a conscientização são cruciais nesses ambientes menores para evitar a mistura de resíduos e garantir a destinação correta.

• Serviços de Apoio Diagnóstico e Terapêutico:
Serviços de hemodiálise geram grandes volumes de resíduos do Grupo A (linhas de diálise, filtros) e E (agulhas e cateteres), devido ao contato direto com o sangue. Serviços de medicina nuclear, radioterapia e laboratórios de pesquisa que utilizam radionuclídeos são locais de geração de resíduos radioativos (Grupo C). A radiografia convencional e a tomografia computadorizada não geram, por si só, resíduos radioativos. Nesses locais, a gestão da radioatividade é um fator adicional de complexidade.

• Instituições Acadêmicas: A Interface entre Ensino, Pesquisa e Saúde
As instituições acadêmicas apresentam uma dinâmica de geração de RSS que intercala atividades de ensino, pesquisa e, em alguns casos, assistência à saúde. A variabilidade dos resíduos reflete a diversidade de disciplinas e projetos desenvolvidos.

• Universidades e Institutos de Pesquisa: O Laboratório do Conhecimento e da Geração de Resíduos
Em universidades com cursos na área da saúde (Medicina, Enfermagem, Biomedicina, Odontologia, Veterinária) e em institutos de pesquisa, a geração de RSS é inerente às práticas laboratoriais. Laboratórios de microbiologia, por exemplo, geram culturas de microrganismos (Grupo A) e resíduos de meios de cultura. Laboratórios de química são fontes de reagentes vencidos ou contaminados (Grupo B). Aulas práticas de anatomia podem gerar resíduos de tecidos e materiais utilizados na dissecação (Grupo A e E). A principal característica aqui é a necessidade de um rigoroso controle e educação contínua de alunos e pesquisadores sobre a segregação e descarte correto, uma vez que a inexperiência pode aumentar o risco de acidentes e contaminação.

• Hospitais-Escola: A Geração Mista e a Dupla Responsabilidade
Os hospitais-escola são um caso à parte, pois combinam a intensa geração de RSS de um serviço assistencial com as especificidades da pesquisa e do ensino. Isso significa que, além de todos os resíduos dos grupos A, B, D e E esperados em um hospital, há também resíduos provenientes de estudos clínicos, experimentação e treinamento prático. A gestão desses resíduos exige uma coordenação ainda mais complexa entre os departamentos assistenciais e acadêmicos.

• Faculdades com Ênfase em Tecnologias Específicas:
Em faculdades que oferecem especializações em Medicina Nuclear ou desenvolvem pesquisa com radionuclídeos, a presença de resíduos radioativos (Grupo C) é um diferencial. Isso exige laboratórios e procedimentos específicos para o manuseio e descarte desses materiais, que são regidos por normas ainda mais estritas que as da Anvisa e Conama, envolvendo também órgãos como a Comissão Nacional de Energia Nuclear (CNEN). Cursos de Radiologia que utilizam radiografia convencional ou tomografia computadorizada não geram, por si só, resíduos radioativos.

Em suma, a compreensão aprofundada dos locais de geração e de suas particularidades é essencial para a elaboração de planos de gerenciamento de RSS que sejam não apenas complacentes com a legislação, mas também eficazes na proteção da saúde pública e do meio ambiente.`;

const texto04 = `Manejo e Descarte Correto dos RSS

O manejo adequado dos resíduos de serviços de saúde (RSS) envolve procedimentos específicos para cada grupo de resíduos, bem como cuidados no armazenamento, transporte e tratamento, garantindo segurança, prevenção de contaminações e proteção ambiental, além do uso de EPIs (luvas resistentes, máscaras, óculos, aventais impermeáveis, etc.), que são obrigatórios para prevenir acidentes.

O armazenamento deve ser realizado em áreas protegidas, ventiladas e sinalizadas, com separação por grupo e controle de acesso. Cada recipiente precisa estar identificado com o tipo de resíduo e o risco associado. O transporte deve ser seguro, utilizando equipamentos fechados, carrinhos específicos e rotas internas que evitem contato com pessoas e áreas públicas. Para resíduos químicos, biológicos ou radioativos, podem ser exigidas normas especiais de contenção. O tratamento e a destinação seguem o grupo e o subgrupo, o risco, a composição e as tecnologias licenciadas ou autorizadas. Para resíduos biológicos e perfurocortantes, podem ser aplicadas tecnologias de tratamento autorizadas, conforme o risco e o enquadramento; resíduos químicos dependem de composição, incompatibilidades, periculosidade e destinação licenciada, sem neutralização universal; resíduos radioativos exigem gestão específica conforme as normas da CNEN; e resíduos orgânicos do Grupo D, corretamente segregados e de baixo risco, podem ser encaminhados para reciclagem ou compostagem quando houver autorização.

Procedimentos específicos para cada grupo
Cada grupo de resíduos possui características e riscos distintos, exigindo procedimentos específicos:
Grupo A – Biológicos
• Segregação: deve ser feita na fonte geradora, usando sacos ou recipientes resistentes, cor e símbolo identificados.
• Acondicionamento: sacos ou recipientes resistentes a perfuração e vazamento, sinalizados com risco biológico.
• Tratamento: deve seguir o subgrupo, o risco e a tecnologia licenciada ou autorizada aplicável; autoclavagem, incineração ou micro-ondas industriais somente quando previstas e autorizadas.
• Exceções: bolsas de sangue inviáveis ou outros materiais somente podem seguir a destinação após o tratamento exigido e conforme o enquadramento, o risco e as regras aplicáveis.
Grupo B – Químicos
• Segregação: separar por tipo (medicamentos, reagentes, saneantes, metais pesados).
• Acondicionamento: recipientes resistentes a vazamentos e corrosão, identificados com o tipo de químico.
• Tratamento: depende da composição, incompatibilidades e periculosidade; deve seguir tecnologia e destinação licenciadas ou autorizadas, podendo incluir encaminhamento a empresas especializadas. A neutralização não é universalmente permitida.
Grupo C – Radioativos
• Segregação: separar por tipo de radioisótopo e meia-vida.
• Acondicionamento: recipientes blindados e sinalizados, resistentes à radiação.
• Transporte: rotas e veículos específicos conforme CNEN.
• Tratamento: gestão conforme as normas da CNEN, incluindo armazenamento para decaimento radioativo quando aplicável, ou envio a instalações licenciadas.
Grupo D – Comuns
• Segregação: apenas resíduos que não apresentam risco biológico, químico ou radiológico.
• Acondicionamento: sacos comuns ou contêineres, mantidos limpos e longe de áreas de risco.
• Tratamento: encaminhamento conforme a natureza do resíduo, para aterros sanitários ou coleta urbana regular quando permitido.
Grupo E – Perfurocortantes
• Segregação: coletar imediatamente após uso.
• Acondicionamento: caixas rígidas resistentes à perfuração, com tampa segura e sinalização.
• Tratamento: deve seguir o risco e a tecnologia licenciada ou autorizada aplicável; autoclavagem, incineração ou desinfecção somente quando previstas para o resíduo.`;

const texto05 = `IMPACTOS DO MANEJO INADEQUADO, CONSEQUÊNCIAS E IMPACTOS AMBIENTAIS

O manejo inadequado dos Resíduos de Serviços de Saúde (RSS) representa um grave risco à saúde pública e ao meio ambiente, pois esses materiais podem conter agentes infecciosos, produtos químicos perigosos e até substâncias radioativas (Oliveira Filho et al., 2024). A falta de segregação, acondicionamento, coleta, transporte, tratamento e disposição final adequados pode gerar consequências sérias, conforme detalhado na RDC nº 222/2018 (Brasil, 2018).

O gerenciamento incorreto dos RSS expõe profissionais de saúde, trabalhadores da limpeza e a população a riscos diretos, que podem resultar em acidentes, infecções e intoxicações.

• Acidentes com materiais perfurocortantes
Ferimentos com agulhas, bisturis, ampolas quebradas e outros objetos pontiagudos são comuns e podem causar a transmissão de doenças graves, como HIV, hepatites B e C, e tétano (Oliveira Filho, Costa & Souza, 2024). A Resolução CONAMA nº 358/2005 reforça a necessidade de sistemas de descarte seguro desses materiais, visando reduzir a exposição (Brasil, 2005).

• Infecções
O descarte inadequado de materiais contaminados, como gazes, luvas e fluidos corporais, cria ambiente propício à proliferação de microrganismos patogênicos, aumentando o risco de infecções hospitalares e comunitárias (Silveira et al., 2023). A vigilância epidemiológica é essencial para identificar e controlar surtos decorrentes dessa exposição.

• Intoxicações
Resíduos químicos — como restos de quimioterapia, medicamentos vencidos, desinfetantes e solventes — podem causar intoxicações agudas ou crônicas. A inalação de vapores tóxicos, o contato com a pele ou a ingestão acidental podem provocar danos graves a órgãos e sistemas (Oliveira Filho et al., 2024).

• Impactos ambientais
Além dos riscos à saúde humana, o manejo inadequado dos RSS afeta significativamente o meio ambiente, contaminando solo, água e ar.
• Solo: O descarte em aterros comuns ou lixões, sem tratamento adequado, permite que agentes biológicos e substâncias químicas contaminem o solo, prejudicando a agricultura e a biodiversidade local.
• Água: O chorume gerado pela decomposição de RSS pode atingir lençóis freáticos e corpos d’água, representando risco à saúde humana e à fauna aquática (Oliveira Filho et al., 2024).
• Ar: A incineração sem controle de emissões libera poluentes tóxicos e carcinogênicos, como dioxinas e furanos. A queima a céu aberto, ainda presente em alguns locais, aumenta a exposição a fumaça tóxica (Brasil, 2005).

Gerenciamento adequado de resíduos: importância e benefícios
O gerenciamento adequado dos resíduos de serviços de saúde é essencial para proteger profissionais, pacientes, população e o meio ambiente. A correta segregação, acondicionamento, transporte, tratamento e destinação final reduz acidentes com perfurocortantes, infecções e intoxicações, além de prevenir a contaminação do solo, da água e do ar por agentes biológicos, químicos e radioativos. Investir em capacitação, conscientização e uso de tecnologias sustentáveis aplicáveis ao resíduo, como autoclavagem, incineração controlada, tratamento químico e compostagem de resíduos orgânicos do Grupo D corretamente segregados e autorizados, aumenta a segurança, promove a sustentabilidade e garante o cumprimento da legislação vigente, como a RDC nº 222/2018 da ANVISA, a Resolução CONAMA nº 358/2005 e a Lei nº 12.305/2010 (Política Nacional de Resíduos Sólidos). O PGRSS (Plano de Gerenciamento de Resíduos de Serviços de Saúde) funciona como guia prático, reunindo todas as etapas do manejo, responsabilidades, monitoramento ambiental e logística reversa de determinados materiais, assegurando que a instituição realize o descarte de forma organizada, segura e legal.

Estratégias para Redução dos Impactos
Uma das formas mais eficazes de reduzir os impactos dos resíduos de serviços de saúde é investir em capacitação e conscientização de todos os envolvidos no manejo, incluindo profissionais de saúde, estudantes, técnicos de laboratório e trabalhadores da limpeza. Quando todos compreendem os riscos associados a cada tipo de resíduo e conhecem as normas de segregação, acondicionamento, transporte e destinação, o manejo torna-se muito mais seguro e eficiente.

Capacitação
A capacitação é uma das estratégias mais importantes para garantir o manejo seguro dos resíduos de serviços de saúde. Ela consiste em treinamentos sistemáticos e contínuos voltados para todos os profissionais que lidam direta ou indiretamente com os resíduos, incluindo médicos, enfermeiros, técnicos de laboratório, estudantes e trabalhadores da limpeza.

Os treinamentos devem abordar:
• Classificação dos resíduos: identificação correta de cada grupo e subgrupo.
• Segregação e acondicionamento: uso correto de cores, embalagens e EPIs.
• Transporte interno seguro: formas de movimentar os resíduos dentro das instituições sem risco de acidentes ou contaminações.
• Procedimentos em casos de acidentes: condutas imediatas em perfurocortantes, derramamento de químicos ou exposição a agentes biológicos.
• Normas legais e protocolos institucionais: conhecimento das resoluções e regulamentações vigentes, garantindo cumprimento da lei.

Conscientização
A conscientização complementa a capacitação técnica e é fundamental para criar uma cultura de responsabilidade e sustentabilidade no manejo dos resíduos de serviços de saúde. Ela busca que os profissionais compreendam o impacto de suas ações na saúde pública e no meio ambiente, reconhecendo que cada etapa do manejo de resíduos tem consequências diretas sobre a segurança de todos e a preservação dos ecossistemas.

Estratégias eficazes de conscientização incluem:
• Campanhas educativas: uso de materiais visuais, palestras e folhetos para reforçar boas práticas.
• Sinalização e instruções visuais: identificação clara de lixeiras, cores e símbolos que facilitem a segregação correta dos resíduos.
• Lembretes frequentes: avisos periódicos sobre cuidados com perfurocortantes, químicos e biológicos.
• Envolvimento de estudantes e profissionais: atividades práticas e participativas que estimulam o engajamento e a responsabilidade coletiva.

Investir em capacitação e conscientização contribui para:
• Redução de acidentes e infecções.
• Minimização de impactos ambientais, como contaminação do solo, água e ar.
• Maior eficiência no cumprimento da legislação e normas de saúde.
• Formação de profissionais conscientes e preparados para a prática segura e sustentável do manejo de resíduos.`;

const trilha = `TRILHA

Perguntas para a trilha

1. O que significa a sigla RSS?
Resposta: Resíduos de Serviços de Saúde.
✅ Acertou: avance 2 casas.
❌ Errou: volte 1 casa.

2. Qual é o principal risco do manejo inadequado dos RSS?
Resposta: Risco à saúde pública e ao meio ambiente.
✅ +2 casas
❌ -1 casa

3. Cite um exemplo de material perfurocortante.
Resposta: Agulha, bisturi ou ampola quebrada.
✅ +2 casas
❌ -2 casas

4. Quais doenças podem ser transmitidas por acidentes com agulhas contaminadas?
Resposta: HIV, hepatite B e hepatite C.
✅ +3 casas
❌ -2 casas

5. O descarte inadequado de gazes e luvas contaminadas pode favorecer o quê?
Resposta: A proliferação de microrganismos patogênicos.
✅ +2 casas
❌ -1 casa

6. O que são intoxicações causadas por resíduos químicos?
Resposta: Danos provocados pela exposição a substâncias químicas perigosas.
✅ +2 casas
❌ -2 casas

7. Quais compartimentos ambientais podem ser contaminados pelo manejo inadequado dos RSS?
Resposta: Solo, água e ar.
✅ +3 casas
❌ -2 casas

8. Como o solo pode ser contaminado pelos RSS?
Resposta: Pelo descarte inadequado em lixões ou aterros sem tratamento.
✅ +2 casas
❌ -1 casa

9. O que é chorume?
Resposta: Líquido gerado pela decomposição dos resíduos.
✅ +2 casas
❌ -1 casa

10. Por que a contaminação da água é preocupante?
Resposta: Porque pode atingir lençóis freáticos e corpos d'água.
✅ +3 casas
❌ -2 casas

11. Qual problema pode ser causado pela incineração sem controle?
Resposta: Liberação de poluentes tóxicos.
✅ +2 casas
❌ -2 casas

12. O gerenciamento adequado dos resíduos ajuda a prevenir quais três problemas principais?
Resposta: Acidentes, infecções e intoxicações.
✅ +3 casas
❌ -2 casas

13. O que é o PGRSS?
Resposta: Plano de Gerenciamento de Resíduos de Serviços de Saúde.
✅ +3 casas
❌ -2 casas

14. Cite uma tecnologia utilizada no tratamento de resíduos.
Resposta: Autoclavagem, incineração controlada, tratamento químico ou compostagem de resíduos orgânicos do Grupo D corretamente segregados e em operação autorizada.
✅ +2 casas
❌ -1 casa

15. Qual a importância da capacitação dos profissionais?
Resposta: Garantir o manejo seguro e correto dos resíduos.
✅ +3 casas
❌ -2 casas

16. Quem deve receber treinamento sobre manejo de resíduos?
Resposta: Todos os envolvidos, como profissionais de saúde, estudantes, técnicos e trabalhadores da limpeza.
✅ +2 casas
❌ -1 casa

17. O que deve ser ensinado nos treinamentos sobre segregação?
Resposta: Uso correto das cores, embalagens e EPIs.
✅ +2 casas
❌ -1 casa

18. O que deve ser feito em caso de acidente com perfurocortante?
Resposta: Seguir os procedimentos imediatos previstos nos protocolos.
✅ +3 casas
❌ -2 casas

19. O que é conscientização no manejo dos resíduos?
Resposta: Desenvolvimento da responsabilidade e sustentabilidade nas práticas de descarte.
✅ +2 casas
❌ -1 casa

20. Cite uma estratégia de conscientização.
Resposta: Campanhas educativas, palestras ou folhetos.
✅ +2 casas
❌ -1 casa

21. Por que a sinalização das lixeiras é importante?
Resposta: Porque facilita a segregação correta dos resíduos.
✅ +2 casas
❌ -1 casa

22. Qual benefício ambiental é obtido com o gerenciamento adequado dos RSS?
Resposta: Evita a contaminação do solo, da água e do ar.
✅ +3 casas
❌ -2 casas

23. O investimento em conscientização reduz o quê?
Resposta: Acidentes e infecções.
✅ +2 casas
❌ -1 casa

24. Qual lei institui a Política Nacional de Resíduos Sólidos?
Resposta: Lei nº 12.305/2010.
✅ +3 casas
❌ -2 casas

25. (Casa final) - Por que o gerenciamento adequado dos RSS é essencial?
Resposta: Porque protege a saúde das pessoas e preserva o meio ambiente.
✅ Chegou ao final e venceu!
❌ Volte 2 casas e tente novamente.`;

const texto06 = `Uso de Tecnologias Sustentáveis

O uso de tecnologias sustentáveis no manejo de resíduos de serviços de saúde é essencial para reduzir impactos ambientais e promover práticas mais seguras e conscientes. Entre as tecnologias estão autoclavagem, reciclagem, incineração controlada, tratamentos químicos e biológicos, além de compostagem Avançada e Digestão Anaeróbica para resíduos orgânicos de baixo risco, devidamente segregados como Grupo D e encaminhados a unidades autorizadas, e uso de Materiais Biodegradáveis.

Autoclavagem: Processo de esterilização por vapor sob pressão, que pode ser utilizado, quando aplicável e autorizado, para determinados resíduos biológicos e perfurocortantes. Sob parâmetros adequados, reduz microrganismos e pode reduzir a necessidade de incineração, diminuindo emissões poluentes; a destinação deve seguir o enquadramento do resíduo.

Reciclagem: Permite o reaproveitamento de materiais como plásticos, vidros e papéis não contaminados. Reduz a quantidade de resíduos destinados a aterros, economiza recursos naturais e promove sustentabilidade. A segregação correta é fundamental para garantir a segurança do processo.

Incineração controlada: É a queima de resíduos em fornos específicos, com controle de temperatura e emissão de gases. Pode ser indicada, conforme o grupo, o risco, a composição e as regras aplicáveis, para resíduos altamente infectantes ou químicos que não podem ser reciclados. Quando bem controlada, minimiza poluentes e evita contaminação ambiental.

Tratamento químico: Alguns resíduos biológicos e líquidos contaminados podem, quando compatível com sua composição e autorizado, ser tratados com soluções químicas apropriadas, como desinfetantes e agentes neutralizantes. Essa tecnologia pode reduzir o risco biológico; a destinação posterior, inclusive em sistemas de esgoto ou aterros específicos, somente ocorre quando permitida pelas regras e autorizações aplicáveis.

Tratamento biológico: Processos como compostagem ou digestão anaeróbia podem ser aplicados somente a resíduos orgânicos de baixo risco, devidamente segregados como Grupo D e encaminhados a operação autorizada, transformando-os em produtos úteis, como fertilizantes ou biogás.

Logística Reversa: A Política Nacional de Resíduos Sólidos (PNRS – Lei nº 12.305/2010) prevê sistemas de logística reversa para determinados resíduos, garantindo a destinação final ambientalmente adequada. Devem ser encaminhados a pontos de coleta autorizados ou devolvidos ao fabricante:
• Medicamentos vencidos.
• Pilhas e baterias.
• Produtos eletroeletrônicos.
• Alguns insumos hospitalares, quando previsto em regulamento.

Compostagem Avançada e Digestão Anaeróbica: São métodos para tratar resíduos orgânicos de baixo risco, como restos de alimentos, quando devidamente segregados como Grupo D e encaminhados a unidades autorizadas. A compostagem avançada transforma os resíduos em fertilizante orgânico, enquanto a digestão anaeróbica converte a matéria orgânica em biogás para energia e resíduo rico em nutrientes. Ambos reduzem o volume de resíduos e promovem sustentabilidade nas instituições de saúde.

Uso de Materiais Biodegradáveis
A substituição de plásticos convencionais por materiais biodegradáveis em equipamentos médicos descartáveis reduz a geração de resíduos que não podem ser reciclados.

O uso dessas tecnologias contribui para:
• Redução do volume e periculosidade dos resíduos.
• Minimização de impactos ambientais (solo, água e ar).
• Maior segurança para profissionais e pacientes.
• Promoção de sustentabilidade e economia de recursos naturais.`;

const texto07 = `Monitoramento Ambiental

O monitoramento ambiental é uma etapa essencial no gerenciamento de resíduos de serviços de saúde (RSS), pois garante que os resíduos sejam descartados de forma segura e que seus impactos sobre o meio ambiente e a saúde pública sejam minimizados. Ele permite identificar problemas, prevenir contaminações e orientar ajustes nas práticas de manejo.

Principais aspectos do monitoramento ambiental
Solo: Verificação de contaminação química e biológica em áreas de descarte e armazenamento temporário.
• Análises periódicas para detectar metais pesados, resíduos químicos, sangue ou fluidos corporais que possam infiltrar no solo.
Água: Monitoramento de corpos d’água próximos a hospitais e laboratórios, bem como de lençóis freáticos, para evitar contaminação por chorume ou produtos químicos.
• Testes de qualidade da água ajudam a prevenir impactos na saúde humana e na vida aquática.
Ar: Controle de emissões de gases e partículas provenientes de incineração, autoclavagem ou transporte de resíduos.
• Avaliação de poluentes tóxicos, como dioxinas e furanos, que podem ser gerados pela queima inadequada de resíduos hospitalares.
Tecnologias e indicadores: Uso de sensores e sistemas de Internet das Coisas (IoT) para monitorar volumes de resíduos, temperatura e umidade em locais de armazenamento.
• Indicadores de desempenho ambiental, como quantidade de resíduos reciclados, reutilizados ou tratados, ajudam a medir a eficiência das práticas adotadas.
Ações corretivas e prevenção: Os dados obtidos pelo monitoramento permitem corrigir falhas na segregação, acondicionamento e transporte dos resíduos.
• Também orientam treinamentos e conscientização de profissionais, fortalecendo uma cultura de segurança e sustentabilidade.

Quem realiza o monitoramento
• Profissionais da Vigilância Sanitária, órgãos ambientais (como IBAMA e secretarias estaduais ou municipais de meio ambiente) e equipes internas de gestão ambiental das instituições de saúde.
• Laboratórios especializados realizam análises de solo, água e ar quando necessário.

Frequência do monitoramento
O monitoramento deve ser regular e contínuo, com avaliações periódicas de acordo com o tipo de resíduo e risco ambiental.

Em geral, recomenda-se:
• Solo e água: análise semestral ou anual, dependendo do volume e do risco dos resíduos.
• Ar e emissões de gases: monitoramento trimestral ou conforme normas específicas de tratamento e incineração.
• Indicadores de desempenho e sensores IoT: acompanhamento diário ou semanal para controle interno.

Políticas e Fiscalização
O gerenciamento de resíduos de serviços de saúde no Brasil é regulamentado por um conjunto de normas que visam garantir a saúde pública e a proteção ambiental. Além da RDC nº 222/2018 da ANVISA, que estabelece as boas práticas de gerenciamento desses resíduos, outras legislações complementam esse arcabouço normativo:
• Lei nº 12.305/2010: Institui a Política Nacional de Resíduos Sólidos, estabelecendo princípios e diretrizes para a gestão integrada e o gerenciamento ambientalmente adequado dos resíduos sólidos no país.
• Resolução CONAMA nº 358/2005: Dispõe sobre o tratamento e a disposição final dos resíduos dos serviços de saúde, estabelecendo diretrizes para a gestão ambiental desses resíduos.

A fiscalização do cumprimento dessas normas é responsabilidade dos órgãos competentes, como as Vigilâncias Sanitárias locais, o IBAMA e as Secretarias Estaduais e Municipais de Meio Ambiente. Estes órgãos realizam inspeções, auditorias e monitoramentos para assegurar que as instituições de saúde adotem práticas adequadas no manejo de seus resíduos.`;

const basicOptions = (correct: "Verdadeiro" | "Falso") => [
  { label: "Verdadeiro", content: "Verdadeiro", isCorrect: correct === "Verdadeiro" },
  { label: "Falso", content: "Falso", isCorrect: correct === "Falso" },
];

export const rss202608Content = {
  batchKey: "rss-doc-2026-08",
  category: {
    title: "Resíduos de Serviços de Saúde",
    slug: "residuos-de-servicos-de-saude",
  },
  batchTag: {
    name: "RSS 2026-08",
    slug: "rss-2026-08",
  },
  articles: [
    {
      sourceKey: "rss-2026-08-article-01",
      title: "Texto 01 — INTRODUÇÃO",
      slug: "rss-2026-08-texto-01-introducao",
      excerpt:
        "Você sabia que os resíduos gerados em hospitais, clínicas, laboratórios e outros serviços de saúde podem representar riscos à saúde humana e ao meio ambiente quando não são manejados corretamente?",
      readingTimeMinutes: 2,
      contentText: texto01,
      content: toBlockNote(texto01),
      sourceType: "original",
      difficulty: "basic",
      status: "published",
    },
    {
      sourceKey: "rss-2026-08-article-02",
      title: "Texto 02 — Resíduos de Serviços de Saúde",
      slug: "rss-2026-08-texto-02-residuos-de-servicos-de-saude",
      excerpt:
        "Os Resíduos de Serviços de Saúde (RSS) constituem uma categoria de resíduos sólidos gerados em diversas atividades relacionadas ao atendimento à saúde humana e animal.",
      readingTimeMinutes: 3,
      contentText: texto02,
      content: toBlockNote(texto02),
      sourceType: "original",
      difficulty: "basic",
      status: "published",
    },
    {
      sourceKey: "rss-2026-08-article-03",
      title: "Texto 03 — CLASSIFICAÇÃO DOS RESÍDUOS DE SAÚDE",
      slug: "rss-2026-08-texto-03-classificacao-dos-residuos-de-saude",
      excerpt:
        "Os Resíduos de Serviços de Saúde (RSS) constituem uma categoria diversificada de materiais descartados, provenientes de atividades relacionadas à atenção à saúde humana ou animal, incluindo pesquisa, ensino e desenvolvimento.",
      readingTimeMinutes: 8,
      contentText: texto03,
      content: toBlockNote(texto03),
      sourceType: "original",
      difficulty: "intermediate",
      status: "published",
    },
    {
      sourceKey: "rss-2026-08-article-04",
      title: "Texto 04 — Manejo e Descarte Correto dos RSS",
      slug: "rss-2026-08-texto-04-manejo-e-descarte-correto-dos-rss",
      excerpt:
        "O manejo adequado dos resíduos de serviços de saúde (RSS) envolve procedimentos específicos para cada grupo de resíduos, bem como cuidados no armazenamento, transporte e tratamento.",
      readingTimeMinutes: 3,
      contentText: texto04,
      content: toBlockNote(texto04),
      sourceType: "original",
      difficulty: "intermediate",
      status: "published",
    },
    {
      sourceKey: "rss-2026-08-article-05",
      title: "Texto 05 — IMPACTOS DO MANEJO INADEQUADO, CONSEQUÊNCIAS E IMPACTOS AMBIENTAIS",
      slug: "rss-2026-08-texto-05-impactos-do-manejo-inadequado",
      excerpt:
        "O manejo inadequado dos Resíduos de Serviços de Saúde (RSS) representa um grave risco à saúde pública e ao meio ambiente.",
      readingTimeMinutes: 5,
      contentText: texto05,
      content: toBlockNote(texto05),
      sourceType: "original",
      difficulty: "intermediate",
      status: "published",
    },
    {
      sourceKey: "rss-2026-08-trilha-reference",
      title: "TRILHA — Perguntas para a trilha",
      slug: "rss-2026-08-trilha-perguntas-e-respostas",
      excerpt:
        "Perguntas, respostas e feedback de avanço e retorno para a trilha sobre resíduos de serviços de saúde.",
      readingTimeMinutes: 3,
      contentText: trilha,
      content: toBlockNote(trilha),
      sourceType: "original",
      difficulty: "basic",
      status: "published",
    },
    {
      sourceKey: "rss-2026-08-article-06",
      title: "Texto 06 — Uso de Tecnologias Sustentáveis",
      slug: "rss-2026-08-texto-06-uso-de-tecnologias-sustentaveis",
      excerpt:
        "O uso de tecnologias sustentáveis no manejo de resíduos de serviços de saúde é essencial para reduzir impactos ambientais e promover práticas mais seguras e conscientes.",
      readingTimeMinutes: 3,
      contentText: texto06,
      content: toBlockNote(texto06),
      sourceType: "original",
      difficulty: "intermediate",
      status: "published",
    },
    {
      sourceKey: "rss-2026-08-article-07",
      title: "Texto 07 — Monitoramento Ambiental",
      slug: "rss-2026-08-texto-07-monitoramento-ambiental",
      excerpt:
        "O monitoramento ambiental é uma etapa essencial no gerenciamento de resíduos de serviços de saúde (RSS), pois garante que os resíduos sejam descartados de forma segura.",
      readingTimeMinutes: 3,
      contentText: texto07,
      content: toBlockNote(texto07),
      sourceType: "original",
      difficulty: "intermediate",
      status: "published",
    },
  ],
  questions: [] as unknown[],
  quizzes: [
    {
      sourceKey: "rss-2026-08-quiz-01",
      title: "Texto 02 — Questões de múltipla escolha",
      slug: "rss-2026-08-texto-02-multipla-escolha",
      description: "Questões de múltipla escolha sobre os Resíduos de Serviços de Saúde.",
      instructions: "Assinale a alternativa correta.",
      difficulty: "basic",
      status: "active",
      questions: [
        {
          sourceKey: "rss-2026-08-quiz-01-question-01",
          prompt: "Segundo a RDC nº 222/2018, os RSS são definidos como:",
          type: "multiple_choice",
          difficulty: "basic",
          status: "active",
          options: [
            { label: "A", content: "Resíduos gerados exclusivamente em hospitais públicos.", isCorrect: false },
            { label: "B", content: "Resíduos produzidos apenas em laboratórios clínicos e hospitais.", isCorrect: false },
            { label: "C", content: "Resíduos gerados nos serviços de saúde, incluindo diversas atividades relacionadas à saúde humana e animal.", isCorrect: true },
            { label: "D", content: "Resíduos domésticos produzidos em unidades de saúde.", isCorrect: false },
          ],
        },
        {
          sourceKey: "rss-2026-08-quiz-01-question-02",
          prompt: "Qual das legislações abaixo regulamenta o gerenciamento dos RSS no Brasil?",
          type: "multiple_choice",
          difficulty: "basic",
          status: "active",
          options: [
            { label: "A", content: "RDC nº 50/2002 e Lei nº 8.080/1990.", isCorrect: false },
            { label: "B", content: "RDC nº 222/2018 da ANVISA e Resolução CONAMA nº 358/2005.", isCorrect: true },
            { label: "C", content: "Lei nº 9.605/1998 e RDC nº 306/2004.", isCorrect: false },
            { label: "D", content: "Constituição Federal e Código Civil.", isCorrect: false },
          ],
        },
        {
          sourceKey: "rss-2026-08-quiz-01-question-03",
          prompt: "A gestão inadequada dos RSS pode resultar em:",
          type: "multiple_choice",
          difficulty: "basic",
          status: "active",
          options: [
            { label: "A", content: "Apenas aumento dos custos operacionais das instituições.", isCorrect: false },
            { label: "B", content: "Exclusivamente danos ao meio ambiente.", isCorrect: false },
            { label: "C", content: "Disseminação de agentes infecciosos e contaminantes químicos.", isCorrect: true },
            { label: "D", content: "Apenas problemas administrativos.", isCorrect: false },
          ],
        },
        {
          sourceKey: "rss-2026-08-quiz-01-question-04",
          prompt: "Qual dos seguintes estabelecimentos é considerado gerador de RSS?",
          type: "multiple_choice",
          difficulty: "basic",
          status: "active",
          options: [
            { label: "A", content: "Supermercados.", isCorrect: false },
            { label: "B", content: "Postos de combustível.", isCorrect: false },
            { label: "C", content: "Consultórios odontológicos.", isCorrect: true },
            { label: "D", content: "Lojas de vestuário.", isCorrect: false },
          ],
        },
        {
          sourceKey: "rss-2026-08-quiz-01-question-05",
          prompt: "Os laboratórios de análises clínicas produzem resíduos como:",
          type: "multiple_choice",
          difficulty: "basic",
          status: "active",
          options: [
            { label: "A", content: "Tubos de ensaio contendo amostras biológicas, lâminas e placas de cultura.", isCorrect: true },
            { label: "B", content: "Apenas resíduos administrativos.", isCorrect: false },
            { label: "C", content: "Exclusivamente embalagens de papelão.", isCorrect: false },
            { label: "D", content: "Somente resíduos químicos.", isCorrect: false },
          ],
        },
        {
          sourceKey: "rss-2026-08-quiz-01-question-06",
          prompt: "O descarte incorreto de medicamentos vencidos pode causar:",
          type: "multiple_choice",
          difficulty: "basic",
          status: "active",
          options: [
            { label: "A", content: "Apenas desperdício financeiro.", isCorrect: false },
            { label: "B", content: "Impactos ambientais e riscos à saúde pública.", isCorrect: true },
            { label: "C", content: "Benefícios ao meio ambiente.", isCorrect: false },
            { label: "D", content: "Nenhuma consequência relevante.", isCorrect: false },
          ],
        },
        {
          sourceKey: "rss-2026-08-quiz-01-question-07",
          prompt: "O correto gerenciamento dos RSS deve ocorrer:",
          type: "multiple_choice",
          difficulty: "basic",
          status: "active",
          options: [
            { label: "A", content: "Apenas na etapa de descarte final.", isCorrect: false },
            { label: "B", content: "Somente durante o transporte externo.", isCorrect: false },
            { label: "C", content: "Desde a geração do resíduo até sua disposição final.", isCorrect: true },
            { label: "D", content: "Apenas após o tratamento.", isCorrect: false },
          ],
        },
        {
          sourceKey: "rss-2026-08-quiz-01-question-08",
          prompt: "Um dos principais objetivos do gerenciamento adequado dos RSS é:",
          type: "multiple_choice",
          difficulty: "basic",
          status: "active",
          options: [
            { label: "A", content: "Aumentar a produção de resíduos.", isCorrect: false },
            { label: "B", content: "Reduzir os custos de aquisição de materiais.", isCorrect: false },
            { label: "C", content: "Proteger a saúde humana e minimizar impactos ambientais.", isCorrect: true },
            { label: "D", content: "Eliminar a necessidade de treinamento das equipes.", isCorrect: false },
          ],
        },
      ],
    },
    {
      sourceKey: "rss-2026-08-quiz-02",
      title: "Texto 02 — Verdadeiro ou Falso",
      slug: "rss-2026-08-texto-02-verdadeiro-ou-falso",
      description: "Questões de verdadeiro ou falso sobre os Resíduos de Serviços de Saúde.",
      instructions: "Assinale (V) para Verdadeiro ou (F) para Falso.",
      difficulty: "basic",
      status: "active",
      questions: [
        {
          sourceKey: "rss-2026-08-quiz-02-question-01",
          prompt: "Os Resíduos de Serviços de Saúde (RSS) são gerados apenas em hospitais e clínicas médicas.",
          type: "true_false",
          difficulty: "basic",
          status: "active",
          options: basicOptions("Falso"),
        },
        {
          sourceKey: "rss-2026-08-quiz-02-question-02",
          prompt: "A RDC nº 222/2018 da ANVISA e a Resolução CONAMA nº 358/2005 são normas que regulamentam os RSS no Brasil.",
          type: "true_false",
          difficulty: "basic",
          status: "active",
          options: basicOptions("Verdadeiro"),
        },
        {
          sourceKey: "rss-2026-08-quiz-02-question-03",
          prompt: "Os RSS incluem resíduos provenientes de atividades relacionadas à saúde humana e animal.",
          type: "true_false",
          difficulty: "basic",
          status: "active",
          options: basicOptions("Verdadeiro"),
        },
        {
          sourceKey: "rss-2026-08-quiz-02-question-04",
          prompt: "Todos os resíduos gerados nos serviços de saúde apresentam risco biológico.",
          type: "true_false",
          difficulty: "basic",
          status: "active",
          options: basicOptions("Falso"),
        },
        {
          sourceKey: "rss-2026-08-quiz-02-question-05",
          prompt: "A definição de RSS abrange resíduos produzidos em hospitais, laboratórios, consultórios odontológicos, farmácias e serviços veterinários.",
          type: "true_false",
          difficulty: "basic",
          status: "active",
          options: basicOptions("Verdadeiro"),
        },
        {
          sourceKey: "rss-2026-08-quiz-02-question-06",
          prompt: "O manejo inadequado dos RSS pode contribuir para a disseminação de agentes infecciosos.",
          type: "true_false",
          difficulty: "basic",
          status: "active",
          options: basicOptions("Verdadeiro"),
        },
        {
          sourceKey: "rss-2026-08-quiz-02-question-07",
          prompt: "A gestão inadequada dos RSS não causa impactos ambientais significativos.",
          type: "true_false",
          difficulty: "basic",
          status: "active",
          options: basicOptions("Falso"),
        },
        {
          sourceKey: "rss-2026-08-quiz-02-question-08",
          prompt: "Os laboratórios de análises clínicas podem gerar resíduos contendo microrganismos patogênicos.",
          type: "true_false",
          difficulty: "basic",
          status: "active",
          options: basicOptions("Verdadeiro"),
        },
        {
          sourceKey: "rss-2026-08-quiz-02-question-09",
          prompt: "Consultórios odontológicos geram resíduos como agulhas, brocas e resíduos de amálgama.",
          type: "true_false",
          difficulty: "basic",
          status: "active",
          options: basicOptions("Verdadeiro"),
        },
        {
          sourceKey: "rss-2026-08-quiz-02-question-10",
          prompt: "Farmácias e drogarias não são consideradas geradoras de RSS.",
          type: "true_false",
          difficulty: "basic",
          status: "active",
          options: basicOptions("Falso"),
        },
        {
          sourceKey: "rss-2026-08-quiz-02-question-11",
          prompt: "Medicamentos vencidos ou impróprios para uso podem representar riscos quando descartados incorretamente.",
          type: "true_false",
          difficulty: "basic",
          status: "active",
          options: basicOptions("Verdadeiro"),
        },
        {
          sourceKey: "rss-2026-08-quiz-02-question-12",
          prompt: "Serviços de medicina veterinária produzem resíduos semelhantes aos gerados no atendimento à saúde humana.",
          type: "true_false",
          difficulty: "basic",
          status: "active",
          options: basicOptions("Verdadeiro"),
        },
        {
          sourceKey: "rss-2026-08-quiz-02-question-13",
          prompt: "Serviços de acupuntura e tatuagem podem gerar materiais perfurocortantes que exigem descarte seguro.",
          type: "true_false",
          difficulty: "basic",
          status: "active",
          options: basicOptions("Verdadeiro"),
        },
        {
          sourceKey: "rss-2026-08-quiz-02-question-14",
          prompt: "O gerenciamento dos RSS deve ocorrer apenas após a geração dos resíduos.",
          type: "true_false",
          difficulty: "basic",
          status: "active",
          options: basicOptions("Falso"),
        },
        {
          sourceKey: "rss-2026-08-quiz-02-question-15",
          prompt: "A separação dos resíduos na fonte geradora faz parte do gerenciamento eficaz dos RSS.",
          type: "true_false",
          difficulty: "basic",
          status: "active",
          options: basicOptions("Verdadeiro"),
        },
        {
          sourceKey: "rss-2026-08-quiz-02-question-16",
          prompt: "O correto gerenciamento dos RSS contribui para a proteção da saúde dos trabalhadores, pacientes e da população.",
          type: "true_false",
          difficulty: "basic",
          status: "active",
          options: basicOptions("Verdadeiro"),
        },
        {
          sourceKey: "rss-2026-08-quiz-02-question-17",
          prompt: "Os resíduos produzidos em laboratórios de análises clínicas são exclusivamente resíduos químicos.",
          type: "true_false",
          difficulty: "basic",
          status: "active",
          options: basicOptions("Falso"),
        },
        {
          sourceKey: "rss-2026-08-quiz-02-question-18",
          prompt: "Entre os resíduos hospitalares podem estar presentes tecidos orgânicos e fluidos corporais.",
          type: "true_false",
          difficulty: "basic",
          status: "active",
          options: basicOptions("Verdadeiro"),
        },
        {
          sourceKey: "rss-2026-08-quiz-02-question-19",
          prompt: "O gerenciamento adequado dos RSS é importante tanto para a saúde humana quanto para a preservação ambiental.",
          type: "true_false",
          difficulty: "basic",
          status: "active",
          options: basicOptions("Verdadeiro"),
        },
        {
          sourceKey: "rss-2026-08-quiz-02-question-20",
          prompt: "A RDC nº 222/2018 reconhece diversos tipos de estabelecimentos como geradores de RSS.",
          type: "true_false",
          difficulty: "basic",
          status: "active",
          options: basicOptions("Verdadeiro"),
        },
      ],
    },
    {
      sourceKey: "rss-2026-08-quiz-03",
      title: "Texto 03 — Classificação dos Resíduos de Saúde",
      slug: "rss-2026-08-texto-03-classificacao-matching",
      description: "Associe os grupos de Resíduos de Serviços de Saúde às suas características e exemplos.",
      instructions: "Relacione os grupos da Coluna A às respectivas características e exemplos da Coluna B.",
      difficulty: "intermediate",
      status: "active",
      questions: [
        {
          sourceKey: "rss-2026-08-quiz-03-question-01",
          prompt: "Relacione os grupos de Resíduos de Serviços de Saúde (Coluna A) às suas respectivas características e exemplos (Coluna B).",
          type: "matching",
          difficulty: "intermediate",
          status: "active",
          matchingPairs: [
            {
              leftText: "Grupo A – Biológicos",
              rightText: "Resíduos contaminados por agentes biológicos capazes de causar infecções, como materiais com sangue e culturas microbiológicas.",
              sequence: 1,
            },
            {
              leftText: "Grupo B – Químicos",
              rightText: "Resíduos contendo substâncias químicas perigosas, como medicamentos vencidos, reagentes e desinfetantes.",
              sequence: 2,
            },
            {
              leftText: "Grupo C – Radioativos",
              rightText: "Resíduos contaminados com radionuclídeos provenientes de medicina nuclear, radioterapia e laboratórios especializados.",
              sequence: 3,
            },
            {
              leftText: "Grupo D – Resíduos Comuns",
              rightText: "Resíduos semelhantes ao lixo domiciliar, sem risco biológico, químico ou radiológico, como papel e restos alimentares.",
              sequence: 4,
            },
            {
              leftText: "Grupo E – Perfurocortantes",
              rightText: "Resíduos que podem causar cortes ou perfurações, como agulhas, bisturis e lâminas.",
              sequence: 5,
            },
          ],
        },
      ],
    },
    {
      sourceKey: "rss-2026-08-quiz-04",
      title: "Texto 04 — Manejo e Descarte Correto dos RSS",
      slug: "rss-2026-08-texto-04-manejo-e-descarte",
      description: "Questões sobre a classificação, o manejo e o tratamento dos grupos de RSS.",
      instructions: "Leia as situações e associe cada grupo ao procedimento específico de manejo e tratamento.",
      difficulty: "intermediate",
      status: "active",
      questions: [
        {
          sourceKey: "rss-2026-08-quiz-04-question-01",
          prompt: "Leia as situações abaixo e assinale a alternativa que apresenta a sequência correta de classificação dos resíduos (Grupo A, B, C, D ou E).\n\nI. Após uma vacinação, a agulha utilizada deve ser descartada imediatamente em uma caixa rígida resistente à perfuração.\nII. Um laboratório precisa descartar reagentes químicos vencidos utilizados em análises clínicas.\nIII. Um serviço de medicina nuclear gera resíduos contendo material radioativo.\nIV. Restos de papel toalha limpo e embalagens sem contaminação são descartados após o atendimento.\nV. Gazes contendo sangue provenientes de um curativo são descartadas após o procedimento.\n\nA sequência correta é:",
          type: "multiple_choice",
          difficulty: "intermediate",
          status: "active",
          explanation: "• I → Grupo E (Perfurocortantes) – agulhas.\n• II → Grupo B (Químicos) – reagentes químicos.\n• III → Grupo C (Radioativos) – materiais radioativos.\n• IV → Grupo D (Comuns) – resíduos sem risco biológico, químico ou radiológico.\n• V → Grupo A (Biológicos) – materiais contaminados com sangue.",
          options: [
            { label: "a", content: "A – B – C – D – E", isCorrect: false },
            { label: "b", content: "E – B – C – D – A", isCorrect: true },
            { label: "c", content: "E – A – C – D – B", isCorrect: false },
            { label: "d", content: "B – E – C – A – D", isCorrect: false },
            { label: "e", content: "C – B – E – D – A", isCorrect: false },
          ],
        },
        {
          sourceKey: "rss-2026-08-quiz-04-question-02",
          prompt: "Associe a Coluna A (Grupos de Resíduos de Serviços de Saúde) à Coluna B (Procedimentos Específicos de Manejo e Tratamento).",
          type: "matching",
          difficulty: "intermediate",
          status: "active",
          matchingPairs: [
            {
              leftText: "(1) Grupo A – Biológicos",
              rightText: "Devem ser segregados na fonte geradora e submetidos, preferencialmente, à autoclavagem ou incineração.",
              sequence: 1,
            },
            {
              leftText: "(2) Grupo B – Químicos",
              rightText: "Devem ser separados por tipo de substância química e encaminhados, conforme composição, incompatibilidades e periculosidade, para destinação licenciada ou empresa especializada; neutralização somente quando permitida.",
              sequence: 2,
            },
            {
              leftText: "(3) Grupo C – Radioativos",
              rightText: "Devem ser separados por tipo de radioisótopo, acondicionados em recipientes blindados e geridos conforme as normas da CNEN, incluindo armazenamento para decaimento radioativo quando aplicável ou encaminhamento a instalação licenciada.",
              sequence: 3,
            },
            {
              leftText: "(4) Grupo D – Comuns",
              rightText: "Não apresentam risco biológico, químico ou radiológico e podem ser encaminhados para coleta urbana regular ou aterros sanitários quando permitido pelas regras aplicáveis.",
              sequence: 4,
            },
            {
              leftText: "(5) Grupo E – Perfurocortantes",
              rightText: "Devem ser acondicionados em caixas rígidas resistentes à perfuração e descartados imediatamente após o uso.",
              sequence: 5,
            },
          ],
        },
      ],
    },
    {
      sourceKey: "rss-2026-08-quiz-05",
      title: "Texto 06 — Tecnologias Sustentáveis no Manejo de Resíduos de Serviços de Saúde",
      slug: "rss-2026-08-texto-06-tecnologias-sustentaveis",
      description: "Quiz sobre tecnologias sustentáveis no manejo de Resíduos de Serviços de Saúde.",
      instructions: "Assinale a alternativa correta.",
      difficulty: "intermediate",
      status: "active",
      questions: [
        {
          sourceKey: "rss-2026-08-quiz-05-question-01",
          prompt: "A __________ pode ser utilizada, quando aplicável e autorizada, como processo de esterilização por vapor sob pressão para determinados resíduos biológicos e perfurocortantes.",
          type: "multiple_choice",
          difficulty: "intermediate",
          status: "active",
          options: [
            { label: "a", content: "Reciclagem", isCorrect: false },
            { label: "b", content: "Compostagem", isCorrect: false },
            { label: "c", content: "Autoclavagem", isCorrect: true },
            { label: "d", content: "Digestão anaeróbica", isCorrect: false },
          ],
        },
        {
          sourceKey: "rss-2026-08-quiz-05-question-02",
          prompt: "A autoclavagem contribui para a redução da necessidade de __________, diminuindo a emissão de poluentes.",
          type: "multiple_choice",
          difficulty: "intermediate",
          status: "active",
          options: [
            { label: "a", content: "Reciclagem", isCorrect: false },
            { label: "b", content: "Incineração", isCorrect: true },
            { label: "c", content: "Compostagem", isCorrect: false },
            { label: "d", content: "Logística reversa", isCorrect: false },
          ],
        },
        {
          sourceKey: "rss-2026-08-quiz-05-question-03",
          prompt: "A __________ permite o reaproveitamento de materiais como plásticos, vidros e papéis não contaminados.",
          type: "multiple_choice",
          difficulty: "intermediate",
          status: "active",
          options: [
            { label: "a", content: "Autoclavagem", isCorrect: false },
            { label: "b", content: "Incineração", isCorrect: false },
            { label: "c", content: "Reciclagem", isCorrect: true },
            { label: "d", content: "Digestão anaeróbica", isCorrect: false },
          ],
        },
        {
          sourceKey: "rss-2026-08-quiz-05-question-04",
          prompt: "Para garantir a segurança do processo de reciclagem, é fundamental realizar a correta __________ dos resíduos.",
          type: "multiple_choice",
          difficulty: "intermediate",
          status: "active",
          options: [
            { label: "a", content: "Incineração", isCorrect: false },
            { label: "b", content: "Neutralização", isCorrect: false },
            { label: "c", content: "Segregação", isCorrect: true },
            { label: "d", content: "Esterilização", isCorrect: false },
          ],
        },
        {
          sourceKey: "rss-2026-08-quiz-05-question-05",
          prompt: "A __________ consiste na queima de resíduos em fornos específicos com controle de temperatura e emissão de gases.",
          type: "multiple_choice",
          difficulty: "intermediate",
          status: "active",
          options: [
            { label: "a", content: "Compostagem avançada", isCorrect: false },
            { label: "b", content: "Digestão anaeróbica", isCorrect: false },
            { label: "c", content: "Incineração controlada", isCorrect: true },
            { label: "d", content: "Reciclagem", isCorrect: false },
          ],
        },
        {
          sourceKey: "rss-2026-08-quiz-05-question-06",
          prompt: "A incineração controlada pode ser indicada, conforme o grupo, o risco, a composição e as regras aplicáveis, para resíduos altamente infectantes ou __________.",
          type: "multiple_choice",
          difficulty: "intermediate",
          status: "active",
          options: [
            { label: "a", content: "Orgânicos", isCorrect: false },
            { label: "b", content: "Biodegradáveis", isCorrect: false },
            { label: "c", content: "Químicos", isCorrect: true },
            { label: "d", content: "Recicláveis", isCorrect: false },
          ],
        },
        {
          sourceKey: "rss-2026-08-quiz-05-question-07",
          prompt: "O tratamento químico utiliza soluções apropriadas, como desinfetantes e agentes __________.",
          type: "multiple_choice",
          difficulty: "intermediate",
          status: "active",
          options: [
            { label: "a", content: "Fertilizantes", isCorrect: false },
            { label: "b", content: "Neutralizantes", isCorrect: true },
            { label: "c", content: "Lubrificantes", isCorrect: false },
            { label: "d", content: "Oxidantes", isCorrect: false },
          ],
        },
        {
          sourceKey: "rss-2026-08-quiz-05-question-08",
          prompt: "O principal objetivo do tratamento químico é reduzir o risco __________ dos resíduos.",
          type: "multiple_choice",
          difficulty: "intermediate",
          status: "active",
          options: [
            { label: "a", content: "Financeiro", isCorrect: false },
            { label: "b", content: "Ambiental", isCorrect: false },
            { label: "c", content: "Biológico", isCorrect: true },
            { label: "d", content: "Mecânico", isCorrect: false },
          ],
        },
        {
          sourceKey: "rss-2026-08-quiz-05-question-09",
          prompt: "Quando aplicados a resíduos orgânicos de baixo risco, devidamente segregados como Grupo D e em operação autorizada, processos como compostagem e digestão anaeróbia são exemplos de tratamento __________.",
          type: "multiple_choice",
          difficulty: "intermediate",
          status: "active",
          options: [
            { label: "a", content: "Químico", isCorrect: false },
            { label: "b", content: "Mecânico", isCorrect: false },
            { label: "c", content: "Biológico", isCorrect: true },
            { label: "d", content: "Térmico", isCorrect: false },
          ],
        },
        {
          sourceKey: "rss-2026-08-quiz-05-question-10",
          prompt: "A digestão anaeróbica pode transformar matéria orgânica em __________ para geração de energia.",
          type: "multiple_choice",
          difficulty: "intermediate",
          status: "active",
          options: [
            { label: "a", content: "Vapor", isCorrect: false },
            { label: "b", content: "Biogás", isCorrect: true },
            { label: "c", content: "Plástico reciclado", isCorrect: false },
            { label: "d", content: "Oxigênio", isCorrect: false },
          ],
        },
        {
          sourceKey: "rss-2026-08-quiz-05-question-11",
          prompt: "A Política Nacional de Resíduos Sólidos prevê sistemas de __________ para determinados resíduos.",
          type: "multiple_choice",
          difficulty: "intermediate",
          status: "active",
          options: [
            { label: "a", content: "Esterilização", isCorrect: false },
            { label: "b", content: "Compostagem", isCorrect: false },
            { label: "c", content: "Logística reversa", isCorrect: true },
            { label: "d", content: "Incineração", isCorrect: false },
          ],
        },
        {
          sourceKey: "rss-2026-08-quiz-05-question-12",
          prompt: "Um exemplo de resíduo que deve ser destinado por logística reversa é:",
          type: "multiple_choice",
          difficulty: "intermediate",
          status: "active",
          options: [
            { label: "a", content: "Papel contaminado", isCorrect: false },
            { label: "b", content: "Restos de alimentos", isCorrect: false },
            { label: "c", content: "Pilhas e baterias", isCorrect: true },
            { label: "d", content: "Gesso hospitalar", isCorrect: false },
          ],
        },
        {
          sourceKey: "rss-2026-08-quiz-05-question-13",
          prompt: "Na compostagem avançada, resíduos orgânicos de baixo risco, devidamente segregados como Grupo D e encaminhados a unidade autorizada, são transformados em __________.",
          type: "multiple_choice",
          difficulty: "intermediate",
          status: "active",
          options: [
            { label: "a", content: "Biogás", isCorrect: false },
            { label: "b", content: "Fertilizante orgânico", isCorrect: true },
            { label: "c", content: "Vapor esterilizado", isCorrect: false },
            { label: "d", content: "Combustível fóssil", isCorrect: false },
          ],
        },
        {
          sourceKey: "rss-2026-08-quiz-05-question-14",
          prompt: "A substituição de plásticos convencionais por materiais __________ reduz a geração de resíduos não recicláveis.",
          type: "multiple_choice",
          difficulty: "intermediate",
          status: "active",
          options: [
            { label: "a", content: "Metálicos", isCorrect: false },
            { label: "b", content: "Sintéticos", isCorrect: false },
            { label: "c", content: "Biodegradáveis", isCorrect: true },
            { label: "d", content: "Radioativos", isCorrect: false },
          ],
        },
        {
          sourceKey: "rss-2026-08-quiz-05-question-15",
          prompt: "O uso de tecnologias sustentáveis no manejo dos resíduos contribui para a redução do volume e da __________ dos resíduos.",
          type: "multiple_choice",
          difficulty: "intermediate",
          status: "active",
          options: [
            { label: "a", content: "Cor", isCorrect: false },
            { label: "b", content: "Umidade", isCorrect: false },
            { label: "c", content: "Periculosidade", isCorrect: true },
            { label: "d", content: "Densidade", isCorrect: false },
          ],
        },
      ],
    },
  ],
  trail: {
    sourceKey: "rss-2026-08-trail",
    trailId: "rss-trilha-2026-08",
    name: "Trilha RSS — Manejo e Sustentabilidade",
    description: "Trilha publicada sobre resíduos de serviços de saúde, seu manejo e sua sustentabilidade.",
    categorySlug: "residuos-de-servicos-de-saude",
    tagSlug: "rss-2026-08",
    difficulty: "intermediate",
    status: "published",
    content: [
      { sequence: 1, type: "article", sourceKey: "rss-2026-08-article-01" },
      { sequence: 2, type: "article", sourceKey: "rss-2026-08-article-02" },
      { sequence: 3, type: "quiz", sourceKey: "rss-2026-08-quiz-01" },
      { sequence: 4, type: "quiz", sourceKey: "rss-2026-08-quiz-02" },
      { sequence: 5, type: "article", sourceKey: "rss-2026-08-article-03" },
      { sequence: 6, type: "quiz", sourceKey: "rss-2026-08-quiz-03" },
      { sequence: 7, type: "article", sourceKey: "rss-2026-08-article-04" },
      { sequence: 8, type: "quiz", sourceKey: "rss-2026-08-quiz-04" },
      { sequence: 9, type: "article", sourceKey: "rss-2026-08-article-05" },
      { sequence: 10, type: "article", sourceKey: "rss-2026-08-trilha-reference" },
      { sequence: 11, type: "article", sourceKey: "rss-2026-08-article-06" },
      { sequence: 12, type: "quiz", sourceKey: "rss-2026-08-quiz-05" },
      { sequence: 13, type: "article", sourceKey: "rss-2026-08-article-07" },
    ],
  },
};

for (const quiz of rss202608Content.quizzes) {
  rss202608Content.questions.push(...quiz.questions);
}
