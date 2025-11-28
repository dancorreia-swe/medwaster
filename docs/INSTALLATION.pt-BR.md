# Guia de Instalação e Configuração do MedWaster

Este guia fornece instruções detalhadas para configurar, ajustar e implantar o MedWaster.

## Índice
- [Pré-requisitos](#pré-requisitos)
- [Início Rápido](#início-rápido)
- [Configuração de Ambiente (.env)](#configuração-de-ambiente-env)
- [Modos de Implantação](#modos-de-implantação)
- [Gerenciamento de Banco de Dados](#gerenciamento-de-banco-de-dados)
- [Configuração do App Mobile](#configuração-do-app-mobile)
- [Solução de Problemas](#solução-de-problemas)

## Pré-requisitos

- **Docker** e **Docker Compose** (v2.0+)
- **Bun** (opcional, para desenvolvimento local fora do Docker)
- **Git**

## Início Rápido

### Opção 1: Script Automatizado (Recomendado)

```bash
curl -fsSL https://raw.githubusercontent.com/dancorreia-swe/medwaster/main/install.sh | bash
```

### Opção 2: Instalação Manual

1.  **Clonar o repositório:**
    ```bash
    git clone https://github.com/dancorreia-swe/medwaster.git
    cd medwaster
    ```

2.  **Configurar Ambiente:**
    ```bash
    cp .env.example .env
    ```

3.  **Configurar `.env`** (Veja [Configuração de Ambiente](#configuração-de-ambiente-env) abaixo).

4.  **Iniciar Serviços:**
    ```bash
    docker compose up -d
    ```

## Configuração de Ambiente (.env)

O arquivo `.env` é a configuração central para toda a stack. Abaixo está uma referência detalhada para todas as variáveis disponíveis.

### 🔑 Segredos de Segurança Críticos
Estes **DEVEM** ser alterados para produção.

| Variável | Descrição |
|----------|-----------|
| `BETTER_AUTH_SECRET` | Chave secreta para tokens JWT e sessões. Gere com `openssl rand -base64 32`. |
| `AUDIT_CHECKSUM_SECRET` | Chave secreta para proteção dos logs de auditoria. Gere com `openssl rand -base64 32`. |
| `NODE_ENV` | Defina como `production` para implantação, `development` para trabalho local. |

### 🌐 Domínio e Modo de Implantação

| Variável | Descrição |
|----------|-----------|
| `DOMAIN` | Seu nome de domínio (ex: `exemplo.com`) ou `localhost` para dev local. |
| `LETSENCRYPT_EMAIL` | Email para registro do certificado SSL (obrigatório se usar modo Proxy). |
| `LOCALAI_HOST` | Hostname para LocalAI se usado (ex: `medwaster.ai.lan`). |

### 🧠 Configuração de IA (Mais Fácil vs. Auto-Hospedado)

O MedWaster suporta múltiplos provedores de IA.

#### Opção A: OpenAI (Mais Fácil e Confiável)
A maneira mais simples de começar.

| Variável | Valor |
|----------|-------|
| `AI_PROVIDER` | `openai` |
| `OPENAI_API_KEY` | **[OBRIGATÓRIO]** Sua chave da API OpenAI (`sk-...`). |
| `OPENAI_BASE_URL` | Endpoint da API. Padrão: `https://api.openai.com/v1`. |
| `AI_CHAT_MODEL` | `gpt-4o` (Recomendado) ou `gpt-3.5-turbo`. |
| `AI_EMBEDDING_MODEL` | `text-embedding-3-small`. |
| `AI_TRANSCRIPTION_MODEL` | `whisper-1`. |

#### Opção B: Ollama (Leve e Auto-Hospedado)
Roda localmente. Bom para hardware moderno.

1.  Inicie os serviços: `docker compose --profile ollama --profile whisper up -d`
2.  Baixe os modelos: `docker exec -it medwaster-ollama ollama pull qwen3`

| Variável | Valor |
|----------|-------|
| `AI_PROVIDER` | `ollama` |
| `OLLAMA_BASE_URL` | `http://ollama:11434/v1` |
| `AI_CHAT_MODEL` | `qwen3` (ou `llama3.3`). **Não** adicione o prefixo `ollama:`. |
| `AI_EMBEDDING_MODEL` | `nomic-embed-text` |

#### Opção C: LocalAI (Pesado e Auto-Hospedado)
Para servidores com GPU dedicada.

| Variável | Valor |
|----------|-------|
| `AI_PROVIDER` | `localai` |
| `LOCALAI_BASE_URL` | `http://localai:8080/v1` |

### 🔐 Autenticação e OAuth
Configure provedores de login externos.

| Variável | Descrição |
|----------|-----------|
| `GOOGLE_CLIENT_ID` | Client ID do Console Google Cloud para "Entrar com Google". |
| `GOOGLE_CLIENT_SECRET` | Client Secret do Console Google Cloud. |

**Nota:** Para Google OAuth, garanta que sua URI de redirecionamento no Console Google corresponda a: `${BETTER_AUTH_URL}/api/auth/callback/google`.

### 📧 Email (SMTP)
Obrigatório para redefinição de senha e notificações.

| Variável | Descrição |
|----------|-----------|
| `SMTP_HOST` | Seu servidor SMTP (ex: `smtp.gmail.com`). |
| `SMTP_PORT` | Porta (geralmente `587` ou `465`). |
| `SMTP_USER` | Usuário/Email SMTP. |
| `SMTP_PASS` | Senha SMTP (use Senha de App para Gmail). |
| `SMTP_FROM_ADDRESS` | Endereço de email do remetente. |

### 💾 Armazenamento (MinIO/S3)
O MedWaster inclui MinIO para armazenamento de objetos (compatível com S3).

| Variável | Descrição |
|----------|-----------|
| `S3_ENDPOINT` | `http://minio:9000` (rede interna Docker) ou URL do seu provedor S3. Usado pelo servidor para enviar arquivos. |
| `PUBLIC_S3_ENDPOINT` | **(Opcional)** URL externa para downloads de clientes. Use quando `S3_ENDPOINT` for interno (ex: `http://minio:9000`) mas clientes precisam de acesso externo (ex: `http://192.168.1.100:9000`). Usa `S3_ENDPOINT` como fallback se não definido. |
| `MINIO_ROOT_USER` | Usuário admin do console MinIO. |
| `MINIO_ROOT_PASSWORD` | Senha admin do console MinIO. |
| `S3_BUCKET_*` | Nomes para vários buckets de armazenamento (questions, wiki, etc.). |

**Quando usar `PUBLIC_S3_ENDPOINT`:**
- **Implantações Docker**: Defina para IP/domínio externo (ex: `http://192.168.1.100:9000`) enquanto `S3_ENDPOINT` permanece `http://minio:9000`
- **Configurações de servidor único**: Deixe vazio ou defina igual a `S3_ENDPOINT`
- **Produção com CDN**: Defina para a URL do seu CDN

### 🗄️ Banco de Dados (PostgreSQL)

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | String de conexão. Padrão: `postgresql://postgres:password@postgres:5432/medwaster`. |
| `POSTGRES_PASSWORD` | Senha root do banco. **Altere para produção.** |

### 🏗️ Portas de Infraestrutura
Portas expostas na máquina host.

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `WEB_HOST_PORT` | `3000` | Acesso ao Frontend. |
| `SERVER_HOST_PORT` | `4000` | Acesso à API Backend. |
| `MINIO_CONSOLE_PORT` | `9001` | Admin UI do MinIO. |

---

## Modos de Implantação

### Modo 1: Porta Direta (Simples / Local)
Ótimo para testes. Acesse serviços diretamente via portas.

- **Iniciar:** `docker compose up -d`
- **Web:** `http://localhost:3000`
- **API:** `http://localhost:4000`
- **Config:** Defina `VITE_SERVER_URL=http://localhost:4000`

### Modo 2: Proxy Reverso (Produção / HTTPS)
Usa Caddy para gerenciar SSL e roteamento.

- **Iniciar:** `docker compose --profile proxy up -d`
- **Web:** `https://seudominio.com`
- **API:** `https://seudominio.com/api`
- **Config:**
  - `DOMAIN=seudominio.com`
  - `VITE_SERVER_URL=https://seudominio.com/api`
  - `BETTER_AUTH_URL=https://seudominio.com`

## Gerenciamento de Banco de Dados

As migrações rodam automaticamente na inicialização. Para gerenciar manualmente:

```bash
# Rodar migrações
docker compose exec server bun run db:migrate

# Popular dados iniciais (Usuário Admin, etc.)
docker compose exec server bun run db:seed

# Abrir Database Studio (GUI)
docker compose exec server bun db:studio
```

**Usuário Admin Inicial:**
Configurado via `ADMIN_EMAIL` e `ADMIN_PASSWORD` no `.env`.

## Configuração do App Mobile

O app mobile (`apps/native`) usa Expo.

1.  Navegue para `apps/native`.
2.  Crie o `.env`:
    ```env
    EXPO_PUBLIC_SERVER_URL=https://seudominio.com/api
    ```
3.  Execute:
    ```bash
    bun install
    bun start
    ```

## Solução de Problemas

-   **Serviços Unhealthy?** Verifique logs: `docker compose logs -f`.
-   **Erros de IA?** Verifique `OPENAI_API_KEY` ou veja se o container Ollama está rodando.
-   **Email falhando?** Verifique credenciais SMTP. Gmail requer "Senhas de App".
