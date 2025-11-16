<script lang="ts" setup>
import { computed } from 'vue'
import Prose from './Prose.vue'

const props = defineProps({
  filled: { type: Boolean, default: false },
  padding: { type: Boolean, default: false },
  extended: { type: Boolean, default: false },
  logoSize: { type: String, default: 'lg' }, // sm, lg
  hideSearch: { type: Boolean, default: false, required: false },
  hideLogo: { type: Boolean, default: false, required: false },
})

const textShadow = 'text-shadow: 0.2rem 0.2rem 0.3rem hsla(110, 10%, 0%, 0.8);'

// Computed classes based on props
const containerClasses = computed(() => {
  const classes = ['logo-container']
  if (props.logoSize === 'sm') {
    classes.push('logo-container-row')
  } else {
    classes.push('logo-container-responsive')
  }
  return classes.join(' ')
})

const logoClasses = computed(() => {
  const classes = ['logo-content']
  if (props.padding) {
    classes.push('logo-padding')
  }
  return classes.join(' ')
})

const headingClasses = computed(() => {
  return props.logoSize === 'lg' ? 'logo-heading-lg' : 'logo-heading-sm'
})

const searchClasses = computed(() => {
  return props.logoSize === 'lg' ? 'logo-search-lg' : 'logo-search-sm'
})
</script>

<template>
  <div :class="containerClasses">
    <div v-show="!hideLogo" :class="logoClasses" :style="textShadow">
      <Prose>
        <h1 :class="headingClasses" style="line-height: 0.25">
          <strong>
            <span style="color: var(--color-accent-contrast)">Theater</span>
            <span style="color: var(--color-primary-bg)">pedia</span>
          </strong>
          <span v-show="extended" class="line-solid subline"
            style="margin-left: 0.4em; margin-top: -0.5em; color: var(--color-primary-bg)">
            Theaterpädagogik
          </span>
          <span v-show="extended" class="line-dashed subline" style="color: var(--color-accent-contrast)">
            suchen und finden
          </span>
        </h1>
      </Prose>
    </div>

    <!-- Search component placeholder - DesktopSearch doesn't exist in current system -->
    <!-- TODO: Implement search component or remove if not needed -->
    <div v-show="!hideSearch && false" :class="searchClasses" class="logo-search"
      style="box-shadow: var(--theme-shadow)">
      <!-- Search component would go here -->
    </div>
  </div>
</template>

<style scoped>
/* Logo Container Layouts */
.logo-container {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  /* 8px */
}

.logo-container-row {
  flex-direction: row;
  align-items: center;
}

.logo-container-responsive {
  flex-direction: column;
  margin-left: 0.25rem;
}

/* Responsive adjustments for logo container */
@media (min-width: 640px) {
  .logo-container-responsive {
    margin-left: 1rem;
  }
}

@media (min-width: 768px) {
  .logo-container-responsive {
    margin-left: 0;
    flex-direction: row;
    align-items: center;
  }
}

@media (min-width: 1280px) {
  .logo-container {
    padding-right: 5rem;
    /* xl:pr-20 = 80px */
  }
}

/* Logo Content */
.logo-content {
  font-weight: 600;
  /* font-semibold */
}

/* Logo Padding variants */
.logo-padding {
  padding-left: 0.25rem;
  /* pl-1 */
}

@media (min-width: 640px) {
  .logo-padding {
    padding-left: 0.5rem;
    /* sm:pl-2 */
  }
}

@media (min-width: 768px) {
  .logo-padding {
    padding-left: 1rem;
    /* md:pl-4 */
  }
}

@media (min-width: 1024px) {
  .logo-padding {
    padding-left: 1.5rem;
    /* lg:pl-6 */
  }
}

@media (min-width: 1280px) {
  .logo-padding {
    padding-left: 2rem;
    /* xl:pl-8 */
  }
}

/* Logo Heading Sizes */
.logo-heading-lg {
  font-size: 0.875rem;
  /* text-sm */
}

@media (min-width: 640px) {
  .logo-heading-lg {
    font-size: 1rem;
    /* sm:text-base */
  }
}

@media (min-width: 768px) {
  .logo-heading-lg {
    font-size: 1.25rem;
    /* md:text-xl */
  }
}

@media (min-width: 1024px) {
  .logo-heading-lg {
    font-size: 1.5rem;
    /* lg:text-2xl */
  }
}

@media (min-width: 1536px) {
  .logo-heading-lg {
    font-size: 1.875rem;
    /* 2xl:text-3xl */
  }
}

.logo-heading-sm {
  font-size: 0.5em;
  /* text-[0.5em] */
}

@media (min-width: 768px) {
  .logo-heading-sm {
    padding-top: 0.5rem;
    /* md:pt-2 */
  }
}

@media (min-width: 1024px) {
  .logo-heading-sm {
    font-size: 0.75em;
    /* lg:text-[0.75em] */
  }
}

/* Logo Search */
.logo-search {
  flex-grow: 1;
  max-width: 24rem;
  /* max-w-sm = 384px */
}

.logo-search-lg {
  font-size: 1em;
}

@media (min-width: 1024px) {
  .logo-search-lg {
    max-width: 28rem;
    /* lg:max-w-md = 448px */
  }

  .logo-search-lg.logo-search {
    max-width: 32rem;
    /* lg:max-w-lg = 512px */
  }
}

.logo-search-sm {
  font-size: 0.7em;
}

@media (min-width: 1280px) {
  .logo-search-sm {
    max-width: 28rem;
    /* xl:max-w-md */
  }
}

/* Subline Styles */
.subline {
  letter-spacing: 0.075em;
}

.line-solid {
  text-decoration: overline 2px var(--color-primary-base);
}

.line-dashed {
  text-decoration: overline dashed 2px var(--color-primary-base);
}

@media (min-width: 900px) {
  .line-dashed::after {
    content: '......';
    min-width: 10px;
    overflow-y: none;
    color: rgba(0, 0, 0, 0);
    text-shadow: none;
    text-decoration: overline dashed 2px var(--color-primary-base);
  }
}
</style>
