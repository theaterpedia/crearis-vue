# Plan D: Finish ImgShape Component

**Date**: November 8, 2025  
**Priority**: High  
**Status**: 🔄 In Progress - Part II (Tasks 2.3-2.5 remain)  
**Related Plans**: Plan E (ImagesCoreAdmin), Plan F (Hero Integration)

**Progress Summary**:
- ✅ Task 1.1: Dimension validation & error handling (committed: 2d8b7b6)
- ✅ Task 1.2: Avatar shape detection (committed: 2d8b7b6)
- ✅ Task 2.1: Preview state management (committed: cbcebc0)
- ✅ Task 2.2: Click-to-edit activation (already working)
- ⏳ Task 2.3: ShapeEditor component (next)
- ⏳ Task 2.4: ImageAdmin integration (next)
- ⏳ Task 2.5: Dirty detection & state clearing (next)

---

## 📊 Context & Purpose

ImgShape serves as the **reference implementation** for the image system with 4 distinct use cases:

1. **Image Resolver**: Display small/medium images up to card-width (336px)
2. **Helper for ImageAdmin**: Preview & settings management via ShapeEditor
3. **Test Helper**: Basic testing support with error overlays
4. **Reference Implementation**: Blueprint for Hero.vue and similar components

**Philosophy**: Alpha-stage complexity is acceptable. We optimize to known dimensions, error out gracefully when assumptions fail, and document clearly for future simplification.

---

## 🎯 Core Requirements

### Dimensional Assumptions
- **Optimized for**: Small/medium images up to 336px (card-width)
- **Assumption**: Image dimensions are **known exactly**
- **On Failure**: Display default BlurHash + "Image-Shape-Error" overlay (50% opacity white banner)
- **No Fallbacks**: Better to error visibly than silently degrade

### Avatar Handling
- **Rounded Avatar**: Standard circular crop
- **Square Avatar**: Based on `xmlid` detection
- **Auto-detection**: Component determines shape from context

---

## 📋 Task Breakdown

### Part I: Image Resolver (Core Display Logic) 🎨

#### Task 1.1: Dimension Validation & Error Handling ✅ IMPLEMENT FIRST

**Goal**: Enforce known-dimension requirement with graceful degradation

**Implementation**:
```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useBlurHash } from '@/composables/useBlurHash'

interface Props {
    data: {
        x?: number | null
        y?: number | null
        z?: number | null
        url: string
        blur?: string | null
        turl?: string | null
        tpar?: string | null
    }
    shape: 'card' | 'tile' | 'avatar'
    variant?: 'square' | 'wide' | 'vertical' | 'thumb'
    forceBlur?: boolean
}

const props = defineProps<Props>()

// Error state
const hasError = ref(false)
const errorMessage = ref('')

// Validate dimensions
const validateDimensions = () => {
    // If URL exists but dimensions are missing/invalid
    if (props.data.url && !props.data.x && !props.data.y) {
        hasError.value = true
        errorMessage.value = 'Missing dimensions'
        return false
    }
    
    // If dimensions are invalid
    if (props.data.x && props.data.x <= 0) {
        hasError.value = true
        errorMessage.value = 'Invalid width'
        return false
    }
    
    if (props.data.y && props.data.y <= 0) {
        hasError.value = true
        errorMessage.value = 'Invalid height'
        return false
    }
    
    return true
}

// BlurHash fallback
const { getBlurHashDataUrl } = useBlurHash()
const defaultBlurHash = computed(() => {
    if (props.data.blur) {
        return getBlurHashDataUrl(props.data.blur, 32, 32)
    }
    // Default gray blur
    return getBlurHashDataUrl('L9AB*b~q9F?b-;ofofM{4n-;-;WB', 32, 32)
})

onMounted(() => {
    validateDimensions()
})
</script>

<template>
    <div class="img-shape" :class="[`shape-${shape}`, `variant-${variant}`, { 'has-error': hasError }]">
        <!-- Error state: BlurHash + overlay -->
        <div v-if="hasError" class="error-state">
            <img :src="defaultBlurHash" alt="Error" class="blur-image" />
            <div class="error-overlay">
                <span class="error-text">Image-Shape-Error</span>
                <span class="error-detail">{{ errorMessage }}</span>
            </div>
        </div>
        
        <!-- Normal state -->
        <img v-else-if="data.url" :src="data.url" :alt="data.url" class="shape-image" />
        
        <!-- BlurHash loading state -->
        <img v-else :src="defaultBlurHash" alt="Loading" class="blur-image" />
    </div>
</template>

<style scoped>
.img-shape {
    position: relative;
    overflow: hidden;
}

.error-state {
    position: relative;
    width: 100%;
    height: 100%;
}

.blur-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: blur(10px);
}

.error-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: oklch(1 0 0 / 0.5); /* 50% opacity white */
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 0.25rem;
}

.error-text {
    font-family: var(--headings);
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-error-base);
    text-align: center;
}

.error-detail {
    font-size: 0.625rem;
    color: var(--color-text-dimmed);
}
</style>
```

