# MedWaster - Guia de Instalação

Guia completo para hospedar o MedWaster usando Docker Compose.

## Índice

- [Pré-requisitos](#pré-requisitos)
- [Início Rápido](#início-rápido)
- [Modos de Implantação](#modos-de-implantação)
- [Configuração](#configuração)
- [Migrações do Banco de Dados](#migrações-do-banco-de-dados)
- [Aplicativo Mobile](#aplicativo-mobile)
- [Gerenciamento](#gerenciamento)
- [Backup e Restauração](#backup-e-restauração)
- [Solução de Problemas](#solução-de-problemas)

## Pré-requisitos

Antes de começar, você precisa ter instalado:

- **Docker** (versão 20.10 ou superior)
- **Docker Compose** (versão 2.0 ou superior)
- **Domínio** (opcional, apenas para modo com proxy reverso e SSL)
- **Servidor SMTP** (para funcionalidades de email)
- **Chave API OpenAI** ou instância LocalAI (para recursos de IA)

## Início Rápido

### Opção 1: Script Automatizado (Recomendado)

Baixe e execute o script de configuração automática:

```bash
# Instalar diretamente via curl
curl -fsSL https://raw.githubusercontent.com/dancorreia-swe/medwaster/main/install.sh | bash

# Ou se você já clonou o repositório
./install.sh
```

Este script baixará o `docker-compose.yml` mais recente e preparará o ambiente.

### Opção 2: Instalação Manual

#### 1. Clone o Repositório

```bash
git clone <url-do-repositorio>
cd medwaster
```

#### 2. Configure as Variáveis de Ambiente

```bash
cp .env.example .env
```

#### 3. Edite o Arquivo `.env`

Você **deve** alterar os seguintes valores:

```bash
# Gerar secrets seguros (execute no terminal)
openssl rand -base64 32  # Use para BETTER_AUTH_SECRET
openssl rand -base64 32  # Use para AUDIT_CHECKSUM_SECRET

# Editar no arquivo .env
BETTER_AUTH_SECRET=cole_o_secret_gerado_aqui
AUDIT_CHECKSUM_SECRET=cole_o_secret_gerado_aqui
OPENAI_API_KEY=sua_chave_openai_aqui

# Armazenamento MinIO/S3 (usa os defaults do MinIO do Docker)
S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY=${MINIO_ROOT_USER}
S3_SECRET_ACCESS_KEY=${MINIO_ROOT_PASSWORD}
S3_BUCKET_QUESTIONS=questions
S3_BUCKET_WIKI=wiki
S3_BUCKET_AVATARS=avatars
S3_BUCKET_ACHIEVEMENTS=achievements
S3_BUCKET_CERTIFICATES=certificates

# LocalAI (IA auto-hospedada, compatível com OpenAI)
AI_PROVIDER=localai          # defina se quiser usar o LocalAI
LOCALAI_BASE_URL=http://localai:8080/v1
LOCALAI_API_KEY=              # preencha somente se configurar chave no LocalAI
```

**Opcional para produção** (recomendado):
```bash
POSTGRES_PASSWORD=mude_senha_padrao
MINIO_ROOT_PASSWORD=mude_senha_padrao
```

### 4. Inicie os Serviços

```bash
docker compose up -d

# Opcional: iniciar LocalAI (API compatível com OpenAI)
docker compose --profile ai up -d localai

# Adicionar modelos no LocalAI em execução
docker compose --profile ai exec localai sh -c "cd /models && curl -L <url-do-modelo> -o <nome-modelo>.gguf"
```

### 5. Execute as Migrações do Banco de Dados

```bash
docker compose exec server bun run db:migrate
```

### 6. Acesse a Aplicação

- **Aplicação Web**: http://localhost:3000
- **API**: http://localhost:4000
- **Console MinIO**: http://localhost:9001 (usuário: minio, senha: minio123)

🎉 **Pronto!** Sua instalação do MedWaster está funcionando!

---

## Modos de Implantação

O MedWaster pode ser implantado em dois modos diferentes:

### Modo 1: Acesso Direto por Porta (Simples)

**Melhor para:** Desenvolvimento local, testes ou auto-hospedagem simples

```bash
# Iniciar todos os serviços
docker compose up -d

# Verificar status
docker compose ps

# Ver logs
docker compose logs -f
```

**Acessar:**
- Aplicação Web: http://localhost:3000
- API: http://localhost:4000
- Console MinIO: http://localhost:9001
- PostgreSQL: localhost:5432

**Configuração no `.env`:**
```env
DOMAIN=localhost
BETTER_AUTH_URL=http://localhost:4000
CORS_ORIGIN=http://localhost:3000
VITE_SERVER_URL=http://localhost:4000
```

### Modo 2: Proxy Reverso com Caddy (Produção)

**Melhor para:** Implantações em produção com HTTPS automático

```bash
# Iniciar todos os serviços incluindo Caddy
docker compose --profile proxy up -d
```

**Acessar:**
- Tudo: https://seudominio.com
- API: https://seudominio.com/api

**Configuração no `.env`:**
```env
DOMAIN=seudominio.com
LETSENCRYPT_EMAIL=admin@seudominio.com
BETTER_AUTH_URL=https://seudominio.com
CORS_ORIGIN=https://seudominio.com
VITE_SERVER_URL=https://seudominio.com/api
```

**Nota:** Certifique-se de que o registro DNS A do seu domínio aponta para o IP do seu servidor antes de iniciar. O Caddy obterá e renovará automaticamente os certificados SSL do Let's Encrypt.

---

## Configuração

### Serviços Incluídos

A configuração do Docker Compose inclui:

**Infraestrutura:**
- PostgreSQL 18 com extensão pgvector (banco de dados vetorial para IA)
- Redis (cache e fila de jobs)
- MinIO (armazenamento de objetos compatível com S3)

**Aplicações:**
- API do Servidor (backend Elysia na porta 4000)
- Worker do Servidor (processamento de jobs em segundo plano)
- Frontend Web (SPA React na porta 3000)

**Opcional (com `--profile proxy`):**
- Caddy (proxy reverso com HTTPS automático)

**Opcional (com `--profile ai`):**
- LocalAI (API compatível com OpenAI, auto-hospedada)

### Usando LocalAI (IA auto-hospedada)

1) Baixe ou copie modelos GGUF para `./localai/models` (montado no container LocalAI).  
2) No `.env`, defina:  
   - `AI_PROVIDER=localai`  
   - `LOCALAI_BASE_URL=http://localai:8080/v1` (padrão do docker-compose)  
   - `LOCALAI_API_KEY=` (apenas se você configurar chave no LocalAI)  
3) Suba o LocalAI: `docker compose --profile ai up -d localai`  
4) Deixe `OPENAI_API_KEY` vazio ao usar LocalAI para evitar chamadas externas.

Guia de modelos do LocalAI (URLs e opções): https://localai.io/models/

### Variáveis de Ambiente Principais

#### Obrigatórias

```bash
# Autenticação
BETTER_AUTH_SECRET=        # Secret para tokens JWT
BETTER_AUTH_URL=           # URL base do serviço de autenticação
CORS_ORIGIN=              # Origens CORS permitidas

# Banco de Dados
DATABASE_URL=              # String de conexão PostgreSQL

# IA
OPENAI_API_KEY=           # Chave API OpenAI (se usar OpenAI)

# Segurança
AUDIT_CHECKSUM_SECRET=    # Secret para checksums de logs de auditoria
```

#### Opcionais

```bash
# OAuth
GOOGLE_CLIENT_ID=         # ID do cliente Google OAuth
GOOGLE_CLIENT_SECRET=     # Secret do cliente Google OAuth

# Email (SMTP)
SMTP_HOST=                # Servidor SMTP
SMTP_PORT=587             # Porta SMTP
SMTP_USER=                # Usuário SMTP
SMTP_PASS=                # Senha SMTP
SMTP_FROM=                # Endereço de email remetente

# LocalAI (alternativa ao OpenAI)
LOCALAI_BASE_URL=         # URL base da instância LocalAI
AI_PROVIDER=localai       # Alterar para usar LocalAI
```

---

## Migrações do Banco de Dados

Execute as migrações após a primeira inicialização:

```bash
# Executar migrações
docker compose exec server bun run db:migrate

# Opcional: Popular banco com dados de exemplo
docker compose exec server bun run db:seed
```

---

## Aplicativo Mobile

O aplicativo mobile (`apps/native`) é implantado separadamente usando o Expo:

```bash
cd apps/native

# Configurar URL do backend
echo "EXPO_PUBLIC_SERVER_URL=https://seudominio.com/api" > .env

# Build e submissão para lojas de aplicativos
npx eas build --platform all
npx eas submit --platform all
```

Para mais detalhes, consulte a [documentação do Expo EAS](https://docs.expo.dev/eas/).

---

## Gerenciamento

### Atualizar sua Implantação

```bash
# Baixar últimas alterações
git pull

# Reconstruir e reiniciar containers
docker compose build
docker compose up -d

# Ou para modo proxy
docker compose --profile proxy build
docker compose --profile proxy up -d
```

### Monitoramento e Logs

```bash
# Ver todos os logs
docker compose logs -f

# Ver logs de serviço específico
docker compose logs -f server
docker compose logs -f web
docker compose logs -f server-worker

# Verificar status de saúde
docker compose ps
```

### Parar os Serviços

```bash
# Parar todos os serviços
docker compose down

# Parar e remover volumes (⚠️ apaga dados)
docker compose down -v
```

### Reiniciar um Serviço Específico

```bash
# Reiniciar apenas o servidor
docker compose restart server

# Reconstruir e reiniciar
docker compose up -d --build server
```

---

## Backup e Restauração

### Backup

**Banco de Dados:**
```bash
# Criar backup do PostgreSQL
docker compose exec postgres pg_dump -U postgres medwaster > backup_$(date +%Y%m%d).sql
```

**Dados do MinIO (armazenamento de objetos):**
```bash
# Backup dos dados do MinIO
docker compose exec minio mc mirror /data ./backup_minio_$(date +%Y%m%d)
```

**Arquivos de Configuração:**
```bash
# Backup das variáveis de ambiente
cp .env .env.backup_$(date +%Y%m%d)
```

### Restauração

**Banco de Dados:**
```bash
# Restaurar banco de dados PostgreSQL
cat backup_20250124.sql | docker compose exec -T postgres psql -U postgres medwaster
```

**Dados do MinIO:**
```bash
# Restaurar dados do MinIO
docker compose exec minio mc mirror ./backup_minio_20250124 /data
```

---

## Solução de Problemas

### Serviços não inicializam

**Verificar logs:**
```bash
docker compose logs
```

**Verificar variáveis de ambiente:**
```bash
# Verificar se .env existe e está configurado
cat .env
```

**Verificar se as portas estão em uso:**
```bash
netstat -tuln | grep -E '(3000|4000|5432|6379|9000)'
```

**Solução:**
```bash
# Reiniciar tudo do zero
docker compose down -v
docker compose up -d
```

### Problemas de conexão com o banco de dados

**Verificar se PostgreSQL está pronto:**
```bash
docker compose ps
# PostgreSQL deve mostrar "(healthy)"
```

**Verificar DATABASE_URL no `.env`:**
```bash
grep DATABASE_URL .env
# Deve ser: postgresql://postgres:password@postgres:5432/medwaster
```

**Aguardar o PostgreSQL ficar pronto:**
```bash
# Pode levar 10-30 segundos na primeira inicialização
docker compose logs postgres
```

### Recursos de IA não funcionam

**Verificar chave API:**
```bash
grep OPENAI_API_KEY .env
# Certifique-se de que está configurada corretamente
```

**Ou configurar LocalAI:**
```bash
# No .env
AI_PROVIDER=localai
LOCALAI_BASE_URL=http://seu-servidor-localai:8080/v1
```

### Email não está enviando

**Verificar credenciais SMTP no `.env`:**
```bash
grep SMTP_ .env
```

**Verificar logs do servidor:**
```bash
docker compose logs server | grep -i mail
```

### Container mostra "unhealthy"

**Verificar se o serviço está realmente funcionando:**
```bash
# Testar endpoint de saúde do servidor
curl http://localhost:4000/health

# Testar aplicação web
curl http://localhost:3000/health
```

**Se responder corretamente, o "unhealthy" é apenas cosmético** - o serviço está funcionando normalmente.

### Limpar tudo e recomeçar

```bash
# ⚠️ Isso apagará TODOS os dados
docker compose down -v
docker system prune -f
rm -rf node_modules

# Recomeçar do zero
cp .env.example .env
# Editar .env com suas configurações
docker compose up -d
docker compose exec server bun run db:migrate
```

---

## Recursos Adicionais

### Verificar Versões

```bash
# Versão do Docker
docker --version

# Versão do Docker Compose
docker compose version

# Versão do Bun (dentro do container)
docker compose exec server bun --version
```

### Acessar Shell do Container

```bash
# Shell do servidor
docker compose exec server sh

# Shell do banco de dados
docker compose exec postgres psql -U postgres medwaster

# Shell do Redis
docker compose exec redis redis-cli
```

### Monitorar Uso de Recursos

```bash
# Uso de CPU/memória de todos os containers
docker stats

# Espaço em disco usado pelos volumes
docker system df -v
```

---

## Suporte

Para mais ajuda:

1. Verifique os logs: `docker compose logs -f`
2. Consulte a [documentação completa em inglês](./README.md)
3. Abra uma issue no GitHub

---

## Notas de Segurança

**Para uso em produção:**

1. ✅ Alterar todos os passwords padrão
2. ✅ Usar secrets fortes (gerados com `openssl rand -base64 32`)
3. ✅ Configurar firewall para bloquear portas não necessárias
4. ✅ Usar HTTPS (modo proxy com Caddy)
5. ✅ Manter backups regulares
6. ✅ Atualizar regularmente (`git pull && docker compose up -d --build`)

**Portas expostas por padrão:**
- 3000 (Web)
- 4000 (API)
- 5432 (PostgreSQL)
- 6379 (Redis)
- 9000-9001 (MinIO)

**Recomendação:** Em produção, considere expor apenas as portas 80/443 (usando modo proxy) e manter as outras portas acessíveis apenas internamente.

---

## Licença

Este projeto está licenciado sob os termos especificados no arquivo LICENSE.
