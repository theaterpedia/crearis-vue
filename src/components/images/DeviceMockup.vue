<template>
    <div class="device-mockup" :class="`device-mockup-${mode}`">
        <!-- Desktop Mode: No frame -->
        <div v-if="mode === 'desktop'" class="desktop-preview">
            <img :src="imageUrl" :alt="alt" class="preview-image" />
        </div>

        <!-- Mobile Modes: Phone frame -->
        <div v-else-if="mode === 'mobile-50' || mode === 'mobile-100'" class="mobile-preview"
            :class="{ 'mobile-50': mode === 'mobile-50', 'mobile-100': mode === 'mobile-100' }">
            <div class="device-frame phone-frame">
                <!-- Device SVG as background -->
                <div class="device-body">
                    <!-- Screen content area -->
                    <div class="screen-content">
                        <img :src="imageUrl" :alt="alt" class="preview-image" />
                    </div>
                </div>
            </div>
        </div>

        <!-- Tablet Mode: Tablet frame -->
        <div v-else-if="mode === 'tablet'" class="tablet-preview">
            <div class="device-frame tablet-frame">
                <!-- Device SVG as background -->
                <div class="device-body">
                    <!-- Screen content area -->
                    <div class="screen-content">
                        <img :src="imageUrl" :alt="alt" class="preview-image" />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
interface Props {
    mode: 'desktop' | 'mobile-50' | 'mobile-100' | 'tablet'
    imageUrl: string
    alt?: string
}

defineProps<Props>()
</script>

<style scoped>
.device-mockup {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
}

/* Desktop Mode - Full width, no frame */
.desktop-preview {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
}

.desktop-preview .preview-image {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
}

/* Mobile Modes - Phone frame */
.mobile-preview {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
}

.mobile-50 {
    width: 50%;
}

.mobile-100 {
    width: 100%;
    max-width: 400px;
}

.phone-frame {
    position: relative;
    width: 100%;
    padding-top: 200%;
    /* 2:1 aspect ratio for portrait phone (320:640) */
    background: #1a1a1a;
    border-radius: 40px;
    border: 2px solid #333;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.phone-frame .device-body {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 60px 20px;
    /* Match SVG margins */
}

.phone-frame .screen-content {
    width: 100%;
    height: 100%;
    background: #000;
    border-radius: 20px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* Notch decoration */
.phone-frame .device-body::before {
    content: '';
    position: absolute;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    width: 80px;
    height: 30px;
    background: #0a0a0a;
    border-radius: 15px;
    z-index: 10;
}

/* Home indicator decoration */
.phone-frame .device-body::after {
    content: '';
    position: absolute;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%);
    width: 60px;
    height: 5px;
    background: #444;
    border-radius: 2.5px;
}

/* Tablet Mode - Tablet frame */
.tablet-preview {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
}

.tablet-frame {
    position: relative;
    width: 100%;
    max-width: 900px;
    padding-top: 75%;
    /* 4:3 aspect ratio for landscape tablet (1024:768) */
    background: #1a1a1a;
    border-radius: 30px;
    border: 2px solid #333;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.tablet-frame .device-body {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 60px 40px;
    /* Match SVG margins */
}

.tablet-frame .screen-content {
    width: 100%;
    height: 100%;
    background: #000;
    border-radius: 20px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* Camera dot decoration */
.tablet-frame .device-body::before {
    content: '';
    position: absolute;
    top: 30px;
    left: 50%;
    transform: translateX(-50%);
    width: 16px;
    height: 16px;
    background: #0a0a0a;
    border-radius: 50%;
    z-index: 10;
}

/* Home button decoration */
.tablet-frame .device-body::after {
    content: '';
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    width: 40px;
    height: 40px;
    background: #0a0a0a;
    border: 1px solid #333;
    border-radius: 50%;
}

/* Image inside device screens */
.screen-content .preview-image {
    max-width: 100%;
    max-height: 100%;
    object-fit: cover;
}
</style>