**Success Criteria**:
- ✅ Missing dimensions trigger error state
- ✅ Invalid dimensions (≤0) trigger error state
- ✅ BlurHash displays as background
- ✅ White overlay (50% opacity) shows error
- ✅ Error message clearly visible

---

#### Task 1.2: Avatar Shape Detection (xmlid-based) 🎭

**Goal**: Auto-detect rounded vs square avatar based on xmlid

**Implementation**:
```typescript
// Avatar shape detection
const avatarShape = computed(() => {
    if (props.shape !== 'avatar') return null
    
    // Check xmlid pattern for square avatar indicators
    // Example: xmlid="project_123" → square
    // Example: xmlid="user_456" → round
    const xmlid = props.data.xmlid || ''
    
    const squarePatterns = ['project', 'event', 'location', 'post']
    const isSquare = squarePatterns.some(pattern => xmlid.includes(pattern))
    
    return isSquare ? 'square' : 'round'
})
```

**Avatar CSS**:
```css
.shape-avatar.avatar-round {
    border-radius: 50%;
}

.shape-avatar.avatar-square {
    border-radius: var(--radius-small);
}
```

**Success Criteria**:
- ✅ Detect square avatar from xmlid patterns
- ✅ Default to round avatar
- ✅ Apply correct border-radius
- ✅ Works without xmlid (defaults to round)

---

### Part II: Helper for ImageAdmin (ShapeEditor Integration) 🛠️

#### Task 2.1: Preview State Management (Delete ImageAdmin Intermediary State) 🗑️

**Goal**: ImgShape becomes the single source of truth for preview settings

**Current Problem**: ImageAdmin has these intermediary refs:
- `cardWideShapeUrl`, `tileWideShapeUrl`, `avatarThumbShapeUrl`, `verticalShapeUrl`
- `cardWideX`, `cardWideY`, `cardWideZ`
- `tileSquareX`, `tileSquareY`, `tileSquareZ`
- `PreviewWide`, `CorrectionWide`

**Solution**: ImgShape manages its own preview state and exposes via function

**ImgShape Internal State**:
```typescript
// Preview state (internal to ImgShape)
const previewState = ref({
    url: '',
    params: {
        x: null as number | null,
        y: null as number | null,
        z: null as number | null
    },
    mode: 'original' as 'original' | 'preview' | 'saved'
})

// Detect adapter from URL
const adapter = computed(() => {
    const url = props.data.url || ''
    if (url.includes('images.unsplash.com')) return 'unsplash'
    if (url.includes('res.cloudinary.com')) return 'cloudinary'
    if (url.includes('vimeo.com')) return 'vimeo'
    return 'external'
})

// Get preview data (exposed to parent)
const getPreviewData = () => {
    return {
        url: previewState.value.url || props.data.url,
        params: previewState.value.params,
        adapter: adapter.value,
        mode: previewState.value.mode
    }
}

// Expose to parent
defineExpose({
    getPreviewData,
    resetPreview: () => {
        previewState.value = {
            url: '',
            params: { x: null, y: null, z: null },
            mode: 'original'
        }
    }
})
```

