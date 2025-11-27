# medwaster

> 🇺🇸 **[Read in English](./README.md)**

Este projeto foi criado com [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack), uma stack TypeScript moderna que combina React, TanStack Router, Elysia, e mais.

## Funcionalidades

- **TypeScript** - Para segurança de tipos e melhor experiência do desenvolvedor
- **TanStack Router** - Roteamento baseado em arquivos com segurança de tipos completa
- **React Native** - Construa apps móveis usando React
- **Expo** - Ferramentas para desenvolvimento React Native
- **TailwindCSS** - CSS utilitário para desenvolvimento rápido de UI
- **shadcn/ui** - Componentes de UI reutilizáveis
- **Elysia** - Framework de alta performance e tipo seguro
- **Bun** - Ambiente de execução (Runtime)
- **Drizzle** - ORM TypeScript-first
- **PostgreSQL** - Motor de Banco de Dados
- **Autenticação** - Email e senha com Better Auth
- **Turborepo** - Sistema de build otimizado para monorepos

## Instalação e Implantação

Para instruções detalhadas de instalação, incluindo configuração de ambiente, guias de auto-hospedagem e solução de problemas, consulte o **[Guia de Instalação](./docs/INSTALLATION.pt-BR.md)**.

### Início Rápido

1.  **Instalar Dependências:**
    ```bash
    bun install
    ```

2.  **Configurar Ambiente:**
    Copie `.env.example` para `.env` e configure seus segredos (Banco de Dados, Auth, OpenAI, etc.).
    *Veja [Configuração de Ambiente](./docs/INSTALLATION.pt-BR.md#configuração-de-ambiente-env) para detalhes.*

3.  **Iniciar Serviços (Docker):**
    ```bash
    docker compose up -d
    ```

4.  **Rodar Servidor de Desenvolvimento:**
    ```bash
    bun dev
    ```

- **Web:** [http://localhost:3000](http://localhost:3000)
- **API:** [http://localhost:4000](http://localhost:4000)

## Estrutura do Projeto

```
medwaster/
├── apps/
│   ├── web/         # Frontend application (React + TanStack Router)
│   ├── native/      # Mobile application (React Native, Expo)
│   └── server/      # Backend API (Elysia)
```

## Scripts Disponíveis

- `bun dev`: Inicia todas as aplicações em modo de desenvolvimento
- `bun dev:all`: Inicia todas as aplicações incluindo worker em segundo plano
- `bun build`: Compila todas as aplicações
- `bun dev:web`: Inicia apenas a aplicação web
- `bun dev:server`: Inicia apenas o servidor
- `bun dev:worker`: Inicia apenas o worker em segundo plano
- `bun dev:native`: Inicia o servidor de desenvolvimento React Native/Expo
- `bun check-types`: Checa tipos TypeScript em todos os apps
- `bun db:push`: Envia mudanças de esquema para o banco de dados (prototipagem)
- `bun db:generate`: Gera migrações SQL a partir do esquema
- `bun db:migrate`: Aplica migrações pendentes ao banco de dados
- `bun db:seed`: Popula o banco de dados com dados iniciais
- `bun db:reset`: Reseta o banco de dados (apaga e reaplica esquema)
- `bun db:studio`: Abre a interface do estúdio do banco de dados