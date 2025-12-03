# Image System

The Theaterpedia image system provides sophisticated image handling with shapes, processing, and adapter-based workflows.

## Overview

### Key Components

| Component | Purpose |
|-----------|---------|
| ImgShape | Render images in predefined shapes |
| cimgImportStepper | Batch image import with metadata |
| ImagesCoreAdmin | Admin view for image management |

### Architecture

```
Author (Canva)  →  Producer (Cloudinary)  →  Publisher (Cloudflare)
     ↑                    ↑                        ↑
  Create/Edit        Process/Transform         Deliver/CDN
```

## ImgShape Component

The core component for displaying images in consistent shapes:

```vue
<ImgShape
  :src="imageUrl"
  shape="card"
  :aspect="16/9"
  fit="cover"
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `src` | string | - | Image URL |
| `shape` | string | 'card' | Shape preset |
| `aspect` | number | auto | Aspect ratio |
| `fit` | string | 'cover' | Object-fit value |
| `placeholder` | boolean | true | Show placeholder |

### Available Shapes

| Shape | Dimensions | Use Case |
|-------|------------|----------|
| `card` | 21rem × 14rem | Cards, previews |
| `tile` | 8rem × 4rem | Lists, compact |
| `tile-square` | 8rem × 8rem | Grid tiles |
| `avatar` | 4rem × 4rem | Profile pics |
| `hero` | full-width | Hero banners |
| `thumb` | 3rem × 3rem | Thumbnails |

### CSS Variables

```css
:root {
  --card-width: 21rem;      /* 336px */
  --card-height: 14rem;     /* 224px */
  --card-height-min: 10.5rem;
  --tile-width: 8rem;       /* 128px */
  --tile-height: 4rem;      /* 64px */
  --tile-height-square: 8rem;
  --avatar: 4rem;           /* 64px */
}
```

## Image Processing Pipeline

### Adapter Strategy

The system uses adapters for different stages:

#### 1. Author Adapter (Canva-like)
- User creates/edits images
- Provides initial file upload
- May include basic editing

#### 2. Producer Adapter (Cloudinary-like)
- Transforms images
- Creates variants (sizes, formats)
- Optimizes for web

#### 3. Publisher Adapter (Cloudflare-like)
- CDN delivery
- Edge caching
- URL generation

### Local Adapter

For development, a local adapter handles all stages:

```typescript
// server/utils/adapters/local.ts
export const localAdapter = {
  upload: async (file: File) => { /* ... */ },
  transform: async (id: string, options: TransformOptions) => { /* ... */ },
  getUrl: (id: string, variant: string) => { /* ... */ }
}
```

## cimgImportStepper

Batch import component for images:

```vue
<cimgImportStepper
  :project-id="projectId"
  :eligible-owners="owners"
  :default-owner-id="defaultOwner"
  @complete="handleComplete"
/>
```

### Features

- Drag-and-drop upload
- Batch metadata editing
- TagFamilies integration (ttags, ctags, dtags)
- Owner/Author assignment
- XMLID generation

### XMLID Format

```
{project}.image_{subject}.{name}
```

Example: `walfische.image_workshop.gruppenarbeit-tag1`

## ImagesCoreAdmin

Admin view for managing all images:

```
/admin/images → ImagesCoreAdmin.vue
```

### Features

- Filter by project
- Search by metadata
- Batch operations
- Shape preview
- Delete/archive

## API Endpoints

### Upload

```http
POST /api/images/upload
Content-Type: multipart/form-data

file: <binary>
project_id: string
owner_id: number
metadata: JSON
ttags: number
ctags: number
dtags: number
```

### List

```http
GET /api/images?project_id={id}&shape={shape}
```

### Get by ID

```http
GET /api/images/{id}
GET /api/images/{id}?variant=thumb
```

## Usage Examples

### Basic Image Display

```vue
<template>
  <div class="image-grid">
    <ImgShape
      v-for="img in images"
      :key="img.id"
      :src="img.url"
      shape="tile"
    />
  </div>
</template>
```

### With Placeholder

```vue
<ImgShape
  :src="image?.url"
  shape="card"
  placeholder
>
  <template #placeholder>
    <div class="loading-state">Loading...</div>
  </template>
</ImgShape>
```

### Responsive Grid

```vue
<div class="image-gallery">
  <ImgShape
    v-for="img in images"
    :key="img.id"
    :src="img.url"
    :shape="isMobile ? 'tile' : 'card'"
  />
</div>
```

---

*See also: [cList Components](/dev/features/clist) for list integration*
