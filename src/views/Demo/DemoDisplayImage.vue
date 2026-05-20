<template>
  <div class="demo-display-container">
    <h1>Display Components Demo</h1>
    <p class="demo-intro">
      Testing <code>DisplayImage</code> and <code>DisplayBanner</code> components 
      that fetch images by <code>xmlid</code>.
    </p>

    <!-- xmlid Input -->
    <div class="demo-controls">
      <label for="xmlid-input">Test xmlid:</label>
      <input 
        id="xmlid-input"
        v-model="testXmlid" 
        type="text" 
        placeholder="e.g., tp.image.landscape-001"
        class="demo-input"
      />
      <span class="demo-hint">
        Enter an existing image xmlid from your database
      </span>
    </div>

    <hr />

    <!-- Section 1: DisplayImage in Container -->
    <section class="demo-section">
      <h2>1. DisplayImage in Container</h2>
      <p>Standard usage with float behavior (50% width on desktop).</p>

      <Container>
        <h3>Left Placement (default)</h3>
        <DisplayImage 
          :xmlid="testXmlid" 
          placement="left"
          caption="author"
        />
        <Prose>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod 
            tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, 
            quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          </p>
          <p>
            Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore 
            eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, 
            sunt in culpa qui officia deserunt mollit anim id est laborum.
          </p>
          <p>
            Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium 
            doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore 
            veritatis et quasi architecto beatae vitae dicta sunt explicabo.
          </p>
        </Prose>
        <div style="clear: both;" />
      </Container>

      <Container>
        <h3>Right Placement with Caption</h3>
        <DisplayImage 
          :xmlid="testXmlid" 
          placement="right"
          caption="full"
          padding="small"
          background="muted"
        />
        <Prose>
          <p>
            Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, 
            sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.
          </p>
          <p>
            Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, 
            adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et 
            dolore magnam aliquam quaerat voluptatem.
          </p>
          <p>
            Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit 
            laboriosam, nisi ut aliquid ex ea commodi consequatur?
          </p>
        </Prose>
        <div style="clear: both;" />
      </Container>
    </section>

    <hr />

    <!-- Section 2: DisplayImage in Columns -->
    <section class="demo-section">
      <h2>2. DisplayImage in Columns</h2>
      <p>With <code>isColumn=true</code>, image takes 100% of column width.</p>

      <Columns>
        <Column>
          <DisplayImage 
            :xmlid="testXmlid" 
            :is-column="true"
            caption="description"
          />
        </Column>
        <Column>
          <Prose>
            <h4>Column Content</h4>
            <p>
              This demonstrates DisplayImage inside a Columns layout. 
              The image fills 100% of its column because <code>isColumn=true</code>.
            </p>
            <p>
              The aspect ratio is preserved using CSS <code>aspect-ratio: 531 / 300</code>.
            </p>
          </Prose>
        </Column>
      </Columns>
    </section>

    <hr />

    <!-- Section 3: DisplayBanner -->
    <section class="demo-section">
      <h2>3. DisplayBanner</h2>
      <p>Full-width banner with 4:1 aspect ratio (1062×265.5).</p>

      <Container>
        <h3>Basic Banner</h3>
        <DisplayBanner 
          :xmlid="testXmlid"
          caption="none"
        />
      </Container>

      <Container>
        <h3>Banner with Author Caption</h3>
        <DisplayBanner 
          :xmlid="testXmlid"
          caption="author"
          padding="medium"
        />
      </Container>

      <Container>
        <h3>Banner with Full Caption</h3>
        <DisplayBanner 
          :xmlid="testXmlid"
          caption="full"
          background="muted"
          padding="large"
        />
      </Container>
    </section>

    <hr />

    <!-- Section 4: Props Showcase -->
    <section class="demo-section">
      <h2>4. Props Showcase</h2>
      
      <div class="props-grid">
        <div class="prop-demo">
          <h4>padding="none"</h4>
          <DisplayImage :xmlid="testXmlid" :is-column="true" padding="none" />
        </div>
        <div class="prop-demo">
          <h4>padding="small"</h4>
          <DisplayImage :xmlid="testXmlid" :is-column="true" padding="small" />
        </div>
        <div class="prop-demo">
          <h4>padding="medium"</h4>
          <DisplayImage :xmlid="testXmlid" :is-column="true" padding="medium" />
        </div>
        <div class="prop-demo">
          <h4>padding="large"</h4>
          <DisplayImage :xmlid="testXmlid" :is-column="true" padding="large" />
        </div>
      </div>

      <div class="props-grid">
        <div class="prop-demo">
          <h4>background="inherit"</h4>
          <DisplayImage :xmlid="testXmlid" :is-column="true" background="inherit" />
        </div>
        <div class="prop-demo">
          <h4>background="standard"</h4>
          <DisplayImage :xmlid="testXmlid" :is-column="true" background="standard" />
        </div>
        <div class="prop-demo">
          <h4>background="muted"</h4>
          <DisplayImage :xmlid="testXmlid" :is-column="true" background="muted" />
        </div>
        <div class="prop-demo">
          <h4>background="accent"</h4>
          <DisplayImage :xmlid="testXmlid" :is-column="true" background="accent" />
        </div>
      </div>
    </section>

    <hr />

    <!-- Section 5: Error States -->
    <section class="demo-section">
      <h2>5. Error States</h2>
      
      <Columns>
        <Column>
          <h4>Invalid xmlid</h4>
          <DisplayImage xmlid="non.existent.image.12345" :is-column="true" />
        </Column>
        <Column>
          <h4>Empty xmlid</h4>
          <DisplayImage xmlid="" :is-column="true" />
        </Column>
      </Columns>
    </section>

    <hr />

    <!-- Section 6: API Response Preview -->
    <section class="demo-section">
      <h2>6. API Response Preview</h2>
      <p>Raw response from <code>/api/images/xmlid/:xmlid</code></p>
      
      <button @click="fetchApiResponse" class="demo-button">
        Fetch API Response
      </button>
      
      <pre v-if="apiResponse" class="api-response">{{ JSON.stringify(apiResponse, null, 2) }}</pre>
      <p v-if="apiError" class="api-error">{{ apiError }}</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Container from '@/components/Container.vue'
