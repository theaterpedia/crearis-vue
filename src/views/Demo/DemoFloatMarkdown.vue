<template>
    <div class="demo-float-markdown">
        <Section background="default">
            <Container>
                <Prose>
                    <h1>Floating Post-Its Demo: Markdown Integration</h1>
                    <p>
                        This demo shows how to use the floating post-it system with <strong>Markdown</strong>.
                        Post-its are embedded in markdown content using the <code>::fpostit</code> syntax.
                    </p>

                    <div v-if="!markedAvailable" class="warning-box">
                        <h3>⚠️ Marked.js Not Installed</h3>
                        <p>
                            To use the markdown integration feature, you need to install <code>marked</code>:
                        </p>
                        <pre><code>npm install marked</code></pre>
                        <p>After installation, refresh this page to see the markdown demo.</p>
                    </div>
                </Prose>

                <div v-if="markedAvailable" ref="markdownContainer" class="markdown-demo" v-html="renderedMarkdown">
                </div>

                <Prose v-else>
                    <h2>Markdown Syntax Example</h2>
                    <p>Here's how you would write floating post-its in markdown:</p>
                    <pre><code>{{ markdownSource }}</code></pre>
                </Prose>
            </Container>
        </Section>

        <!-- Floating Post-It Renderer -->
        <FpostitRenderer />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import Section from '@/components/Section.vue'
import Container from '@/components/Container.vue'
import Prose from '@/components/Prose.vue'
import { useFpostitController } from '@/fpostit/composables/useFpostitController'
import FpostitRenderer from '@/fpostit/components/FpostitRenderer.vue'

const controller = useFpostitController()
const markdownContainer = ref<HTMLElement>()
const renderedMarkdown = ref('')
const markedAvailable = ref(false)

const markdownSource = `## Welcome to Markdown Integration

This content is written in **Markdown** and contains floating post-its!

::fpostit[p1]{title="💡 Pro Tip" color="accent" hlogic="right"}
You can use **markdown** inside post-its!

- Bullet lists
- *Italic* and **bold** text
- [Links](https://example.com)

[Learn More](#){.fpostact1}
[Got It](#){.fpostact2}
::

Here's some regular markdown content between post-its.

::fpostit[p2]{title="📚 Documentation" color="primary" hlogic="left"}
Check out our comprehensive documentation:

1. Getting Started Guide
2. API Reference
3. Best Practices

[Read Docs](#docs){.fpostact1}
::

More content here...

::fpostit[p3]{title="⚠️ Important Notice" color="warning" hlogic="element" image="https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=200&fit=crop"}
System maintenance scheduled for this weekend.

**When:** Saturday 2-6 AM UTC
**Impact:** Brief interruptions

[View Schedule](#){.fpostact1}
[Dismiss](#){.fpostact2}
::

And more markdown content after the post-its!
`

onMounted(async () => {
    // Check if marked is available
    try {
        const { marked } = await import('marked')
        const { fpostitExtension } = await import('@/fpostit/utils/markedExtension')

        markedAvailable.value = true

        // Configure marked with extension
        marked.use(fpostitExtension)

        // Render markdown
        renderedMarkdown.value = await marked.parse(markdownSource)

        // Wait for DOM update
        await nextTick()

        // Discover post-its from rendered HTML
        if (markdownContainer.value) {
            const count = controller.discoverFromDOM({
                root: markdownContainer.value,
                attachHandlers: true
            })
            console.log(`[fpostit] Discovered ${count} post-its from markdown`)
        }
    } catch (error) {
        console.warn('[fpostit] marked.js not available:', error)
        markedAvailable.value = false
    }
})
</script>

<style scoped>
.demo-float-markdown {
    min-height: 100vh;
    padding: 2rem 0;
}

.warning-box {
    margin: 2rem 0;
    padding: 1.5rem;
    background: var(--color-warning-bg);
    color: var(--color-warning-contrast);
    border-radius: 0.5rem;
    border-left: 4px solid currentColor;
}

.warning-box h3 {
    margin-top: 0;
}

.warning-box pre {
    background: rgba(0, 0, 0, 0.1);
    padding: 0.5rem;
    border-radius: 0.25rem;
    overflow-x: auto;
}

.warning-box code {
    font-family: monospace;
}

.markdown-demo {
    margin: 2rem 0;
}

.markdown-demo :deep(h2) {
    margin-top: 2rem;
    margin-bottom: 1rem;
    font-size: 1.5rem;
    font-weight: 600;
}

.markdown-demo :deep(p) {
    margin: 1rem 0;
    line-height: 1.6;
}

.markdown-demo :deep(ul),
.markdown-demo :deep(ol) {
    margin: 1rem 0;
    padding-left: 2rem;
}

.markdown-demo :deep(li) {
    margin: 0.5rem 0;
}

.markdown-demo :deep(a) {
    color: var(--color-primary-bg);
    text-decoration: underline;
}

.markdown-demo :deep([data-fpostcontainer]) {
    margin: 1rem 0;
}

.markdown-demo :deep([data-fpostlink]) {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast);
    text-decoration: none;
    border-radius: 0.375rem;
    font-weight: 500;
    transition: transform 0.2s, opacity 0.2s;
}

.markdown-demo :deep([data-fpostlink]:hover) {
    transform: translateY(-2px);
    opacity: 0.9;
}

pre code {
    display: block;
    padding: 1rem;
    background: var(--color-muted-bg);
    border-radius: 0.375rem;
    overflow-x: auto;
    font-family: monospace;
    font-size: 0.9em;
    line-height: 1.5;
}
</style>
