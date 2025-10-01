# Data Model: Wiki Admin Panel

**Branch**: `003-wiki-admin-panel` | **Date**: 2025-01-26

## Overview
Database schema design for Wiki Admin Panel extending existing MedWaster schema with article management, publication workflow, and content organization capabilities.

---

## Database Schema Extensions

### New Tables

#### wiki_articles
Primary table for storing wiki article content and metadata.

```sql
CREATE TABLE wiki_articles (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content JSONB NOT NULL,                    -- BlockNote editor content
  content_text TEXT,                         -- Plain text for search indexing
  excerpt TEXT,                              -- Manual or auto-generated summary
  reading_time_minutes INTEGER,              -- Calculated reading time
  status wiki_article_status DEFAULT 'draft' NOT NULL,
  category_id INTEGER REFERENCES content_categories(id) ON DELETE SET NULL,
  author_id TEXT NOT NULL REFERENCES user(id) ON DELETE RESTRICT,
  featured_image_url TEXT,                   -- Optional header image
  meta_description TEXT,                     -- SEO description
  view_count INTEGER DEFAULT 0,             -- Student view tracking
  last_viewed_at TIMESTAMP WITH TIME ZONE,  -- Latest student view
  published_at TIMESTAMP WITH TIME ZONE,    -- Publication timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enums
CREATE TYPE wiki_article_status AS ENUM ('draft', 'published', 'archived');

-- Indexes for performance
CREATE INDEX idx_wiki_articles_status ON wiki_articles(status);
CREATE INDEX idx_wiki_articles_category ON wiki_articles(category_id);
CREATE INDEX idx_wiki_articles_author ON wiki_articles(author_id);
CREATE INDEX idx_wiki_articles_published_at ON wiki_articles(published_at);
CREATE INDEX idx_wiki_articles_updated_at ON wiki_articles(updated_at);
CREATE INDEX idx_wiki_articles_slug ON wiki_articles(slug);

-- Full-text search index
CREATE INDEX idx_wiki_articles_search ON wiki_articles USING GIN(
  to_tsvector('portuguese', COALESCE(title, '') || ' ' || COALESCE(content_text, ''))
);
```

#### wiki_article_tags
Junction table for many-to-many relationship between articles and tags.

```sql
CREATE TABLE wiki_article_tags (
  article_id INTEGER NOT NULL REFERENCES wiki_articles(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  assigned_by TEXT REFERENCES user(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  PRIMARY KEY (article_id, tag_id)
);

-- Indexes
CREATE INDEX idx_wiki_article_tags_article ON wiki_article_tags(article_id);
CREATE INDEX idx_wiki_article_tags_tag ON wiki_article_tags(tag_id);
```

#### wiki_article_relationships
Table for managing content relationships (related articles, prerequisites, etc.)

```sql
CREATE TABLE wiki_article_relationships (
  id SERIAL PRIMARY KEY,
  source_article_id INTEGER NOT NULL REFERENCES wiki_articles(id) ON DELETE CASCADE,
  target_article_id INTEGER NOT NULL REFERENCES wiki_articles(id) ON DELETE CASCADE,
  relationship_type wiki_relationship_type NOT NULL,
  created_by TEXT NOT NULL REFERENCES user(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  UNIQUE(source_article_id, target_article_id, relationship_type)
);

CREATE TYPE wiki_relationship_type AS ENUM (
  'related',      -- General relationship
  'prerequisite', -- Must read before current article
  'continuation', -- Follow-up reading
  'reference'     -- Referenced within content
);

-- Indexes
CREATE INDEX idx_wiki_relationships_source ON wiki_article_relationships(source_article_id);
CREATE INDEX idx_wiki_relationships_target ON wiki_article_relationships(target_article_id);
CREATE INDEX idx_wiki_relationships_type ON wiki_article_relationships(relationship_type);
```

---

### Modified Tables

#### content_categories (Existing - No Changes Required)
The existing table already supports wiki content through the type enum:

```sql
-- Existing table supports wiki articles
content_category_type ENUM includes 'wiki'
```

#### tags (Existing - No Changes Required)
The existing tags table can be used directly for wiki article tagging.

---

## Data Relationships

### Entity Relationship Diagram

```
user (existing)
├── authors ──→ wiki_articles (1:many)
└── assigned_by ──→ wiki_article_tags (1:many)

content_categories (existing)
└── articles ──→ wiki_articles (1:many)

tags (existing)
└── article_tags ──→ wiki_article_tags (many:many)

wiki_articles
├── tags ──→ wiki_article_tags (1:many)
├── source_relationships ──→ wiki_article_relationships (1:many)
└── target_relationships ──→ wiki_article_relationships (1:many)
```

### Relationship Rules

#### Article-Category Relationship
- **Cardinality**: Many articles to one category
- **Constraint**: Category can be NULL (uncategorized content)
- **Cascade**: SET NULL on category deletion
- **Business Rule**: Published articles should have categories

#### Article-Tag Relationship
- **Cardinality**: Many-to-many through junction table
- **Constraint**: Unique article-tag pairs
- **Cascade**: CASCADE delete on article/tag deletion
- **Business Rule**: Articles can have 0-10 tags