**ImageAdmin Updates**:
```typescript
// DELETE these refs (no longer needed):
// const cardWideShapeUrl = ref<string>('')
// const cardWideX = ref<number | null>(null)
// etc.

// KEEP only template refs:
const cardShapeRef = ref<any | null>(null)
const tileShapeRef = ref<any | null>(null)
const avatarShapeRef = ref<any | null>(null)
const verticalShapeRef = ref<any | null>(null)

// Use ImgShape's data:
const saveCardWideUrl = () => {
    const preview = cardShapeRef.value?.getPreviewData?.()
    if (preview?.url) {
        selectedImage.value.shape_wide = {
            ...selectedImage.value.shape_wide,
            url: preview.url,
            x: preview.params?.x ?? null,
            y: preview.params?.y ?? null,
            z: preview.params?.z ?? null
        }
    }
    checkDirty()
}
```

**Success Criteria**:
- ✅ ImgShape stores preview state internally
- ✅ No intermediary refs in ImageAdmin
- ✅ getPreviewData() provides current settings
- ✅ resetPreview() clears state on record load

---

#### Task 2.2: Click-to-Edit Activation (ShapeEditor Trigger) 🖱️

**Goal**: Click on ImgShape activates ShapeEditor in ImageAdmin

**ImgShape Click Handler**:
```vue
<script setup lang="ts">
const emit = defineEmits<{
    activate: [data: { shape: string, variant: string, adapter: string }]
}>()

const handleClick = () => {
    if (props.editable) {
        emit('activate', {
            shape: props.shape,
            variant: props.variant || 'default',
            adapter: adapter.value
        })
    }
}
</script>

<template>
    <div 
        class="img-shape" 
        :class="{ 'editable': editable }"
        @click="handleClick"
    >
        <!-- Image content -->
    </div>
</template>

<style scoped>
.img-shape.editable {
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
}

.img-shape.editable:hover {
    transform: scale(1.02);
    box-shadow: 0 4px 12px oklch(0 0 0 / 0.2);
}

.img-shape.editable.active {
    outline: 2px solid var(--color-primary-base);
    outline-offset: 2px;
}
</style>
```

**Success Criteria**:
- ✅ Click emits 'activate' event with shape info
- ✅ Hover shows interactive state
- ✅ Active state shows outline
- ✅ Non-editable mode has no interaction

---

#### Task 2.3: ShapeEditor Component (New Component) 🎛️

**Location**: Create `src/components/images/ShapeEditor.vue`

**Goal**: Replace all shape-editing controls in ImageAdmin aside with unified editor

**Three Modes**:
1. **Shape-based Automation**: Per-shape, per-adapter presets
2. **XYZ Input**: Manual parameter entry
3. **Direct URL Edit**: Edit transformation string + tpar

