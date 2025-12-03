
## Now we build the image-system
### DESCRIPTION
The goal of the system is to deliver an integrated experience to users while working with images that are stored on cdn-services like unsplash, cloudinary, vimeo and canva (more to come later, especially cloudflare). 
Canva being the place to create and update imagery and video, Unsplash for both searching and collecting existing images as well as open-source-publish own creations, Cloudinary to fine-tuning select images and Vimeo as publishing-platform for video.

A) MAIN OBJECTIVE: All Unsplash, Cloudinary and Vimeo allow for a lot of customizations of CDN-content in a pseudo-editing manner without the need to download and upload content. Instead the user composes parameters and settings that get appended to the urls (or as embedd-params in Vimeo). This shall be integrated in one unique config-experience where users don't have to leave the platform and login to these services anymore.

B) SIDE EFFECT: On the other hand those services organize media-assets in collections and allow for sophisticated tagging with metadata. This shall be integrated into a basic set of tags that are easy to use. They are hardcoded into the system with the `rtags` and `rtags` for quick and easy filtering, ordering.

C) WORKFLOW by Design
The user experiences a simple workflow (visually top-to-bottom) where one can progress step-by-step as needed
1. quickly apply standardized resolutions to unlock a quality image to be used in a variety of components with different shapes -> setting shape:param(x,y,z)
2. then start further 'producing' an asset with special effects like overlay, adapting colors (what can be done with Cloudinary -> setting shape:json)
3. manage publishing with different versions of the same piece of art (using images.variations) for different platforms and always keep author-ship and copyright-information simple and straight-forward 

D) The system makes a big simplification to treat everything as 'images'. Icon-Overlays like the Youtube-Icon, Speaker-Icon, a PDF-Icon and a PPTX-Icon help understand that other media-types like slide-shows or audio are targeted, but that get displayed a image with click-action that helps start additional actions or features.

### NAVIGATION
At its core the image-system is served on three routes: /admin/images + /users/:id/images + /sites/:id/images
It has unified topnav-navigation (no homesite-routes /home /start /team /blog to be displayed). The topnav (menues and menu-items provided via prop, just buttons all triggering the same dummy-action with toast-message for now) provides this functionality:
- /admin/images: Access to all images, all actions only accessible with role admin + some actions for the base role. 
	- Base has a 'manage'-menu with these actions: 
		- 'register images from urls'
		- 'edit labels and tags'
		- 'verifiy and curate'
		- 'prepare release'. 
	- Admin has an additional menu with
		- 'json-import'
		- 'json-export'
		- 'configure adapters' -> configure adapters opens a sub-menu with an entry for every adapter.
- /users/:id/images: It is the same 'manage'-menu as base-role on the admin-route, but only for all images owned by this user.
- /sites/:id/images: For all images available on a project - with two menus:
	- 'collection'
	- 'stories'. 
	-> make up some dummy-actions here, different functionality depending whether the active user is owner of an image or not.

### LAYOUT AND DESIGN
The Layout is very much the same as: /home/persona/crearis/crearis-vue/src/views/Home/HomePage.vue
- it should be based on the PageLayout-component (/home/persona/crearis/crearis-vue/src/components/PageLayout.vue)
- the topnav shows the back-arrow (prop) and does not show the default-homerouts.
- the Heading in slot #heading is for settings-preview of the ative selected image and shrinks to 'simple' (small height) when no image is selected, for now hardcode it with one of the unsplash-urls from the instructors-csv. Here take the images.shape_square-resolution for the background-image
- the hero-banner shows a **`PreviewConfig`**-Component, but for now just show a 'Hello to Image-Previewing' for now
- still in slot #heading is a **`ShapesPreview`** row with 3 dummy-cards with the same dummy-image to showcase the different images.shapes: vertical | thumb | wide
- below the heading in main is a gallery with preview-cards for the active image-collection
- the left sidebar can be toggled: it shows categories to filter and sort the gallery
- Exactly as implemented in /home/persona/crearis/crearis-vue/src/views/ProjectSite.vue there is a ConfigPanel-like Container (make it 'muted' for roles base, user at the moment to showcase the routing-rules). It is called **`AdaptersPanel`** and provides deep configuration-options for 1-3 adapters. The inner design is made in a way like a lot of api-chain-workflows are designed. The Adapters have a fixed order:
	- Author-Adapter
	- Producer-Adapter
	- Publisher-Adapter
