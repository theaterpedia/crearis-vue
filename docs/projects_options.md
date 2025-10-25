page_background = text.Dropdown(
    label='Background',
    selection=[
        ('primary', 'Primary'),
        ('secondary', 'Secondary'),
        ('accent', 'Accent'),
        ('neutral', 'Neutral'),
        ('muted', 'Muted'),
        ('positive', 'Positive'),
        ('negative', 'Negative'),
        ('warning', 'Warning')
    ],
)

page_cssvars = jsonb(
    label='CSS Variables',
)

page_navigation = jsonb(
    label='Navigation',
)

page_options_ext = jsonb(
    label='Options (Page)',
)

# ASIDE OPTIONS
aside_postit = jsonb(
    label='Post-it (Aside)',
)

aside_toc = jsonb(
    label='Table of Contents',
)

aside_list = text.Dropdown(
    label='List Type',
    selection=[
        ('alike', 'Alike'),
        ('product', 'Product'),
        ('events', 'Events'),
        ('posts', 'Posts'),
        ('partners', 'Partners'),
        ('companies', 'Companies'),
        ('media', 'Media')
    ],
)

aside_context = jsonb(
    label='Context',
)

aside_options_ext = jsonb(
    label='Options (Aside)',
)

# HEADER OPTIONS
header_alert = jsonb(
    label='Alert',
)

header_postit = jsonb(
    label='Post-it (Header)',
)

header_options_ext = jsonb(
    label='Options (Header)',
)

# FOOTER OPTIONS
footer_gallery = text.Dropdown(
    label='Gallery Type',
    selection=[
        ('alike', 'Alike'),
        ('product', 'Product'),
        ('events', 'Events'),
        ('posts', 'Posts'),
        ('partners', 'Partners'),
        ('companies', 'Companies'),
        ('media', 'Media')
    ],
)

footer_postit = jsonb(
    label='Post-it (Footer)',
)

footer_slider = text.Dropdown(
    label='Slider Type',
    selection=[
        ('alike', 'Alike'),
        ('product', 'Product'),
        ('events', 'Events'),
        ('posts', 'Posts'),
        ('partners', 'Partners'),
        ('companies', 'Companies'),
        ('media', 'Media')
    ],
)

footer_repeat = jsonb(
    label='Repeat',
)

footer_sitemap = text.Dropdown(
    label='Sitemap',
    selection=[
        ('none', 'None'),
        ('small', 'Small'),
        ('medium', 'Medium'),
        ('large', 'Large')
    ],
)

footer_options_ext = jsonb(
    label='Options (Footer)',
)