# Research: Wiki Admin Panel

**Branch**: `003-wiki-admin-panel` | **Date**: 2025-01-26

## Research Objectives
1. Analyze BlockNote editor capabilities and integration patterns
2. Evaluate existing database schema compatibility
3. Assess UI/UX patterns for content management interfaces
4. Research content organization and workflow best practices

---

## BlockNote Editor Analysis

### Current Integration Status
✅ **Already Integrated**: BlockNote is configured in the existing codebase
- Location: `/apps/web/src/routes/_auth/wiki/$articleId.tsx`
- Version: Using `@blocknote/react` and `@blocknote/shadcn`
- Locale: Portuguese (pt) with custom placeholders
- Theme: Light theme configured

### Capabilities Assessment
✅ **Rich Text Formatting**: 
- Headers (H1-H6), bold, italic, underline
- Lists (ordered, unordered, checklist)
- Blockquotes, code blocks, tables
- Text alignment and styling

✅ **Slash Commands**: 
- Already configured with Portuguese placeholder: "Digite um texto ou use "/" para utilizar comandos"
- Supports quick insertion of blocks and formatting

✅ **Media Support**:
- Image upload and embedding capabilities
- File attachment support
- Video embed capabilities (if needed)

✅ **ShadCN Integration**:
- Uses `@blocknote/shadcn` for consistent design system
- Compatible with existing Tailwind CSS styling
- Matches current UI component patterns

### Implementation Recommendations
1. **Custom Blocks**: Extend BlockNote with medical-specific blocks (procedures, warnings, etc.)
2. **Image Upload**: Integrate with file storage service for article images
3. **Auto-save**: Implement periodic saving during editing
4. **Collaboration**: Consider real-time editing for multiple admins (future)

---

## Database Schema Compatibility

### Existing Schema Analysis
✅ **Compatible Tables**:
- `content_categories`: Ready for wiki articles with type='wiki'
- `tags`: Existing tag system can be used for article tagging
- `user`: Auth system supports admin role requirements

✅ **Category System**:
```sql
-- Existing content_categories table supports:
- Hierarchical structure (parentId)
- Type-based categorization (content_category_type enum includes 'wiki')
- Color coding and descriptions
- Active/inactive status
```

✅ **Tag System**:
```sql
-- Existing tags table provides:
- Unique tag names with slugs
- Color coding capabilities
- Creation/update timestamps
```

### Required Extensions
❌ **Missing: Wiki Articles Table**
Need new table structure:
```sql
wiki_articles {
  id: serial primary key
  title: text not null
  slug: text unique not null
  content: text (BlockNote JSON)
  excerpt: text (auto-generated or manual)
  reading_time_minutes: integer
  status: enum (draft, published, archived)
  category_id: references content_categories
  author_id: references user
  featured_image_url: text
  meta_description: text
  created_at, updated_at: timestamps
}
```

❌ **Missing: Article-Tag Relationships**
```sql
wiki_article_tags {
  article_id: references wiki_articles
  tag_id: references tags
  created_at: timestamp
}
```

---

## UI/UX Pattern Analysis

### Existing Admin Patterns
✅ **Layout Structure**: 
- TanStack Router with `/_auth` protected routes
- ShadCN UI components for consistent design
- Responsive grid/flex layouts

✅ **Form Patterns**:
- React Hook Form integration patterns
- Validation with error display
- Loading states and feedback

✅ **Table/List Patterns**:
- Data tables with sorting and filtering
- Pagination components
- Bulk action patterns

### Content Management Best Practices
✅ **Article Listing**:
- Card/grid view for visual articles
- Table view for detailed information
- Advanced filtering by status, category, tags
- Search with highlighting

✅ **Editor Interface**:
- Side-by-side preview option
- Auto-save indicators
- Version history (future)
- Rich metadata editing

✅ **Publication Workflow**:
- Clear status indicators
- Preview before publish
- Validation feedback
- Publication scheduling (future)

