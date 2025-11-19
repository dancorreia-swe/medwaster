# Documento de Requisitos - Sistema MedWaster Learning

## Sumário
1. [[#1. Introdução]]
    1. [[#1.1. Visão geral do documento]]
    2. [[#1.2. Convenções, termos e abreviações]]
2. [[#2. Descrição geral do sistema]]
    1. [[#2.1. Abrangência e sistemas relacionados]]
    2. [[#2.2. Público-alvo e contexto de uso]]
    3. [[#2.3. Arquitetura geral da solução]]
3. [[#3. Requisitos Funcionais]]
    1. [[#3.1. Autenticação e Controle de Acesso]]
    2. [[#3.2. Dashboard e Métricas]]
    3. [[#3.3. Gestão de Questões e Quizzes]]
    4. [[#3.4. Gestão de Trilhas Administrativo]]
    5. [[#3.5. Gestão de Wiki Administrativo]]
    6. [[#3.6. Sistema de Conquistas Administrativo]]
    7. [[#3.7. Gestão de Usuários Administrativo]]
    8. [[#3.8. Sistema de Certificação Administrativo]]
    9. [[#3.9. Módulo Estudante - Autenticação e Onboarding]]
    10. [[#3.10. Dashboard do Estudante]]
    11. [[#3.11. Trilhas de Aprendizagem - Módulo Estudante]]
    12. [[#3.12. Conteúdo Educacional - Execução]]
    13. [[#3.13. Wiki do Estudante]]
    14. [[#3.14. AI Assistant]]
    15. [[#3.15. Perfil e Configurações do Estudante]]
    16. [[#3.16. Sistema de Conquistas do Usuário]]
    17. [[#3.17. Suporte e Ajuda]]
    18. [[#3.18. Certificação do Estudante]]
    19. [[#3.19. Gestão de Tags Administrativo]]
4. [[#4. Requisitos Não Funcionais]]
5. [[#5. Requisitos de Segurança]]
6. [[#6. Matriz de Avaliação de Risco]]
7. [[#7. Matriz de Rastreabilidade]]

## 1. Introdução

Este documento especifica os requisitos do sistema MedWaster Learning, fornecendo aos desenvolvedores as informações necessárias para o projeto e implementação, assim como para a realização dos testes e homologação do sistema.

### 1.1. Visão geral do documento

Além desta seção introdutória, as seções seguintes estão organizadas como descrito abaixo:

**Seção 2** – Descrição geral do sistema: apresenta uma visão geral do sistema, caracterizando qual é o seu escopo e descrevendo seus usuários.

**Seção 3** – Requisitos funcionais: especifica todos os casos de uso do sistema, descrevendo os fluxos de eventos, prioridades, premissas, pré-condições e demais observações de cada caso de uso a ser implementado, organizados por módulos funcionais.

**Seção 4** – Requisitos não-funcionais: especifica todos os requisitos não funcionais do sistema, divididos por categorias específicas como usabilidade, confiabilidade, desempenho, segurança, compatibilidade e adequação a padrões.

**Seção 5** – Requisitos de Segurança: especifica todos os requisitos de segurança relacionados aos requisitos funcionais e não funcionais, organizados por categorias de ameaças e soluções.

**Seção 6** – Matriz de Avaliação de Risco: registra a análise sistemática dos riscos identificados com suas probabilidades, impactos e estratégias de mitigação.

**Seção 7** – Matriz de rastreabilidade: registra a ligação e dependências entre os requisitos funcionais.

**Seção 8** – Referências: apresenta referências para outros documentos utilizados para a confecção deste documento.

### 1.2. Convenções, termos e abreviações

A correta interpretação deste documento exige o conhecimento de algumas convenções e termos específicos, que são descritos a seguir.

#### 1.2.1. Identificação dos requisitos

Os requisitos devem ser identificados com um identificador único seguindo o padrão estabelecido:

- **RF001** - Requisitos Funcionais (numeração sequencial de 001 a 120)
- **RNF001** - Requisitos Não Funcionais (numeração sequencial de 001 a 030)
- **RS001** - Requisitos de Segurança (numeração sequencial de 001 a 025)

#### 1.2.2. Prioridades dos requisitos

Para estabelecer a prioridade dos requisitos, foram adotadas as denominações "**essencial**", "**importante**" e "**desejável**".

- **Essencial**: requisito sem o qual o sistema não entra em funcionamento. Requisitos essenciais são imprescindíveis para o MVP (Minimum Viable Product).
- **Importante**: requisito sem o qual o sistema entra em funcionamento, mas de forma não satisfatória. Implementação recomendada na primeira iteração pós-MVP.
- **Desejável**: requisito que será implantado se houver tempo e recursos. Funcionalidades de melhoria da experiência do usuário.

#### 1.2.3. Perfis de Usuário (RBAC)

O sistema MedWaster Learning implementa controle de acesso baseado em papéis (Role-Based Access Control - RBAC) com três perfis distintos, cada um com permissões específicas alinhadas aos objetivos educacionais da plataforma:

##### **Super Admin**

Perfil com controle total sobre o sistema, responsável pela gestão estratégica e configuração geral da plataforma.

**Permissões principais:**
- Criação e gestão de contas de administradores
- Configuração de templates de certificados
- Gestão de configurações globais do sistema
- Acesso completo a todos os relatórios e métricas
- Configuração de integração com sistemas externos
- Gestão de backup e configurações de segurança
- Aprovação final de certificados em casos especiais
- Acesso total a logs de auditoria e segurança

**Limitações:**
- Não pode excluir dados permanentemente (apenas desativar)
- Alterações críticas requerem confirmação dupla
- Todas as ações são registradas em log de auditoria

##### **Admin**

Perfil especializado na gestão de conteúdo educacional e acompanhamento pedagógico dos estudantes.

**Permissões principais:**

- **Gestão de Conteúdo:**
    - Criar, editar e publicar artigos wiki
    - Criar e gerenciar questões de todos os tipos
    - Criar e configurar quizzes
    - Criar e configurar trilhas de aprendizagem
    - Gerenciar categorias e sistema de tags

- **Gestão de Usuários:**
    - Visualizar lista completa de estudantes
    - Acompanhar progresso individual de cada estudante
    - Gerenciar status de contas (ativar/desativar)
    - Resetar progresso de trilhas específicas
    - Alterar dados básicos de estudantes

- **Sistema de Certificação:**
    - Aprovar ou rejeitar certificados pendentes
    - Visualizar histórico completo de certificações
    - Gerar relatórios de certificação

- **Gamificação:**  
    - Criar e gerenciar conquistas
    - Monitorar sistema de badges
    - Configurar critérios de obtenção

- **Relatórios e Analytics:**
    - Gerar relatórios de progresso geral
    - Acompanhar métricas de engajamento
    - Exportar dados para análise

**Limitações:**
- Não pode criar outros administradores
- Não pode alterar configurações globais do sistema
- Não pode acessar logs de auditoria de segurança
- Não pode modificar templates de certificados

##### **Estudante**

Perfil do usuário final, profissional de saúde que utiliza a plataforma para capacitação em descarte de resíduos médicos.

**Permissões principais:**

- **Aprendizagem:**
    - Acessar trilhas de aprendizagem desbloqueadas
    - Responder questões e realizar quizzes
    - Visualizar progresso próprio
    - Acessar biblioteca wiki sem restrições

- **Perfil:**
    - Editar informações pessoais e profissionais
    - Alterar dados de onboarding
    - Configurar preferências do aplicativo
    - Gerenciar notificações

- **Certificação:**
    - Gerar certificado automaticamente após completar trilhas
    - Fazer download do certificado aprovado
    - Acompanhar status de aprovação

- **Interação:**
    - Utilizar AI Assistant para tirar dúvidas
    - Acessar sistema de suporte
    - Visualizar conquistas obtidas

**Limitações:**
- Não pode acessar dados de outros estudantes
- Não pode modificar conteúdo educacional
- Não pode alterar sequência de trilhas
- Acesso limitado apenas ao próprio progresso e certificados

##### **Hierarquia e Herança de Permissões**

```
super admin (controle total)
    ├── Todas as permissões de admin
    ├── Gestão de administradores
    ├── Configurações globais
    └── Segurança e auditoria

admin (gestão educacional)
    ├── Todas as permissões de visualização de estudante
    ├── Gestão de conteúdo
    ├── Gestão de usuários
    └── Certificação e relatórios

estudante (usuário final)
    ├── Acesso a conteúdo próprio
    ├── Progresso individual
    └── Certificação pessoal
```

##### **Regras de Segurança RBAC**

1. **Princípio do Menor Privilégio:** Cada perfil possui apenas as permissões mínimas necessárias para suas funções
2. **Separação de Responsabilidades:** Funções críticas requerem perfis específicos
3. **Auditoria Completa:** Todas as ações são registradas com identificação do usuário e perfil
4. **Validação Contínua:** Sistema verifica permissões a cada operação
5. **Sessões Seguras:** Tokens incluem informações de perfil para validação em tempo real

#### 1.2.4. Tipos de dados e validações

**Convenções para especificação de campos:**

- **String:** Texto com limite de caracteres especificado
- **Text:** Texto longo, geralmente para conteúdo extenso
- **Integer:** Números inteiros
- **Float:** Números decimais
- **Boolean:** Verdadeiro ou Falso
- **Date:** Data no formato DD/MM/AAAA
- **DateTime:** Data e hora no formato DD/MM/AAAA HH:MM
- **Time:** Horário no formato HH:MM
- **File:** Upload de arquivo com restrições de formato e tamanho
- **Dropdown:** Lista de seleção com opções pré-definidas
- **Multi-select:** Seleção múltipla de opções
- **List:** Coleção de elementos

#### 1.2.5. Estados e fluxos

**Estados padrão de entidades:**
- **Ativo:** Entidade em uso normal no sistema
- **Inativo:** Entidade desabilitada mas preservada no sistema
- **Rascunho:** Entidade em criação/edição, não visível aos usuários finais
- **Arquivado:** Entidade removida do uso ativo mas mantida para histórico

## 2. Descrição geral do sistema

### 2.1. Abrangência e sistemas relacionados

O Sistema MedWaster Learning é uma solução educacional dual composta por uma plataforma administrativa web para gestão de conteúdo e um aplicativo mobile para aprendizagem gamificada sobre descarte adequado de resíduos médicos.

O sistema não se integra diretamente com sistemas hospitalares existentes, focando exclusivamente na capacitação profissional através de trilhas progressivas, questões interativas, documentação wiki e certificação digital.

**Componentes principais:**
- **Plataforma Web Administrativa:** Interface para gestão de conteúdo, usuários, certificação e analytics
- **Aplicativo Mobile Estudante:** Interface otimizada para aprendizagem e consumo de conteúdo educacional
- **API Backend:** Serviços centralizados para processamento de dados e integração entre componentes
- **Sistema de Notificações:** Comunicação automática via push, email e outros canais
- **AI Assistant:** Assistente inteligente especializado em descarte de resíduos médicos

### 2.2. Público-alvo e contexto de uso

**Usuários Primários:**
- **Profissionais de saúde:** Médicos, enfermeiros, técnicos, farmacêuticos e outros profissionais que lidam com resíduos médicos
- **Gestores educacionais:** Responsáveis por programas de capacitação em instituições de saúde
- **Administradores de sistema:** Técnicos responsáveis pela manutenção e configuração da plataforma

**Contexto de uso:**
- **Ambiente hospitalar:** Capacitação contínua de equipes médicas
- **Instituições de ensino:** Cursos de formação em saúde
- **Consultórios e clínicas:** Treinamento de pequenas equipes
- **Órgãos reguladores:** Programas de conformidade e certificação

**Necessidades identificadas:**
- Padronização do conhecimento sobre descarte seguro
- Redução de riscos de contaminação e acidentes
- Atendimento a normas regulatórias (ANVISA, CONAMA)
- Flexibilidade para aprendizado em horários diversos
- Gamificação para aumentar engajamento
- Certificação reconhecida para desenvolvimento profissional

### 2.3. Arquitetura geral da solução

**Modelo de arquitetura:** Cliente-Servidor com aplicações web e mobile

**Camadas da aplicação:**
1. **Apresentação:** Interface web (admin) e mobile (estudante)
2. **Aplicação:** APIs REST para processamento de lógica de negócio
3. **Dados:** Banco de dados relacional para persistência
4. **Integração:** Serviços externos para IA, notificações e armazenamento

**Tecnologias previstas:**
- **Frontend Web:** React
- **Mobile:** React Native 
- **Backend:** Bun - Elysia
- **Banco de dados:** PostgreSQL 
- **IA:** OpenAI assistente inteligente

**Integrações externas:**
- **Serviços de email** para notificações e recuperação de senha
- **Serviço de AI** para consulta acerca do conteúdo interno e responder dúvidas do estudante

---

## 3. Requisitos Funcionais

### 3.1. Autenticação e Controle de Acesso

#### RF001 - Login de Usuário

**Descrição:** Sistema de autenticação para acesso à plataforma administrativa

**Objetivos:** Permitir que administradores e super administradores acessem a plataforma web de forma segura.

**Premissas:** Senhas criptografadas, sessões baseadas em cookies seguros, rate limiting implementado.

**Pré-condições:** Usuário deve estar cadastrado com perfil administrativo.

**Campos obrigatórios:**
- **Email:** String, 200 caracteres máximo, formato válido obrigatório
- **Senha:** String, mínimo 8 caracteres, critérios de segurança

**Funcionalidades:**
- Login por email e senha
- Criação de sessão segura via cookies
- Rate limiting (5 tentativas por 15 minutos)
- Log de tentativas de acesso

**Validações:**
- Email: formato válido (pattern: qualquer texto + @ + domínio + ponto + extensão)
- Senha: verificação de hash criptografado
- Status do usuário: deve estar ativo

**Regras de negócio:**
1. Bloqueio temporário após 5 tentativas incorretas
2. Sessão expira em 8 horas de inatividade
3. Log obrigatório de todas as tentativas (sucesso e falha)
4. Redirecionamento automático conforme perfil (dashboard específico)

---

#### RF002 - Controle de Acesso RBAC

**Descrição:** Sistema de controle de acesso baseado em papéis

**Objetivos:** Garantir acesso granular às funcionalidades conforme perfil do usuário.

**Premissas:** Três perfis distintos com hierarquia bem definida. Validação em tempo real via sessão.

**Pré-condições:** Usuário autenticado com perfil ativo.

**Perfis disponíveis:**
- **Super Admin:** String - Controle total, gestão de admins, configurações globais
- **Admin:** String - Gestão educacional, usuários, certificação
- **Estudante:** String - Trilhas, wiki, progresso pessoal

**Funcionalidades por perfil:**
- Validação de permissões por operação
- Dados de role armazenados na sessão
- Middleware de autorização
- Herança hierárquica de permissões

**Regras de negócio:**
1. Princípio do menor privilégio aplicado
2. Validação obrigatória em cada operação
3. Logs de auditoria para ações administrativas
4. Impossibilidade de auto-elevação de privilégios

---

#### RF003 - Recuperação de Senha

**Descrição:** Sistema de reset de senha via email

**Objetivos:** Permitir recuperação segura de acesso para administradores.

**Premissas:** Tokens únicos com expiração. Processo auditado completamente.

**Pré-condições:** Email deve estar cadastrado e verificado no sistema.

**Campos obrigatórios:**
- **Email:** String, 200 caracteres, formato válido

**Processo:**
- Solicitação via email cadastrado
- Geração de token único criptografado
- Envio de email com link temporário
- Validação de token com expiração 24h
- Redefinição com nova senha segura

**Validações:**
- Token: único, criptografado, temporal
- Nova senha: mínimo 8 caracteres, maiúscula, minúscula, número
- Email: deve existir na base de administradores

**Regras de negócio:**
1. Token expira em 24 horas após geração
2. Token invalidado após primeiro uso
3. Máximo 3 tentativas de reset por hora
4. Log completo do processo para auditoria

---

#### RF004 - Sistema de Logout

**Descrição:** Encerramento seguro de sessão administrativa

**Objetivos:** Permitir que administradores encerrem sessões de forma segura e completa.

**Premissas:** Invalidação completa de cookies de sessão e limpeza de dados sensíveis.

**Pré-condições:** Usuário deve estar autenticado no sistema.

**Funcionalidades:**
- Logout manual pelo usuário
- Invalidação imediata de cookies de sessão
- Limpeza de dados da sessão no servidor
- Redirecionamento para tela de login
- Log do evento de logout

**Processo:**
- Clique no botão logout
- Confirmação opcional (configurável)
- Invalidação do cookie de sessão no servidor
- Remoção de cookies do navegador
- Registro em log de auditoria

**Regras de negócio:**
1. Cookie de sessão deve ser invalidado imediatamente no servidor
2. Cookies removidos do navegador (httpOnly, secure)
3. Redirecionamento obrigatório para página de login
4. Log deve registrar horário e IP de origem

---

#### RF005 - Gestão de Sessões

**Descrição:** Controle automatizado de sessões baseado em cookies

**Objetivos:** Gerenciar sessões ativas garantindo segurança e usabilidade adequada.

**Premissas:** Sessões persistidas via cookies seguros com tempo limitado e renovação automática.

**Pré-condições:** Sistema de autenticação operacional.

**Configurações de sessão:**
- **Tempo de expiração:** Integer, 8 horas por padrão
- **Cookie httpOnly:** Boolean, true (prevenção XSS)
- **Cookie secure:** Boolean, true (apenas HTTPS)
- **Cookie sameSite:** String, "strict" (proteção CSRF)

**Funcionalidades:**
- Timeout automático por inatividade
- Renovação de sessão em atividade
- Controle de múltiplas sessões simultâneas
- Logout automático em expiração
- Alertas de expiração próxima

**Validações:**
- Cookie deve ter assinatura válida
- Verificação de timestamp de expiração
- Validação de integridade da sessão

**Regras de negócio:**
1. Sessão expira após 8 horas de inatividade
2. Aviso de expiração 5 minutos antes
3. Máximo 3 sessões simultâneas por usuário
4. Renovação automática a cada operação no monorepo

---

### 3.2. Dashboard e Métricas

#### RF006 - Dashboard Principal Administrativo

**Descrição:** Interface principal com visão consolidada de métricas, ações rápidas e atividades do sistema.

**Objetivos:** Fornecer visão geral do sistema e hub central de navegação para todos os módulos administrativos.

**Premissas:** Dashboard personalizado conforme perfil do usuário com métricas em tempo real e cache otimizado.

**Pré-condições:** 
- Usuário administrador deve estar autenticado no sistema
- Permissões de acesso ao painel administrativo devem estar ativas

**Métricas principais exibidas:**
- **Usuários ativos no mês:** Integer, com variação percentual mensal
- **Trilhas finalizadas no mês:** Integer, com variação percentual mensal
- **Questões respondidas hoje:** Integer, com variação percentual diária
- **Visualizações de wiki na semana:** Integer, com variação percentual semanal

**Ações rápidas disponíveis:**
- Criar trilha de aprendizagem
- Expandir banco de questões
- Atualizar wiki
- Gerenciar usuários

**Feed de atividades recentes:**
- **Tipo de atividade:** String (registro, conclusão, adição, atualização)
- **Nome do usuário/admin:** String
- **Timestamp:** DateTime, formato relativo ("há 2 minutos")
- **Categoria da ação:** String (user, journey, question, wiki)

**Validações:**
- Métricas: valores numéricos não negativos
- Timestamps: formato ISO válido
- Variações percentuais: cálculo baseado em período anterior

**Regras de negócio:**
1. Dashboard deve ser página inicial após login do administrador
2. Métricas atualizadas em tempo real ou com cache máximo de 5 minutos
3. Ações rápidas redirecionam diretamente para funcionalidades correspondentes
4. Feed de atividades deve exibir máximo 10 itens mais recentes
5. Interface responsiva para diferentes resoluções

---

### 3.3. Gestão de Questões e Quizzes

#### RF007 - Listagem de Questões

**Descrição:** Exibição e gerenciamento de todas as questões do banco de dados de forma organizada.

**Objetivos:** Permitir busca eficiente e gestão completa das questões para montagem de trilhas e quizzes.

**Premissas:** Sistema deve permitir busca por múltiplos critérios com performance otimizada e interface intuitiva.

**Pré-condições:**
- Usuário administrador deve estar logado no sistema
- Ter permissão de acesso ao módulo de gestão de questões

**Campos de busca e filtro:**
- **Busca por texto:** String, 100 caracteres máximo, opcional (busca no conteúdo da pergunta)
- **Filtro por categoria:** Dropdown, seleção única, opcional (categorias da Wiki)
- **Filtro por tipo:** Multi-select, opcional (Múltipla escolha, V/F, Completar, Associação)
- **Filtro por nível:** Dropdown, opcional (Básico, Intermediário, Avançado)
- **Filtro por tags:** String, 200 caracteres máximo, opcional (tags separadas por vírgula)
- **Filtro por data:** Date range picker, opcional (criação ou modificação)
- **Filtro por autor:** Dropdown, opcional (administradores do sistema)
- **Filtro por status:** Dropdown, padrão "Ativo" (Ativo, Inativo)

**Configurações de paginação:**
- **Itens por página:** Dropdown (10, 20, 50), padrão 10
- **Ordenação:** Dropdown (Data modificação DESC, Data criação DESC, Nome ASC, Categoria ASC)
- **Exibição:** Toggle (Grid/Lista), configurável pelo usuário

**Dados exibidos por questão:**
- **ID único:** Integer, auto-incremento, 8 dígitos, somente leitura
- **Preview da pergunta:** String, truncado em 80 caracteres, link para visualização completa
- **Tipo de questão:** String, badge colorido (Múltipla, V/F, Completar, etc)
- **Categoria:** String, tag colorida conforme configuração
- **Nível:** String, ícone + texto (Básico=1 estrela, Intermediário=2, Avançado=3)
- **Tags:** List, máximo 5 exibidas, resto como "+X mais"
- **Trilhas que usam:** Integer, link para listagem relacionadas
- **Autor:** String, nome do administrador criador
- **Data de criação:** Date, formato DD/MM/AAAA HH:MM
- **Data de modificação:** Date, formato DD/MM/AAAA HH:MM
- **Status:** String, badge colorido (Ativo=verde, Inativo=cinza)

**Ações disponíveis por questão:**
- **Visualizar:** Modal com preview completo
- **Editar:** Redirecionamento para formulário de edição
- **Duplicar:** Criação de cópia editável
- **Ativar/Desativar:** Toggle de mudança de status
- **Excluir:** Apenas se não estiver em uso em trilhas

**Ações em lote:**
- **Seleção múltipla:** Checkbox em cada linha + "Selecionar todos"
- **Ativar selecionados:** Para questões inativas
- **Desativar selecionados:** Para questões ativas
- **Mover para categoria:** Dropdown de categorias

**Validações:**
- Busca por texto: máximo 100 caracteres, sem caracteres maliciosos
- Tags: Fazem parte do sistema unificado ([[#RF065 - Gestão de Sistema de Tags |RF065]])
- Data: formato válido, data início ≤ data fim
- Paginação: números inteiros positivos dentro dos limites

**Regras de negócio:**
1. Questões ordenadas por data de modificação (mais recente primeiro) como padrão
2. Preview truncado após 80 caracteres com "..."
3. Questões usadas em trilhas publicadas não podem ser excluídas, apenas desativadas
4. Filtros persistidos na sessão do usuário
5. Busca textual funciona em: pergunta, explicação da resposta, tags
6. Sistema deve mostrar contador total de resultados
7. Loading state durante carregamento
8. Mensagem "Nenhuma questão encontrada" quando sem resultados

---

#### RF008 - Criar Questão - Múltipla Escolha

**Descrição:** Criação de questões do tipo múltipla escolha com até 5 alternativas para avaliação do conhecimento sobre descarte de resíduos médicos.

**Objetivos:** Permitir criação flexível de questões objetivas com validação rigorosa e interface intuitiva.

**Premissas:** Questões de múltipla escolha são o formato mais comum para avaliações objetivas. Sistema deve garantir qualidade educacional.

**Pré-condições:**
- Administrador deve estar logado no sistema
- Categorias da Wiki devem estar previamente cadastradas
- Sistema de validação deve estar ativo

**Campos obrigatórios:**
- **Pergunta:** Text, 2000 caracteres máximo, mínimo 10 caracteres
- **Categoria:** Dropdown, seleção única, obrigatório (categorias ativas da Wiki)
- **Nível:** Dropdown, seleção única, obrigatório (Básico, Intermediário, Avançado)
- **Alternativa A:** String, 500 caracteres máximo, obrigatório
- **Alternativa B:** String, 500 caracteres máximo, obrigatório
- **Alternativa C:** String, 500 caracteres máximo, opcional
- **Alternativa D:** String, 500 caracteres máximo, opcional
- **Alternativa E:** String, 500 caracteres máximo, opcional
- **Alternativa correta:** Radio button, seleção única, obrigatório
- **Explicação da resposta:** Text, 1000 caracteres máximo, mínimo 20 caracteres

**Campos opcionais:**
- **Campo de tags com busca inteligente:** Integração com[[#RF065 - Gestão de Sistema de Tags | RF065]] para sugestão automática
- **Validação de tags:** Verificação de existência no sistema centralizado
- **Imagem ilustrativa:** File, PNG/JPG/JPEG, máximo 2MB
- **Referências:** Text, 500 caracteres máximo

**Campos automáticos:**
- **ID da questão:** Integer, auto-incremento, 8 dígitos
- **Autor:** String, administrador logado automaticamente
- **Data de criação:** DateTime, timestamp atual
- **Data de modificação:** DateTime, atualizado a cada save
- **Status:** String, default "Ativo"
- **Tipo:** String, fixo "Múltipla Escolha"

**Interface do formulário:**
- Editor WYSIWYG para enunciado da pergunta com formatação básica
- Contador de caracteres em tempo real
- Preview imediato após upload de imagem
- Salvamento automático com debounce

**Botões de ação:**
- "Salvar" (status=Ativo)
- "Salvar e Criar Nova" (salva atual e limpa formulário)
- "Cancelar" (descarta alterações, confirma se há dados não salvos)
- "Preview" (visualiza como aparecerá ao estudante)

**Validações:**
- Pergunta: mínimo 10 caracteres, não pode ser apenas espaços
- Mínimo 2 alternativas: A e B obrigatórias
- Alternativas únicas: não pode haver alternativas idênticas
- Resposta correta: exatamente 1 alternativa marcada
- Explicação: mínimo 20 caracteres para fins educativos
- Imagem: formato válido e tamanho adequado

**Regras de negócio:**
1. Questão criada inicia como "Ativo" 
2. Alternativas são embaralhadas na apresentação ao estudante
3. Imagem armazenada em CDN com URL segura no banco
4. Histórico completo de alterações mantido para auditoria
5. Explicação deve ser educativa para ambos cenários (acerto e erro)

---

#### RF009 - Criar Questão - Verdadeiro ou Falso

**Descrição:** Criação de questões do tipo verdadeiro ou falso para avaliação rápida de conceitos fundamentais.

**Objetivos:** Permitir criação de questões dicotômicas com explicação educativa obrigatória.

**Premissas:** Questões V/F são ideais para verificação de conceitos básicos e devem ter explicação detalhada.

**Pré-condições:**
- Administrador autenticado no sistema
- Categorias da Wiki disponíveis para seleção

**Campos obrigatórios:**
- **Afirmação:** Text, 1500 caracteres máximo, mínimo 10 caracteres
- **Resposta correta:** Boolean (Verdadeiro ou Falso)
- **Explicação:** Text, 1000 caracteres máximo, mínimo 30 caracteres
- **Categoria:** Dropdown, categoria existente na Wiki
- **Nível:** Dropdown (Básico, Intermediário, Avançado)

**Campos herdados de RF008:**
- **Tags:** Multi-select com auto-complete baseado no sistema[[#RF065 - Gestão de Sistema de Tags | RF065]]
- **Imagem ilustrativa:** File, PNG/JPG/JPEG, máximo 2MB  
- **Referências:** Text, 500 caracteres máximo
- **Campos automáticos:** ID, autor, datas, status (mesmo padrão RF008)
- **Botões de ação:** Mesmo conjunto de RF008

---

#### RF010 - Criar Questão - Complete a Frase

**Descrição:** Criação de questões de completar com lacunas específicas para fixação de terminologias técnicas.

**Objetivos:** Permitir criação de questões de preenchimento para memorização de termos técnicos e procedimentos.

**Premissas:** Questões de completar são fundamentais para memorização de terminologias e procedimentos específicos.

**Pré-condições:**
- Administrador logado no sistema
- Sistema de distratores disponível

**Campos obrigatórios:**
- **Texto com lacunas:** Text, 1500 caracteres máximo, lacunas marcadas por [LACUNA]
- **Respostas corretas:** List, uma resposta para cada lacuna
- **Categoria:** Dropdown
- **Nível:** Dropdown

**Campos Opcionais**: 
- **Tags**: Multi-select integrado com [[#RF065 - Gestão de Sistema de Tags |RF065]]

**Configurações específicas:**
- **Lista de distratores:** List, palavras/frases incorretas para embaralhar
- **Posicionamento automático:** Boolean, numeração automática das lacunas
- **Opções embaralhadas:** List, mistura respostas corretas com distratores

**Validações:**
- Cada lacuna deve ter resposta correta correspondente
- Mínimo 2 distratores por lacuna
- Marcação de lacunas deve seguir padrão [LACUNA]

**Regras de negócio:**
1. Sistema deve embaralhar automaticamente as opções de resposta
2. Deve haver pelo menos 2 distratores por lacuna
3. Respostas corretas não podem aparecer em sequência nas opções
4. Lacunas numeradas automaticamente na ordem de aparição

---

#### RF011 - Criar Questão - Associação

**Descrição:** Criação de questões de relacionar elementos de duas colunas para associação de conceitos.

**Objetivos:** Permitir criação de questões que avaliem capacidade de relacionar tipos de resíduos com métodos de descarte adequados.

**Premissas:** Questões de associação são ideais para relacionar conceitos práticos como tipos de resíduos e procedimentos de descarte.

**Pré-condições:**
- Administrador deve estar logado
- Mínimo de 3 pares de associação devem ser criados

**Campos obrigatórios:**
- **Instrução:** Text, 500 caracteres máximo, explicação do que deve ser associado
- **Coluna A:** List, itens fixos (ex: tipos de resíduos)
- **Coluna B:** List, itens para associar (ex: métodos de descarte)
- **Conexões corretas:** List, mapeamento 1↔A, 2↔B, etc.
- **Categoria:** Dropdown
- **Nível:** Dropdown

**Configurações específicas:**
- **Validação de resposta:** Boolean, verificação automática das conexões
- **Feedback imediato:** Boolean, mostrar acertos/erros em tempo real
- **Embaralhamento:** Boolean, ordem aleatória dos itens nas colunas

**Campos Opcionais**: 
- **Tags**: Multi-select integrado com [[#RF065 - Gestão de Sistema de Tags |RF065]]

**Validações:**
- Correspondência 1:1 entre itens das colunas
- Mínimo 3 pares, máximo 8 pares
- Cada item da coluna A deve ter correspondente na coluna B
- Instruções claras e não ambíguas

**Regras de negócio:**
1. Deve haver correspondência 1:1 entre itens das colunas
2. Pelo menos 3 pares de associação são obrigatórios
3. Máximo de 8 pares para não comprometer usabilidade
4. Sistema deve embaralhar itens das colunas automaticamente
5. Feedback visual deve indicar conexões corretas/incorretas

#### RF012 - Criar Novo Quiz

**Descrição:** Criação de quizzes agrupando múltiplas questões para avaliação temática consolidada.

**Objetivos:** Permitir criação de avaliações estruturadas com múltiplas questões relacionadas a um tema específico.

**Premissas:** Quizzes permitem avaliação mais robusta que questões isoladas, agrupando conteúdo relacionado para avaliação holística.

**Pré-condições:**
- Administrador deve estar logado
- Questões devem estar disponíveis no banco de dados
- Sistema RF065 (tags) deve estar operacional

**Campos Obrigatórios**:
- **Nome do quiz:** String, 150 caracteres máximo, mínimo 5 caracteres
- **Descrição:** Text, 500 caracteres máximo, explicação do objetivo do quiz
- **Categoria:** Dropdown, categorias ativas da Wiki
- **Nível:** Dropdown (Básico, Intermediário, Avançado)

**Configurações de avaliação:**
- **Critério de aprovação:** Float, percentual mínimo para aprovação (padrão 70%)
- **Tempo limite:** Integer, minutos totais (opcional, 0 = sem limite)

**Campos Opcionais:**
- **Tags:** Multi-select integrado com RF065, máximo 8 tags
- **Instruções especiais:** Text, 300 caracteres, orientações adicionais
- **Imagem de capa:** File, PNG/JPG, máximo 2MB
- **Randomizar questões:** Boolean, ordem aleatória das questões
- **Permitir revisão:** Boolean, usuário pode voltar às questões anteriores
- **Mostrar resultado detalhado:** Boolean, feedback por questão ao final

**Campos Automáticos 
- **ID do quiz:** String, formato QUIZ_YYMMDD_XXX
- **Autor:** String, administrador logado
- **Data de criação:** DateTime, timestamp atual
- **Data de modificação:** DateTime, atualizado a cada save
- **Status:** String, default "Rascunho"

**Configurações por questão:**
- **Ordem:** Integer, posição no quiz (se não randomizado)
- **Obrigatória:** Boolean, questão deve ser respondida

1. **Status inicial:** Quiz criado inicia como "Rascunho"
2. **Ativação:** Requer validação completa de todas as configurações
3. **Questões:** Mínimo 3, máximo 20 questões por quiz
4. **Versionamento:** Controle automático a cada alteração
5. **Integridade:** Quiz não pode ficar sem questões válidas
6. **Auditoria:** Log completo de criação e alterações
7. **Dependências:** Quiz deve verificar se questões ainda existem/estão ativas

---
#### RF013 - Listagem de Quizzes

**Descrição:** Exibição e gerenciamento de todos os quizzes do banco de dados de forma organizada.

**Objetivos:** Permitir busca eficiente e gestão completa dos quizzes para avaliação e administração do sistema.

**Premissas:** Sistema deve permitir busca por múltiplos critérios com performance otimizada e interface intuitiva.

**Pré-condições:**
- Usuário administrador deve estar logado no sistema
- Ter permissão de acesso ao módulo de gestão de quizzes

**Campos de busca e filtro:**
- **Busca por texto:** String, 100 caracteres máximo, opcional (busca no nome e descrição do quiz)
- **Filtro por categoria:** Dropdown, seleção única, opcional (categorias da Wiki)
- **Filtro por nível:** Dropdown, opcional (Básico, Intermediário, Avançado)
- **Filtro por tags:** String, 200 caracteres máximo, opcional (tags separadas por vírgula)
- **Filtro por data:** Date range picker, opcional (criação ou modificação)
- **Filtro por autor:** Dropdown, opcional (administradores do sistema)
- **Filtro por status:** Dropdown, padrão "Ativo" (Ativo, Inativo, Arquivado)
- **Filtro por número de questões:** Range slider, opcional (3-20 questões)

**Configurações de paginação:**
- **Itens por página:** Dropdown (10, 20, 50), padrão 20
- **Ordenação:** Dropdown (Data modificação DESC, Data criação DESC, Nome ASC, Categoria ASC, Número de questões DESC)
- **Exibição:** Toggle (Grid/Lista), configurável pelo usuário

**Dados exibidos por quiz:**
- **ID único:** String, formato QUIZ_YYMMDD_XXX, somente leitura
- **Nome do quiz:** String, truncado em 60 caracteres, link para visualização completa
- **Descrição:** String, truncado em 100 caracteres com "..."
- **Categoria:** String, tag colorida conforme configuração
- **Nível:** String, ícone + texto (Básico=1 estrela, Intermediário=2, Avançado=3)
- **Tags:** List, máximo 3 exibidas, resto como "+X mais"
- **Número de questões:** Integer, badge com contador
- **Tempo limite:** String, formato "Xmin" ou "Sem limite"
- **Critério aprovação:** Float, percentual com símbolo "%"
- **Autor:** String, nome do administrador criador
- **Data de criação:** Date, formato DD/MM/AAAA HH:MM
- **Data de modificação:** Date, formato DD/MM/AAAA HH:MM
- **Status:** String, badge colorido

**Ações disponíveis por quiz:**
- **Visualizar:** Modal com preview completo do quiz
- **Editar:** Redirecionamento para formulário de edição
- **Duplicar:** Criação de cópia editável
- **Ativar/Desativar:** Toggle de mudança de status (conforme regras)
- **Arquivar:** Move para status arquivado
- **Excluir:** Apenas rascunhos sem respostas associadas

**Ações em lote:**
- **Seleção múltipla:** Checkbox em cada linha + "Selecionar todos"
- **Ativar selecionados:** Para quizzes inativos
- **Desativar selecionados:** Para quizzes ativos
- **Arquivar selecionados:** Para quizzes inativos
- **Mover para categoria:** Dropdown de categorias

**Validações:**
- Busca por texto: máximo 100 caracteres, sem caracteres maliciosos
- Tags: Fazem parte do sistema unificado (RF065)
- Data: formato válido, data início ≤ data fim
- Paginação: números inteiros positivos dentro dos limites
- Range de questões: valores entre 3 e 20

**Regras de negócio:**
1. Quizzes ordenados por data de modificação (mais recente primeiro) como padrão
2. Nome truncado após 60 caracteres com "..."
3. Descrição truncada após 100 caracteres com "..."
4. Quizzes com respostas associadas não podem ser excluídos, apenas arquivados
5. Filtros persistidos na sessão do usuário
6. Busca textual funciona em: nome, descrição, instruções especiais, tags
7. Sistema deve mostrar contador total de resultados
8. Loading state durante carregamento
9. Mensagem "Nenhum quiz encontrado" quando sem resultados
10. Quiz em uso por respondentes não pode ser desativado/arquivado
11. Indicador visual para quizzes com questões inválidas/inativas
12. Tooltip com informações adicionais ao passar mouse sobre badges

---

#### RF014 - Editar Quiz Existente

**Descrição:** Modificação de quizzes existentes mantendo integridade referencial e controle de versões.

**Objetivos:** Permitir atualização completa de quizzes preservando histórico e validando dependências do sistema.

**Premissas:** Edições em quizzes ativos devem preservar integridade de respostas já coletadas através de versionamento.

**Pré-condições:**
- Administrador deve estar logado no sistema
- Quiz deve existir e ser acessível
- Ter permissão de edição no módulo de quizzes

**Formulário de edição:**
- **Todos os campos do RF012** com valores pré-preenchidos
- **Campos bloqueados:** ID, autor original, data criação
- **Campos calculados:** Data modificação (auto-update)

**Seções do formulário:**
1. **Informações básicas:** Nome, descrição, categoria, nível
2. **Configurações de avaliação:** Critério, tempo limite
3. **Configurações opcionais:** Tags, instruções, imagem, toggles
4. **Gerenciamento de questões:** Interface drag-and-drop para reordenação
5. **Configurações avançadas:** Auditoria

**Gerenciamento de questões:**
- **Adicionar questões:** Modal com busca integrada (RF007)
- **Remover questões:** Confirmação com impacto em respostas
- **Reordenar:** Drag & drop com numeração automática
- **Configurar por questão:** Ordem, obrigatoriedade
- **Validação contínua:** Mínimo 3, máximo 20 questões

**Regras de versionamento:**
1. **Quiz Rascunho:** Edição direta, sem versionamento
2. **Quiz Ativo com respostas:** Nova versão automática
3. **Quiz Ativo sem respostas:** Edição direta com confirmação
4. **Quiz Inativo:** Edição direta com opção de reativação
5. **Quiz Arquivado:** Apenas visualização, requer desarquivar

**Validações específicas:**
- Nome único dentro da categoria (exceto próprio quiz)
- Questões devem estar ativas e acessíveis
- Tempo limite não pode ser menor que respostas em andamento
- Critério de aprovação entre 1% e 100%
- Configurações de randomização não podem conflitar

**Funcionalidades especiais:**
- **Preview em tempo real:** Visualização como estudante
- **Reverter alterações:** Desfazer até última versão salva

---
#### RF015 - Excluir/Arquivar Quiz

**Descrição:** Remoção controlada de quizzes com proteção de dados e integridade referencial.

**Objetivos:** Permitir exclusão segura de quizzes protegendo respostas coletadas e mantendo auditoria completa.

**Premissas:** Exclusões devem preservar integridade de dados históricos e permitir recuperação quando apropriado.

**Pré-condições:**
- Administrador deve estar logado
- Ter permissão de exclusão no módulo
- Quiz deve existir no sistema

**Tipos de operação:**

**Arquivamento (Exclusão Lógica):**
- **Aplicável a:** Todos os status de quiz
- **Efeito:** Quiz oculto da listagem padrão
- **Preserva:** Respostas, estatísticas, histórico completo
- **Reversível:** Sim, a qualquer momento

**Exclusão Física:**
- **Aplicável a:** Quizzes sem uso em trilhas
- **Efeito:** Remoção permanente do banco
- **Reversível:** Não

**Processo de validação:**
1. **Verificação de dependências:**
   - Respostas associadas
   - Referências em outros módulos
   - Status atual do quiz
   
2. **Análise de impacto:**
   - Número de respondentes afetados
   - Dados estatísticos perdidos
   - Referências quebradas

**Regras de proteção:**
- **Quiz com respostas ativas:** Apenas arquivamento
- **Quiz referenciado:** Verificação de impacto obrigatória

**Exclusão em lote:**
- **Seleção múltipla:** Com validação individual
- **Confirmação única:** Para toda a operação

---
#### RF016 - Duplicar Quiz

**Descrição:** Criação de cópia completa de quiz existente para reutilização e adaptação eficiente.

**Objetivos:** Facilitar criação de novos quizzes baseados em estruturas comprovadas, reduzindo tempo de desenvolvimento.

**Premissas:** Duplicação deve preservar estrutura e configurações essenciais, mas criar entidade totalmente independente.

**Pré-condições:**
- Administrador deve estar logado
- Ter permissão de criação de quizzes
- Quiz origem deve existir e ser acessível

**Configurações de duplicação:**
- **Nome do novo quiz:** String obrigatória, sugestão automática "[Original] - Cópia"
- **Modo de questões:**
  - Referência: Mantém link para questões originais
- **Tags:** Checkbox para manter tags originais
- **Configurações:** Checkbox para cada grupo de configurações
- **Status inicial:** Sempre "Inativo"

**Elementos copiados automaticamente:**
- Estrutura completa do quiz (nome personalizado)
- Todas as questões (conforme modo selecionado)
- Configurações de avaliação
- Instruções especiais
- Ordem e configurações por questão
- Imagem de capa (nova cópia do arquivo)

**Elementos NÃO copiados:**
- Histórico de respostas
- Estatísticas de uso
- Log de modificações
- Versionamento histórico
- Status (sempre inicia como Rascunho)

**Novo quiz resultante:**
- **ID único:** Novo formato QUIZ_YYMMDD_XXX
- **Autor:** Administrador que executou a duplicação
- **Data criação/modificação:** Timestamp da operação
- **Status:** Rascunho (requer ativação manual)

**Funcionalidades adicionais:**
- **Edição imediata:** Redirecionamento automático para edição após duplicação

**Notificações:**
- Confirmação de duplicação bem-sucedida

---

#### RF017 - Editar Questões Existentes

**Descrição:** Modificação de questões já criadas, mantendo integridade das trilhas que as utilizam.

**Objetivos:** Permitir atualização de questões preservando consistência educacional das trilhas publicadas.

**Premissas:** Edição deve preservar integridade educacional e alertar sobre impactos em trilhas ativas.

**Pré-condições:**
- Questão deve existir no banco de dados
- Administrador deve ter permissões de edição
- Sistema deve verificar uso em trilhas ativas

**Funcionalidades:**
- Edição de todos os campos (mesmo comportamento da criação)
- Manutenção do tipo original (não permite alterar tipo da questão)
- Validação de uso em trilhas antes de salvar
- Controle de versionamento automático

**Processo de edição:**
- Carregamento dos dados existentes
- Formulário pré-preenchido
- Validações em tempo real
- Verificação de impacto em trilhas
- Confirmação de alterações críticas

**Regras especiais:**
- **Questão em trilha publicada:** Sistema alerta sobre impacto
- **Histórico de alterações:** Log de auditoria obrigatório
- **Nova data de modificação:** Atualização automática

**Opções de resolução de conflito:**
- **Continuar:** Aplicar alterações mesmo com trilhas ativas
- **Cancelar:** Descartar alterações
- **Duplicar questão:** Criar nova versão mantendo original

**Validações:**
- Todas as validações do tipo de questão correspondente
- Verificação de integridade referencial
- Confirmação para alterações que afetam trilhas ativas

---

### 3.4. Gestão de Trilhas Administrativo

#### RF018 - Listagem de Trilhas

**Descrição:** Exibição e gerenciamento de todas as trilhas de aprendizagem com métricas organizadas para acompanhamento educacional.

**Objetivos:** Permitir gestão completa das trilhas com visão consolidada de métricas e progresso dos usuários.

**Premissas:** Trilhas são sequências estruturadas que guiam profissionais do básico ao avançado no descarte de resíduos médicos.

**Pré-condições:**
- Administrador logado no sistema
- Permissões de acesso ao módulo de trilhas

**Campos de filtro:**
- **Busca por nome:** String, 100 caracteres máximo, case-insensitive
- **Filtro por categoria:** Multi-select, categorias ativas da Wiki
- **Filtro por nível:** Multi-select (Básico, Intermediário, Avançado)
- **Filtro por status:** Dropdown, default "Ativo" (Todos, Ativo, Inativo, Rascunho, Publicado)
- **Filtro por autor:** Dropdown, administradores criadores
- **Filtro por data de criação:** Date range picker
- **Filtro por popularidade:** Dropdown (Todas, Mais acessadas, Menos acessadas, Sem acesso)

**Configurações de visualização:**
- **Itens por página:** Dropdown (10, 25, 50), default 10
- **Ordenação:** Dropdown, default "Última modificação DESC"
- **Modo de exibição:** Toggle (Grid/Lista), default Grid

**Dados exibidos por trilha:**
- **ID único:** String, formato TRL000001
- **Nome da trilha:** String, máximo 60 caracteres exibidos, tooltip se truncado
- **Descrição resumida:** String, máximo 100 caracteres
- **Categoria:** Badge colorido conforme configuração
- **Nível:** Ícones + texto (Básico=1 estrela, Intermediário=2, Avançado=3)
- **Status:** Badge com ícone (Ativo=verde+check, Inativo=cinza+pause)
- **Ordem de desbloqueio:** Integer, posição na sequência
- **Conteúdo:** Resumo (total questões + quizzes + artigos)
- **Critério de aprovação:** Float, badge colorido por faixa
- **Usuários matriculados:** Integer, counter com ícone
- **Taxa de conclusão média:** Float, barra de progresso
- **Tempo médio de conclusão:** String, formato "Xh Ym"
- **Autor:** String, nome do administrador criador
- **Data de criação:** Date, formato DD/MM/AAAA
- **Data de modificação:** DateTime, formato DD/MM/AAAA HH:MM

**Ações individuais:**
- **Visualizar:** Preview da trilha completa
- **Editar:** Formulário de edição
- **Gerenciar conteúdo:** Editor de sequência
- **Configurar:** Configurações avançadas
- **Clonar:** Duplicar trilha
- **Ativar/Desativar:** Toggle switch
- **Visualizar como estudante:** Preview na interface do aluno
- **Relatório de progresso:** Analytics da trilha
- **Excluir:** Apenas se não tiver usuários matriculados

**Métricas consolidadas:**
- **Total de trilhas:** Integer, breakdown por status
- **Trilhas populares:** Top 3 mais acessadas
- **Média de conclusão geral:** Float, percentual geral
- **Usuários em progresso:** Integer, usuários ativos
- **Certificados gerados (mês):** Integer, com tendência

**Regras de negócio:**
1. Trilhas ordenadas por data de modificação (mais recente primeiro)
2. Lista paginada obrigatoriamente (máximo 50 por página)
3. Trilhas "Rascunho" só visíveis para criador e super admin
4. Métricas calculadas apenas para trilhas ativas
5. Cache de 10 minutos para métricas não críticas
6. Validação de integridade da sequência ao alterar ordem

---

#### RF019 - Criar Nova Trilha

**Descrição:** Criação de novas trilhas de aprendizagem com estrutura organizada para progressão pedagógica adequada.

**Objetivos:** Permitir criação de trilhas seguindo sequência lógica de aprendizado, dos conceitos básicos aos avançados.

**Premissas:** Trilhas devem seguir progressão pedagógica respeitando pré-requisitos educacionais e ordem sequencial.

**Pré-condições:**
- Administrador autenticado no sistema
- Categorias da Wiki devem estar cadastradas
- Sistema de ordenação deve estar disponível

**Seção 1: Informações Básicas**
- **Nome da trilha:** String, 120 caracteres máximo, mínimo 5 caracteres, obrigatório
- **Descrição/Objetivo:** Text, 500 caracteres máximo, opcional
- **Categoria principal:** Dropdown, seleção única, obrigatório (categorias Wiki ativas)
- **Nível de dificuldade:** Radio buttons, obrigatório (Básico, Intermediário, Avançado)
- **Tags de classificação:** String, 200 caracteres máximo, formato "tag1, tag2, tag3"

**Seção 2: Configuração de Sequência**
- **Ordem de desbloqueio:** Integer, obrigatório, validação de unicidade
- **Pré-requisitos:** Multi-select, opcional (trilhas existentes)
- **Trilhas que desbloqueia:** Read-only, calculado automaticamente

**Seção 3: Configurações de Avaliação**
- **Critério de aprovação:** Float, 50-95%, default 70%
- **Tentativas permitidas:** Integer, 1-5, default 3
- **Tempo limite por sessão:** Integer, minutos, opcional
- **Permitir pular questões:** Boolean, default false
- **Mostrar explicações imediatas:** Boolean, default true

**Seção 4: Configurações de Apresentação**
- **Randomizar ordem do conteúdo:** Boolean, default false
- **Imagem de capa:** File, PNG/JPG/JPEG, máximo 5MB, 1200x675px recomendado
- **Cor do tema:** String, hex color picker, opcional

**Seção 5: Configurações Avançadas**
- **Disponibilidade:** Date range picker, opcional
- **Público-alvo:** Multi-select, baseado em onboarding
- **Estimativa de tempo:** Integer, minutos, calculado automaticamente
- **Certificado personalizado:** Boolean, default false

**Campos automáticos:**
- **ID da trilha:** String, formato TRL000001, auto-incremento
- **Status:** String, default "Rascunho"
- **Autor:** String, administrador logado
- **Data de criação:** DateTime, timestamp atual
- **Data de modificação:** DateTime, atualizado automaticamente
- **UUID:** String, identificador único global

**Interface do formulário:**
- Layout wizard com 5 seções em tabs
- Barra de progresso do preenchimento
- Validação em tempo real
- Salvamento automático a cada 30 segundos
- Restore de sessão em caso de desconexão

**Botões de ação:**
- **Anterior/Próximo:** Navegação entre seções
- **Salvar como Rascunho:** Disponível em todas as seções
- **Preview:** Visualização como aparecerá ao estudante
- **Salvar e Configurar Conteúdo:** Redirecionamento para gestão de conteúdo
- **Salvar e Publicar:** Validação completa e ativação da trilha
- **Cancelar:** Confirmação de descarte se há alterações

**Validações por seção:**
1. **Básicas:** Nome único, categoria válida, nível selecionado
2. **Sequência:** Ordem única, sem dependências circulares
3. **Avaliação:** Percentuais válidos, tentativas > 0
4. **Apresentação:** Imagem válida, cor válida
5. **Avançadas:** Datas coerentes, público-alvo válido

**Regras de negócio:**
1. Trilha criada sempre inicia como "Rascunho"
2. Nome deve ser único no sistema (validação em tempo real)
3. Ordem de desbloqueio não pode duplicar (sugestão automática)
4. Sistema previne dependências circulares automaticamente
5. Imagem de capa é redimensionada automaticamente
6. Estimativa de tempo calculada baseada no conteúdo adicionado

---

#### RF020 - Gerenciar Conteúdo da Trilha

**Descrição:** Adição e organização de diferentes tipos de conteúdo dentro de uma trilha de aprendizagem.

**Objetivos:** Permitir organização flexível de conteúdo educacional em sequência pedagógica apropriada.

**Premissas:** Trilhas devem permitir mix de conteúdo teórico e prático em ordem lógica de aprendizado.

**Pré-condições:**
- Trilha deve estar criada no sistema
- Administrador com permissões adequadas
- Conteúdos (questões, quizzes, artigos) disponíveis

**Tipos de conteúdo suportados:**
- **Questões isoladas:** Boolean (múltipla escolha, V/F, completar, associação)
- **Quizzes:** Boolean (sequências de várias questões)
- **Artigos Wiki:** Boolean (referências para leitura)
- **Tópicos teóricos:** Boolean (conteúdo explicativo)

**Interface de gestão:**
- **Lista de conteúdo atual:** Drag & drop para reordenação
- **Biblioteca de conteúdo:** Busca e filtro por tipo/categoria
- **Preview de conteúdo:** Visualização antes de adicionar
- **Indicadores de progresso:** Estimativa de tempo por módulo

**Funcionalidades:**
- **Adicionar conteúdo:** Dropdown de seleção por tipo
- **Reorganizar ordem:** Interface drag & drop
- **Remover conteúdo:** Com confirmação
- **Duplicar módulos:** Cópia de estrutura
- **Preview completo:** Visualização como estudante
- **Salvar sequência:** Persistência automática de alterações

**Validações:**
- Conteúdo deve existir e estar ativo
- Ordem sequencial deve ser mantida
- Não permitir conteúdo duplicado na mesma trilha

**Regras de negócio:**
1. Conteúdo deve seguir ordem lógica de aprendizado
2. Artigos Wiki devem preceder questões relacionadas ao tema
3. Sistema deve permitir reordenação via drag & drop
4. Alterações são salvas automaticamente
5. Remoção de conteúdo requer confirmação
6. Estimativa de tempo recalculada automaticamente

---

#### RF021 - Sistema de Ordenação e Dependências

**Descrição:** Gerenciamento da ordem sequencial de trilhas e sistema de desbloqueio baseado em conclusão de pré-requisitos.

**Objetivos:** Garantir progressão pedagógica liberando conteúdo avançado apenas após domínio do básico.

**Premissas:** Sistema educacional deve respeitar progressão pedagógica, evitando que usuários acessem conteúdo complexo sem base adequada.

**Pré-condições:**
- Trilhas devem estar cadastradas no sistema
- Critérios de aprovação devem estar definidos
- Sistema de avaliação deve estar funcional

**Configurações de sequência:**
- **Sequência global:** Integer, ordem 1, 2, 3... sequencial
- **Pré-requisitos:** Multi-select, trilhas que devem ser concluídas antes
- **Dependências:** List, trilhas liberadas após conclusão, calculado automaticamente

**Lógica de desbloqueio:**
- **Condição 1:** Usuário completa trilha com % mínimo configurado
- **Condição 2:** Todas as trilhas pré-requisito aprovadas
- **Condição 3:** Média geral >= critério mínimo (70% padrão)
- **Ação:** Liberar Próxima Trilha
- **Notificação:** Notificar desbloqueio 

**Interface de configuração:**
- **Visualização da sequência:** Diagrama com mapa de dependências
- **Edição de dependências:** Drag & drop para reordenar
- **Validação de integridade:** Verificação automática de dependências circulares
- **Preview da progressão:** Simulação do fluxo do estudante

**Regras de negócio:**
1. Primeira trilha da sequência deve estar sempre disponível
2. Trilhas subsequentes só desbloqueiam após aprovação na anterior
3. Sistema deve validar integridade (evitar dependências circulares)
4. Alterações na sequência só afetam novos usuários
5. Usuários em progresso mantêm trilhas já desbloqueadas
6. Sistema deve gerar alertas para dependências conflitantes

---

#### RF022 - Configuração de Critérios de Aprovação

**Descrição:** Definição de critérios específicos de aprovação para cada trilha de aprendizagem.

**Objetivos:** Permitir personalização de critérios baseados na complexidade e importância educacional do conteúdo.

**Premissas:** Cada trilha pode ter critérios personalizados adequados ao nível de conhecimento exigido.

**Pré-condições:**
- Trilha deve existir no sistema
- Administrador deve ter permissões de configuração

**Critérios configuráveis:**
- **Porcentagem mínima de acerto:** Float, 50% - 95%, default 70%
- **Tentativas permitidas:** Integer, 1 a 5, default 3
- **Tempo limite:** Integer, minutos, opcional
- **Questões obrigatórias:** Boolean, marcação de questões críticas
- **Permitir revisão de respostas:** Boolean, default true
- **Mostrar explicação após erro:** Boolean, feedback educativo imediato
- **Permitir pular questões:** Boolean, flexibilidade na navegação

**Interface de configuração:**
- **Slider visual:** Para percentual com indicação de dificuldade
- **Configurações por seção:** Agrupamento lógico de opções
- **Preview de impacto:** Simulação de como afetará estudantes
- **Comparação com padrões:** Benchmarks por nível de trilha

**Validações:**
- Porcentagem mínima não pode ser menor que 50%
- Tentativas devem ser número inteiro positivo
- Tempo limite deve ser realista (mínimo 10 minutos se configurado)

**Regras de negócio:**
1. Trilhas básicas devem ter critérios menos rigorosos
2. Questões marcadas como obrigatórias devem ser respondidas corretamente
3. Tempo limite é opcional mas recomendado para trilhas avançadas
4. Critérios mais rigorosos para trilhas que geram certificação
5. Sistema deve sugerir critérios baseados no nível da trilha

---

#### RF023 - Clonar Trilha

**Descrição:** Duplicação de trilhas existentes para acelerar criação de conteúdo similar.

**Objetivos:** Permitir reutilização de estruturas educacionais bem-sucedidas, otimizando processo de criação.

**Premissas:** Clonagem permite aproveitamento de trilhas eficazes como base para novas versões ou adaptações.

**Pré-condições:**
- Trilha original deve existir e estar acessível
- Administrador deve ter permissões de criação

**Dados clonados:**
- **Nome da trilha:** String, com prefixo "Cópia de [Nome Original]"
- **Categoria e tags:** String, mantém classificação original
- **Sequência completa de conteúdo:** List, questões, quizzes, artigos
- **Critérios de aprovação:** Float, configurações de avaliação
- **Configurações de randomização:** Boolean, comportamento das questões
- **Configurações visuais:** Imagem de capa e cor do tema

**Dados NÃO clonados:**
- **Ordem de desbloqueio:** Integer, fica sem ordem definida
- **Estatísticas de uso:** Integer, métricas zeradas
- **Histórico de estudantes:** List, dados de progresso não transferidos
- **ID e UUID:** Novos identificadores gerados

**Estado da trilha clonada:**
- **Status:** String, "Rascunho" para permitir edição
- **Data de criação:** DateTime, nova data atual
- **Autor:** String, administrador que realizou clonagem
- **Versão:** Float, inicia em 1.0

**Processo de clonagem:**
- Seleção da trilha original
- Confirmação da ação de clonagem
- Processamento automático da duplicação
- Redirecionamento para edição da trilha clonada
- Notificação de conclusão

**Regras de negócio:**
1. Trilha clonada sempre inicia como rascunho
2. Nome deve incluir prefixo identificador da clonagem
3. Conteúdo é duplicado mas mantém referência ao original
4. Trilha clonada não herda posição na sequência educacional
5. Sistema deve validar disponibilidade de todo o conteúdo referenciado
6. Clonagem preserva integridade das relações de conteúdo

---

#### RF024 - Randomização de Questões

**Descrição:** Configuração de ordem aleatória das questões dentro de uma trilha para cada estudante.

**Objetivos:** Evitar decoração de sequências e garantir avaliação mais autêntica do conhecimento adquirido.

**Premissas:** Randomização previne memorização de ordem das questões, mantendo validade educacional da avaliação.

**Pré-condições:**
- Trilha deve conter questões cadastradas
- Sistema de randomização deve estar ativo

**Configurações por trilha:**
- **Ativar ordem aleatória:** Boolean, habilitar randomização global
- **Manter artigos wiki na posição:** Boolean, conteúdo teórico em posição fixa
- **Randomizar ordem de respostas:** Boolean, embaralhar alternativas das questões
- **Questões fixas:** Multi-select, questões que não randomizam
- **Posições específicas:** Integer, primeira questão, última questão

**Algoritmo de randomização:**
- **Seed por usuário:** String, garante mesma ordem em tentativas do mesmo usuário
- **Distribuição equilibrada:** Algoritmo garante representação adequada por tipo
- **Preservação de fluxo:** Artigos teóricos precedem questões relacionadas

**Configurações avançadas:**
- **Grupos de questões:** Manter questões relacionadas em sequência
- **Balanceamento por tipo:** Distribuição proporcional de tipos de questão
- **Respeitar dependências:** Questões que dependem de conteúdo anterior

**Regras de negócio:**
1. Artigos teóricos devem preceder questões relacionadas
2. Questões introdutórias podem ser fixadas no início
3. Algoritmo deve garantir distribuição equilibrada
4. Mesmo usuário vê mesma ordem em tentativas da mesma sessão
5. Sistema deve manter log da ordem gerada por usuário para auditoria

---

### 3.5. Gestão de Wiki Administrativo

#### RF025 - Listagem de Artigos Wiki

**Descrição:** Exibição e gerenciamento de todos os artigos da base de conhecimento com filtros e métricas.

**Objetivos:** Permitir gestão completa da base de conhecimento teórico complementar às trilhas práticas.

**Premissas:** Wiki serve como biblioteca de referência técnica sobre descarte de resíduos médicos, acessível sem restrições.

**Pré-condições:**
- Sistema wiki operacional
- Categorias cadastradas
- Administrador com permissões adequadas

**Campos de busca e filtro:**
- **Busca textual:** String, 100 caracteres máximo, busca em título, conteúdo, tags
- **Filtro por categoria:** Multi-select, hierárquica (categoria pai > filha)
- **Filtro por status:** Dropdown, default "Todos" (Todos, Publicado, Rascunho, Arquivado)
- **Filtro por autor:** Multi-select, administradores criadores
- **Filtro por tags:** String, auto-complete, operador AND/OR
- **Filtro por data:** Date range picker (criação, modificação, publicação)
- **Filtro por engajamento:** Dropdown (Mais visualizados, Menos visualizados, Sem visualizações)

**Configurações de exibição:**
- **Itens por página:** Dropdown (10, 25, 50), default 10
- **Ordenação:** Dropdown, default "Data modificação DESC"
- **Modo de visualização:** Toggle (Cards/Lista/Tabela)
- **Densidade:** Slider (Compacto/Normal/Espaçado)

**Dados exibidos por artigo:**
- **ID único:** String, formato WIKI_YYMMDD_XXX
- **Título:** String, máximo 80 caracteres exibidos, tooltip se truncado
- **Resumo/Excerpt:** String, máximo 150 caracteres, auto-gerado ou manual
- **Status:** Badge com ícone (Publicado=verde+check, Rascunho=amarelo+edit, Arquivado=cinza+archive)
- **Categoria:** Badge hierárquico colorido (Pai > Filha)
- **Tags:** List, máximo 3 visíveis + "+N mais"
- **Autor:** Avatar circular + nome, tooltip com informações
- **Tempo de leitura:** Badge com ícone relógio, calculado automaticamente
- **Visualizações:** Integer, counter com ícone de olho
- **Referências em trilhas:** Integer, badge com número
- **Criado em:** Date, formato DD/MM/AAAA
- **Modificado em:** DateTime, indicador "há X tempo"
- **Publicado em:** Date, apenas se status = Publicado

**Ações individuais:**
- **Visualizar:** Modal/página de preview
- **Editar:** Editor WYSIWYG
- **Duplicar:** Criar cópia editável
- **Publicar/Despublicar:** Toggle com confirmação
- **Arquivar:** Move para arquivo
- **Visualizar como estudante:** Preview na interface final
- **Analytics:** Gráficos de visualização
- **Histórico de versões:** Lista de alterações com diff
- **Excluir:** Apenas rascunhos

**Ações em lote:**
- **Seleção múltipla:** Checkbox master + individuais
- **Publicar selecionados:** Para artigos em rascunho
- **Arquivar selecionados:** Move para arquivo
- **Alterar categoria:** Dropdown para nova categoria
- **Aplicar tags:** Adicionar/remover tags em massa
- **Exportar:** ZIP com artigos em diferentes formatos

**Métricas consolidadas:**
- **Total de artigos:** Integer, breakdown por status
- **Publicados hoje:** Integer, comparativo com ontem
- **Artigos mais lidos:** Top 5 com visualizações
- **Categorias mais populares:** Chart de distribuição
- **Artigos desatualizados:** Counter com alerta (>6 meses sem atualização)

**Regras de negócio:**
1. Artigos ordenados por data de modificação (mais recente primeiro)
2. Lista paginada obrigatoriamente (máximo 50 por página)
3. Apenas artigos "Publicados" aparecem na wiki do estudante
4. Rascunhos só visíveis para autor e administradores
5. Cache de 5 minutos para métricas de visualização
6. Busca textual indexada para performance
7. Tempo de leitura recalculado automaticamente (200 palavras/min)

---

#### RF026 - Criação de Nova Página Wiki

**Descrição:** Criação de novos artigos para a base de conhecimento com editor WYSIWYG avançado.

**Objetivos:** Permitir criação de conteúdo rico e formatado sem conhecimento técnico avançado.

**Premissas:** Editor deve ser intuitivo similar ao Notion, permitindo formatação rica e elementos interativos.

**Pré-condições:**
- Administrador deve estar logado
- Categorias devem estar disponíveis
- Sistema de upload deve estar operacional

**Campos obrigatórios:**
- **Título do artigo:** String, 200 caracteres máximo, mínimo 5 caracteres
- **Categoria:** Dropdown, obrigatório para publicação
- **Conteúdo:** Text, editor WYSIWYG, mínimo 50 caracteres

**Campos opcionais:**
- **Resumo personalizado:** Text, 300 caracteres máximo, sobrescreve auto-gerado
- **Tags:** String, múltiplas tags separadas por vírgula
- **Imagem de destaque:** File, PNG/JPG, máximo 5MB
- **Meta descrição:** String, 160 caracteres, para SEO interno
- **Autor personalizado:** String, sobrescreve usuário logado se necessário

**Editor WYSIWYG funcionalidades:**
- **Formatação de texto:** Negrito, itálico, sublinhado, tachado
- **Cabeçalhos:** H1, H2, H3, H4 com âncoras automáticas
- **Listas:** Ordenadas, não-ordenadas, checklist
- **Links:** Externos e internos (outros artigos wiki)
- **Citações:** Blockquotes com formatação especial
- **Código:** Inline e blocos com syntax highlighting
- **Tabelas:** Criação e edição visual
- **Imagens:** Upload com resize automático e alt text
- **Divisores:** Linhas horizontais
- **Embeds:** Vídeos, iframes (se permitido)

**Comandos rápidos:**
- **"/" para menu de comandos:** Inserção rápida de elementos
- **Markdown shortcuts:** # para títulos, * para listas, etc.
- **Atalhos de teclado:** Ctrl+B, Ctrl+I, etc.

**Campos automáticos:**
- **ID do artigo:** String, formato WIKI_YYMMDD_XXX
- **Slug da URL:** String, gerado automaticamente do título
- **Autor:** String, usuário logado
- **Data de criação:** DateTime, timestamp atual
- **Data de modificação:** DateTime, atualizado a cada save
- **Status:** String, default "Rascunho"
- **Tempo de leitura:** Integer, calculado automaticamente

**Validações:**
- Título: único, sem caracteres especiais na URL
- Categoria: deve existir e estar ativa
- Conteúdo: mínimo para publicação
- Imagens: formato e tamanho válidos
- Links internos: verificação de existência

**Regras de negócio:**
1. Todo artigo novo inicia como "Rascunho"
2. Autor definido automaticamente pelo usuário logado
3. Categoria obrigatória para publicação
4. Sistema de salvamento automático a cada 30 segundos
5. Histórico de versões mantido automaticamente

---

#### RF027 - Editor WYSIWYG de Conteúdo

**Descrição:** Editor de texto rico similar ao Notion para criação de conteúdo wiki com funcionalidades avançadas.

**Objetivos:** Fornecer editor intuitivo que permita formatação rica sem conhecimento de código, com recursos modernos de produtividade.

**Premissas:** Editor deve ser intuitivo para administradores não técnicos, oferecendo recursos profissionais de formatação e organização de conteúdo.

**Pré-condições:**
- Artigo deve estar em modo de edição
- Editor deve estar carregado corretamente
- Sistema de upload de arquivos operacional

**Funcionalidades de formatação básica:**
- **Texto:** Negrito (Ctrl+B), itálico (Ctrl+I), sublinhado (Ctrl+U), tachado
- **Cores:** Destaque de texto, cor de fundo, paleta personalizada
- **Alinhamento:** Esquerda, centro, direita, justificado
- **Espaçamento:** Entrelinhas, espaçamento de parágrafos

**Estrutura e organização:**
- **Cabeçalhos:** H1, H2, H3, H4 com estilização automática
- **Listas:** Numeradas, com marcadores, checklist interativo
- **Citações:** Blockquotes com bordas estilizadas
- **Divisores:** Linhas horizontais com diferentes estilos
- **Colunas:** Layout em 2 ou 3 colunas para organização

**Mídia e arquivos:**
- **Imagens:** Upload, redimensionamento, alinhamento, alt text
- **Vídeos:** Embed de YouTube, Vimeo (se permitido)
- **Documentos:** PDF, links para download
- **Galeria:** Múltiplas imagens organizadas

**Elementos especializados:**
- **Tabelas:** Criação visual, cabeçalhos, estilos, ordenação
- **Código:** Syntax highlighting para múltiplas linguagens

**Comandos rápidos ("/"):**
- **/h1, /h2, /h3** - Inserir cabeçalhos
- **/lista, /numerada** - Criar listas
- **/citacao** - Inserir blockquote
- **/codigo** - Bloco de código
- **/imagem** - Upload de imagem
- **/tabela** - Criar tabela
- **/divisor** - Linha horizontal
- **/caixa** - Caixa de destaque

**Recursos de produtividade:**
- **Auto-salvamento:** A cada 30 segundos
- **Histórico de versões:** Rollback para versões anteriores
- **Contador de palavras:** Estatísticas do conteúdo
- **Tempo de leitura:** Cálculo automático

**Validações do editor:**
- Links internos: verificação de existência
- Imagens: formato e tamanho válidos

**Regras de negócio:**
1. Editor deve ter salvamento automático funcional
2. Preview deve ser disponível em tempo real
3. Sistema deve suportar desfazer/refazer ilimitado
4. Todos os elementos devem ser responsivos

---

#### RF028 - Controle de Status e Publicação

**Descrição:** Gerenciamento do ciclo de vida dos artigos através de controle de status simplificado.

**Objetivos:** Controlar visibilidade dos artigos mantendo processo editorial simples e eficiente.

**Premissas:** Sistema deve controlar visibilidade mantendo processo editorial ágil sem burocracia excessiva.

**Pré-condições:**
- Artigo deve existir no sistema
- Administrador deve ter permissões de publicação

**Estados possíveis:**
- **Rascunho:** Artigo em criação/edição, não visível aos estudantes
- **Publicado:** Disponível para estudantes na wiki
- **Arquivado:** Removido da visualização mas mantido no sistema

**Ações de status:**
- **Salvar:** Manter como rascunho
- **Publicar:** Alterar status para "Publicado" após validações
- **Despublicar:** Voltar de "Publicado" para "Rascunho"
- **Arquivar:** Mover para arquivo (reversível)

**Validações obrigatórias para publicação:**
- **Título preenchido:** String, não vazio
- **Categoria selecionada:** Dropdown, obrigatório
- **Conteúdo não vazio:** Text, mínimo 50 caracteres
- **Imagens válidas:** File, formatos suportados
- **Links funcionais:** Verificação automática de links internos

**Interface de controle:**
- **Status atual:** Badge visual claro
- **Ações disponíveis:** Botões contextuais por status
- **Histórico de mudanças:** Log de alterações de status
- **Preview antes de publicar:** Visualização como estudante

**Regras de negócio:**
1. Apenas artigos "Publicados" aparecem na wiki do estudante
2. Mudança de status deve gerar log de auditoria
3. Artigos publicados podem voltar para rascunho para edição
4. Despublicar deve alertar sobre impacto em trilhas que referenciam
5. Arquivamento deve ser reversível por administradores
6. Sistema deve validar integridade antes de permitir publicação

---

#### RF029 - Cálculo Automático de Tempo de Leitura

**Descrição:** Cálculo automático do tempo estimado de leitura baseado na análise do conteúdo textual.

**Objetivos:** Fornecer estimativa realista de tempo de leitura para ajudar usuários a planejar sessões de estudo.

**Premissas:** Tempo de leitura preciso melhora planejamento de estudo e expectativas do usuário sobre o conteúdo.

**Pré-condições:**
- Artigo deve ter conteúdo textual
- Algoritmo de contagem deve estar ativo

**Algoritmo de cálculo:**
- **Taxa padrão:** 200 palavras por minuto (adulto médio)
- **Contagem de palavras:** Exclusão de HTML tags, contagem apenas de texto corrido
- **Elementos considerados:** Texto, listas, citações
- **Elementos excluídos:** Títulos, legendas, código, tabelas complexas
- **Ajustes por tipo:** Texto técnico +15%, listas simples -10%

**Configurações:**
- **Tempo mínimo:** 1 minuto para qualquer artigo
- **Arredondamento:** Minutos inteiros, segundos descartados
- **Recálculo automático:** A cada alteração >50 palavras
- **Cache:** Resultado armazenado até próxima modificação

**Exibição:**
- **Formato:** "⏱ X min de leitura"
- **Posição:** Topo da página, próximo ao título
- **Estilo visual:** Badge discreto, não intrusivo
- **Responsividade:** Adaptável a diferentes tamanhos de tela

**Regras de negócio:**
1. Cálculo deve considerar apenas texto corrido
2. Elementos visuais não contam para o tempo
3. Recálculo deve ser automático durante edição
4. Tempo deve ser arredondado para minutos inteiros
5. Sistema deve ajustar para conteúdo técnico/especializado
6. Cache deve ser invalidado em qualquer alteração de conteúdo

---

#### RF030 - Gestão de Categorias

**Descrição:** Criação e gerenciamento de categorias para organização hierárquica de conteúdo wiki.

**Objetivos:** Organizar conteúdo de forma lógica e hierárquica facilitando navegação e descoberta.

**Premissas:** Categorias devem criar estrutura organizacional clara refletindo taxonomia do conhecimento sobre resíduos médicos.

**Pré-condições:**
- Sistema de categorização deve estar ativo
- Administrador deve ter permissões de gestão

**Campos obrigatórios:**
- **Nome da categoria:** String, 100 caracteres máximo, único no sistema
- **Cor de identificação:** String, código hexadecimal ou paleta pré-definida
- **Nível:** Dropdown (Básico, Intermediário, Avançado)

**Campos opcionais:**
- **Descrição:** Text, 500 caracteres máximo
- **Categoria pai:** Dropdown, para hierarquia (máximo 3 níveis)
- **Ícone representativo:** String, classe de ícone ou upload de imagem
- **Ordem de exibição:** Integer, posicionamento na lista

**Estrutura hierárquica:**
- **Nível 1:** Categorias principais (ex: Resíduos Biológicos)
- **Nível 2:** Subcategorias (ex: Sangue e Hemoderivados)
- **Nível 3:** Especificações (ex: Bolsas de Sangue)

**Métricas exibidas:**
- **Total de categorias:** Integer, breakdown por nível
- **Categorias mais utilizadas:** Top 5 com quantidade de artigos

**Validações:**
- Nome: único, sem caracteres especiais problemáticos
- Cor: código hexadecimal válido
- Hierarquia: máximo 3 níveis de profundidade
- Categoria pai: não pode criar dependência circular

**Regras de negócio:**
1. Nome da categoria deve ser único no sistema
2. Cada categoria deve ter cor única para identificação visual
3. Hierarquia máxima de 3 níveis (Pai > Filho > Neto)
4. Exclusão deve verificar conteúdos associados
5. Mudança de hierarquia deve preservar artigos existentes

---

#### RF031 - Sistema de Relacionamentos de Conteúdo

**Descrição:** Criação de conexões inteligentes entre artigos wiki, trilhas e questões.

**Objetivos:** Melhorar navegação e descoberta de conteúdo relacionado através de conexões automáticas e manuais.

**Premissas:** Relacionamentos facilitam aprendizado conectado e descoberta de conteúdo complementar.

**Pré-condições:**
- Conteúdos devem estar categorizados
- Sistema de tags deve estar ativo

**Relacionamentos automáticos:**
- **Wiki ↔ Trilhas:** Baseado na mesma categoria
- **Wiki ↔ Questões:** Por tags e categoria compartilhadas
- **Trilhas ↔ Artigos:** Referências de conteúdo teórico
- **Artigos similares:** Algoritmo de similaridade textual

**Interface de relacionamentos:**
- **Seção "Relacionamentos":** Painel lateral durante edição
- **Auto-sugestões:** Baseadas em categoria e tags
- **Busca manual:** Campo de busca para relacionamentos específicos
- **Preview de conteúdo:** Visualização rápida antes de relacionar

**Tipos de relacionamento:**
- **Ver também:** Conteúdo complementar
- **Pré-requisito:** Conteúdo que deve ser lido antes
- **Aprofundamento:** Conteúdo mais avançado sobre o tema
- **Relacionado:** Conexão temática geral

**Exibição para o usuário:**
- **Seção no final do artigo:** "Conteúdo Relacionado"
- **Cards visuais:** Preview com título, tipo e tempo estimado
- **Navegação contextual:** Links dentro do próprio texto
- **Breadcrumb inteligente:** Caminho de navegação sugerido

**Regras de negócio:**
1. Relacionamentos devem ser bidirecionais quando apropriado
2. Sistema deve sugerir conexões baseadas em categorias e tags
3. Administrador pode criar relacionamentos manuais específicos
4. Relacionamentos devem ser exibidos de forma não intrusiva
5. Sistema deve evitar relacionamentos circulares excessivos
6. Qualidade dos relacionamentos deve ser monitorada

---

#### RF032 - Visualizar Como Usuário

**Descrição:** Pré-visualização do conteúdo como aparecerá para os estudantes na interface final.

**Objetivos:** Permitir validação da apresentação e funcionalidade antes da publicação oficial.

**Premissas:** Preview deve ser idêntico à experiência final do estudante para garantir qualidade da apresentação.

**Pré-condições:**
- Artigo deve estar em edição ou criado
- Template do usuário deve estar disponível
- Sistema de renderização deve estar operacional

**Funcionalidades incluídas:**
- **Layout idêntico ao app do estudante:** Interface exata sem elementos administrativos
- **Tempo de leitura calculado:** Exibição do tempo estimado
- **Relacionamentos funcionais:** Links clicáveis para conteúdo relacionado
- **Navegação breadcrumb:** Caminho de navegação como aparece ao usuário
- **Seção "Conteúdo Relacionado":** Sugestões automáticas funcionais
- **Responsividade:** Teste em diferentes tamanhos de tela
- **Elementos interativos:** Acordeões, tabs, botões funcionais

**Limitações do preview:**
- **Não conta como visualização real:** Não afeta métricas de analytics
- **Não afeta estatísticas:** Métricas de engajamento não são alteradas
- **Modo "sandbox":** Ambiente isolado sem persistência de interações

**Interface de preview:**
- **Botão "Preview":** Disponível durante edição
- **Nova aba/modal:** Abertura em contexto separado
- **Barra de ferramentas:** Opções de visualização (desktop, tablet, mobile)
- **Botão de retorno:** Volta para edição facilmente

**Validações no preview:**
- **Links internos:** Verificação de funcionamento
- **Imagens:** Carregamento e responsividade
- **Formatação:** Consistência visual
- **Navegação:** Fluxo de relacionamentos

**Regras de negócio:**
1. Preview deve ser idêntico à versão final do usuário
2. Funcionalidades interativas devem estar operacionais
3. Modo preview não deve afetar métricas reais
4. Preview deve ser responsivo para diferentes dispositivos
5. Sistema deve alertar sobre elementos não funcionais no preview
6. Performance do preview deve ser monitorada

---

### 3.6. Sistema de Conquistas Administrativo

#### RF033 - Listagem de Conquistas

**Descrição:** Exibição e gerenciamento de todas as conquistas configuradas no sistema de gamificação.

**Objetivos:** Permitir gestão completa do sistema de conquistas que incentiva engajamento dos usuários.

**Premissas:** Conquistas gamificam o aprendizado incentivando progresso e engajamento contínuo dos estudantes.

**Pré-condições:**
- Sistema de gamificação deve estar ativo
- Conquistas devem estar cadastradas

**Campos de filtro:**
- **Busca por nome:** String, 100 caracteres máximo
- **Filtro por categoria:** Dropdown (Trilhas, Wiki, Geral, Certificação)
- **Filtro por dificuldade:** Dropdown (Fácil, Médio, Difícil)
- **Filtro por status:** Dropdown (Ativo, Inativo)
- **Filtro por critério:** Dropdown (Automático, Manual)

**Métricas exibidas:**
- **Total de conquistas criadas:** Integer, breakdown por categoria
- **Conquistas mais obtidas:** List, top 10 com percentual de usuários
- **Conquistas menos obtidas:** List, identificar possíveis problemas
- **Usuários com mais conquistas:** List, top engajados

**Dados por conquista:**
- **Nome da conquista:** String, título motivacional
- **Descrição:** Text, explicação clara do critério
- **Critério de obtenção:** String, condição técnica
- **Categoria:** Badge colorido (Trilhas=azul, Wiki=verde, etc.)
- **Dificuldade:** Ícones (Fácil=1 estrela, Médio=2, Difícil=3)
- **Quantidade de usuários que obtiveram:** Integer, contador + percentual
- **Taxa de obtenção:** Float, percentual do total de usuários
- **Data de criação:** Date, formato DD/MM/AAAA
- **Status:** Toggle (Ativo=verde, Inativo=cinza)
- **Ícone/Badge:** Imagem da conquista

**Ações disponíveis:**
- **Visualizar:** Modal com detalhes completos
- **Editar:** Formulário de edição de critérios
- **Duplicar:** Criar conquista similar
- **Ativar/Desativar:** Toggle de status
- **Ver usuários:** Lista de quem obteve a conquista
- **Analytics:** Gráficos de obtenção ao longo do tempo

**Regras de negócio:**
1. Conquistas ordenadas por quantidade de usuários que obtiveram
2. Conquistas inativas não são verificadas pelo sistema
3. Exclusão de conquista deve alertar sobre usuários que já a possuem
4. Lista paginada (15 conquistas por página)
5. Sistema deve destacar conquistas com baixa taxa de obtenção
6. Métricas atualizadas diariamente

---

#### RF034 - Criar Nova Conquista

**Descrição:** Criação de novas conquistas para gamificação do sistema educacional.

**Objetivos:** Permitir criação de conquistas com critérios verificáveis automaticamente pelo sistema para incentivar engajamento.

**Premissas:** Conquistas devem ter critérios claros, alcançáveis e motivacionais alinhados aos objetivos educacionais.

**Pré-condições:**
- Sistema de eventos deve estar operacional
- Critérios de obtenção devem estar definidos e verificáveis

**Campos obrigatórios:**
- **Nome da conquista:** String, 80 caracteres máximo, motivacional e claro
- **Descrição:** Text, 200 caracteres máximo, explicação para o usuário
- **Critério de obtenção:** Dropdown, tipo de evento automático
- **Categoria:** Dropdown (Trilhas, Wiki, Geral, Certificação)

**Campos opcionais:**
- **Ícone/Badge:** File, PNG/SVG, máximo 1MB, 128x128px recomendado
- **Dificuldade:** Dropdown (Fácil, Médio, Difícil)
- **Ordem de exibição:** Integer, posicionamento na lista
- **Mensagem personalizada:** String, texto exibido ao conquistar
- **Pontos de experiência:** Integer, se sistema de XP ativo

**Critérios de obtenção disponíveis:**

**Trilhas:**
- "Completar X trilhas" (configurável: 1, 3, 5, todas)
- "Completar trilha específica" (seleção de trilha)
- "Completar trilhas sem erro" (100% de acerto)
- "Completar trilhas em sequência" (sem parar)

**Wiki:**
- "Ler categoria completa" (todos artigos de uma categoria)
- "Ler X artigos" (configurável: 5, 10, 25, 50)
- "Tempo total de leitura" (configurável: 1h, 5h, 10h)
- "Ler artigo específico" (seleção de artigo importante)

**Questões:**
- "Sequência de X acertos" (configurável: 5, 10, 20)
- "Responder X questões" (configurável: 50, 100, 500)
- "Taxa de acerto >Y%" (configurável: 80%, 90%, 95%)
- "Acertar questão difícil" (nível avançado)

**Certificação:**
- "Obter primeiro certificado" (marco inicial)
- "Obter certificado com média >X%" (configurável: 85%, 90%, 95%)
- "Certificado aprovado rapidamente" (análise em <48h)

**Geral:**
- "Cadastro completo" (onboarding finalizado)
- "Primeiro login" (boas-vindas)
- "Login consecutivo X dias" (configurável: 3, 7, 30)
- "Usar AI Assistant" (primeira interação)

**Configurações por critério:**
- **Valores numéricos:** Integer, para critérios quantitativos
- **Seleção específica:** Dropdown, para trilhas/artigos específicos
- **Período de tempo:** Integer, para critérios temporais

**Validações:**
- Nome: único no sistema, motivacional
- Descrição: clara e compreensível
- Critério: deve ser verificável automaticamente
- Ícone: formato e tamanho válidos

**Regras de negócio:**
1. Nome da conquista deve ser único no sistema
2. Critérios devem ser verificáveis automaticamente
3. Conquistas criadas ficam ativas por padrão
4. Descrição deve ser clara e motivacional para o usuário
5. Sistema deve validar consistência dos critérios numéricos
6. Conquistas devem ser balanceadas em dificuldade

---

#### RF035 - Monitorar Conquistas dos Usuários

**Descrição:** Acompanhamento de quais usuários obtiveram quais conquistas com interface de gestão.

**Objetivos:** Permitir monitoramento da efetividade da gamificação e gestão manual quando necessário.

**Premissas:** Monitoramento permite avaliar engajamento e identificar problemas no sistema de conquistas.

**Pré-condições:**
- Conquistas devem estar ativas
- Usuários devem estar engajados no sistema

**Funcionalidades de monitoramento:**

**Visão por usuário:**
- Lista de conquistas obtidas por usuário específico
- Progresso para próximas conquistas
- Timeline de conquistas ao longo do tempo
- Comparação com outros usuários (opcional)

**Visão por conquista:**
- Lista de usuários que obtiveram conquista específica
- Estatísticas de obtenção (tempo médio, taxa de sucesso)
- Gráfico de obtenção ao longo do tempo
- Identificação de possíveis problemas

**Interface de monitoramento:**
- **Ranking:** Usuários com mais conquistas
- **Timeline:** Conquistas obtidas recentemente
- **Filtros:** Por usuário, conquista, período, categoria
- **Analytics:** Gráficos de engajamento

**Dados exibidos:**
- **Nome do usuário:** String, com link para perfil
- **Nome da conquista:** String, com descrição
- **Data de obtenção:** DateTime, formato DD/MM/AAAA HH:MM
- **Critério atendido:** String, como foi conquistada
- **Tempo para conquistar:** Duration, desde o cadastro
- **Posição no ranking:** Integer, entre todos os usuários

**Ações administrativas:**
- **Revogar conquista:** Manual, com justificativa
- **Conceder manualmente:** Para casos especiais
- **Ver detalhes:** Informações completas da obtenção
- **Exportar dados:** Relatório de conquistas

**Regras de negócio:**
1. Dados atualizados em tempo real
2. Timeline mostra últimas 50 conquistas
3. Revogação deve ser justificada e registrada
4. Sistema deve detectar padrões anômalos de obtenção
5. Conquistas revogadas mantêm histórico para auditoria
6. Interface deve destacar conquistas raras ou difíceis

---

### 3.7. Gestão de Usuários Administrativo

#### RF036 - Listagem de Usuários

**Descrição:** Exibição e gerenciamento de todos os usuários cadastrados na plataforma com informações resumidas de progresso educacional.

**Objetivos:** Fornecer visão consolidada do engajamento dos usuários e progresso no aprendizado para gestão administrativa.

**Premissas:** Interface deve consolidar informações críticas sobre usuários e seu desenvolvimento educacional.

**Pré-condições:**
- Administrador deve estar logado com permissões adequadas
- Sistema de usuários deve estar operacional

**Campos de filtro:**
- **Busca geral:** String, 100 caracteres máximo, busca em nome, email, CPF (mascarado)
- **Filtro por status:** Dropdown, default "Todos" (Todos, Ativo, Inativo, Pendente, Suspenso)
- **Filtro por perfil:** Dropdown, default "Todos" (Todos, Estudante, Admin, Super Admin)
- **Filtro por progresso:** Dropdown, default "Todos" (Não iniciado 0%, Iniciante 1-35%, Intermediário 36-70%, Avançado 71-99%, Concluído 100%)
- **Filtro por data de cadastro:** Date range picker, com atalhos (Hoje, Última semana, Último mês)
- **Filtro por última atividade:** Date range picker, para identificar usuários inativos
- **Filtro por certificação:** Dropdown (Todos, Com certificado, Sem certificado, Certificado pendente)

**Configurações de exibição:**
- **Itens por página:** Dropdown (10, 20, 50, 100), default 20
- **Ordenação:** Dropdown, default "Última atividade DESC"
- **Colunas visíveis:** Checkbox múltipla, configuração salva por usuário

**Dados exibidos por usuário:**
- **Avatar:** Imagem circular 40x40px, default se não fornecida
- **Nome completo:** String, máximo 50 caracteres exibidos, tooltip completo
- **Email:** String, máximo 30 caracteres exibidos, tooltip completo
- **Perfil:** Badge colorido (Estudante=azul, Admin=laranja, Super Admin=vermelho)
- **Status:** Badge com ícone (Ativo=verde+check, Inativo=cinza+pausa, Pendente=amarelo+relógio)
- **Data de cadastro:** Date, formato DD/MM/AAAA
- **Última atividade:** DateTime relativo ("há 2 horas", "há 3 dias")
- **Progresso geral:** Barra de progresso + percentual (trilhas concluídas/total)
- **Trilhas concluídas:** String formato "X/Y trilhas" com link para detalhamento
- **Certificados:** Badge com contador (número obtidos)
- **Última trilha acessada:** String, nome da trilha com link
- **Tempo total de estudo:** Duration, formato "Xh Ym"

**Ações individuais:**
- **Visualizar perfil:** Modal ou página detalhada
- **Editar dados:** Formulário de edição
- **Alterar status:** Dropdown (Ativar, Desativar, Suspender, Reativar)
- **Resetar progresso:** Com seleção de trilhas específicas
- **Enviar email:** Template de email
- **Ver histórico:** Log de atividades
- **Impersonar:** Login temporário (apenas super admin)

**Ações em lote:**
- **Seleção múltipla:** Checkbox master + individual
- **Exportar dados:** PDF, Excel, CSV
- **Alterar status em lote:** Para usuários selecionados
- **Envio de email em massa:** Template personalizável
- **Gerar relatório:** Relatório customizado

**Métricas do cabeçalho:**
- **Total de usuários:** Counter com breakdown por status
- **Novos hoje:** Counter com comparativo de ontem
- **Usuários ativos (7 dias):** Percentual do total
- **Taxa de conclusão média:** Percentual geral de progresso
- **Certificados emitidos (mês):** Counter com tendência

**Regras de negócio:**
1. Lista paginada obrigatoriamente (máximo 100 por página)
2. Dados pessoais sensíveis mascarados conforme LGPD
3. Usuários inativos há mais de 90 dias destacados visualmente
4. Super admin vê todos os usuários, admin vê apenas estudantes
5. Cache de 5 minutos para dados não críticos
6. Log de auditoria para todas as ações administrativas

---

#### RF037 - Visualizar Perfil Detalhado do Usuário

**Descrição:** Acesso a informações detalhadas de um usuário específico para análise de desempenho.

**Objetivos:** Permitir acompanhamento individualizado do progresso educacional e identificação de necessidades específicas.

**Premissas:** Perfil detalhado permite análise completa para suporte personalizado e intervenções pedagógicas.

**Pré-condições:**
- Usuário deve existir no sistema
- Administrador deve ter permissões de visualização

**Dados básicos:**
- **Informações pessoais:** Nome, email, data de cadastro, método de registro
- **Status da conta:** Ativo/inativo com histórico de mudanças
- **Dados de onboarding:** Especialização, posição, experiência, objetivos

**Informações educacionais:**
- **Progresso na plataforma:** Trilhas concluídas vs disponíveis com percentuais
- **Tempo total de estudo:** Duração acumulada com breakdown por trilha
- **Média de acertos:** Percentual geral com tendência temporal
- **Conquistas obtidas:** Lista com datas de obtenção

**Atividade recente:**
- **Últimas trilhas acessadas:** List com timestamps
- **Artigos wiki visualizados:** Histórico de leitura
- **Sessões de estudo:** Duração, frequência, padrões de horário
- **Interações com IA:** Quantidade e temas das consultas

**Análise de desempenho:**
- **Padrões de erro:** Tópicos com mais dificuldade
- **Tópicos com mais acertos:** Áreas de forte domínio
- **Padrão de estudo:** Horário preferido, duração das sessões
- **Evolução temporal:** Gráficos de progresso

**Regras de negócio:**
1. Dados atualizados em tempo real
2. Histórico mantém últimas 30 atividades por tipo
3. Métricas consideram apenas atividades válidas
4. Interface destaca áreas de dificuldade
5. Gráficos mostram tendências de melhoria/declínio

---

#### RF038 - Acompanhar Progresso Individual

**Descrição:** Exibição do progresso detalhado de um usuário em todas as trilhas e atividades educacionais.

**Objetivos:** Permitir identificação de dificuldades específicas e personalização de suporte educacional baseado em dados concretos.

**Premissas:** Acompanhamento granular permite intervenções pedagógicas direcionadas e melhoria da experiência de aprendizado.

**Pré-condições:**
- Usuário deve ter iniciado pelo menos uma trilha
- Dados de progresso devem estar disponíveis e consistentes

**Dados por trilha:**
- **Nome da trilha:** String com link para visualização
- **Status:** String (Não iniciada, Em progresso, Concluída, Aprovada, Reprovada)
- **Progresso percentual:** Float com barra visual
- **Tempo gasto:** Duration total na trilha
- **Número de tentativas:** Integer por trilha
- **Pontuação final:** Float da melhor tentativa
- **Data de início:** Date da primeira interação
- **Data de conclusão:** Date quando completou (se aplicável)

**Dados por questão/quiz:**
- **Questões corretas:** Integer com percentual
- **Questões com dificuldade:** Integer, identificação de padrões
- **Tempo médio por questão:** Duration para análise de compreensão
- **Tipos de erro:** List, categorização por tipo de questão
- **Tentativas por questão:** Integer, identificação de persistência

**Análise de performance:**
- **Padrões de erro:** List, tópicos com maior dificuldade
- **Tópicos com mais acertos:** List, áreas de domínio
- **Evolução temporal:** Gráfico de melhoria ao longo do tempo
- **Padrão de estudo:** String, horário preferido e duração de sessões
- **Comparação com média:** Float, posicionamento relativo

**Interface de acompanhamento:**
- **Timeline de progresso:** Visualização cronológica das atividades
- **Gráficos de desempenho:** Charts de evolução por trilha
- **Heatmap de atividade:** Padrões de estudo por dia/hora
- **Alertas de dificuldade:** Destacar áreas que precisam de atenção

**Funcionalidades de intervenção:**
- **Sugerir conteúdo complementar:** Baseado em dificuldades identificadas
- **Resetar trilha específica:** Para nova tentativa
- **Marcar para acompanhamento:** Flag de usuários que precisam de suporte
- **Enviar mensagem direcionada:** Comunicação personalizada

**Regras de negócio:**
1. Dados atualizados após cada atividade do usuário
2. Análise deve identificar padrões de aprendizado únicos
3. Sistema deve sugerir intervenções baseadas em dados
4. Relatórios devem ser exportáveis para acompanhamento externo
5. Interface deve destacar progressos positivos além das dificuldades

---

#### RF039 - Gerenciar Status dos Usuários

**Descrição:** Permitir ao administrador alterar o status dos usuários e realizar ações administrativas.

**Objetivos:** Fornecer controle administrativo mantendo integridade dos dados educacionais e rastreabilidade das ações.

**Premissas:** Gestão deve permitir controle necessário mantendo integridade educacional e conformidade com regulamentações.

**Pré-condições:**
- Administrador deve ter permissões específicas
- Usuário deve existir no sistema

**Status possíveis:**
- **Ativo:** Utilizando o sistema normalmente
- **Inativo:** Não acessa há mais de 90 dias (automático)
- **Pendente:** Aguardando ação específica (verificação de email, etc.)
- **Suspenso:** Conta suspensa administrativamente

**Ações administrativas disponíveis:**
- **Ativar/Desativar conta:** Mudança manual de status
- **Resetar progresso:** Seleção de trilhas específicas para reset
- **Resetar senha:** Envio de email para redefinição
- **Alterar dados básicos:** Nome, email (com validações)
- **Gerenciar permissões:** Alteração de perfil de acesso

**Processo de alteração de status:**
- **Seleção da ação:** Dropdown com opções contextuais
- **Justificativa obrigatória:** Text para ações críticas
- **Confirmação dupla:** Para alterações irreversíveis
- **Notificação ao usuário:** Email automático sobre mudanças

**Validações obrigatórias:**
- **Confirmação dupla para exclusão:** Processo em duas etapas
- **Log de auditoria:** Registro obrigatório de todas as ações
- **Notificação ao usuário:** Email sobre alterações importantes
- **Verificação de impacto:** Análise de consequências educacionais

**Regras de negócio:**
1. Alterações críticas requerem confirmação dupla
2. Todas as ações devem ser registradas em log com timestamp e justificativa
3. Usuário deve ser notificado sobre alterações em sua conta
4. Reset de progresso deve permitir seleção granular de trilhas
5. Suspensão deve preservar dados para eventual reativação
6. Alterações de email requerem nova verificação

---

#### RF040 - Dashboard de Usuários

**Descrição:** Integração de métricas de usuários no dashboard principal administrativo.

**Objetivos:** Consolidar informações-chave sobre engajamento e progresso dos usuários em visão executiva.

**Premissas:** Dashboard deve fornecer insights acionáveis sobre performance geral da base de usuários.

**Pré-condições:**
- Sistema de usuários deve estar operacional
- Dados de atividade devem estar disponíveis

**Métricas integradas:**
- **Monthly Active Users:** Integer (342 + variação mensal percentual)
- **Journey Completions:** Integer (156 + variação mensal percentual)
- **Questions Answered:** Integer (8,247 + variação diária percentual)
- **Average Study Time:** Duration média por usuário ativo

**Atividades recentes:**
- **New user registration:** String (nome + tempo relativo)
- **Journey completed:** String (usuário + trilha + tempo)
- **Certificate generated:** String (usuário + status + tempo)

**Widget de usuários recentes:**
- **Lista de novos usuários:** List (últimos 7 dias)
- **Dados exibidos:** Nome, ocupação, data de cadastro, primeiro acesso
- **Link para perfil:** Acesso direto ao perfil detalhado

**Gráficos de tendência:**
- **Cadastros ao longo do tempo:** Chart mensal dos últimos 12 meses
- **Engajamento semanal:** Usuários ativos por dia da semana
- **Taxa de retenção:** Percentual de usuários que voltam após cadastro

**Alertas automáticos:**
- **Usuários inativos:** Counter de usuários sem atividade >30 dias
- **Progresso estagnado:** Usuários sem progresso >15 dias
- **Certificações pendentes:** Quantidade aguardando aprovação

**Regras de negócio:**
1. Métricas atualizadas em tempo real ou cache máximo 5 minutos
2. Variações devem mostrar tendência (crescimento/declínio) com indicadores visuais
3. Feed deve priorizar atividades mais relevantes para gestão
4. Dashboard deve destacar alertas que requerem ação administrativa
5. Todos os widgets devem ter links para visões detalhadas

---

### 3.8. Sistema de Certificação Administrativo

#### RF041 - Listagem de Certificados

**Descrição:** Exibição e gerenciamento de todos os certificados emitidos e suas respectivas situações.

**Objetivos:** Permitir gestão eficiente do processo de validação de certificados e acompanhamento do pipeline de aprovação.

**Premissas:** Interface deve facilitar análise rápida e ações em lote para otimizar processo de validação educacional.

**Pré-condições:**
- Sistema de certificação deve estar operacional
- Usuários devem ter completado trilhas para gerar certificados

**Campos de filtro:**
- **Filtro por status:** Dropdown (Todos, Pendente, Aprovado, Rejeitado)
- **Filtro por período:** Date range picker (data de conclusão/solicitação)
- **Filtro por usuário:** String, busca por nome/email
- **Filtro por média:** Float range (filtrar por performance)
- **Filtro por tempo pendente:** Dropdown (Até 3 dias, 3-7 dias, Mais de 7 dias)

**Métricas resumidas:**
- **Total de certificados emitidos:** Integer, breakdown por status
- **Certificados pendentes:** Integer com indicador de urgência
- **Taxa de aprovação mensal:** Float com tendência
- **Tempo médio de análise:** Duration com meta de SLA

**Dados por certificado:**
- **Nome do usuário:** String com link para perfil
- **Email do usuário:** String mascarado para privacidade
- **Data de conclusão:** Date quando completou todas as trilhas
- **Data de solicitação:** DateTime quando certificado foi gerado
- **Status:** Badge colorido (Pendente=amarelo, Aprovado=verde, Rejeitado=vermelho)
- **Média geral de acertos:** Float com indicador visual de performance
- **Tempo total de estudo:** Duration acumulado
- **Tempo aguardando:** Duration desde a solicitação
- **Administrador responsável:** String (se já analisado)

**Ações individuais:**
- **Analisar:** Acesso à interface de análise detalhada
- **Aprovar rapidamente:** Para casos óbvios
- **Ver detalhes:** Modal com informações completas
- **Histórico:** Log de tentativas e progresso

**Ações em lote:**
- **Seleção múltipla:** Checkbox para certificados similares
- **Aprovação em lote:** Para certificados que atendem critérios padrão
- **Rejeição em lote:** Com motivo comum
- **Exportar relatório:** Lista de certificados processados

**Ordenação inteligente:**
- **Prioridade por tempo:** Pendentes há mais tempo primeiro
- **Por performance:** Maiores médias primeiro para aprovação rápida
- **Por urgência:** Baseado em critérios configuráveis

**Regras de negócio:**
1. Apenas usuários com 100% das trilhas podem gerar certificado
2. Certificados ordenados por data de conclusão (mais antigo primeiro)
3. Certificados aprovados não podem ser rejeitados posteriormente
4. Interface deve destacar certificados pendentes há mais de 5 dias
5. Sistema deve sugerir aprovação automática para casos evidentes

---

#### RF042 - Analisar Certificado Individual

**Descrição:** Análise detalhada do desempenho do usuário antes de aprovar o certificado.

**Objetivos:** Garantir qualidade e integridade do processo de certificação através de análise criteriosa.

**Premissas:** Análise individual assegura que apenas usuários que demonstraram real domínio do conteúdo recebam certificação oficial.

**Pré-condições:**
- Certificado deve estar em status pendente
- Dados completos do usuário devem estar disponíveis

**Informações exibidas:**
- **Dados do usuário:** Nome, email, perfil do onboarding, data de cadastro
- **Performance geral:** Média de acertos, tempo total, consistência temporal
- **Detalhamento por trilha:** Status, tentativas, pontuação, tempo gasto
- **Histórico de atividade:** Padrão de estudo, frequência, evolução
- **Análise de integridade:** Detecção de padrões anômalos

**Métricas de qualidade:**
- **Consistência de performance:** Variação entre trilhas
- **Padrão temporal:** Tempo adequado investido por trilha
- **Taxa de melhoria:** Evolução do desempenho ao longo do tempo
- **Engajamento com conteúdo:** Tempo em artigos wiki, uso do AI Assistant

**Interface de análise:**
- **Resumo executivo:** Cards com principais métricas
- **Timeline de progresso:** Visualização cronológica
- **Comparação com benchmarks:** Posicionamento relativo
- **Alertas automáticos:** Indicadores de possíveis irregularidades

**Campos de decisão:**
- **Decisão:** Radio buttons (Aprovar, Rejeitar, Solicitar informações)
- **Comentários:** Text, obrigatório para rejeições
- **Motivo de rejeição:** Dropdown (Performance insuficiente, Padrão suspeito, Documentação incompleta)
- **Recomendações:** Text, sugestões para melhoria

**Regras de negócio:**
1. Análise deve considerar desempenho holístico, não apenas médias
2. Comentários são opcionais para aprovações, obrigatórios para rejeições
3. Sistema deve mostrar padrões de resposta suspeitos automaticamente
4. Decisão deve ser baseada em critérios educacionais transparentes
5. Tempo de análise deve ser rastreado para métricas de eficiência

---

#### RF043 - Aprovar/Rejeitar Certificados

**Descrição:** Permitir ao administrador aprovar ou rejeitar certificados com notificação automática ao usuário.

**Objetivos:** Finalizar processo de certificação com transparência e comunicação adequada ao usuário.

**Premissas:** Processo deve ser transparente, educativo e manter histórico completo para auditoria.

**Pré-condições:**
- Certificado deve ter sido analisado
- Sistema de notificação deve estar ativo

**Fluxo de aprovação:**
- **Confirmação da decisão:** Modal com resumo da análise
- **Alteração de status:** "Pendente" → "Verificado"
- **Geração de PDF final:** Certificado oficial sem marca d'água
- **Registro de metadados:** Data, administrador, justificativa
- **Notificação automática:** Email ao usuário com link de download

**Fluxo de rejeição:**
- **Motivo obrigatório:** Text explicando razões educativas
- **Manutenção de status:** Permanece "Não Verificado"
- **Orientações construtivas:** Sugestões para melhoria
- **Email explicativo:** Comunicação educativa sobre próximos passos

**Dados registrados na aprovação:**
- **Timestamp da decisão:** DateTime exato
- **Administrador responsável:** String, quem aprovou
- **Comentários da análise:** Text (se fornecidos)
- **Métricas no momento:** Snapshot dos dados do usuário
- **Número único do certificado:** String para verificação

**Dados registrados na rejeição:**
- **Motivo da rejeição:** String, categoria
- **Explicação detalhada:** Text, feedback educativo
- **Recomendações:** Text, próximos passos sugeridos
- **Possibilidade de nova tentativa:** Boolean, se aplicável

**Validações do processo:**
- **Confirmação irreversível:** Warning claro sobre finalidade da decisão
- **Completude da análise:** Verificação de campos obrigatórios
- **Integridade dos dados:** Validação de consistência

**Regras de negócio:**
1. Ação não pode ser desfeita após confirmação final
2. Registro de auditoria obrigatório com todos os detalhes
3. Rejeições devem incluir feedback construtivo e educativo
4. Aprovação gera PDF final com selo de autenticidade único
5. Sistema deve detectar e alertar sobre decisões em massa suspeitas

---

#### RF044 - Geração Automática de Certificado

**Descrição:** Geração automática de certificados quando um usuário completa todas as trilhas com aprovação.

**Objetivos:** Automatizar detecção de elegibilidade e criar certificado inicial para análise administrativa.

**Premissas:** Sistema deve detectar automaticamente conclusão completa e iniciar pipeline de certificação.

**Pré-condições:**
- Usuário deve ter concluído todas as trilhas obrigatórias
- Critérios de aprovação devem ter sido atendidos em todas as trilhas

**Trigger automático:**
- **Detecção de conclusão:** Usuário completa última trilha pendente
- **Verificação de elegibilidade:** Validação de todos os critérios
- **Criação do certificado:** Status inicial "Não Verificado"
- **Notificação administrativa:** Alerta para análise manual

**Critérios de elegibilidade:**
- **100% das trilhas concluídas:** Boolean, verificação obrigatória
- **Média geral mínima:** Float, 70% ou conforme configurado
- **Nenhuma trilha reprovada:** Boolean, todas devem estar aprovadas
- **Tempo mínimo investido:** Duration, se configurado globalmente

**Dados incluídos no certificado:**
- **Nome completo do usuário:** String conforme cadastro
- **Período de estudo:** Date, início da primeira trilha até conclusão da última
- **Carga horária total:** Duration, tempo acumulado de estudo
- **Média geral de aproveitamento:** Float, média ponderada de todas as trilhas
- **Data de conclusão:** Date, quando completou a última trilha
- **ID único:** String, para verificação e rastreamento

**Estados do certificado:**
- **Não Verificado:** PDF com marca d'água "PENDENTE DE VERIFICAÇÃO"
- **Verificado:** PDF oficial sem marca d'água, com selo de aprovação

**Processo automático:**
- **Validação de critérios:** Verificação sistemática de todos os requisitos
- **Geração de PDF temporário:** Certificado com marca d'água
- **Registro no sistema:** Criação do registro de certificado
- **Fila de análise:** Adição à lista de certificados pendentes
- **Log de auditoria:** Registro completo do processo automático

**Regras de negócio:**
1. Geração deve ser totalmente automática após conclusão da última trilha
2. Certificado inicial sempre tem status "Não Verificado"
3. Sistema deve validar integridade de todos os dados antes de gerar
4. Notificação ao administrador deve incluir dados para análise rápida
5. Processo deve ser idempotente (não duplicar certificados)

---

#### RF045 - Gestão de Templates de Certificado

**Descrição:** Configurar o layout e informações que aparecem nos certificados PDF.

**Objetivos:** Permitir personalização visual e textual dos certificados para refletir identidade institucional e padrões profissionais.

**Premissas:** Templates devem ser configuráveis para diferentes tipos de certificação mantendo consistência visual e informacional.

**Pré-condições:**
- Sistema de geração de PDF deve estar operacional
- Arquivos de logo e assinatura devem estar disponíveis

**Configurações visuais disponíveis:**
- **Logo da instituição:** File, PNG/SVG, máximo 2MB, posicionamento configurável
- **Nome da instituição:** String, 200 caracteres máximo
- **Cores do template:** Color picker (primária, secundária, texto)
- **Fonte principal:** Dropdown (Serif, Sans-serif, opções profissionais)
- **Layout:** Dropdown (Clássico, Moderno, Institucional)

**Configurações textuais:**
- **Título do certificado:** String, default "Certificado de Conclusão - Descarte de Resíduos Médicos"
- **Texto padrão:** Text, 1000 caracteres máximo, com variáveis dinâmicas
- **Texto de validação:** String, informações sobre verificação online
- **Rodapé:** Text, informações adicionais da instituição

**Elementos obrigatórios:**
- **Assinatura digital:** File, imagem da assinatura autorizada
- **Selo de autenticidade:** Gerado automaticamente com QR code
- **Número único:** String, formato configurável
- **Data de emissão:** Date, formatação configurável

**Template base com variáveis:**
- **Cabeçalho:** [LOGO] + [NOME_INSTITUICAO]
- **Corpo principal:** [TEXTO_PADRAO] + dados variáveis
- **Dados do usuário:** [NOME_COMPLETO], [PERIODO_ESTUDO], [CARGA_HORARIA]
- **Rodapé:** [ASSINATURA] + [DATA_EMISSAO] + [STATUS_VERIFICACAO]

**Dados variáveis disponíveis:**
- **[NOME_COMPLETO]:** Nome do usuário certificado
- **[DATA_INICIO] / [DATA_FIM]:** Período de estudo
- **[CARGA_HORARIA]:** Tempo total investido
- **[APROVEITAMENTO]:** Percentual médio de performance
- **[DATA_CONCLUSAO]:** Quando completou as trilhas
- **[NUMERO_CERTIFICADO]:** ID único para verificação

**Interface de configuração:**
- **Editor visual:** Preview em tempo real das alterações
- **Biblioteca de templates:** Templates pré-configurados
- **Histórico de versões:** Controle de mudanças
- **Teste de geração:** Certificado de exemplo com dados fictícios

**Validações:**
- **Arquivos de imagem:** Formato e resolução adequados para impressão
- **Texto obrigatório:** Campos essenciais não podem ficar vazios
- **Variáveis:** Validação de sintaxe das variáveis dinâmicas
- **Layout:** Verificação de sobreposição de elementos

**Regras de negócio:**
1. Template deve manter proporções adequadas para impressão A4
2. Dados variáveis são substituídos automaticamente na geração
3. Alterações no template afetam apenas novos certificados
4. Sistema deve validar integridade visual antes de salvar
5. Backup automático de templates anteriores
6. Preview obrigatório antes de ativação

---

#### RF046 - Dashboard de Certificação

**Descrição:** Exibição de métricas-chave relacionadas aos certificados no dashboard principal administrativo.

**Objetivos:** Fornecer visão executiva rápida do status do processo de certificação e indicadores de performance.

**Premissas:** Dashboard deve fornecer insights acionáveis sobre pipeline de certificação e eficiência do processo.

**Pré-condições:**
- Sistema de certificação deve estar operacional
- Dados históricos devem estar disponíveis para tendências

**Métricas principais no dashboard:**
- **Certificados emitidos no mês:** Integer com variação percentual vs mês anterior
- **Certificados pendentes:** Integer com indicador de urgência (SLA)
- **Taxa de aprovação média:** Float com tendência dos últimos 3 meses
- **Tempo médio de análise:** Duration com meta de SLA

**Widget de certificação:**
- **Resumo mensal:** Dados consolidados com indicadores visuais de tendência
- **Alertas críticos:** Certificados aguardando há mais de 7 dias
- **Link de gestão:** Acesso direto à listagem completa
- **Próximas ações:** Counter de certificados que requerem análise hoje

**Atividades recentes (feed):**
- **Certificate approved:** String (nome usuário + tempo relativo)
- **New certificate pending:** String (nome usuário + tempo de espera)
- **Certificate rejected:** String (nome usuário + motivo resumido + tempo)

**Gráficos de tendência:**
- **Volume mensal:** Chart dos últimos 12 meses de certificados processados
- **Taxa de aprovação:** Evolução percentual ao longo do tempo
- **SLA de análise:** Distribuição do tempo de processamento

**Alertas automáticos:**
- **SLA em risco:** Certificados próximos de violar tempo meta
- **Backlog crescente:** Aumento significativo de pendências
- **Baixa taxa de aprovação:** Alert se taxa cair abaixo de threshold

**Regras de negócio:**
1. Métricas atualizadas em tempo real ou cache máximo 5 minutos
2. Alertas devem destacar certificados com análise em atraso
3. Variações devem mostrar tendência mensal com indicadores visuais
4. Links devem direcionar para funcionalidades específicas de gestão
5. Dashboard deve priorizar informações que requerem ação imediata

---

#### RF047 - Integração com Módulo de Usuários

**Descrição:** Integração do sistema de certificação com o gerenciamento de usuários.

**Objetivos:** Fornecer contexto completo do usuário durante análise de certificação e manter dados sincronizados.

**Premissas:** Integração deve permitir análise holística considerando histórico completo do usuário.

**Pré-condições:**
- Dados do usuário devem estar completos e atualizados
- Sistema de usuários deve estar integrado

**Integrações bidirecionais:**
- **Perfil do usuário → Status do certificado:** Exibição na visualização do perfil
- **Certificação → Dados do usuário:** Acesso contextual durante análise
- **Dashboard → Métricas cruzadas:** Correlação entre usuários ativos e certificações

**Informações exibidas no perfil do usuário:**
- **Status do certificado:** Badge visual (Pendente/Aprovado/Rejeitado)
- **Data de geração:** DateTime quando certificado foi criado
- **Progresso para certificação:** Percentual de trilhas concluídas
- **Link para detalhes:** Acesso direto ao certificado ou análise

**Dados disponíveis durante análise:**
- **Histórico educacional completo:** Todas as interações do usuário
- **Padrões de comportamento:** Tempo de estudo, frequência, evolução
- **Dados demográficos:** Informações do onboarding para contexto
- **Interações com suporte:** Histórico de dúvidas e assistência

**Sincronização de dados:**
- **Status em tempo real:** Atualizações automáticas entre sistemas
- **Consistência referencial:** Validação de integridade dos relacionamentos
- **Cache inteligente:** Otimização para consultas frequentes

**Regras de negócio:**
1. Status deve ser atualizado automaticamente em ambos os sistemas
2. Integração deve manter consistência de dados
3. Perfil deve mostrar histórico completo de certificação
4. Links devem permitir navegação contextual entre módulos
5. Dados sensíveis devem respeitar permissões de acesso

---

#### RF048 - Integração com Sistema de Trilhas

**Descrição:** Monitoramento automático da conclusão de trilhas para trigger de certificação.

**Objetivos:** Automatizar detecção de elegibilidade e garantir que certificação seja iniciada imediatamente após conclusão.

**Premissas:** Sistema deve monitorar progresso em tempo real para identificar momento exato de elegibilidade.

**Pré-condições:**
- Sistema de trilhas deve estar operacional
- Critérios de aprovação devem estar definidos para todas as trilhas

**Lógica de trigger:**
- **Condição 1:** Usuário completa última trilha pendente
- **Condição 2:** Todas as trilhas anteriores estão aprovadas
- **Condição 3:** Média geral >= critério mínimo configurado
- **Ação:** Executar função `gerar_certificado_automaticamente()`
- **Notificação:** Alertar administrador sobre novo certificado pendente

**Validações executadas:**
- **Completude das trilhas:** Boolean, verificação de 100% de conclusão
- **Status de aprovação:** Boolean, nenhuma trilha "Em progresso" ou "Reprovada"
- **Critérios de performance:** Float, média geral atende requisitos
- **Integridade temporal:** Verificação de sequência lógica de conclusão

**Dados capturados no trigger:**
- **Timestamp de conclusão:** DateTime exato da última atividade
- **Trilha final concluída:** String, qual trilha completou o requisito
- **Métricas consolidadas:** Snapshot completo da performance
- **Sequência de conclusão:** List, ordem cronológica das trilhas

**Monitoramento contínuo:**
- **Event listeners:** Escuta eventos de conclusão de trilha
- **Validação em tempo real:** Verificação imediata de elegibilidade
- **Queue de processamento:** Fila para processar certificações em lote
- **Logs detalhados:** Registro completo para auditoria

**Regras de negócio:**
1. Trigger deve ser executado imediatamente após conclusão da última trilha
2. Sistema deve validar todas as condições antes de gerar certificado
3. Falhas no processo devem gerar alertas para administrador
4. Validações devem considerar apenas trilhas marcadas como obrigatórias
5. Sistema deve prevenir duplicação de certificados para o mesmo usuário

---

### 3.9. Módulo Estudante - Autenticação e Onboarding

#### RF049 - Autenticação de Usuário

**Descrição:** Sistema de verificação de identidade de usuários para acesso ao aplicativo através de métodos seguros de autenticação.

**Objetivos:** Permitir que profissionais de saúde acessem o aplicativo de forma segura e conveniente.

**Premissas:** Sistema deve oferecer múltiplas opções de autenticação para maximizar acessibilidade e conveniência dos profissionais de saúde.

**Pré-condições:**
- Aplicativo deve estar instalado e operacional
- Conectividade com internet deve estar disponível
- Serviços de autenticação devem estar ativos

**Métodos de autenticação disponíveis:**
- **Email e senha:** Credenciais tradicionais com validação rigorosa
- **Google OAuth:** Integração com conta Google existente

**Campos obrigatórios (método tradicional):**
- **Email:** String, 200 caracteres máximo, validação de formato obrigatória
- **Senha:** String, mínimo 8 caracteres, critérios de segurança definidos

**Funcionalidades de apoio:**
- **Recuperação de senha:** Via email com token temporal
- **Lembrar credenciais:** Login automático (opcional)
- **Validação de credenciais:** Verificação no servidor
- **Detecção de primeiro acesso:** Para direcionamento ao onboarding

**Validações:**
- Email: formato válido, existência na base
- Senha: verificação de hash criptografado
- Status: conta deve estar ativa
- Tentativas: máximo 5 tentativas antes de bloqueio temporário

**Regras de negócio:**
1. Usuários novos devem completar onboarding obrigatório
2. Google OAuth deve sincronizar nome e email automaticamente
3. Máximo de 5 tentativas incorretas antes de bloqueio temporário
4. Sessão deve permanecer ativa por 30 dias (exceto logout manual)
5. Sistema deve detectar primeiro acesso para direcionar ao onboarding
6. Bloqueio temporário de 15 minutos após tentativas excessivas

---

#### RF050 - Registro de Nova Conta

**Descrição:** Cadastramento de novos usuários no sistema educacional.

**Objetivos:** Permitir que profissionais de saúde se cadastrem de forma simples e rápida.

**Premissas:** Processo de registro deve ser otimizado para profissionais ocupados, minimizando fricção.

**Pré-condições:**
- Sistema de usuários deve estar operacional
- Validação de email deve estar ativa
- Termos de serviço devem estar disponíveis

**Campos obrigatórios:**
- **Nome completo:** String, mínimo 3 caracteres, máximo 120 caracteres
- **Email:** String, 200 caracteres, validação de formato e unicidade
- **Senha:** String, mínimo 8 caracteres (maiúscula, minúscula, número)
- **Confirmação de senha:** String, deve ser idêntica à senha

**Métodos de registro:**
- **Registro tradicional:** Preenchimento manual dos campos
- **Google OAuth:** Dados preenchidos automaticamente da conta Google

**Validações obrigatórias:**
- **Email único no sistema:** Verificação de duplicidade
- **Critérios de senha forte:** Complexidade adequada
- **Confirmação de senha:** Verificação de igualdade
- **Aceitação de termos:** Terms of Service e Privacy Policy obrigatórios

**Processo pós-registro:**
- **Conta ativa imediatamente:** Sem necessidade de verificação por email
- **Redirecionamento para onboarding:** Obrigatório para novos usuários
- **Sincronização automática:** Para dados do Google OAuth
- **Log de auditoria:** Registro da criação da conta

**Regras de negócio:**
1. Email deve ser único no sistema
2. Conta fica ativa imediatamente após criação
3. Google OAuth deve verificar se email já existe no sistema
4. Novos usuários devem ser redirecionados obrigatoriamente para onboarding
5. Dados do Google OAuth (nome e email) devem ser sincronizados automaticamente
6. Sistema deve validar força da senha em tempo real

---

#### RF051 - Onboarding de Novo Usuário

**Descrição:** Coleta obrigatória de informações profissionais e objetivos de aprendizagem para personalização da experiência educacional.

**Objetivos:** Personalizar trilhas de aprendizagem baseado no perfil profissional e objetivos específicos do usuário.

**Premissas:** Onboarding deve coletar informações essenciais para customizar conteúdo e sugestões de trilhas conforme necessidades específicas.

**Pré-condições:**
- Usuário deve estar autenticado
- Base de dados de especialidades deve estar disponível
- Sistema deve detectar primeiro acesso

**Etapa 1 - Dados Profissionais (obrigatórios):**
- **Área de especialização:** Dropdown (Medicina Interna, Cirurgia, Emergência, Pediatria, Oncologia, Enfermagem, Farmácia, etc.)
- **Posição/Cargo:** Dropdown (Médico, Enfermeiro, Técnico, Farmacêutico, Gestor, Estudante)
- **Nível de experiência:** Dropdown (Entry Level 0-2 anos, Mid Level 3-5 anos, Senior 5+ anos)
- **Departamento principal:** Dropdown (Emergência, UTI, Cirúrgico, Clínico, Ambulatório, etc.)

**Etapa 2 - Objetivos de Aprendizagem (mínimo 1 selecionado):**
- **Compreender classificações de resíduos médicos:** Boolean
- **Aprender procedimentos corretos de descarte:** Boolean
- **Dominar protocolos de controle de infecção:** Boolean
- **Preparar-se para certificação profissional:** Boolean
- **Melhorar segurança no ambiente de trabalho:** Boolean
- **Treinar outros membros da equipe:** Boolean
- **Atender compliance regulatório:** Boolean
- **Reduzir impacto ambiental:** Boolean

**Interface do onboarding:**
- **Progresso visual:** Barra indicando etapa atual (1/2)
- **Navegação:** Botões "Anterior" e "Próximo"
- **Validação em tempo real:** Feedback imediato sobre campos obrigatórios
- **Design responsivo:** Adaptável a diferentes tamanhos de tela

**Dados armazenados automaticamente:**
- **Data de conclusão:** DateTime do término do onboarding
- **Versão do onboarding:** Integer para controle de mudanças
- **Tempo gasto:** Duration no processo
- **Dispositivo usado:** String para analytics

**Personalização baseada nos dados:**
- **Sugestões de trilhas:** Ordem de prioridade baseada no perfil
- **Conteúdo destacado:** Artigos wiki mais relevantes
- **Notificações personalizadas:** Baseadas em objetivos selecionados
- **Dashboard customizado:** Métricas relevantes para o perfil

**Regras de negócio:**
1. Onboarding é obrigatório para novos usuários
2. Deve ser apresentado apenas no primeiro acesso
3. Pelo menos um objetivo deve ser selecionado
4. Dados são utilizados para personalizar experiência
5. Informações podem ser editadas posteriormente no perfil
6. Conclusão do onboarding libera acesso completo ao aplicativo
7. Sistema deve salvar progresso parcial em caso de interrupção

---

### 3.10. Dashboard do Estudante

#### RF052 - Dashboard de Progresso do Estudante

**Descrição:** Exibição do progresso consolidado do estudante e direcionamento para próxima atividade de aprendizagem.

**Objetivos:** Servir como hub central motivacional e informativo, direcionando o estudante para ações prioritárias.

**Premissas:** Dashboard deve ser interface principal pós-login, fornecendo visão clara do progresso e próximos passos.

**Pré-condições:**
- Usuário deve estar autenticado
- Onboarding deve estar completo
- Sistema de trilhas deve estar operacional

**Elementos principais do dashboard:**
- **Saudação personalizada:** String (nome do usuário + saudação contextual por horário)
- **Progresso geral:** Float (porcentagem de conclusão de todas as trilhas disponíveis)
- **Nível atual:** String (Beginner, Intermediate, Advanced baseado no progresso)
- **Próximo milestone:** String (próxima meta importante a ser alcançada)

**Seção "Continue Learning":**
- **Nome da trilha atual:** String (trilha em andamento ou próxima a iniciar)
- **Módulo específico:** String (próxima atividade não concluída)
- **Progresso da trilha:** Float (porcentagem de conclusão da trilha atual)
- **Tipo de conteúdo:** String (Tópico, Pergunta, Quiz)
- **Tempo estimado:** Integer (minutos para completar próxima atividade)

**Seção de conquistas:**
- **Última conquista obtida:** String com ícone e data
- **Progresso para próxima:** Float com barra visual
- **Total de conquistas:** Integer contador

**Métricas de motivação:**
- **Sequência de dias estudando:** Integer (streak atual)
- **Tempo total investido:** Duration formatado
- **Posição relativa:** String (motivacional, sem comparação direta)

**Cálculo de progresso:**
- **Trilhas concluídas vs. total:** Float baseado apenas em trilhas desbloqueadas
- **Módulos concluídos por trilha:** Integer para granularidade
- **Status de conclusão:** Boolean (aprovado/reprovado por trilha)

**Regras de negócio:**
1. Dashboard deve ser a tela inicial após login
2. Progresso calculado baseado apenas em trilhas desbloqueadas para o usuário
3. "Continue Learning" sempre mostra próxima atividade relevante
4. Sistema identifica automaticamente trilha em andamento
5. Saudação varia conforme horário (Bom dia, Boa tarde, Boa noite)
6. Nível calculado automaticamente: 0-35% Beginner, 36-70% Intermediate, 71-100% Advanced
7. Métricas devem ser motivacionais, evitando comparações competitivas

---

### 3.11. Trilhas de Aprendizagem - Módulo Estudante

#### RF053 - Acesso a Trilhas de Aprendizagem

**Descrição:** Permitir ao estudante acessar e visualizar trilhas de aprendizagem conforme ordem sequencial e critérios de desbloqueio.

**Objetivos:** Garantir progressão pedagógica respeitando sequência educacional definida pelos administradores.

**Premissas:** Sistema deve respeitar progressão pedagógica, liberando trilhas avançadas apenas após domínio do conteúdo básico.

**Pré-condições:**
- Usuário deve estar autenticado e onboarding completo
- Trilhas devem estar configuradas pelo administrador
- Sistema de avaliação deve estar funcional

**Interface de trilhas:**
- **Busca por trilhas:** String para localizar trilha específica
- **Filtros por nível:** Dropdown (Beginner, Intermediate, Advanced)
- **Abas organizacionais:** Current (em andamento), Discover (disponíveis), Progress (concluídas)

**Funcionalidades de acesso:**
- **Visualização de trilhas disponíveis:** Trilhas desbloqueadas para acesso
- **Identificação de trilhas bloqueadas:** Indicação clara de trilhas ainda não liberadas
- **Acesso direto a trilhas desbloqueadas:** Entrada imediata no conteúdo
- **Progresso visual por trilha:** Barra de progresso com percentual

**Estados das trilhas:**
- **Disponível:** Verde, acesso liberado
- **Bloqueada:** Cinza, com indicação do pré-requisito
- **Em progresso:** Azul, com percentual de conclusão
- **Concluída:** Verde com check, revisão permitida

**Sistema de desbloqueio:**
- **Primeira trilha sempre disponível:** Ponto de entrada garantido
- **Trilhas subsequentes liberadas por conclusão:** Baseado em aprovação
- **Critério baseado em aprovação:** Percentual mínimo configurado pelo admin

**Dados exibidos por trilha:**
- **Nome e descrição:** Informações básicas
- **Nível de dificuldade:** Indicadores visuais
- **Tempo estimado:** Duração prevista
- **Progresso atual:** Percentual e atividades concluídas
- **Status de desbloqueio:** Disponível/bloqueada com justificativa

**Regras de negócio:**
1. Primeira trilha deve estar sempre disponível para novos usuários
2. Trilhas são liberadas sequencialmente após aprovação na anterior
3. Usuário pode revisar trilhas já concluídas a qualquer momento
4. Progresso é salvo automaticamente a cada atividade
5. Sistema deve indicar claramente quais trilhas estão bloqueadas e porquê
6. Interface deve mostrar progresso visual para motivar continuidade

---

#### RF054 - Navegação em Trilha Individual

**Descrição:** Navegação e execução de conteúdo dentro de uma trilha específica de aprendizagem.

**Objetivos:** Permitir navegação fluida entre diferentes tipos de conteúdo educacional mantendo contexto de progresso.

**Premissas:** Interface deve facilitar navegação intuitiva respeitando ordem pedagógica definida.

**Pré-condições:**
- Trilha deve estar desbloqueada para o usuário
- Conteúdo deve estar configurado pelo administrador
- Sistema de progresso deve estar ativo

**Tipos de conteúdo navegáveis:**
- **Tópicos educacionais:** Conteúdo teórico para leitura
- **Questões individuais:** Perguntas isoladas para avaliação
- **Quizzes:** Sequência de múltiplas questões
- **Artigos wiki:** Referências complementares

**Funcionalidades de navegação:**
- **Progresso visual da trilha:** Barra de progresso geral
- **Lista de módulos:** Visão geral do conteúdo com status individual
- **Navegação sequencial:** Botões próximo/anterior
- **Status por módulo:** Indicadores visuais (concluído, atual, bloqueado)

**Interface de navegação:**
- **Cabeçalho com contexto:** Nome da trilha, progresso, posição atual
- **Menu lateral:** Lista de módulos com navegação rápida
- **Área principal:** Conteúdo atual sendo estudado
- **Controles de navegação:** Botões de ação contextuais

**Informações por módulo:**
- **Tipo de conteúdo:** Ícones diferenciados (Tópico, Quiz, Pergunta)
- **Tempo estimado:** Minutos para completar
- **Status de conclusão:** Visual claro do que foi feito
- **Nível de dificuldade:** Quando aplicável

**Regras de negócio:**
1. Módulos devem ser acessados em ordem sequencial
2. Progresso deve ser salvo automaticamente
3. Sistema deve permitir revisão de módulos concluídos
4. Interface deve indicar claramente posição atual na trilha
5. Botão "Continue" deve sempre levar à próxima atividade não concluída
6. Sistema deve calcular tempo estimado total da trilha dinamicamente

---

### 3.12. Conteúdo Educacional - Execução

#### RF055 - Visualização de Tópicos Educacionais

**Descrição:** Apresentação de conteúdo teórico formatado para leitura em dispositivos móveis.

**Objetivos:** Fornecer experiência de leitura otimizada e envolvente em telas pequenas.

**Premissas:** Conteúdo deve ser apresentado de forma clara, legível e envolvente adaptado para dispositivos móveis.

**Pré-condições:**
- Tópico deve estar disponível na trilha atual
- Conteúdo deve estar publicado pelo administrador
- Tempo de leitura deve estar calculado

**Elementos da interface:**
- **Título do tópico:** Cabeçalho claro e destacado
- **Tempo estimado de leitura:** Badge discreto com ícone
- **Nível de dificuldade:** Indicador visual (Básico, Intermediário, Avançado)
- **Conteúdo formatado:** Texto rico com formatação preservada
- **Botão de progresso:** "Marcar como lido" ou "Continuar"

**Funcionalidades de leitura:**
- **Formatação responsiva:** Adaptação automática para diferentes tamanhos de tela
- **Rolagem suave:** Experiência de leitura otimizada
- **Zoom de texto:** Ajuste de tamanho da fonte
- **Modo noturno:** Alternância de cores para leitura em ambiente escuro

**Detecção de leitura:**
- **Tracking de scroll:** Sistema detecta quando usuário leu conteúdo
- **Tempo mínimo:** Permanência adequada na página
- **Interação:** Cliques, scrolls como indicadores de engajamento
- **Conclusão automática:** Marcação baseada em critérios objetivos

**Regras de negócio:**
1. Sistema deve detectar automaticamente conclusão da leitura
2. Conteúdo deve ser responsivo para diferentes dispositivos
3. Tempo de leitura calculado baseado na quantidade de texto (200 palavras/min)
4. Tópico marcado como concluído após scroll completo + tempo mínimo
5. Interface deve manter formatação consistente com versão web
6. Sistema deve preservar posição de leitura em caso de interrupção

---

#### RF056 - Sistema de Questões Interativas

**Descrição:** Apresentação e avaliação de diferentes tipos de questões educacionais.

**Objetivos:** Avaliar conhecimento de forma educativa fornecendo feedback construtivo imediato.

**Premissas:** Questões devem educar através do processo de avaliação, não apenas medir conhecimento.

**Pré-condições:**
- Questão deve estar disponível na sequência da trilha
- Sistema de avaliação deve estar ativo
- Feedback educativo deve estar configurado

**Tipos de questão suportados:**
- **Múltipla escolha:** 2 a 5 alternativas com uma correta
- **Verdadeiro ou Falso:** Com explicação educativa obrigatória
- **Complete a frase:** Lacunas com opções embaralhadas
- **Associação:** Relacionar elementos de duas colunas

**Interface de questão:**
- **Enunciado claro:** Pergunta bem formatada
- **Alternativas/opções:** Layout otimizado por tipo de questão
- **Botão de resposta:** Ativo apenas após seleção
- **Indicador de progresso:** Posição na sequência se aplicável

**Sistema de avaliação:**
- **Registro de resposta:** Captura antes de mostrar feedback
- **Feedback imediato:** Explicação educativa sempre exibida
- **Cálculo de acertos:** Atualização da performance
- **Tentativas limitadas:** Conforme configuração da trilha

**Feedback educativo:**
- **Resposta correta:** Reforço positivo + explicação complementar
- **Resposta incorreta:** Explicação educativa + resposta correta
- **Contexto adicional:** Links para conteúdo relacionado quando relevante

**Regras de negócio:**
1. Todas as questões devem fornecer feedback educativo obrigatório
2. Resposta deve ser registrada antes de mostrar feedback
3. Sistema deve permitir número limitado de tentativas por trilha
4. Questões incorretas devem mostrar explicação detalhada
5. Progresso só avança após resposta ou tentativas esgotadas
6. Interface deve ser acessível para diferentes necessidades

---

#### RF057 - Execução de Quiz

**Descrição:** Execução de sequências de questões agrupadas tematicamente com avaliação consolidada.

**Objetivos:** Avaliar conhecimento de forma abrangente sobre tema específico através de múltiplas questões relacionadas.

**Premissas:** Quiz deve proporcionar avaliação mais robusta que questões isoladas, com resultado consolidado e feedback detalhado.

**Pré-condições:**
- Quiz deve estar disponível na trilha
- Questões do quiz devem estar cadastradas e ativas
- Critérios de avaliação devem estar definidos

**Funcionalidades do quiz:**
- **Sequência de questões:** Ordem definida ou randomizada conforme configuração
- **Indicador de progresso:** "Questão X de Y" com barra visual
- **Navegação entre questões:** Próxima/anterior se permitido pela configuração
- **Timer opcional:** Contagem regressiva se tempo limite configurado
- **Resultado consolidado:** Pontuação final e status de aprovação

**Configurações por quiz:**
- **Randomização:** Ordem aleatória das questões
- **Revisão permitida:** Voltar para questões anteriores
- **Tempo limite:** Minutos totais para conclusão
- **Mostrar resultado:** Pontuação detalhada ao final

**Interface durante execução:**
- **Cabeçalho:** Nome do quiz, progresso, timer (se ativo)
- **Área da questão:** Conforme tipo específico da questão
- **Navegação:** Botões contextuais baseados na configuração
- **Indicadores:** Status de resposta por questão

**Tela de resultado:**
- **Pontuação obtida:** Percentual de acertos com indicador visual
- **Questões corretas/total:** Breakdown numérico
- **Tempo gasto:** Duração total vs tempo limite
- **Status de aprovação:** Aprovado/Reprovado baseado em critérios
- **Feedback por questão:** Revisão detalhada das respostas

**Estados de execução:**
- **Em andamento:** Quiz iniciado, permitindo navegação
- **Pausado:** Salvamento do progresso parcial
- **Finalizado:** Resultado disponível, sem alterações possíveis
- **Expirado:** Tempo esgotado, submissão automática

**Regras de negócio:**
1. Quiz deve ser completado integralmente para validação
2. Sistema deve salvar progresso parcial em caso de interrupção
3. Resultado final deve considerar critérios configurados pelo administrador
4. Usuário deve poder revisar respostas se configuração permitir
5. Feedback deve ser educativo independente da aprovação

---

### 3.13. Wiki do Estudante

#### RF058 - Acesso à Base de Conhecimento

**Descrição:** Fornecer acesso livre e irrestrito à documentação educacional sobre descarte de resíduos médicos.

**Objetivos:** Servir como referência complementar sempre disponível, sem travas ou limitações de acesso.

**Premissas:** Wiki deve funcionar como biblioteca de referência técnica, acessível independentemente do progresso nas trilhas.

**Pré-condições:**
- Usuário deve estar autenticado
- Artigos devem estar publicados pelo administrador
- Sistema de categorização deve estar operacional

**Funcionalidades de acesso:**
- **Navegação livre:** Sem restrições de sequência ou pré-requisitos
- **Busca por conteúdo:** Campo de busca para localizar artigos específicos
- **Navegação por categorias:** Organização temática hierárquica
- **Histórico de leitura:** Registro de artigos já visualizados

**Interface da wiki:**
- **Lista de categorias:** Organização hierárquica expansível
- **Artigos por categoria:** Listagem de conteúdo organizada
- **Barra de busca:** Busca textual livre com sugestões
- **Filtros por nível:** Básico, Intermediário, Avançado

**Dados por artigo:**
- **Título:** Nome claro e descritivo
- **Tempo de leitura:** Calculado automaticamente (ícone + tempo)
- **Nível de complexidade:** Indicadores visuais
- **Categoria:** Badge colorido
- **Conteúdo relacionado:** Sugestões automáticas ao final

**Funcionalidades de navegação:**
- **Breadcrumb:** Caminho de navegação atual
- **Links internos:** Conexões entre artigos relacionados
- **Busca contextual:** Sugestões baseadas no artigo atual
- **Favoritos:** Marcação de artigos para acesso rápido

**Regras de negócio:**
1. Wiki deve estar acessível sem restrições de trilha
2. Busca deve funcionar por título, conteúdo e tags
3. Histórico deve registrar artigos visualizados com timestamp
4. Sistema deve sugerir conteúdo relacionado automaticamente
5. Interface deve ser otimizada para leitura em dispositivos móveis
6. Conteúdo deve estar sempre atualizado com versões mais recentes

---

### 3.14. AI Assistant

#### RF059 - Assistente Inteligente para Dúvidas

**Descrição:** Fornecer suporte automatizado através de inteligência artificial especializada em descarte de resíduos médicos.

**Objetivos:** Oferecer assistência contextualizada 24/7 para dúvidas específicas sobre procedimentos e normas de descarte.

**Premissas:** IA deve ter acesso à base de conhecimento da wiki para fornecer respostas precisas e contextualizadas, sempre com disclaimers apropriados.

**Pré-condições:**
- Sistema de AI deve estar operacional
- Base de conhecimento wiki deve estar disponível
- Usuário deve estar autenticado

**Funcionalidades do assistente:**
- **Chat conversacional:** Interface de mensagens em tempo real
- **Respostas contextualizadas:** Baseadas na wiki e perfil do usuário
- **Suporte 24/7:** Disponibilidade constante
- **Perguntas frequentes:** Sugestões automáticas de tópicos comuns

**Interface do chat:**
- **Campo de entrada de texto:** Digitação livre com sugestões
- **Botão de envio:** Ativação por toque ou enter
- **Histórico de conversa:** Mensagens anteriores da sessão
- **Sugestões rápidas:** Perguntas pré-definidas como botões

**Categorias de perguntas frequentes:**
- **Medicamentos:** "Como descartar medicamentos vencidos?"
- **Emergência:** "Procedimento para material perfurocortante"
- **Protocolos:** "Cores dos recipientes de descarte"
- **Regulamentação:** "Normas ANVISA para resíduos"
- **Equipamentos:** "Descarte de materiais contaminados"

**Capacidades da IA:**
- **Consulta à wiki:** Acesso automático à base de conhecimento
- **Contextualização:** Considera perfil profissional do usuário
- **Referências:** Inclui links para artigos relevantes
- **Limitações claras:** Disclaimers sobre não substituir orientação profissional

**Regras de negócio:**
1. AI deve consultar base de conhecimento wiki para respostas
2. Respostas devem incluir referências aos artigos relacionados
3. Interface deve incluir aviso sobre limitações da AI
4. Sugestões devem ser baseadas em perguntas mais comuns do perfil
5. Sistema deve manter contexto da conversa durante a sessão
6. Disclaimer obrigatório sobre não substituir consulta médica/profissional

---

### 3.15. Perfil e Configurações do Estudante

#### RF060 - Perfil do Estudante

**Descrição:** Exibição e gestão das informações pessoais, profissionais e estatísticas de aprendizagem do usuário.

**Objetivos:** Consolidar todas as informações relevantes sobre progresso educacional e permitir edição de dados pessoais.

**Premissas:** Perfil deve servir como hub central para acompanhamento do desenvolvimento profissional no programa.

**Pré-condições:**
- Usuário deve estar autenticado
- Onboarding deve estar completo
- Dados de progresso devem estar disponíveis

**Dados pessoais exibidos:**
- **Avatar/Foto:** Imagem do perfil, default se não fornecida
- **Nome completo:** String editável
- **Email:** String com opção de alteração
- **Data de cadastro:** Date, somente leitura

**Informações profissionais:**
- **Especialização:** String, área médica de atuação
- **Departamento:** String, setor de trabalho
- **Nível de experiência:** String, classificação profissional
- **Objetivos de aprendizagem:** List, selecionados no onboarding

**Estatísticas de desempenho:**
- **Certificados obtidos:** Integer, contador com status
- **Taxa de aprovação média:** Float, percentual médio de acertos
- **Tempo total de estudo:** Duration, formatado como "Xh Ym"
- **Módulos concluídos:** String, formato "concluídos/total disponível"
- **Quizzes realizados:** Integer, contador total
- **Maior pontuação:** Float, melhor desempenho registrado

**Seção de conquistas:**
- **Conquistas recentes:** List, últimas obtidas com datas
- **Progresso para próximas:** Indicadores visuais
- **Total de conquistas:** Integer, contador geral

**Regras de negócio:**
1. Avatar deve ser opcional com imagem padrão se não fornecida
2. Dados profissionais podem ser editados a qualquer momento
3. Estatísticas devem ser atualizadas em tempo real
4. Email pode ser alterado mas deve passar por verificação
5. Objetivos de aprendizagem podem ser modificados (afeta sugestões)
6. Sistema deve manter histórico de alterações importantes

---

#### RF061 - Edição de Dados Pessoais

**Descrição:** Permitir ao usuário modificar suas informações pessoais e profissionais.

**Objetivos:** Dar autonomia para manter dados atualizados sem intervenção administrativa.

**Premissas:** Usuário deve ter controle total sobre suas informações, respeitando validações de segurança.

**Pré-condições:**
- Usuário deve estar autenticado
- Interface de edição deve estar acessível
- Validações devem estar ativas

**Campos editáveis:**
- **Nome completo:** String, mínimo 3 caracteres, máximo 120
- **Email:** String, com revalidação obrigatória
- **Foto de perfil:** File, PNG/JPG, máximo 2MB
- **Especialização:** Dropdown, lista pré-definida
- **Departamento:** Dropdown, opções configuradas
- **Nível de experiência:** Dropdown, classificações padrão
- **Instituição:** String, campo livre opcional

**Processo de validação:**
- **Alteração de email:** Envio de código de verificação para novo email
- **Validação de imagem:** Verificação de formato, tamanho e conteúdo
- **Campos obrigatórios:** Nome e email não podem ficar vazios
- **Unicidade:** Email deve ser único no sistema

**Interface de edição:**
- **Formulário intuitivo:** Campos claramente identificados
- **Preview de alterações:** Visualização antes de salvar
- **Validação em tempo real:** Feedback imediato
- **Confirmação de alterações:** Modal para mudanças críticas

**Regras de negócio:**
1. Alteração de email requer verificação por código enviado
2. Mudanças são salvas automaticamente após validação
3. Foto de perfil deve ser redimensionada automaticamente
4. Sistema deve confirmar alterações importantes
5. Dados editados devem refletir imediatamente nas sugestões de conteúdo
6. Histórico de alterações deve ser mantido para auditoria

---

#### RF062 - Configurações do Aplicativo

**Descrição:** Configurações de comportamento e preferências do aplicativo para personalização da experiência.

**Objetivos:** Fornecer controle sobre experiência personalizada, notificações e aspectos visuais do aplicativo.

**Premissas:** Usuário deve ter autonomia sobre configurações que afetam sua experiência de uso, respeitando limitações técnicas.

**Pré-condições:**
- Usuário deve estar autenticado
- Sistema de configurações deve estar operacional

**Configurações disponíveis:**
- **Notificações push:** Boolean, ativar/desativar notificações do sistema
- **Lembretes de estudo:** Boolean, notificações programadas para engajamento
- **Modo escuro/claro:** Dropdown, tema da interface (Auto/Claro/Escuro)
- **Tamanho da fonte:** Dropdown, acessibilidade (Pequena/Média/Grande)
- **Idioma:** Dropdown, se múltiplos idiomas disponíveis

**Configurações de notificação:**
- **Conclusão de trilha:** Boolean, alertas de marcos alcançados
- **Novas conquistas:** Boolean, celebração de achievements
- **Lembretes de estudo:** Boolean, incentivo à continuidade
- **Certificados aprovados:** Boolean, status de certificação
- **Horário preferido:** Time picker, para lembretes personalizados

**Configurações de privacidade:**
- **Compartilhar progresso:** Boolean, visibilidade para outros usuários
- **Dados de uso:** Boolean, coleta para melhorias do sistema
- **Analytics:** Boolean, participação em estatísticas anônimas

**Interface de configurações:**
- **Seções organizadas:** Agrupamento lógico de opções
- **Toggles intuitivos:** Switches claros para opções booleanas
- **Preview imediato:** Aplicação instantânea de mudanças visuais
- **Descrições contextuais:** Explicações sobre o que cada configuração faz

**Regras de negócio:**
1. Configurações devem ser salvas automaticamente
2. Notificações respeitam configurações do sistema operacional
3. Tema deve ser aplicado imediatamente à interface
4. Configurações devem ser sincronizadas entre dispositivos
5. Usuário deve poder resetar todas as configurações para padrão
6. Sistema deve respeitar leis de privacidade (LGPD)

---

#### RF063 - Meus Certificados

**Descrição:** Exibição e gerenciamento dos certificados obtidos pelo usuário.

**Objetivos:** Fornecer acesso fácil aos certificados para download, compartilhamento e acompanhamento de status.

**Premissas:** Usuário deve ter controle total sobre seus certificados com transparência sobre status de aprovação.

**Pré-condições:**
- Usuário deve ter pelo menos um certificado emitido
- Sistema de certificação deve estar operacional

**Informações por certificado:**
- **Status:** Badge visual (Pendente/Verificado/Rejeitado)
- **Data de emissão:** Date, quando foi gerado automaticamente
- **Data de aprovação:** Date, quando administrador aprovou
- **Média obtida:** Float, desempenho que gerou o certificado
- **Período de validade:** Date, se aplicável

**Funcionalidades disponíveis:**
- **Download PDF:** Certificado em formato PDF para impressão
- **Compartilhamento:** Envio por email ou redes sociais
- **Visualização prévia:** Preview antes do download
- **Histórico completo:** Todos os certificados emitidos
- **Link de verificação:** URL pública para validação

**Estados do certificado:**
- **Pendente:** Aguardando aprovação administrativa, marca d'água presente
- **Verificado:** Aprovado e válido oficialmente, sem marca d'água
- **Rejeitado:** Não aprovado com motivo explicativo

**Interface de certificados:**
- **Lista cronológica:** Certificados ordenados por data
- **Filtros por status:** Organização por situação atual
- **Ações rápidas:** Botões contextuais por certificado
- **Detalhes expandidos:** Informações completas em modal

**Regras de negócio:**
1. Certificados pendentes devem mostrar status de análise clara
2. Apenas certificados verificados devem permitir download oficial
3. Sistema deve manter histórico completo de todos os certificados
4. Download deve gerar log para auditoria
5. Certificados rejeitados devem mostrar motivo e orientações
6. Interface deve destacar certificados mais recentes

---

### 3.16. Sistema de Conquistas do Usuário

#### RF064 - Visualização de Conquistas Obtidas

**Descrição:** Exibição das conquistas obtidas pelo usuário durante o programa educacional.

**Objetivos:** Reconhecer marcos importantes no aprendizado e motivar engajamento contínuo.

**Premissas:** Conquistas devem celebrar progresso e incentivar continuidade através de gamificação positiva.

**Pré-condições:**
- Sistema de gamificação deve estar ativo
- Conquistas devem estar configuradas pelo administrador
- Usuário deve ter progresso registrado no sistema

**Interface de conquistas:**
- **Conquistas obtidas:** Grid com badges conquistadas
- **Conquistas disponíveis:** Objetivos possíveis com critérios
- **Progresso para próximas:** Barra de progresso com meta
- **Data de obtenção:** Timestamp de quando foi conquistada

**Categorias de conquistas:**
- **Trilhas:** "Primeira trilha concluída", "Todas as trilhas básicas"
- **Wiki:** "Primeira leitura", "Categoria completa lida"
- **Questões:** "Sequência de 10 acertos", "100 questões respondidas"
- **Certificação:** "Primeiro certificado", "Certificado com nota máxima"
- **Engajamento:** "Login por 7 dias consecutivos", "Primeiro quiz"

**Dados por conquista:**
- **Nome motivacional:** Título claro e celebrativo
- **Descrição:** Explicação do critério atendido
- **Ícone/badge:** Representação visual única
- **Data de obtenção:** Quando foi conquistada
- **Critério:** Como foi obtida
- **Raridade:** Indicador de dificuldade/exclusividade

**Funcionalidades:**
- **Notificação de nova conquista:** Alert imediato ao conquistar
- **Compartilhamento:** Redes sociais com imagem personalizada
- **Detalhes da conquista:** Modal com informações completas
- **Timeline de conquistas:** Histórico cronológico

**Regras de negócio:**
1. Conquistas devem ser concedidas automaticamente pelo sistema
2. Notificação deve aparecer imediatamente após conquista
3. Interface deve mostrar progresso claro para próximas conquistas
4. Conquistas devem ter descrições motivacionais e claras
5. Sistema deve destacar conquistas recentes visualmente
6. Deve haver conquistas para diferentes níveis de engajamento

---

### 3.17. Suporte e Ajuda

#### RF065 - Suporte e Ajuda

**Descrição:** Fornecer canais de suporte e informações de ajuda ao usuário.

**Objetivos:** Garantir que usuários tenham acesso fácil a suporte quando enfrentar dificuldades ou dúvidas sobre o sistema.

**Premissas:** Usuário deve ter múltiplas opções de suporte organizadas por categoria para resolução eficiente de problemas.

**Pré-condições:**
- Canais de suporte devem estar configurados
- FAQ deve estar atualizada e organizada

**Opções de suporte disponíveis:**
- **FAQ:** Perguntas frequentes organizadas por categorias
- **Chat com suporte:** Interface de atendimento (se disponível)
- **Email de contato:** Formulário estruturado de contato
- **Tutorial do app:** Guia interativo de uso

**Categorias de ajuda:**
- **Como usar o app:** Guias básicos de navegação e funcionalidades
- **Problemas técnicos:** Resolução de erros comuns e troubleshooting
- **Dúvidas sobre conteúdo:** Questões educacionais e pedagógicas
- **Certificados:** Processo de obtenção, validação e download
- **Conta e perfil:** Gerenciamento de dados pessoais e configurações

**Interface de suporte:**
- **Busca na FAQ:** Campo de busca para localizar respostas rapidamente
- **Categorias expandíveis:** Organização hierárquica de tópicos
- **Avaliação de respostas:** Sistema de feedback (Útil/Não útil)
- **Formulário de contato:** Campos estruturados para solicitações

**Funcionalidades:**
- **Busca inteligente:** Localização por palavras-chave
- **Sugestões relacionadas:** Artigos similares baseados na consulta
- **Escalabilidade:** Encaminhamento para atendimento humano
- **Histórico:** Registro de consultas anteriores

**Regras de negócio:**
1. FAQ deve ser organizada por categorias claras e intuitivas
2. Busca deve funcionar por palavras-chave e sinônimos
3. Tutorial deve ser acessível mesmo sem conexão à internet
4. Formulário de contato deve incluir informações do usuário automaticamente
5. Sistema deve registrar consultas mais frequentes para melhorias
6. Respostas devem ser claras, objetivas e direcionadas ao problema

---

### 3.18. Certificação do Estudante

#### RF066 - Solicitação Automática de Certificado

**Descrição:** Geração automática de solicitação de certificado quando usuário completa todos os requisitos educacionais.

**Objetivos:** Detectar automaticamente elegibilidade e gerar certificado inicial para análise administrativa.

**Premissas:** Sistema deve monitorar progresso e disparar certificação automaticamente sem intervenção manual.

**Pré-condições:**
- Usuário deve ter concluído todas as trilhas obrigatórias
- Critérios de aprovação devem ter sido atendidos
- Sistema de certificação deve estar operacional

**Critérios para geração automática:**
- **Todas as trilhas concluídas:** 100% de conclusão verificada
- **Média geral mínima:** 70% ou conforme configurado
- **Nenhuma trilha reprovada:** Todas devem estar aprovadas
- **Tempo mínimo de estudo:** Se configurado globalmente

**Processo automático:**
- **Verificação de elegibilidade:** Validação de todos os critérios
- **Geração de certificado "Não Verificado":** Certificado com marca d'água
- **Notificação ao usuário:** Alert sobre geração do certificado
- **Envio para análise administrativa:** Fila de aprovação

**Dados incluídos no certificado:**
- **Nome completo do usuário:** Conforme cadastro atual
- **Período de estudo:** Data início até conclusão da última trilha
- **Carga horária total:** Tempo acumulado de estudo
- **Média geral de aproveitamento:** Percentual consolidado
- **Data de conclusão:** Timestamp da última trilha

**Regras de negócio:**
1. Geração deve ser totalmente automática após conclusão da última trilha
2. Certificado inicial sempre tem status "Não Verificado"
3. Sistema deve validar todos os critérios antes de gerar
4. Usuário deve ser notificado imediatamente sobre geração
5. Processo não pode ser revertido pelo usuário
6. Sistema deve registrar timestamp exato da conclusão

---

#### RF067 - Visualização de Status do Certificado

**Descrição:** Permitir ao usuário acompanhar o status de análise e aprovação de seu certificado.

**Objetivos:** Fornecer transparência total sobre processo de validação do certificado.

**Premissas:** Usuário deve ter visibilidade completa do processo para gerenciar expectativas adequadamente.

**Pré-condições:**
- Certificado deve ter sido gerado automaticamente
- Sistema de acompanhamento deve estar ativo

**Estados possíveis do certificado:**
- **Não Verificado (Pendente):** Aguardando análise administrativa
- **Verificado (Aprovado):** Aprovado pelo administrador
- **Rejeitado:** Não aprovado com justificativa

**Informações exibidas:**
- **Status atual:** Badge visual com ícone e descrição
- **Data de geração:** Quando o certificado foi criado
- **Data de análise:** Quando foi analisado (se aplicável)
- **Administrador responsável:** Quem aprovou (quando aplicável)
- **Motivo de rejeição:** Explicação detalhada se rejeitado
- **Próximos passos:** Orientações claras para o usuário

**Interface de acompanhamento:**
- **Timeline do processo:** Visualização das etapas
- **Estimativa de análise:** Tempo médio de resposta
- **Notificações:** Alertas sobre mudanças de status
- **Ações disponíveis:** Contextuais conforme status

**Funcionalidades por status:**
- **Pendente:** Visualização com marca d'água, não oficial
- **Aprovado:** Download do PDF oficial, compartilhamento
- **Rejeitado:** Orientações para melhoria, nova tentativa se aplicável

**Regras de negócio:**
1. Status deve ser atualizado em tempo real
2. Usuário deve ser notificado sobre qualquer mudança
3. Certificado pendente deve ter marca d'água clara
4. Rejeições devem incluir orientações construtivas
5. Sistema deve mostrar histórico completo do processo
6. Interface deve ser clara sobre valor oficial do certificado

---

#### RF068 - Download de Certificado

**Descrição:** Permitir download do certificado em formato PDF com diferentes níveis de oficialidade.

**Objetivos:** Gerar PDFs profissionais adequados para apresentação em contextos profissionais.

**Premissas:** Sistema deve gerar documentos com qualidade profissional respeitando status de aprovação.

**Pré-condições:**
- Certificado deve estar gerado no sistema
- Template deve estar configurado
- Sistema de geração de PDF deve estar operacional

**Tipos de download disponíveis:**
- **PDF Não Verificado:** Com marca d'água "PENDENTE DE VERIFICAÇÃO"
- **PDF Verificado:** Oficial, sem marca d'água, com selo de aprovação

**Elementos do PDF:**
- **Cabeçalho:** Logo da instituição + nome
- **Título:** "Certificado de Conclusão - Descarte de Resíduos Médicos"
- **Corpo principal:** Nome do usuário + texto padrão + dados específicos
- **Dados incluídos:** Período, carga horária, aproveitamento
- **Rodapé:** Assinatura digital + data + status de verificação
- **QR Code:** Para validação online (se aprovado)

**Funcionalidades de download:**
- **Preview antes do download:** Visualização do documento final
- **Qualidade alta para impressão:** Resolução adequada
- **Download imediato:** Sem necessidade de processamento
- **Log de downloads:** Registro para auditoria

**Interface de download:**
- **Botão de download:** Contextual conforme status
- **Preview modal:** Visualização antes do download
- **Opções de compartilhamento:** Email, redes sociais
- **Instruções de uso:** Como utilizar o certificado

**Regras de negócio:**
1. Certificado não verificado deve ter marca d'água visível
2. Apenas certificados aprovados geram PDF oficial
3. Download deve ser registrado para auditoria
4. PDF deve manter qualidade para impressão profissional
5. Certificado deve incluir QR code para validação online
6. Sistema deve permitir downloads múltiplos

--- 

### 3.19. Gestão de Tags Administrativo

#### RF069 - Listagem de Tags

**Descrição:** Exibição e gerenciamento de todas as tags utilizadas no sistema com métricas de uso organizadas.

**Objetivos:** Permitir visualização consolidada de todas as tags do sistema para gestão e monitoramento de uso.

**Premissas:** Interface deve facilitar localização e análise de uso das tags para manutenção da taxonomia do sistema.

**Pré-condições:**
- Administrador deve estar logado com permissões adequadas
- Sistema de tags deve estar operacional

**Campos de busca e filtro:**
- **Busca por nome:** String, 100 caracteres máximo
- **Filtro por categoria:** Dropdown (Todas, Questões, Wiki, Geral, Trilhas)
- **Filtro por status:** Dropdown (Todas, Ativas, Inativas)
- **Filtro por uso:** Dropdown (Mais usadas, Menos usadas, Não utilizadas)
- **Ordenação:** Dropdown (Nome A-Z, Mais usadas, Criação recente)

**Configurações de paginação:**
- **Itens por página:** Dropdown (10, 20, 50), padrão 20
- **Ordenação:** Dropdown, padrão "Mais usadas DESC"

**Dados exibidos por tag:**
- **Nome da tag:** String com cor de identificação
- **Categoria:** Badge colorido
- **Hierarquia:** Indicador visual se é tag pai/filha
- **Uso total:** Integer (questões + artigos)
- **Status:** Toggle visual (Ativa/Inativa)
- **Criada em:** Date, formato DD/MM/AAAA
- **Última utilização:** Date relativa ("há 5 dias")
- **Administrador criador:** String

**Ações individuais:**
- **Editar:** Redirecionamento para formulário de edição
- **Ativar/Desativar:** Toggle de mudança de status
- **Ver relacionamentos:** Modal com conteúdos que usam a tag
- **Excluir:** Apenas tags não utilizadas

**Regras de negócio:**
1. Tags ordenadas por uso (mais utilizadas primeiro) como padrão
2. Tags inativas devem ser destacadas visualmente
3. Sistema deve mostrar contador total de resultados
4. Busca textual funciona no nome e descrição da tag
5. Interface deve destacar tags não utilizadas há mais de 90 dias

---

#### RF070 - Criar Nova Tag

**Descrição:** Criação de novas tags para categorização e organização de conteúdo educacional.

**Objetivos:** Permitir criação de tags padronizadas para manter taxonomia consistente do sistema.

**Premissas:** Sistema deve garantir unicidade e qualidade das tags para evitar duplicações e inconsistências.

**Pré-condições:**
- Administrador deve estar logado
- Sistema deve validar unicidade de nomes

**Campos obrigatórios:**
- **Nome da tag:** String, 50 caracteres máximo, único no sistema
- **Categoria:** Dropdown (Questões, Wiki, Geral, Trilhas)

**Campos opcionais:**
- **Descrição:** Text, 200 caracteres máximo, para clarificar uso
- **Cor de identificação:** Color picker, para diferenciação visual
- **Tag pai:** Dropdown, para hierarquia opcional (máximo 2 níveis)

**Campos automáticos:**
- **Status:** Boolean, padrão "Ativa"
- **Data de criação:** DateTime, timestamp atual
- **Administrador criador:** String, usuário logado

**Funcionalidades:**
- **Auto-complete:** Sugestões baseadas em tags existentes
- **Detecção de similaridade:** Alertas para nomes muito parecidos
- **Preview de cor:** Visualização da cor selecionada
- **Validação em tempo real:** Verificação de unicidade durante digitação

**Validações:**
- Nome único no sistema (case-insensitive)
- Sem caracteres especiais problemáticos
- Não pode começar ou terminar com espaços
- Máximo 50 caracteres para compatibilidade
- Tag pai não pode criar dependência circular

**Regras de negócio:**
1. Nome da tag deve ser único no sistema
2. Tags filhas herdam categoria da tag pai automaticamente
3. Sistema deve sugerir cor automática se não selecionada
4. Validação contínua de integridade referencial
5. Log de auditoria obrigatório para criação

---

#### RF071 - Editar Tag Existente

**Descrição:** Modificação de tags existentes com propagação automática de alterações para conteúdos associados.

**Objetivos:** Permitir atualização de tags mantendo integridade referencial em todo o sistema.

**Premissas:** Alterações devem ser propagadas automaticamente para preservar consistência da taxonomia.

**Pré-condições:**
- Tag deve existir no sistema
- Administrador deve ter permissões de edição

**Campos editáveis:**
- **Nome da tag:** String, com propagação automática
- **Descrição:** Text, 200 caracteres máximo
- **Cor de identificação:** Color picker
- **Categoria:** Dropdown, com validação de impacto
- **Tag pai:** Dropdown, respeitando hierarquia
- **Status:** Boolean (Ativa/Inativa)

**Processo de edição:**
- **Verificação de impacto:** Análise de conteúdos que usam a tag
- **Confirmação para alterações críticas:** Modal para mudanças que afetam >10 itens
- **Propagação automática:** Atualização em todos os conteúdos associados
- **Backup de segurança:** Snapshot antes de alterações críticas

**Validações específicas:**
- Nome único (exceto a própria tag)
- Verificação de impacto em conteúdos existentes
- Confirmação obrigatória para alterações em tags muito utilizadas
- Validação de hierarquia para evitar dependências circulares

**Regras de negócio:**
1. Alterações no nome propagam automaticamente para todo conteúdo
2. Mudança de categoria deve ser confirmada se afetar muitos itens
3. Sistema deve manter log de todas as alterações
4. Impossível alterar tag pai se criar dependência circular

---

#### RF072 - Sistema de Hierarquia de Tags

**Descrição:** Gestão de relacionamento hierárquico entre tags para organização taxonômica avançada.

**Objetivos:** Permitir criação de taxonomia estruturada com categorias principais e especificações detalhadas.

**Premissas:** Hierarquia deve ser limitada para evitar complexidade excessiva mantendo usabilidade.

**Pré-condições:**
- Tags pai e filha devem existir no sistema
- Sistema deve validar hierarquia continuamente

**Estrutura hierárquica:**
- **Nível 1 (Tags pai):** Categorias principais (ex: "Resíduos Biológicos")
- **Nível 2 (Tags filha):** Especificações (ex: "Sangue", "Tecidos")
- **Máximo 2 níveis:** Limitação para evitar complexidade excessiva

**Funcionalidades:**
- **Visualização de árvore:** Interface gráfica da hierarquia
- **Navegação hierárquica:** Expansão/colapso de categorias
- **Herança automática:** Tag filha herda categoria da tag pai
- **Validação de integridade:** Prevenção de dependências circulares

**Interface de gestão:**
- **Diagrama hierárquico:** Visualização em árvore das relações
- **Drag & drop:** Reorganização visual de hierarquia
- **Breadcrumb:** Navegação do caminho hierárquico

**Regras de negócio:**
1. Máximo 2 níveis de profundidade (Pai > Filha)
2. Tag filha herda automaticamente categoria da tag pai
3. Impossível criar dependências circulares
4. Exclusão de tag pai deve gerenciar tags filhas
5. Sistema deve sugerir reorganização de hierarquias órfãs

---

#### RF073 - Gestão Inteligente de Tags

**Descrição:** Funcionalidades avançadas para manutenção automática e otimização da taxonomia de tags.

**Objetivos:** Automatizar limpeza e manutenção da base de tags para manter qualidade da taxonomia.

**Premissas:** Sistema deve identificar problemas automaticamente e sugerir melhorias na organização das tags.

**Pré-condições:**
- Base de tags deve estar populada
- Algoritmos de similaridade devem estar ativos

**Funcionalidades inteligentes:**
- **Detecção de similaridade:** Algoritmo identifica tags muito parecidas
- **Merge automático:** Unificação de tags duplicadas ou similares
- **Limpeza automática:** Identificação de tags não utilizadas há >90 dias
- **Sugestões de categorização:** IA sugere categoria baseada no nome/uso

**Interface de gestão:**
- **Dashboard de qualidade:** Métricas de saúde da taxonomia
- **Alertas automáticos:** Notificações sobre problemas identificados
- **Assistente de merge:** Interface para unificar tags similares
- **Relatórios de limpeza:** Análise de tags candidatas à remoção

**Algoritmos implementados:**
- **Similaridade textual:** Distância Levenshtein para nomes parecidos
- **Análise de uso:** Padrões de utilização para sugerir merges
- **Clustering automático:** Agrupamento de tags relacionadas
- **Predição de categoria:** ML para sugerir categorização

**Regras de negócio:**
1. Sugestões devem ser aprovadas manualmente pelo administrador
2. Sistema deve manter backup antes de operações de merge
3. Tags não utilizadas há mais de 90 dias são candidatas à limpeza
4. Similaridade >85% gera alerta automático de possível duplicação
5. Merge de tags deve consolidar todas as referências

---

#### RF074 - Ações em Lote de Tags

**Descrição:** Operações em massa para gestão eficiente de múltiplas tags simultaneamente.

**Objetivos:** Otimizar produtividade administrativa através de operações em massa para grandes volumes de tags.

**Premissas:** Sistema deve permitir seleção múltipla e aplicação de ações padronizadas em lote.

**Pré-condições:**
- Múltiplas tags devem estar disponíveis para seleção
- Administrador deve ter permissões adequadas

**Funcionalidades em lote:**
- **Seleção múltipla:** Checkbox para ações em massa
- **Alteração de categoria:** Reclassificação múltipla
- **Ativação/Desativação em lote:** Gestão de status
- **Merge selecionadas:** Unificação de tags similares
- **Exclusão em massa:** Para tags não utilizadas

**Interface de seleção:**
- **Checkbox master:** "Selecionar todos" da página atual
- **Seleção por critérios:** Baseada em filtros aplicados
- **Contador de selecionados:** Feedback visual da quantidade
- **Pré-visualização de impacto:** Análise antes da execução

**Operações disponíveis:**
- **Alteração de categoria:** Dropdown para nova categoria
- **Mudança de status:** Ativar/desativar selecionadas
- **Aplicação de cor:** Color picker para uniformização
- **Definição de hierarquia:** Atribuição em massa de tag pai

**Funcionalidades de segurança:**
- **Confirmação obrigatória:** Modal de confirmação para ações críticas
- **Preview de impacto:** Análise de quantos conteúdos serão afetados
- **Log de operações:** Registro detalhado de todas as ações em lote
- **Rollback disponível:** Possibilidade de desfazer operações

**Regras de negócio:**
1. Máximo 100 tags selecionáveis por operação em lote
2. Confirmação obrigatória para operações que afetam >50 conteúdos
3. Log detalhado deve registrar todas as alterações realizadas
4. Sistema deve validar consistência antes de executar ações
5. Operações críticas devem ter rollback disponível por 24h

---

## 4. Requisitos Não Funcionais

### 4.1. Requisitos de Usabilidade

| ID     | Requisito                          | Descrição                                                                                     | Critérios de Aceitação                                                                                                                              | Métrica                        | Prioridade |
| ------ | ---------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ---------- |
| RNF001 | Interface Responsiva e Adaptável   | O sistema deve fornecer interfaces otimizadas para diferentes dispositivos e tamanhos de tela | • Aplicativo mobile adaptável a iOS e Android<br>• Elementos redimensionam proporcionalmente<br>• Textos legíveis em todas as resoluções            | -                              | Essencial  |
| RNF002 | Tempo de Aprendizagem da Interface | Usuários devem conseguir utilizar funcionalidades básicas sem treinamento extensivo           | Interface intuitiva para usuários iniciantes                                                                                                        | -                              | Importante |
| RNF003 | Navegação Intuitiva                | Sistema deve permitir navegação clara e consistente entre módulos                             | Navegação consistente em todos os módulos                                                                                                           | -                              | Essencial  |
| RNF004 | Acessibilidade                     | Interface deve seguir padrões de acessibilidade para profissionais de saúde                   | • Fontes grandes e legíveis<br>• Alto contraste visual<br>• Suporte a leitores de tela<br>• Navegação por teclado<br>• Ícones com texto alternativo | Conformidade WCAG 2.1 nível AA | Importante |
| RNF005 | Mensagens de Erro Claras           | Sistema deve fornecer feedback claro quando ações não podem ser realizadas                    | • Mensagens específicas sobre o problema<br>• Orientações de correção<br>• Linguagem não técnica                                                    | -                              | Importante |

### 4.2. Requisitos de Confiabilidade

| ID     | Requisito                  | Descrição                                                      | Critérios de Aceitação                                                                                             | Métrica          | Prioridade |
| ------ | -------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ---------------- | ---------- |
| RNF006 | Disponibilidade do Sistema | Sistema deve manter alta disponibilidade para suporte contínuo | Alta disponibilidade operacional                                                                                   | 99.8% uptime     | Essencial  |
| RNF007 | Recuperação de Falhas      | Sistema deve se recuperar automaticamente de falhas menores    | • Auto-restart de serviços<br>• Backup automático<br>• Sincronização de dados após reconexão                       | MTTR < 5 minutos | Importante |
| RNF008 | Integridade de Dados       | Sistema deve garantir consistência e precisão dos dados        | • Validação de entrada rigorosa<br>• Backup incremental diário<br>• Verificação de integridade automática          | 100% integridade | Essencial  |
| RNF009 | Tolerância a Falhas        | Sistema deve continuar operando mesmo com falhas parciais      | • Graceful degradation<br>• Modo offline para funcionalidades críticas<br>• Retry automático de operações falhadas | -                | Importante |

### 4.3. Requisitos de Desempenho

| ID     | Requisito                          | Descrição                                            | Critérios de Aceitação                                                                                                                                  | Métrica                         | Prioridade |
| ------ | ---------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | ---------- |
| RNF010 | Tempo de Resposta - Interface Web  | Plataforma administrativa deve responder rapidamente | Resposta rápida às interações dos administradores                                                                                                       | < 2 segundos                    | Importante |
| RNF011 | Performance do Aplicativo Mobile   | Aplicativo mobile deve oferecer experiência fluida   | Experiência responsiva no mobile                                                                                                                        | < 1 segundo (ações básicas)     | Importante |
| RNF012 | Capacidade de Usuários Simultâneos | Sistema deve suportar múltiplos usuários simultâneos | • Suporte mínimo a 100 usuários simultâneos<br>• Performance não degrada mais que 20% sob carga máxima<br>• Tempo de resposta dentro dos limites        | 100 usuários simultâneos        | Importante |

### 4.4. Requisitos de Compatibilidade

| ID     | Requisito                      | Descrição                                                 | Critérios de Aceitação                                                                                    | Métrica | Prioridade |
| ------ | ------------------------------ | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------- | ---------- |
| RNF013 | Compatibilidade Mobile         | Aplicativo deve ser compatível com versões atuais dos SOs | • iOS 12.0 ou superior<br>• Android 7.0 (API 24) ou superior<br>• Adaptável a diferentes tamanhos de tela | -       | Essencial  |
| RNF014 | Compatibilidade de Navegadores | Interface web deve funcionar nos principais navegadores   | • Chrome 90+<br>• Firefox 88+<br>• Safari 14+<br>• Edge 90+                                               | -       | Essencial  |
| RNF015 | Integração com APIs Externas   | Sistema deve integrar com serviços de terceiros           | • OpenAI para IA<br>• Serviços de email<br>• APIs de upload de arquivos                                   | -       | Importante |

### 4.5. Requisitos de Distribuição

| ID     | Requisito                  | Descrição                                      | Critérios de Aceitação                                                         | Métrica | Prioridade |
| ------ | -------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------ | ------- | ---------- |
| RNF018 | Arquitetura Distribuída    | Sistema deve ser escalável e distribuível      | • Arquitetura monorepo<br>• Load balancing<br>• Database scaling se necessário | -       | Importante |
| RNF019 | CDN para Conteúdo Estático | Conteúdo estático deve ser distribuído via CDN | • Imagens e arquivos via CDN<br>• Redução de latência<br>• Cache inteligente   | -       | Desejável  |

### 4.6. Requisitos de Adequação a Padrões

| ID     | Requisito                  | Descrição                                                               | Critérios de Aceitação                                                                                           | Métrica           | Prioridade |
| ------ | -------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------- | ---------- |
| RNF020 | Conformidade LGPD          | Sistema deve estar em conformidade com a Lei Geral de Proteção de Dados | • Consentimento explícito<br>• Direito ao esquecimento<br>• Anonimização de dados<br>• Relatórios de privacidade | 100% conformidade | Essencial  |
| RNF021 | Padrões de Desenvolvimento | Código deve seguir padrões de qualidade estabelecidos                   | • Clean Code practices<br>• Documentação técnica                                                                 | -                 | Importante |
| RNF022 | Padrões de API REST        | APIs devem seguir convenções REST                                       | • Métodos HTTP corretos<br>• Status codes apropriados<br>• Versionamento de API<br>• Documentação OpenAPI        | -                 | Importante |

### 4.8. Observações Gerais

1. **Priorização:** Requisitos marcados como "Essencial" devem ser implementados na primeira versão (MVP)
2. **Métricas:** Valores específicos devem ser validados em ambiente de produção
3. **Monitoramento:** Todos os requisitos de performance devem ter dashboards de acompanhamento
4. **Revisão:** Requisitos devem ser revisados trimestralmente para ajustes baseados no uso real
5. **Testes:** Cada requisito não funcional deve ter casos de teste específicos para validação

## 5. Requisitos de Segurança

### 5.1. Segurança de Autenticação e Autorização

| ID    | Perigo Identificado                              | Descrição do Risco                                                     | Soluções Implementadas                                                                                                                                      | Critérios de Aceitação                                                                                                       | Prioridade |
| ----- | ------------------------------------------------ | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------- |
| RS001 | Acesso não autorizado por credenciais fracas     | Usuários podem usar senhas fracas facilitando ataques de força bruta   | • Política de senha forte obrigatória<br>• Integração Google OAuth 2.0<br>• Rate limiting (5 tentativas por 15 min)<br>• Bloqueio temporário após falhas    | • Senhas: mín. 8 chars, maiúscula, minúscula, número<br>• Bloqueio automático funcional<br>• OAuth implementado corretamente | Essencial  |
| RS002 | Violação de controle de acesso RBAC              | Usuários podem acessar funcionalidades não autorizadas para seu perfil | • Sistema RBAC granular com 3 perfis<br>• Validação de permissões em cada operação<br>• Dados de role na sessão<br>• Middleware de autorização              | • Validação de role em 100% das operações<br>• Sessões com dados de perfil<br>• Testes de penetração aprovados               | Essencial  |
| RS003 | Sessões não expiradas permitindo acesso indevido | Sessões longas podem ser comprometidas                                 | • Timeout automático após 30 dias inatividade<br>• Renovação automática de sessão<br>• Logout forçado em múltiplos dispositivos<br>• Invalidação de cookies | • Sessão expira automaticamente<br>• Múltiplos dispositivos controlados<br>• Logout efetivo                                  | Importante |
| RS004 | Ataques de enumeração de usuários                | Atacantes podem descobrir usuários válidos                             | • Respostas padronizadas para login<br>• Mesma resposta para email válido/inválido<br>• Rate limiting por IP<br>• CAPTCHA após tentativas                   | • Impossível determinar usuários existentes<br>• Rate limiting funcional<br>• CAPTCHA implementado                           | Importante |

### 5.2. Segurança de Dados Pessoais (LGPD)

| ID    | Perigo Identificado                       | Descrição do Risco                                               | Soluções Implementadas                                                                                                                              | Critérios de Aceitação                                                                           | Prioridade |
| ----- | ----------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------- |
| RS005 | Vazamento de dados pessoais de estudantes | Exposição não autorizada de informações pessoais e profissionais | • Criptografia AES-256 em repouso<br>• TLS 1.3 para transmissão<br>• Anonimização para analytics<br>• Pseudonimização de logs                       | • Dados criptografados verificados<br>• TLS configurado corretamente<br>• Nenhum PII em logs     | Essencial  |
| RS006 | Não conformidade com LGPD                 | Violação de direitos dos titulares de dados                      | • Consentimento explícito coletado<br>• Direito ao esquecimento implementado<br>• Portabilidade de dados<br>• DPO nomeado<br>• Relatório de impacto | • Consentimento documentado<br>• Exclusão de dados funcional<br>• Exportação de dados disponível | Essencial  |
| RS007 | Retenção inadequada de dados              | Dados armazenados além do necessário                             | • Políticas de retenção automática<br>• Purga automática após 5 anos inatividade<br>• Classificação de dados por sensibilidade                      | • Purga automática funcional<br>• Dados classificados corretamente<br>• Políticas documentadas   | Importante |

### 5.3. Segurança de Aplicação Web

| ID    | Perigo Identificado               | Descrição do Risco                                            | Soluções Implementadas                                                                                                                    | Critérios de Aceitação                                                                           | Prioridade |
| ----- | --------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------- |
| RS008 | Ataques de injeção SQL            | Comprometimento da base de dados através de campos de entrada | • ORM/ODM para queries<br>• Prepared statements<br>• Validação rigorosa de entrada<br>• Sanitização de dados                              | • Nenhuma query SQL direta<br>• Validação em 100% inputs<br>• Testes de penetração passam        | Essencial  |
| RS009 | Cross-Site Scripting (XSS)        | Execução de scripts maliciosos no navegador                   | • Content Security Policy implementada<br>• Sanitização de saída<br>• Encoding de caracteres especiais<br>• Headers de segurança HTTP     | • CSP configurada corretamente<br>• Nenhum XSS em testes<br>• Headers implementados              | Essencial  |
| RS010 | Cross-Site Request Forgery (CSRF) | Execução de ações não autorizadas                             | • Tokens CSRF obrigatórios<br>• SameSite cookies configurados<br>• Verificação de origem<br>• Double submit cookies                       | • CSRF tokens funcionais<br>• Cookies configurados corretamente<br>• Verificação de origem ativa | Essencial  |
| RS011 | Exposição de APIs sem proteção    | Acesso não autorizado aos endpoints                           | • Rate limiting (100 req/min por usuário)<br>• Autenticação obrigatória<br>• Validação de entrada rigorosa<br>• Documentação de segurança | • Rate limiting funcional<br>• Todas APIs protegidas<br>• Documentação atualizada                | Essencial  |

### 5.4. Segurança de Conteúdo Educacional

| ID    | Perigo Identificado                                | Descrição do Risco                                       | Soluções Implementadas                                                                                                                              | Critérios de Aceitação                                                                    | Prioridade |
| ----- | -------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ---------- |
| RS012 | Modificação não autorizada de conteúdo educacional | Alteração maliciosa de trilhas, questões ou certificados | • Controle de versão de conteúdo<br>• Assinatura digital de certificados<br>• Log de auditoria detalhado<br>• Aprovação obrigatória para publicação | • Versionamento implementado<br>• Certificados assinados digitalmente<br>• Logs imutáveis | Essencial  |
| RS013 | Falsificação de certificados                       | Criação ou alteração fraudulenta de certificados         | • Watermarks digitais<br>• QR codes únicos com validação<br>• Hash SHA-256 dos certificados<br>• Registro em blockchain (desejável)                 | • QR code funcional<br>• Validação online disponível<br>• Hash verificável                | Essencial  |

### 5.6. Monitoramento e Auditoria

| ID    | Perigo Identificado                        | Descrição do Risco                                    | Soluções Implementadas                                                                                                                | Critérios de Aceitação                                                                        | Prioridade |
| ----- | ------------------------------------------ | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ---------- |
| RS014 | Falta de rastreabilidade de ações críticas | Impossibilidade de investigar incidentes de segurança | • Log de auditoria completo<br>• Timestamps UTC padronizados<br>• Logs imutáveis após criação<br>• Retenção de 2 anos mínimo          | • 100% ações críticas logadas<br>• Logs protegidos contra alteração<br>• Retenção configurada | Essencial  |
| RS015 | Detecção tardia de atividades suspeitas    | Ataques não detectados em tempo hábil                 | • SIEM implementado<br>• Alertas automáticos<br>• Análise comportamental<br>• Dashboard de segurança                                  | • Alertas em tempo real<br>• Dashboard funcional<br>• SIEM configurado                        | Importante |
| RS016 | Acesso não autorizado aos logs             | Manipulação de evidências por invasores               | • Logs centralizados em sistema dedicado<br>• Acesso restrito a super admin<br>• Criptografia de logs<br>• Verificação de integridade | • Acesso controlado<br>• Logs criptografados<br>• Integridade verificável                     | Importante |

### 5.7. Segurança Mobile

| ID    | Perigo Identificado                   | Descrição do Risco                                         | Soluções Implementadas                                                                                                                            | Critérios de Aceitação                                                  | Prioridade |
| ----- | ------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ---------- |
| RS021 | Armazenamento inseguro no dispositivo | Dados sensíveis expostos em dispositivos comprometidos     | • Keychain/Keystore para dados críticos<br>• Criptografia local obrigatória<br>• Não armazenar senhas localmente<br>• Auto-logout por inatividade | • Dados protegidos no dispositivo<br>• Testes de segurança mobile       | Essencial  |
| RS022 | Interceptação de comunicações         | Man-in-the-middle em redes públicas                        | • Certificate pinning implementado<br>• TLS 1.3 obrigatório<br>• Verificação de certificado<br>• Fallback seguro                                  | • Pinning funcionando<br>• TLS verificado<br>• Sem comunicação insegura | Essencial  |
| RS023 | Análise estática de código reverso    | Exposição de lógica sensível através de engenharia reversa | • Ofuscação de código<br>• Proteção de strings sensíveis<br>• Verificação de integridade do app<br>• Anti-debugging                               | • Código ofuscado<br>• Strings protegidas<br>• Proteções ativas         | Importante |

## 6. Matriz de Avaliação de Risco

### 6.1. Escala de Probabilidade

| Nível | Classificação | Descrição                                   | Frequência Esperada |
| ----- | ------------- | ------------------------------------------- | ------------------- |
| A     | Frequente     | Ocorre regularmente durante operação normal | > 1 vez por mês     |
| B     | Provável      | Pode ocorrer várias vezes durante operação  | 1 vez por trimestre |
| C     | Ocasional     | Pode ocorrer algumas vezes durante operação | 1 vez por semestre  |
| D     | Remoto        | Improvável, mas possível durante operação   | 1 vez por ano       |
| E     | Improvável    | Extremamente raro, quase impossível         | < 1 vez em 5 anos   |

### 6.2. Escala de Impacto/Severidade

| Nível | Classificação  | Descrição                                             | Consequências                                                                                                                 |
| ----- | -------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 1     | Catastrófico   | Falha completa do sistema, vazamento massivo de dados | • Sistema totalmente inoperante<br>• Violação LGPD grave<br>• Perda de confiança total<br>• Impacto legal severo              |
| 2     | Crítico        | Falha severa afetando funcionalidades principais      | • Módulos principais indisponíveis<br>• Perda parcial de dados<br>• Comprometimento da certificação<br>• Impacto na reputação |
| 3     | Marginal       | Impacto moderado, algumas funcionalidades afetadas    | • Degradação de performance<br>• Inconveniência aos usuários<br>• Funcionalidades secundárias afetadas                        |
| 4     | Insignificante | Impacto mínimo, não afeta operação principal          | • Pequenos bugs visuais<br>• Atrasos menores<br>• Impacto limitado aos usuários                                               |

### 6.3. Matriz de Risco (Probabilidade × Impacto)

| Probabilidade/Impacto | **Catastrófico (1)**            | **Crítico (2)**                 | **Marginal (3)**                | **Insignificante (4)**     |
| --------------------- | ------------------------------- | ------------------------------- | ------------------------------- | -------------------------- |
| **Frequente (A)**     | **EXTREMO**<br>Inaceitável      | **ALTO**<br>Ação imediata       | **MÉDIO**<br>Atenção necessária | **BAIXO**<br>Monitoramento |
| **Provável (B)**      | **EXTREMO**<br>Inaceitável      | **ALTO**<br>Ação imediata       | **MÉDIO**<br>Atenção necessária | **BAIXO**<br>Aceitável     |
| **Ocasional (C)**     | **ALTO**<br>Ação imediata       | **MÉDIO**<br>Atenção necessária | **MÉDIO**<br>Atenção necessária | **BAIXO**<br>Aceitável     |
| **Remoto (D)**        | **MÉDIO**<br>Atenção necessária | **MÉDIO**<br>Atenção necessária | **BAIXO**<br>Aceitável          | **BAIXO**<br>Aceitável     |
| **Improvável (E)**    | **BAIXO**<br>Aceitável          | **BAIXO**<br>Aceitável          | **BAIXO**<br>Aceitável          | **BAIXO**<br>Aceitável     |

### 6.4. Mapeamento dos Requisitos de Segurança

| ID do Requisito | Descrição do Risco (Original)                      | Prob. Original | Impacto Original | Prob. Reajustada | Impacto Reajustado | Nível de Risco |
| --------------- | -------------------------------------------------- | -------------- | ---------------- | ---------------- | ------------------ | -------------- |
| **RS001**       | Acesso não autorizado por credenciais fracas       | B              | 2                | **A**            | 2                  | **ALTO**       |
| **RS002**       | Violação de controle de acesso RBAC                | C              | 1                | **B**            | 1                  | **EXTREMO**    |
| **RS003**       | Sessões não expiradas permitindo acesso indevido   | C              | 2                | **B**            | 2                  | **ALTO**       |
| **RS004**       | Ataques de enumeração de usuários                  | B              | 3                | B                | 3                  | **MÉDIO**      |
| **RS005**       | Vazamento de dados pessoais de estudantes          | D              | 1                | **B**            | 1                  | **EXTREMO**    |
| **RS006**       | Não conformidade com LGPD                          | C              | 1                | **A**            | 1                  | **EXTREMO**    |
| **RS007**       | Retenção inadequada de dados                       | C              | 2                | C                | 2                  | **MÉDIO**      |
| **RS008**       | Ataques de injeção SQL                             | D              | 1                | **C**            | 1                  | **ALTO**       |
| **RS009**       | Cross-Site Scripting (XSS)                         | C              | 2                | **B**            | 2                  | **ALTO**       |
| **RS010**       | Cross-Site Request Forgery (CSRF)                  | C              | 2                | C                | 2                  | **MÉDIO**      |
| **RS011**       | Exposição de APIs sem proteção                     | B              | 2                | **A**            | 2                  | **ALTO**       |
| **RS012**       | Modificação não autorizada de conteúdo educacional | D              | 1                | **C**            | 1                  | **ALTO**       |
| **RS013**       | Falsificação de certificados                       | D              | 1                | D                | 1                  | **MÉDIO**      |
| **RS014**       | Falta de rastreabilidade de ações críticas         | C              | 2                | **B**            | 2                  | **ALTO**       |
| **RS015**       | Detecção tardia de atividades suspeitas            | C              | 3                | **B**            | 2                  | **ALTO**       |
| **RS016**       | Acesso não autorizado aos logs                     | D              | 2                | C                | 2                  | **MÉDIO**      |
| **RS021**       | Armazenamento inseguro no dispositivo mobile       | B              | 2                | **A**            | 2                  | **ALTO**       |
| **RS022**       | Interceptação de comunicações mobile               | C              | 2                | **B**            | 2                  | **ALTO**       |
| **RS023**       | Análise estática de código reverso mobile          | C              | 3                | C                | **2**              | **MÉDIO**      |
## 7. Matriz de Rastreabilidade

### 7.1. Legenda

- **R** = Relacionado: Requisitos que interagem ou compartilham funcionalidades
- **D** = Dependente: Requisito A depende do Requisito B para funcionar corretamente
- **-** = Sem relacionamento direto significativo

### 7.2. Matriz de Rastreabilidade Principal (RF001-RF037)

| ID        | RF001 | RF002 | RF003 | RF004 | RF005 | RF006 | RF007 | RF008 | RF009 | RF010 | RF011 | RF012 | RF013 | RF014 | RF015 | RF016 | RF017 | RF018 | RF019 | RF020 | RF021 | RF022 | RF023 | RF024 | RF025 | RF026 | RF027 | RF028 | RF029 | RF030 | RF031 | RF032 | RF033 | RF034 | RF035 | RF036 | RF037 |
| --------- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- |
| **RF001** | -     | D     | R     | R     | R     | D     | D     | D     | D     | D     | D     | D     | D     | D     | D     | D     | D     | D     | D     | D     | D     | D     | D     | D     | D     | D     | D     | D     | D     | D     | D     | D     | D     | D     | D     | D     | D     |
| **RF002** | D     | -     | R     | R     | R     | D     | D     | D     | D     | D     | D     | D     | D     | D     | D     | D     | D     | D     | D     | D     | D     | D     | D     | D     | D     | D     | D     | D     | D     | D     | D     | D     | D     | D     | D     | D     | D     |
| **RF003** | D     | R     | -     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF004** | D     | R     | R     | -     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF005** | D     | R     | R     | R     | -     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF006** | D     | D     | R     | R     | R     | -     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF007** | D     | D     | R     | R     | R     | R     | -     | D     | D     | D     | D     | D     | D     | D     | D     | D     | D     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | R     | R     | R     | R     | R     | R     | R     |
| **RF008** | D     | D     | R     | R     | R     | R     | D     | -     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | R     | R     | R     | R     | R     | R     | R     |
| **RF009** | D     | D     | R     | R     | R     | R     | D     | R     | -     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | R     | R     | R     | R     | R     | R     | R     |
| **RF010** | D     | D     | R     | R     | R     | R     | D     | R     | R     | -     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | R     | R     | R     | R     | R     | R     | R     |
| **RF011** | D     | D     | R     | R     | R     | R     | D     | R     | R     | R     | -     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | R     | R     | R     | R     | R     | R     | R     |
| **RF012** | D     | D     | R     | R     | R     | R     | D     | R     | R     | R     | R     | -     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | R     | R     | R     | R     | R     | R     | R     |
| **RF013** | D     | D     | R     | R     | R     | R     | D     | D     | D     | D     | D     | D     | -     | D     | D     | D     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF014** | D     | D     | R     | R     | R     | R     | D     | D     | D     | D     | D     | D     | D     | -     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF015** | D     | D     | R     | R     | R     | R     | D     | D     | D     | D     | D     | D     | D     | R     | -     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF016** | D     | D     | R     | R     | R     | R     | D     | D     | D     | D     | D     | D     | D     | R     | R     | -     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF017** | D     | D     | R     | R     | R     | R     | D     | D     | D     | D     | D     | D     | R     | R     | R     | R     | -     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF018** | D     | D     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | -     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF019** | D     | D     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | -     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF020** | D     | D     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | D     | -     | R     | R     | R     | R     | D     | D     | D     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF021** | D     | D     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | D     | R     | -     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF022** | D     | D     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | D     | R     | R     | -     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF023** | D     | D     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | D     | R     | R     | R     | -     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF024** | D     | D     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | D     | R     | R     | R     | R     | -     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF025** | D     | D     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | R     | R     | R     | R     | -     | D     | D     | D     | D     | D     | D     | D     | R     | R     | R     | R     | R     |
| **RF026** | D     | D     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | R     | R     | R     | R     | D     | -     | D     | R     | R     | D     | R     | R     | R     | R     | R     | R     | R     |
| **RF027** | D     | D     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | R     | R     | R     | R     | D     | D     | -     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF028** | D     | D     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | R     | R     | -     | R     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF029** | D     | D     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | D     | R     | R     | -     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF030** | D     | D     | R     | R     | R     | R     | D     | D     | D     | D     | D     | D     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | D     | R     | R     | R     | -     | R     | R     | R     | R     | R     | R     | R     |
| **RF031** | D     | D     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | R     | R     | R     | R     | R     | -     | R     | R     | R     | R     | R     | R     |
| **RF032** | D     | D     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | R     | R     | R     | R     | R     | R     | -     | R     | R     | R     | R     | R     |
| **RF033** | D     | D     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | -     | D     | D     | R     | R     |
| **RF034** | D     | D     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | -     | R     | R     | R     |
| **RF035** | D     | D     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | R     | -     | R     | R     |
| **RF036** | D     | D     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | -     | D     |
| **RF037** | D     | D     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | -     |

### 7.3. Matriz de Rastreabilidade Expandida (RF038-RF074)

| ID        | RF038 | RF039 | RF040 | RF041 | RF042 | RF043 | RF044 | RF045 | RF046 | RF047 | RF048 | RF049 | RF050 | RF051 | RF052 | RF053 | RF054 | RF055 | RF056 | RF057 | RF058 | RF059 | RF060 | RF061 | RF062 | RF063 | RF064 | RF065 | RF066 | RF067 | RF068 | RF069 | RF070 | RF071 | RF072 | RF073 | RF074 |
| --------- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- |
| **RF001** | D     | D     | D     | D     | D     | D     | D     | D     | D     | D     | D     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | D     | D     | D     | D     | D     |
| **RF002** | D     | D     | D     | D     | D     | D     | D     | D     | D     | D     | D     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | D     | D     | D     | D     | D     |
| **RF003** | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF004** | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF005** | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF006** | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF007** | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | D     | D     | D     | D     | D     |
| **RF008** | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | D     | D     | D     | D     | D     |
| **RF009** | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | D     | D     | D     | D     | D     |
| **RF010** | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | D     | D     | D     | D     | D     |
| **RF011** | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | D     | D     | D     | D     | D     |
| **RF012** | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | D     | D     | D     | D     | D     |
| **RF013** | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF014** | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF015** | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF016** | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF017** | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF018** | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | D     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF019** | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | D     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF020** | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | D     | D     | D     | D     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF021** | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | D     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF022** | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | D     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF023** | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF024** | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF025** | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | R     | R     | D     | D     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | D     | D     | D     | D     | D     |
| **RF026** | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | R     | R     | D     | D     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | D     | D     | D     | D     | D     |
| **RF027** | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | R     | R     | D     | D     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF028** | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | R     | R     | D     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF029** | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | R     | R     | D     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF030** | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | D     | D     | D     | D     | D     |
| **RF031** | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF032** | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF033** | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF034** | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF035** | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF036** | D     | D     | D     | R     | R     | R     | R     | R     | R     | D     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | D     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF037** | -     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF038** | R     | -     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF039** | R     | R     | -     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF040** | R     | R     | R     | -     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF041** | R     | R     | R     | R     | -     | D     | D     | R     | D     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF042** | R     | R     | R     | R     | D     | -     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF043** | R     | R     | R     | R     | R     | R     | -     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF044** | R     | R     | R     | R     | R     | R     | R     | -     | R     | R     | D     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF045** | R     | R     | R     | R     | R     | R     | R     | R     | -     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | R     | R     | R     | R     | R     | R     |
| **RF046** | R     | R     | R     | R     | D     | R     | R     | R     | R     | -     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF047** | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | -     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | R     | R     | D     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF048** | R     | R     | R     | R     | R     | R     | R     | D     | R     | R     | R     | -     | R     | R     | R     | D     | D     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF049** | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | -     | R     | D     | D     | D     | D     | D     | D     | D     | D     | D     | D     | D     | D     | D     | D     | D     | D     | D     | R     | R     | R     | R     | R     | R     |
| **RF050** | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | -     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF051** | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | R     | -     | R     | R     | R     | R     | R     | R     | R     | D     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF052** | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | R     | D     | -     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF053** | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | R     | R     | R     | -     | D     | D     | D     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF054** | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | R     | R     | R     | D     | -     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF055** | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | R     | R     | R     | D     | R     | -     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF056** | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | R     | R     | R     | D     | R     | R     | -     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF057** | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | R     | R     | R     | D     | R     | R     | R     | -     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF058** | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | R     | R     | R     | R     | R     | R     | R     | R     | -     | D     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF059** | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | R     | R     | R     | R     | R     | R     | R     | R     | D     | -     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF060** | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | R     | D     | R     | R     | R     | R     | R     | R     | R     | R     | -     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF061** | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | -     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF062** | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | -     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF063** | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | -     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF064** | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | -     | R     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF065** | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | -     | R     | R     | R     | R     | R     | R     | R     | R     |
| **RF066** | R     | R     | R     | R     | R     | R     | R     | D     | R     | R     | R     | R     | D     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | -     | R     | R     | R     | R     | R     | R     | R     |
| **RF067** | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | R     | R     | D     | -     | R     | R     | R     | R     | R     | R     |
| **RF068** | R     | R     | R     | R     | R     | R     | R     | R     | D     | R     | R     | R     | D     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | R     | R     | R     | D     | -     | R     | R     | R     | R     | R     |
| **RF069** | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | -     | D     | D     | D     | D     |
| **RF070** | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | -     | R     | R     | R     |
| **RF071** | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | R     | -     | R     | R     |
| **RF072** | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | R     | R     | -     | R     |
| **RF073** | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | R     | R     | R     | -     |
| **RF074** | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | R     | D     | R     | R     | R     | R     |
