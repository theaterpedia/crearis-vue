Today (evening) we build imageShape-support for hero.vue and draft two display-components. Now (morning) you create a report on this.
First we add more 8 shape-instances to be created on image-import. They are all controlled by the settings of the shape-templates square, wide, vertical. These three templates provide 1. the minimum resolution of the instances + 2. they give clear 'preset' on how to focus and zoom the image for a given aspect-ratio. The 8 additional instances are recalculated based on 2. The instances have a naming convention ``{target}_{template}`` suffixed with an optional variation-flag, for example 'display_wide' +  'display_thumb_banner'. The first example is calculated based on the preset of the 'wide'-template, the second works on the 'thumb'-template. The backend-code that creates the image-instance-files on image-import should have a 2-loop-architecture with the outer-loop working on the 4 shape-template-names and the inner loop working through the concrete renditions that exist for that shape-preset including the root-rendition (the template itself).
The 'zoom'-factor of each instance that is taken to recalculate the concrete image-dimensions works on the x-axis. Most of the time the value on the y-axis does not fully match to the aspect-ratio of the template (but comes close), y can be both bigger or smaller than in the preset would require. This is intentional and should not lead to stretching the instance. Instead the y-logic of the preset shall be adapted in a way that it follows the 'logic' of the preset how focus/zoom are defined. In the current implementation we do not have complex presets at work (no custom xyz gets applied), but the code-architecture should be prepared to handle manually adjusted xyz (implement it that way: console-log a warning "Auto-generation of shape-instances for {xmlid} falls back to default-preset for: {template}". 
There is one exemption of these rules and this is the 'display_thumb_banner'. Implement a special handling for that: It should calculate the zoom on the y-axis + it will add much more 'wide' to the image on the x-axis. Core idea is: We typically have 'faces' and 'eyes' to catch here (which is the idea of the 'thumb'-template) on the y-axis and then make it a broad banner on the x-axis.
These are the instances (X Y):
- display_wide: 531x300
- display_thumb_banner: 1062x265.5
- hero_wide_xl: 1440 x 820
- hero_square_xl: 1440 x 1280
- hero_wide: 1100 x 620
- hero_wide: 1100 x 620
- hero_square: 440 x 440
- hero_vertical: 440 x 880

Then I want to create 2 new components that work with one of the 'display' instances each. Both target the main-column and will be addressed by markdown-rendering via prose as well. They receive the image xmlid and query the images-endpoint autonomously and make use of the blurhash-logic in the same way that imageShape does. They will be used to testdrive/demo the image-system as well because they are the most simple implementations of the system. Once the components are built, create a demo-view under /Demo that showcase the usage (for displayimage.vue both mount-strategies).

### Component 1: DisplayImage.vue
DisplayImage.vue always works with shape: 'display_wide'
#### props:
- 'padding' (none(default)|small|medium|large)
- 'background' (inherit(default)|standard|muted|accent -> works on theme-coloring)
- 'caption' (none(default)|author|description|full -> full being both author and description) -> 'author' is rendered as overlay right-bottom, description+full print the caption as description-row below the image
- 'placement' (left(default)|lefttop|leftbottom|right|righttop|rightbottom) -> only gets applied inside 'container'

Responsive design:
- on mobile it is 100%, above that 50% of fullwidth (available to the parent-component)
- if the component is smaller than 531px wide it zooms down the image-size and component-size to keep the aspect-ratio, it does not cut-off or stretch parts of the image

The component can directly be used:
	- as child of the 'container.vue'-component (inside section.vue) -> here the 'placement' controls the way that other elements float around
	- as child of the 'columns.vue'-component: The component self-detects that it is used as a columns-child and set to '1/2' = 50% width)

### Component 2: DisplayBanner.vue
DisplayBanner.vue always works with shape: 'display_thumb_banner'
It displays a thin banner and is used to separate content-sections or to highlight a heading that is placed vertically above the banner

The component can only be used as a direct child inside section->container

Responsive design:
- it is always 100% of fullwidth (available to the parent-component)
- if the component is smaller than 1062px wide it zooms down the image-size and component-size to keep the aspect-ratio, it does not cut-off or stretch parts of the image

### Component 3: Hero.vue
We update the existing Hero.vue - Component. I provide 2 implementations of the same component for you to inspect: The original version that did not receive any updates that target the imageShape-functionality. An adapted version that tries to showcase how Hero.vue could be adapted to the image-system based on shapes.
Hero.vue ist the core component to implement responsive design for external pages. It breaks apart the handling of responsive image-display in two steps:
1. intelligently choose from a sample of available renditions of an image (identified by xmlid) to find the best one on the given viewport
2. enable a variety of named choices how to handle the combination if fullwidth-image and image-overlays when dimensions are stable with variations up to 20%

You task will be: 1. Understand how Hero.vue intelligently allows to execute step 2. Then implemement decision-taking among the 6 instances described above that have the 'hero'-target.


### Your task now
Create a report under chat/tasks 2025-12-14-heroRefactor.md that lists you questions still needed and gives 2-3 alternative ways to implement the three components + helper-code.
The core question is: Whether imageShape.vue will be extended to work even with the instances or whether the three components will have own similar code like imageShape.vue (for instance: some shared functionality).