---

## Content Organization Research

### Category Hierarchy Best Practices
✅ **Medical Content Structure**:
```
Level 1: Waste Types
├── Biological Waste
│   ├── Blood Products
│   └── Pathological Waste
├── Chemical Waste
│   ├── Pharmaceuticals
│   └── Laboratory Chemicals
└── Radioactive Waste
    ├── Short-lived Isotopes
    └── Long-lived Isotopes
```

✅ **Complexity Levels**:
- Basic: General procedures, safety guidelines
- Intermediate: Specific waste handling protocols  
- Advanced: Complex disposal procedures, regulations

### Tagging Strategy
✅ **Tag Categories**:
- **Procedures**: disposal, storage, transport, treatment
- **Equipment**: containers, PPE, instruments
- **Regulations**: ANVISA, CONAMA, local guidelines
- **Safety**: hazards, precautions, emergency procedures

---

## Performance Considerations

### Reading Time Calculation
✅ **Algorithm Research**:
- Average reading speed: 200-250 words per minute
- Technical content: +15% time (medical terminology)
- List/bullet content: -10% time (easier scanning)
- Implementation: Real-time calculation during editing

### Search Optimization
✅ **PostgreSQL Full-Text Search**:
- Create tsvector columns for efficient search
- Support Portuguese language stemming
- Index title, content, and tag combinations
- Weighted ranking (title > content > tags)

### Content Loading
✅ **Performance Targets**:
- Article list: <200ms load time
- Editor initialization: <500ms
- Auto-save operations: <1s
- Search results: <300ms

---

## Integration Points

### Auth System Integration
✅ **Role Verification**:
- Leverage existing Better Auth admin role
- Middleware protection for all wiki admin routes
- Author tracking for audit purposes

### File Upload Integration
✅ **Image Handling**:
- Extend existing file upload patterns
- CDN integration for image optimization
- Thumbnail generation for article previews
- Alt text and accessibility support

### Notification Integration
✅ **Admin Notifications**:
- Publication status changes
- Content collaboration updates
- System maintenance alerts

---

## Risk Assessment

### Technical Risks
⚠️ **Medium Risk**: BlockNote content serialization/deserialization
- **Mitigation**: Thorough testing of save/load cycles
- **Backup**: Plain text fallback for content recovery

⚠️ **Low Risk**: PostgreSQL full-text search performance
- **Mitigation**: Proper indexing and query optimization
- **Monitoring**: Performance metrics and alerting

### Content Management Risks
⚠️ **Medium Risk**: Accidental content deletion/modification
- **Mitigation**: Soft deletes and confirmation dialogs
- **Recovery**: Version history and backup procedures

⚠️ **Low Risk**: Category restructuring impact
- **Mitigation**: Validation before hierarchy changes
- **Tools**: Bulk reassignment capabilities

---

## Implementation Readiness

### Prerequisites Met
✅ BlockNote editor integration complete
✅ Database schema foundation available
✅ Auth system supports admin roles
✅ UI component library (ShadCN) ready
✅ File upload patterns established

### Ready for Implementation
✅ Database schema extension design
✅ API contract definition
✅ UI component specifications
✅ Editor integration enhancement
✅ Testing strategy planning

---

## Conclusion

Research indicates strong foundation for Wiki Admin Panel implementation:

**Strengths**:
- BlockNote editor already integrated and functional
- Database schema extensible with minimal changes
- UI patterns established and consistent
- Auth system ready for admin role enforcement

**Key Implementation Areas**:
1. Database schema extension (wiki_articles table)
2. API development for CRUD operations
3. Admin UI components for content management
4. Editor enhancement with custom features
5. Search and filtering implementation

**Estimated Complexity**: Medium - leverages existing infrastructure with focused extensions

**Recommended Approach**: Incremental implementation starting with basic CRUD, then adding advanced features progressively.