import Columns from '@/components/Columns.vue'
import Column from '@/components/Column.vue'
import Prose from '@/components/Prose.vue'
import { DisplayImage, DisplayBanner } from '@/components/display'

// Demo state
const testXmlid = ref('tp.image.landscape-001')
const apiResponse = ref<any>(null)
const apiError = ref<string | null>(null)

// Fetch API response for debugging
async function fetchApiResponse() {
  apiResponse.value = null
  apiError.value = null
  
  try {
    const response = await fetch(`/api/images/xmlid/${encodeURIComponent(testXmlid.value)}`)
    
    if (!response.ok) {
      const error = await response.json()
      apiError.value = `${response.status}: ${error.message || response.statusText}`
      return
    }
    
    apiResponse.value = await response.json()
  } catch (err) {
    apiError.value = err instanceof Error ? err.message : 'Network error'
  }
}
</script>

<style scoped>
.demo-display-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  margin-bottom: 0.5rem;
  color: var(--color-text);
}

.demo-intro {
  color: var(--color-text-muted);
  margin-bottom: 2rem;
}

.demo-intro code {
  background: var(--color-background-muted);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.875em;
}

.demo-controls {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 2rem;
  max-width: 400px;
}

.demo-controls label {
  font-weight: 600;
  color: var(--color-text);
}

.demo-input {
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  font-size: 1rem;
  font-family: monospace;
}

.demo-hint {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

hr {
  margin: 3rem 0;
  border: none;
  border-top: 1px solid var(--color-border);
}

.demo-section {
  margin-bottom: 2rem;
}

.demo-section h2 {
  margin-bottom: 0.5rem;
  color: var(--color-text);
}

.demo-section > p {
  color: var(--color-text-muted);
  margin-bottom: 1.5rem;
}

.demo-section h3 {
  margin-top: 2rem;
  margin-bottom: 1rem;
  font-size: 1.125rem;
  color: var(--color-text);
}

.props-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.prop-demo {
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  padding: 1rem;
  background: var(--color-background);
}

.prop-demo h4 {
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
  font-family: monospace;
  color: var(--color-text-muted);
}

.demo-button {
  padding: 0.75rem 1.5rem;
  background: var(--color-primary-bg);
  color: var(--color-primary-contrast);
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.demo-button:hover {
  opacity: 0.9;
}

.api-response {
  margin-top: 1rem;
  padding: 1rem;
  background: var(--color-background-muted);
  border-radius: 0.5rem;
  font-size: 0.75rem;
  overflow-x: auto;
  max-height: 400px;
  overflow-y: auto;
}

.api-error {
  margin-top: 1rem;
  padding: 1rem;
  background: #fee2e2;
  color: #991b1b;
  border-radius: 0.5rem;
}
</style>