- if one or more of the Adapters are missing, then a dimmed (+) is shown where it could be added
- on top of the whole AdaptersPanel there is an info-card that shows current state, author, version/variations and has an action-slot that takes up to 4 Buttons to control the whole process, for instance there is the 'publish'/'unpublish'-toggle
- if only the Author-Adapter is shown (most of the cases), this adapter is higher and has more controls on it. If additionally producer and/or publisher-adapter are shown they take some of the controls.
- If we click on an adapter it typically expands by 30-70% (the below adapters move down) to give room for edit-controls + an inline-image-live-preview to understand the effects of config-actions done with the adapter (I describe the Unsplash-Adapter below)

### DETAILS CSS-VARS and ASSETS
- inspect 01-variables.css
- dimensions (set them in rem, clean numbers)
	- 336x17.43 > --tagline-small-height
	- 336x57.36 > --card-heading
	- 336x168 > --card-height-min
	- 336x226 > --card-height
	- 168 > --avatar (if it fits em better)

- add these vars to /home/persona/crearis/crearis-vue/src/assets/css/01-variables.css. 
- create a background svg named 'dummy.svg' and store it to /public. It is based on --colors-neutral-base, --colors-primary-base, --colors-secondary-base with cssvars from server.

## DETAILS for Components and Composables
IMPORTANT: Apply the theming from /home/persona/crearis/crearis-vue/src/assets/css/01-variables.css. 

### Create cimgRegistry-stub and prepare the core section-components
Create cimgRegistry-stub and register it on the routes.
- store it together with the main-components under /views/images 
- store smaller components that seem reusable under /componets/images

All three routes work with view-component cimgRegistry.
cimgRegistry sets these props of topnav
- navbarmode=dashboard
- string 'images' in the logo-slot (if possible).
  
**`PreviewConfig`**-Component (still in the heading-slot)
Set different height and widths with the &h=200&w=200&fit=crop - params added to the unsplash-url (replace the 200s). The first of the cards has a vertical layout to simulate a smartphone-layout, in default-view it shows as 'cut-off' (zig-zag), a click on it opens it and it flows over the content below.

### Create a tagsMultiToggle component  (optionally with subcomponents)
it handles the rtags and ctags (for both one tagsMultiToggle).
Implement the dropdown-part using floating-vue.
It is an inputfield-component with every word (tag) shown styled like a pill with an (x) suffixed (inside the pill) -> (x) = remove-action. On enter a dropdown opens that shows all tag-options that are not yet chosen. There are two types of choices, I'll give examples: 
- freely select/deselect -> like: isDark
- choose on of 4 options -> like: ctags (bits 4+5) project, public, private, internal 
- toggle between 2 options -> like: rtags(bit 2) preferTopOverlay, preferBottomOverlay

The dropdown collapses with clickoutside-logic (but allow to set a prop autoclose=true -> closes immediately if a tag is clicked).
The model is a byte-value that is the computed bitmatrix of the tags -> see below: table images.

### Create a cimgImport-component
It gets opened from a button on topnav.vue-menu; It opens cimgImport as a floating-vue-component, card-sized. we need this available on all three images-routes.
It can grow as import-rows are added. It has a keep-me-open checkbox (default unchecked) top left. If the checkbox gets checked topleft a close (x) is shown.
The main-part of the component shows an input-box where an url can be pasted and below the paste-box a growing list of validated import-targets, image-previews 170x100. In each preview-row there is a remove-button (icon).
At the bottom the component is organized in two rows. 
First row: domaincode (projects-dropdown > default: none) | owner_id (user_dropdown > default: currently logged in user) | tagsMultiToggle (ctags) + tagsMultiToggle (rtags)
Second row: | cancel-button | save-button

### Create unsplashAdapter-component
It shows a preview of the current image in card-size and three simple x y z number-inputs. It adds fit=crop&w=x&h=y to the urls and dynamically reloads the image.