**Component Structure**:
```vue
<script setup lang="ts">
interface Props {
    shape: 'square' | 'wide' | 'vertical' | 'thumb'
    adapter: 'unsplash' | 'cloudinary' | 'vimeo' | 'external'
    data: {
        x?: number | null
        y?: number | null
        z?: number | null
        url: string
        tpar?: string | null
    }
}

const props = defineProps<Props>()
const emit = defineEmits<{
    update: [data: Partial<Props['data']>]
    preview: []
}>()

const editMode = ref<'automation' | 'xyz' | 'direct'>('automation')

// Automation presets per shape + adapter
const automationPresets = {
    unsplash: {
        square: { crop: 'entropy', fit: 'crop' },
        wide: { crop: 'focalpoint', fit: 'crop' },
        vertical: { crop: 'faces', fit: 'crop' },
        thumb: { crop: 'entropy', fit: 'crop', auto: 'format' }
    },
    cloudinary: {
        square: { gravity: 'auto', crop: 'fill' },
        wide: { gravity: 'face', crop: 'fill' },
        vertical: { gravity: 'faces', crop: 'fill' },
        thumb: { gravity: 'auto', crop: 'thumb' }
    }
}

// Get available params for current adapter
const availableParams = computed(() => {
    if (props.adapter === 'unsplash') {
        return ['w', 'h', 'fit', 'crop', 'fp-x', 'fp-y', 'fp-z', 'auto', 'q']
    } else if (props.adapter === 'cloudinary') {
        return ['w', 'h', 'c', 'g', 'x', 'y', 'z', 'q', 'f']
    }
    return []
})

// Parse transformation string from URL
const transformationString = computed(() => {
    if (props.adapter === 'unsplash') {
        const url = new URL(props.data.url)
        return url.search.substring(1) // Remove leading '?'
    } else if (props.adapter === 'cloudinary') {
        const match = props.data.url.match(/\/image\/upload\/([^/]+)\//)
        return match ? match[1] : ''
    }
    return ''
})

// Update transformation
const updateTransformation = (newTransform: string) => {
    let newUrl = props.data.url
    
    if (props.adapter === 'unsplash') {
        const url = new URL(props.data.url)
        newUrl = `${url.origin}${url.pathname}?${newTransform}`
    } else if (props.adapter === 'cloudinary') {
        newUrl = props.data.url.replace(
            /\/image\/upload\/[^/]+\//,
            `/image/upload/${newTransform}/`
        )
    }
    
    emit('update', { url: newUrl })
}
</script>

<template>
    <div class="shape-editor">
        <!-- Header: Shape + Adapter Info -->
        <div class="editor-header">
            <div class="shape-info">
                <span class="shape-name">{{ shape }}</span>
                <span class="adapter-badge">{{ adapter }}</span>
            </div>
            
            <!-- Mode Switcher -->
            <div class="mode-switcher">
                <button 
                    :class="{ active: editMode === 'automation' }"
                    @click="editMode = 'automation'"
                >
                    Auto
                </button>
                <button 
                    :class="{ active: editMode === 'xyz' }"
                    @click="editMode = 'xyz'"
                >
                    XYZ
                </button>
                <button 
                    :class="{ active: editMode === 'direct' }"
                    @click="editMode = 'direct'"
                >
                    Direct
                </button>
            </div>
        </div>
        
        <!-- Mode 1: Automation -->
        <div v-if="editMode === 'automation'" class="editor-content">
            <h5>Shape-based Automation</h5>
            <p class="hint">Optimized settings for {{ shape }} on {{ adapter }}</p>
            
            <div class="preset-info">
                <strong>Applied Params:</strong>
                <ul>
                    <li v-for="(value, key) in automationPresets[adapter]?.[shape]" :key="key">
                        <code>{{ key }}</code>: {{ value }}
                    </li>
                </ul>
            </div>
            
            <button @click="$emit('preview')" class="btn-preview">
                Apply & Preview
            </button>
        </div>
        
        <!-- Mode 2: XYZ Input -->
        <div v-else-if="editMode === 'xyz'" class="editor-content">
            <h5>Manual Parameters</h5>
            
            <div class="param-inputs">
                <div class="param-field">
                    <label>X (horizontal %)</label>
                    <input 
                        type="number" 
                        :value="data.x ?? ''"
                        @input="$emit('update', { x: parseInt($event.target.value) || null })"
                        min="0" 
                        max="100"
                        placeholder="50"
                    />
                </div>
                
                <div class="param-field">
                    <label>Y (vertical %)</label>
                    <input 
                        type="number" 
                        :value="data.y ?? ''"
                        @input="$emit('update', { y: parseInt($event.target.value) || null })"
                        min="0" 
                        max="100"
                        placeholder="50"
                    />
                </div>
                
                <div class="param-field">
                    <label>Z (zoom %)</label>
                    <input 
                        type="number" 
                        :value="data.z ?? ''"
                        @input="$emit('update', { z: parseInt($event.target.value) || null })"
                        min="0" 
                        max="100"
                        placeholder="0"
                    />
                </div>
            </div>
            
            <button @click="$emit('preview')" class="btn-preview">
                Preview with XYZ
            </button>
        </div>
        
        <!-- Mode 3: Direct URL Edit -->
        <div v-else class="editor-content">
            <h5>Direct Edit</h5>
            
            <!-- Transformation String -->
            <div class="url-editor">
                <label>Transformation String</label>
                <div class="url-parts">
                    <span class="url-prefix dimmed">
                        {{ adapter === 'unsplash' ? '...?' : '.../upload/' }}
                    </span>
                    <input 
                        type="text" 
                        :value="transformationString"
                        @input="updateTransformation($event.target.value)"
                        placeholder="w=336&h=168&fit=crop"
                        class="transform-input"
                    />
                    <span class="url-suffix dimmed">
                        {{ adapter === 'unsplash' ? '' : '/v123/...' }}
                    </span>
                </div>
            </div>
            
            <!-- tpar (URL Template) -->
            <div class="url-editor">
                <label>tpar (URL Template)</label>
                <textarea 
                    :value="data.tpar ?? ''"
                    @input="$emit('update', { tpar: $event.target.value })"
                    rows="3"
                    placeholder="https://.../{turl}/..."
                    class="tpar-input"
                />
            </div>
            
            <!-- Available Params Reference -->
            <div class="params-reference">
                <strong>Available Params:</strong>
                <div class="param-chips">
                    <span v-for="param in availableParams" :key="param" class="param-chip">
                        {{ param }}
                    </span>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.shape-editor {
    background: var(--color-card-bg);
    border-radius: var(--radius-medium);
    padding: 1rem;
}

.editor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--color-border);
}

.shape-info {
    display: flex;
    gap: 0.5rem;
    align-items: center;
}

.shape-name {
    font-family: var(--headings);
    font-size: 1rem;
    font-weight: 600;
    text-transform: capitalize;
}

.adapter-badge {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast);
    border-radius: var(--radius-small);
}

.mode-switcher {
    display: flex;
    gap: 0.25rem;
    background: var(--color-muted-bg);
    padding: 0.25rem;
    border-radius: var(--radius-small);
}

.mode-switcher button {
    padding: 0.375rem 0.75rem;
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 0.875rem;
    border-radius: var(--radius-small);
    transition: background 0.2s;
}

.mode-switcher button.active {
    background: var(--color-card-bg);
    font-weight: 600;
}

.editor-content h5 {
    margin: 0 0 0.5rem 0;
    font-size: 0.875rem;
    font-weight: 600;
}

.hint {
    font-size: 0.75rem;
    color: var(--color-text-dimmed);
    margin-bottom: 1rem;
}

.preset-info ul {
    list-style: none;
    padding: 0;
    margin: 0.5rem 0;
}

.preset-info li {
    font-size: 0.875rem;
    padding: 0.25rem 0;
}

.param-inputs {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1rem;
}

.param-field label {
    font-size: 0.75rem;
    font-weight: 600;
    margin-bottom: 0.25rem;
    display: block;
}

.param-field input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-small);
    background: var(--color-card-bg);
}

.url-editor {
    margin-bottom: 1rem;
}

.url-editor label {
    font-size: 0.75rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    display: block;
}

.url-parts {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-family: monospace;
    font-size: 0.75rem;
}

.url-prefix,
.url-suffix {
    color: var(--color-text-dimmed);
}

.transform-input,
.tpar-input {
    flex: 1;
    padding: 0.5rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-small);
    background: var(--color-card-bg);
    font-family: monospace;
    font-size: 0.75rem;
}

.params-reference {
    font-size: 0.75rem;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--color-border);
}

.param-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    margin-top: 0.5rem;
}

.param-chip {
    padding: 0.25rem 0.5rem;
    background: var(--color-muted-bg);
    border-radius: var(--radius-small);
    font-family: monospace;
}

.btn-preview {
    width: 100%;
    padding: 0.75rem;
    background: var(--color-accent-bg);
    color: var(--color-accent-contrast);
    border: none;
    border-radius: var(--radius-medium);
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s;
}

.btn-preview:hover {
    opacity: 0.9;
}
</style>
```

