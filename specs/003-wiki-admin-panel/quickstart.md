# Quickstart: Wiki Admin Panel

**Branch**: `003-wiki-admin-panel` | **Date**: 2025-01-26

## Development Setup

### Prerequisites
- ✅ Existing MedWaster project setup
- ✅ PostgreSQL database running
- ✅ Bun package manager installed
- ✅ Admin user account in the system

### Environment Configuration
```bash
# Database migration
cd apps/server
bun run db:migrate

# Install any missing dependencies
bun install

# Start development servers
bun run dev          # Start all services
```

---

## Database Setup

### 1. Create Wiki Schema
```sql
-- Run migration to create wiki_articles table
-- Location: apps/server/src/db/migrations/003_create_wiki_tables.sql

-- Verify tables created
\dt wiki_*

-- Expected tables:
-- - wiki_articles
-- - wiki_article_tags  
-- - wiki_article_relationships
```

### 2. Seed Basic Data
```sql
-- Create wiki-type categories
INSERT INTO content_categories (name, slug, type, color, description) VALUES
('Resíduos Biológicos', 'residuos-biologicos', 'wiki', '#ef4444', 'Materiais contaminados com sangue ou fluidos corporais'),
('Resíduos Químicos', 'residuos-quimicos', 'wiki', '#f59e0b', 'Substâncias químicas e medicamentos'),
('Resíduos Radioativos', 'residuos-radioativos', 'wiki', '#8b5cf6', 'Materiais com radioatividade');

-- Create basic tags
INSERT INTO tags (name, slug, description, color) VALUES
('procedimento', 'procedimento', 'Procedimentos de descarte', '#3b82f6'),
('seguranca', 'seguranca', 'Questões de segurança', '#dc2626'),
('equipamento', 'equipamento', 'Equipamentos necessários', '#059669'),
('normativa', 'normativa', 'Normas e regulamentações', '#7c3aed');
```

---

## Backend Implementation

### 1. Database Schema
```typescript
// File: apps/server/src/db/schema/wiki.ts
export const wikiArticles = pgTable("wiki_articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: jsonb("content").notNull(),
  contentText: text("content_text"),
  excerpt: text("excerpt"),
  // ... additional fields
});
```

### 2. API Routes
```typescript
// File: apps/server/src/modules/wiki/articles.ts
export const wikiArticles = new Elysia({ prefix: "/articles" })
  .use(betterAuthMacro)
  .guard({ auth: true, role: "admin" }, (app) =>
    app
      .get("/", listArticles)
      .get("/:id", getArticle)
      .post("/", createArticle)
      .put("/:id", updateArticle)
      .delete("/:id", archiveArticle)
  );
```

### 3. Business Logic
```typescript
// File: apps/server/src/modules/wiki/services/article-service.ts
export class ArticleService {
  static async createArticle(data: CreateArticleData) {
    // Generate slug from title
    // Extract plain text from BlockNote content
    // Calculate reading time
    // Validate and save
  }
  
  static calculateReadingTime(content: object): number {
    // 200 words per minute baseline
    // Adjust for technical content
  }
}
```

---

## Frontend Implementation

### 1. Route Structure
```
/admin/wiki/
├── articles/           # Article listing
├── articles/new        # Create new article
├── articles/:id        # Edit article
├── articles/:id/preview # Preview article
└── categories/         # Category management
```

### 2. Key Components
```typescript
// File: apps/web/src/features/wiki/components/ArticleList.tsx
export function ArticleList() {
  const { data } = useArticleList({ status: 'all' });
  return <DataTable columns={articleColumns} data={data.articles} />;
}

// File: apps/web/src/features/wiki/components/ArticleEditor.tsx
export function ArticleEditor({ articleId }: { articleId?: number }) {
  const editor = useWikiEditor();
  return <BlockNoteView editor={editor} />;
}
```

### 3. API Integration
```typescript
// File: apps/web/src/features/wiki/api/articles.ts
export const useArticleList = (params: ArticleListParams) => {
  return useQuery({
    queryKey: ['wiki-articles', params],
    queryFn: () => client.admin.wiki.articles.get({ query: params }),
  });
};
```

---

## Testing Strategy

### 1. Backend Tests
```typescript
// File: apps/server/src/modules/wiki/__tests__/articles.test.ts
describe('Wiki Articles API', () => {
  test('should create article with valid data', async () => {
    const response = await app.handle(
      new Request('http://localhost/api/admin/wiki/articles', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${adminToken}` },
        body: JSON.stringify(validArticleData)
      })
    );
    expect(response.status).toBe(201);
  });
});
```

### 2. Frontend Tests
```typescript
// File: apps/web/src/features/wiki/components/__tests__/ArticleEditor.test.tsx
describe('ArticleEditor', () => {
  test('should save article content', async () => {
    render(<ArticleEditor />);
    // Simulate content input
    // Verify save functionality
  });
});
```

---

## Development Workflow

### 1. Create New Article Feature
```bash
# 1. Backend first
cd apps/server
# Create database schema
# Implement API endpoints
# Add tests

# 2. Frontend integration
cd apps/web
# Create UI components
# Add API integration
# Test user flows
```

### 2. Common Development Tasks

#### Add New Custom Block
```typescript
// 1. Define block type in contracts/blocknote-editor.md
// 2. Implement block in BlockNote configuration
// 3. Add to slash commands
// 4. Update content processor for text extraction
```

#### Add New API Endpoint
```typescript
// 1. Add route to articles.ts
// 2. Implement business logic in service
// 3. Add input validation
// 4. Write tests
// 5. Update API contract documentation
```

---

## Production Checklist

### Database
- [ ] Run migrations in production
- [ ] Create database indexes
- [ ] Set up backup procedures
- [ ] Configure connection pooling

### Security
- [ ] Validate admin role permissions
- [ ] Implement rate limiting
- [ ] Sanitize user inputs
- [ ] Configure CORS properly

### Performance
- [ ] Enable query caching
- [ ] Optimize image uploads
- [ ] Configure CDN for static assets
- [ ] Monitor API response times

### Monitoring
- [ ] Set up error tracking
- [ ] Configure performance monitoring
- [ ] Add health checks
- [ ] Set up alerting

---

## Troubleshooting

### Common Issues

#### Database Connection
```bash
# Check database status
bun run db:status

# Reset database (development only)
bun run db:reset
bun run db:migrate
bun run db:seed
```

#### BlockNote Editor Issues
```typescript
// Clear editor state
editor.removeBlocks(editor.document);

// Validate content structure
const isValid = validateBlockNoteContent(content);
```

#### API Authentication
```bash
# Verify admin role
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:3000/api/admin/wiki/articles
```

### Performance Issues
- Check database query performance with EXPLAIN
- Monitor auto-save frequency
- Optimize image upload sizes
- Review API response times

---

## Next Steps

### Phase 1 (MVP)
1. Implement basic CRUD operations
2. Set up article editor with BlockNote
3. Add category management
4. Implement publication workflow

### Phase 2 (Enhanced)
1. Add search and filtering
2. Implement bulk operations
3. Add content relationships
4. Enhanced editor features

### Phase 3 (Advanced)
1. Content analytics
2. Version history
3. Collaboration features
4. Advanced workflow automation

---

## Resources

### Documentation
- [BlockNote Documentation](https://www.blocknotejs.org/docs/)
- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [TanStack Query](https://tanstack.com/query/)
- [ShadCN UI](https://ui.shadcn.com/)

### Examples
- Check existing features in `/apps/web/src/features/`
- Review database patterns in `/apps/server/src/db/schema/`
- Study API patterns in `/apps/server/src/modules/`