#### Article-User Relationship (Author)
- **Cardinality**: Many articles to one author
- **Constraint**: Author cannot be NULL
- **Cascade**: RESTRICT on user deletion (preserve content)
- **Business Rule**: Only admin users can be authors

#### Article-Article Relationships
- **Cardinality**: Many-to-many with relationship types
- **Constraint**: Unique source-target-type combinations
- **Cascade**: CASCADE delete on article deletion
- **Business Rule**: No self-references, prevent circular prerequisites

---

## Data Types & Constraints

### Content Storage
```sql
-- BlockNote editor content stored as JSONB
content JSONB NOT NULL
-- Plain text extraction for search
content_text TEXT  -- Generated from JSONB content
```

### Reading Time Calculation
```sql
-- Stored in minutes, calculated on content save
reading_time_minutes INTEGER
-- Calculation: word_count / 200 words_per_minute, minimum 1 minute
```

### Publication Status
```sql
-- Three-state workflow
status wiki_article_status DEFAULT 'draft'
-- Business rules:
-- draft → published (requires validation)
-- published → archived (soft delete)
-- archived → draft (reactivation)
```

### SEO and Discoverability
```sql
-- URL-friendly identifier
slug TEXT UNIQUE NOT NULL  -- Auto-generated from title
-- Search engine description
meta_description TEXT      -- Max 160 characters
-- Social sharing image
featured_image_url TEXT    -- Optional article header
```

---

## Validation Rules

### Article Validation
```sql
-- Title constraints
CHECK (LENGTH(title) >= 5 AND LENGTH(title) <= 200)

-- Content minimum (estimated 50+ characters in plain text)
CHECK (LENGTH(content_text) >= 50 OR status = 'draft')

-- Slug format (URL-safe)
CHECK (slug ~ '^[a-z0-9-]+$')

-- Reading time reasonableness
CHECK (reading_time_minutes >= 1 AND reading_time_minutes <= 300)

-- Meta description length
CHECK (meta_description IS NULL OR LENGTH(meta_description) <= 160)
```

### Business Logic Constraints
```sql
-- Published articles must have categories
CHECK (status != 'published' OR category_id IS NOT NULL)

-- Published timestamp consistency
CHECK (status != 'published' OR published_at IS NOT NULL)
CHECK (status = 'published' OR published_at IS NULL)

-- View tracking only for published articles
CHECK (status = 'published' OR (view_count = 0 AND last_viewed_at IS NULL))
```

---

## Indexes & Performance

### Search Performance
```sql
-- Full-text search index (Portuguese language)
CREATE INDEX idx_wiki_articles_search ON wiki_articles 
USING GIN(to_tsvector('portuguese', title || ' ' || content_text));

-- Composite index for filtered searches
CREATE INDEX idx_wiki_articles_status_category ON wiki_articles(status, category_id);
CREATE INDEX idx_wiki_articles_status_updated ON wiki_articles(status, updated_at DESC);
```

### Admin Interface Performance
```sql
-- Article listing queries
CREATE INDEX idx_wiki_articles_author_updated ON wiki_articles(author_id, updated_at DESC);
CREATE INDEX idx_wiki_articles_category_status ON wiki_articles(category_id, status);

-- Tag-based filtering
CREATE INDEX idx_wiki_article_tags_composite ON wiki_article_tags(tag_id, article_id);
```

### Analytics Performance
```sql
-- View tracking queries
CREATE INDEX idx_wiki_articles_views ON wiki_articles(view_count DESC, last_viewed_at DESC);
CREATE INDEX idx_wiki_articles_popular ON wiki_articles(status, view_count DESC) 
WHERE status = 'published';
```

---

## Data Migration Strategy

### Phase 1: Schema Creation
1. Create new tables and types
2. Add indexes for performance
3. Set up constraints and validation rules

### Phase 2: Existing Data Integration
1. Ensure content_categories has wiki-type entries
2. Create default tags for medical waste categories
3. Set up initial admin user permissions

### Phase 3: Content Seeding (Optional)
1. Import sample articles for testing
2. Create category hierarchy for medical waste types
3. Establish tag taxonomy for procedures and equipment

---

## Backup & Recovery Considerations

### Critical Data Protection
- **Articles Content**: JSONB content and plain text backup
- **Publication History**: Status changes and timestamps
- **Relationships**: Article connections and references
- **User Attribution**: Author and modification tracking

### Recovery Scenarios
- **Content Corruption**: Plain text fallback from content_text field
- **Accidental Deletion**: Soft delete through archived status
- **Relationship Loss**: Rebuild from content analysis and manual review
- **Performance Degradation**: Index rebuilding and query optimization

---

## Scalability Considerations

### Growth Projections
- **Articles**: 1,000+ articles expected
- **Categories**: 50+ hierarchical categories
- **Tags**: 200+ descriptive tags
- **Relationships**: 2,000+ article connections

### Performance Optimizations
- **Pagination**: All listing queries use LIMIT/OFFSET
- **Caching**: Published article content cached at application layer
- **Indexing**: Comprehensive index strategy for common query patterns
- **Archival**: Old article versions and unused content archival strategy