**Success Criteria**:
- ✅ Three modes switchable via tabs
- ✅ Automation mode shows presets per shape+adapter
- ✅ XYZ mode has three number inputs
- ✅ Direct mode edits transformation string
- ✅ Displays available params reference
- ✅ Emits update events to parent

---

#### Task 2.4: ImageAdmin Integration (Delete Old Controls) 🗑️

**Goal**: Replace aside controls with ShapeEditor, triggered by ImgShape click

**Changes to ImagesCoreAdmin.vue**:

1. **Delete Section**: Lines ~1400-1600 (Author Adapter Tabs onward)
2. **Add ShapeEditor Import**:
```typescript
import ShapeEditor from '@/components/images/ShapeEditor.vue'
```

3. **Add Active Shape State**:
```typescript
const activeShape = ref<{
    shape: 'square' | 'wide' | 'vertical' | 'thumb'
    variant: string
    adapter: string
} | null>(null)

const handleShapeActivate = (data: any) => {
    activeShape.value = data
}
```

4. **Replace Aside Content** (~line 1350):
```vue
<template #aside>
    <div class="aside-content">
        <div v-if="!selectedImage" class="no-selection">
            Select an image to view details
        </div>

        <div v-else class="image-details">
            <!-- Save and Delete buttons (keep existing) -->
            <div class="save-section">
                <!-- existing buttons -->
            </div>

            <!-- Basic fields (keep existing) -->
            <div class="editable-fields">
                <!-- Status, Name, Alt Text, XML ID (keep existing) -->
                <!-- CTags section (keep existing) -->
            </div>

            <!-- Divider -->
            <hr class="form-divider">

            <!-- NEW: ShapeEditor (replaces all shape controls) -->
            <div v-if="activeShape" class="shape-editor-section">
                <ShapeEditor
                    :shape="activeShape.shape"
                    :adapter="activeShape.adapter"
                    :data="selectedImage[`shape_${activeShape.shape}`]"
                    @update="(data) => updateShapeData(activeShape.shape, data)"
                    @preview="previewShape(activeShape.shape)"
                />
            </div>
            
            <div v-else class="no-shape-selected">
                <p>Click on a shape in the header to edit</p>
            </div>
        </div>
    </div>
</template>
```

5. **Update ImgShape Components in Header** (~line 980):
```vue
<ImgShape 
    ref="cardShapeRef" 
    v-if="cardWidePreviewData" 
    :data="cardWidePreviewData"
    shape="card" 
    variant="wide" 
    class="CardShape" 
    :forceBlur="blurImagesPreview"
    :editable="true"
    :active="activeShape?.shape === 'wide'"
    @activate="handleShapeActivate"
/>
```

6. **Add Update Handlers**:
```typescript
const updateShapeData = (shape: string, data: Partial<any>) => {
    if (!selectedImage.value) return
    
    const shapeKey = `shape_${shape}`
    selectedImage.value[shapeKey] = {
        ...selectedImage.value[shapeKey],
        ...data
    }
    
    checkDirty()
}

const previewShape = (shape: string) => {
    // Trigger preview update in ImgShape
    const shapeRef = shape === 'square' ? tileShapeRef :
                     shape === 'wide' ? cardShapeRef :
                     shape === 'vertical' ? verticalShapeRef :
                     avatarShapeRef
    
    // ImgShape will update its preview internally
    shapeRef.value?.updatePreview()
}
```

**Success Criteria**:
- ✅ Click on ImgShape activates ShapeEditor
- ✅ ShapeEditor shows in aside
- ✅ All old controls deleted
- ✅ Updates flow: ShapeEditor → ImageAdmin → ImgShape
- ✅ Preview updates visible in header

---

#### Task 2.5: Dirty Detection & State Clearing 🔄

**Goal**: Clear ImgShape preview state on record load, save, or reset

**ImgShape State Clearing**:
```typescript
// In ImgShape.vue
const clearState = () => {
    previewState.value = {
        url: '',
        params: { x: null, y: null, z: null },
        mode: 'original'
    }
    hasError.value = false
    errorMessage.value = ''
}

defineExpose({
    getPreviewData,
    clearState
})
```

**ImageAdmin Integration**:
```typescript
// On record load
function selectImage(image: any) {
    // ... existing code ...
    
    // Clear all ImgShape preview states
    cardShapeRef.value?.clearState()
    tileShapeRef.value?.clearState()
    avatarShapeRef.value?.clearState()
    verticalShapeRef.value?.clearState()
    
    // Clear active shape
    activeShape.value = null
    
    isDirty.value = false
}

// On save
const saveChanges = async () => {
    // ... existing save logic ...
    
    // Clear preview states after successful save
    cardShapeRef.value?.clearState()
    tileShapeRef.value?.clearState()
    avatarShapeRef.value?.clearState()
    verticalShapeRef.value?.clearState()
    
    activeShape.value = null
}
```

**Success Criteria**:
- ✅ Preview state clears on record load
- ✅ Preview state clears on save
- ✅ Active shape resets
- ✅ No stale data between records

---

### Part III: Test Helper (E2E Support) 🧪

#### Task 3.1: Error Overlay for Testing ✅ ALREADY IMPLEMENTED

**Goal**: Visual error indicators for E2E tests

**Already Covered in Task 1.1**:
- White overlay with "Image-Shape-Error" text
- Error detail message
- Visible in screenshots/assertions

**Additional Test Helpers**:
```vue
<script setup lang="ts">
// Add data attributes for testing
const testAttributes = computed(() => {
    return {
        'data-shape': props.shape,
        'data-variant': props.variant,
        'data-adapter': adapter.value,
        'data-has-error': hasError.value,
        'data-error-message': errorMessage.value,
        'data-mode': previewState.value.mode
    }
})
</script>

<template>
    <div class="img-shape" v-bind="testAttributes">
        <!-- ... -->
    </div>
</template>
```

**Success Criteria**:
- ✅ Error state visible in UI
- ✅ Data attributes for E2E selectors
- ✅ Error messages accessible
- ✅ Mode state queryable

---

### Part IV: Reference Implementation (Hero Integration Prep) 🔗

#### Task 4.1: Document Hero Integration Points 📋

**Goal**: Create clear handoff between ImgShape and Hero implementation

**PAUSE POINT 1**: After Task 1.2 (Avatar Detection)

**Document in Plan F (Hero Integration)**:
```markdown
### REFERENCE: ImgShape Avatar Detection

**Location**: `src/components/images/ImgShape.vue` lines 45-60

**Logic**:
```typescript
const avatarShape = computed(() => {
    if (props.shape !== 'avatar') return null
    const xmlid = props.data.xmlid || ''
    const squarePatterns = ['project', 'event', 'location', 'post']
    const isSquare = squarePatterns.some(pattern => xmlid.includes(pattern))
    return isSquare ? 'square' : 'round'
})
```

**Hero Adaptation**:
- Hero doesn't need avatar detection
- But DOES need similar pattern matching for shape selection
- Consider: `heroShape = isMobile ? 'vertical' : 'wide'`
- Pattern: Use computed property for responsive shape selection
```

**PAUSE POINT 2**: After Task 2.3 (ShapeEditor)

**Document in Plan F**:
```markdown
### REFERENCE: ShapeEditor Adapter Presets

**Location**: `src/components/images/ShapeEditor.vue` lines 30-50

**Automation Presets**:
```typescript
const automationPresets = {
    unsplash: {
        wide: { crop: 'focalpoint', fit: 'crop' }
    },
    cloudinary: {
        wide: { gravity: 'face', crop: 'fill' }
    }
}
```

**Hero Requirements**:
- Hero needs same adapter detection logic
- Hero needs same URL building per adapter
- Extract to composable: `useImageAdapter.ts`
- TODO in Task 3A (Hero Phase 1): Copy URL building from ShapeEditor
```

**Success Criteria**:
- ✅ Two clear pause points documented
- ✅ Hero requirements identified
- ✅ Code references provided
- ✅ Pattern extraction noted

---

#### Task 4.2: Extract Reusable Composable (Optional for Plan F) 🎯

**Goal**: Prepare `useImageAdapter` composable for Hero reuse

**Create**: `src/composables/useImageAdapter.ts`

```typescript
/**
 * Image Adapter Composable
 * Shared logic for ImgShape, ShapeEditor, and Hero
 */

export const useImageAdapter = () => {
    // Detect adapter from URL
    const detectAdapter = (url: string): 'unsplash' | 'cloudinary' | 'vimeo' | 'external' => {
        if (url.includes('images.unsplash.com')) return 'unsplash'
        if (url.includes('res.cloudinary.com')) return 'cloudinary'
        if (url.includes('vimeo.com')) return 'vimeo'
        return 'external'
    }
    
    // Build URL for Unsplash
    const buildUnsplashUrl = (baseUrl: string, params: {
        w?: number
        h?: number
        fit?: string
        crop?: string
        'fp-x'?: number
        'fp-y'?: number
        'fp-z'?: number
    }) => {
        const url = new URL(baseUrl)
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                url.searchParams.set(key, String(value))
            }
        })
        return url.toString()
    }
    
    // Build URL for Cloudinary
    const buildCloudinaryUrl = (baseUrl: string, transformations: string) => {
        // Extract parts: account, version, path
        const match = baseUrl.match(/^(https:\/\/res\.cloudinary\.com\/[^\/]+\/image\/upload\/)([^\/]*)(\/.+)$/)
        if (!match) return baseUrl
        
        return `${match[1]}${transformations}${match[3]}`
    }
    
    // Get automation presets
    const getAutomationPresets = (adapter: string, shape: string) => {
        const presets: Record<string, Record<string, any>> = {
            unsplash: {
                square: { crop: 'entropy', fit: 'crop' },
                wide: { crop: 'focalpoint', fit: 'crop' },
                vertical: { crop: 'faces', fit: 'crop' },
                thumb: { crop: 'entropy', fit: 'crop', auto: 'format' }
            },
            cloudinary: {
                square: { gravity: 'auto', crop: 'fill' },
                wide: { gravity: 'face', crop: 'fill' },
                vertical: { gravity: 'faces', crop: 'fill' },
                thumb: { gravity: 'auto', crop: 'thumb' }
            }
        }
        
        return presets[adapter]?.[shape] || {}
    }
    
    return {
        detectAdapter,
        buildUnsplashUrl,
        buildCloudinaryUrl,
        getAutomationPresets
    }
}
```

**Success Criteria**:
- ✅ Composable created
- ✅ Used by ShapeEditor
- ✅ Available for Hero (Plan F)
- ✅ Consistent adapter logic

---

## 📊 Task Summary & Priorities

### High Priority (Complete Today) ✅
1. **Task 1.1**: Dimension validation + error overlay
2. **Task 1.2**: Avatar shape detection
3. **Task 2.1**: Preview state management
4. **Task 2.2**: Click-to-edit activation

### Medium Priority (Complete This Week) ⏳
5. **Task 2.3**: ShapeEditor component
6. **Task 2.4**: ImageAdmin integration
7. **Task 2.5**: Dirty detection & state clearing

### Low Priority (Nice to Have) 🔮
8. **Task 3.1**: Test helpers (data attributes)
9. **Task 4.1**: Hero documentation
10. **Task 4.2**: Extract composable

---

## 🔗 Cross-Plan Integration

### Dependencies
- **Plan E (ImageAdmin)**: Requires Tasks 2.1-2.5 complete
- **Plan F (Hero)**: Benefits from Tasks 4.1-4.2

### Handoff Points
1. After Task 1.2 → Document avatar pattern for Hero
2. After Task 2.3 → Document adapter presets for Hero
3. After Task 4.2 → Composable ready for Hero Phase 1

---

## ✅ Success Criteria (Overall)

### Functional
- ✅ ImgShape enforces known dimensions
- ✅ Error overlay displays on validation failure
- ✅ Avatar shape auto-detected from xmlid
- ✅ Click activates ShapeEditor
- ✅ ShapeEditor has 3 working modes
- ✅ ImageAdmin intermediary state deleted
- ✅ Preview updates flow correctly

### Technical
- ✅ No intermediary refs in ImageAdmin
- ✅ State clears on record load/save
- ✅ Dirty detection works
- ✅ All TypeScript types correct
- ✅ No console errors

### Documentation
- ✅ Hero integration points documented
- ✅ Code patterns extracted
- ✅ TODO comments in Hero plan

---

**Status**: 🔄 Ready to implement  
**Next Action**: Begin Task 1.1 (Dimension validation)  
**Estimated Time**: 6-8 hours for high priority tasks
