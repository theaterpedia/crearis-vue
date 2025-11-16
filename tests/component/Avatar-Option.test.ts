/**
 * Avatar Option - Unit Tests (A2)
 * 
 * Test Specification: /docs/tasks/2025-11-13_TEST_SPEC_ENTITY_COMPONENTS.md → Section A2
 * 
 * This test file validates that entity components correctly determine when to apply
 * circular avatar borders based on:
 * 1. Entity type (event, instructor, post)
 * 2. Shape type (thumb, square only)
 * 3. xmlID presence
 * 
 * Design Principle:
 * - ItemRow and ItemTile have authority to decide avatar option
 * - ItemCard NEVER uses avatar (wide/vertical shapes incompatible)
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ItemRow from '@/components/clist/ItemRow.vue'
import ItemTile from '@/components/clist/ItemTile.vue'
import ItemCard from '@/components/clist/ItemCard.vue'
import ImgShape from '@/components/images/ImgShape.vue'

describe('Avatar Option - Entity Type Detection', () => {
    describe('ItemRow: Event Entity', () => {
        it('should enable avatar for event entity with thumb shape', () => {
            const wrapper = mount(ItemRow, {
                props: {
                    heading: 'Summer Festival',
                    shape: 'thumb',
                    data: {
                        type: 'url',
                        url: 'https://example.com/event.jpg',
                        xmlid: 'tp.event.summer-festival-2024'
                    }
                }
            })

            const imgShape = wrapper.findComponent(ImgShape)
            expect(imgShape.exists()).toBe(true)
            expect(imgShape.props('avatar')).toBe(true)
        })

        it('should enable avatar for event entity with square shape', () => {
            const wrapper = mount(ItemRow, {
                props: {
                    heading: 'Winter Workshop',
                    shape: 'square',
                    data: {
                        type: 'url',
                        url: 'https://example.com/event.jpg',
                        xmlid: 'tp.event.winter-workshop-2024'
                    }
                }
            })

            const imgShape = wrapper.findComponent(ImgShape)
            expect(imgShape.props('avatar')).toBe(true)
        })
    })

    describe('ItemRow: Instructor Entity', () => {
        it('should enable avatar for instructor entity with thumb shape', () => {
            const wrapper = mount(ItemRow, {
                props: {
                    heading: 'John Doe',
                    shape: 'thumb',
                    data: {
                        type: 'url',
                        url: 'https://example.com/instructor.jpg',
                        xmlid: 'tp.instructor.john-doe'
                    }
                }
            })

            const imgShape = wrapper.findComponent(ImgShape)
            expect(imgShape.props('avatar')).toBe(true)
        })

        it('should enable avatar for instructor entity with square shape', () => {
            const wrapper = mount(ItemRow, {
                props: {
                    heading: 'Jane Smith',
                    shape: 'square',
                    data: {
                        type: 'url',
                        url: 'https://example.com/instructor.jpg',
                        xmlid: 'tp.instructor.jane-smith'
                    }
                }
            })

            const imgShape = wrapper.findComponent(ImgShape)
            expect(imgShape.props('avatar')).toBe(true)
        })
    })

    describe('ItemTile: Post Entity', () => {
        it('should enable avatar for post entity with thumb shape', () => {
            const wrapper = mount(ItemTile, {
                props: {
                    heading: 'Blog Post Title',
                    shape: 'thumb',
                    data: {
                        type: 'url',
                        url: 'https://example.com/post.jpg',
                        xmlid: 'tp.post.blog-post-2024'
                    }
                }
            })

            const imgShape = wrapper.findComponent(ImgShape)
            expect(imgShape.props('avatar')).toBe(true)
        })

        it('should enable avatar for post entity with square shape', () => {
            const wrapper = mount(ItemTile, {
                props: {
                    heading: 'News Article',
                    shape: 'square',
                    data: {
                        type: 'url',
                        url: 'https://example.com/post.jpg',
                        xmlid: 'tp.post.news-article-2024'
                    }
                }
            })

            const imgShape = wrapper.findComponent(ImgShape)
            expect(imgShape.props('avatar')).toBe(true)
        })
    })
})

describe('Avatar Option - Non-Avatar Entities', () => {
    it('should NOT enable avatar for project entity', () => {
        const wrapper = mount(ItemRow, {
            props: {
                heading: 'Project Title',
                shape: 'thumb',
                data: {
                    type: 'url',
                    url: 'https://example.com/project.jpg',
                    xmlid: 'tp.project.summer-2024'
                }
            }
        })

        const imgShape = wrapper.findComponent(ImgShape)
        expect(imgShape.props('avatar')).toBe(false)
    })

    it('should NOT enable avatar for location entity', () => {
        const wrapper = mount(ItemTile, {
            props: {
                heading: 'Main Theater',
                shape: 'square',
                data: {
                    type: 'url',
                    url: 'https://example.com/location.jpg',
                    xmlid: 'tp.location.main-theater'
                }
            }
        })

        const imgShape = wrapper.findComponent(ImgShape)
        expect(imgShape.props('avatar')).toBe(false)
    })

    it('should NOT enable avatar for user entity', () => {
        const wrapper = mount(ItemRow, {
            props: {
                heading: 'User Name',
                shape: 'thumb',
                data: {
                    type: 'url',
                    url: 'https://example.com/user.jpg',
                    xmlid: 'tp.user.user-name'
                }
            }
        })

        const imgShape = wrapper.findComponent(ImgShape)
        expect(imgShape.props('avatar')).toBe(false)
    })
})

describe('Avatar Option - Shape Restrictions', () => {
    it('should NOT enable avatar for event with wide shape', () => {
        const wrapper = mount(ItemRow, {
            props: {
                heading: 'Event Title',
                shape: 'wide',
                data: {
                    type: 'url',
                    url: 'https://example.com/event.jpg',
                    xmlid: 'tp.event.summer-2024'
                }
            }
        })

        const imgShape = wrapper.findComponent(ImgShape)
        expect(imgShape.props('avatar')).toBe(false)
    })

    it('should NOT enable avatar for event with vertical shape', () => {
        const wrapper = mount(ItemTile, {
            props: {
                heading: 'Event Title',
                shape: 'vertical',
                data: {
                    type: 'url',
                    url: 'https://example.com/event.jpg',
                    xmlid: 'tp.event.summer-2024'
                }
            }
        })

        const imgShape = wrapper.findComponent(ImgShape)
        expect(imgShape.props('avatar')).toBe(false)
    })

    it('should NOT enable avatar for instructor with wide shape', () => {
        const wrapper = mount(ItemRow, {
            props: {
                heading: 'John Doe',
                shape: 'wide',
                data: {
                    type: 'url',
                    url: 'https://example.com/instructor.jpg',
                    xmlid: 'tp.instructor.john-doe'
                }
            }
        })

        const imgShape = wrapper.findComponent(ImgShape)
        expect(imgShape.props('avatar')).toBe(false)
    })
})

describe('Avatar Option - Edge Cases', () => {
    it('should NOT enable avatar when xmlid is missing', () => {
        const wrapper = mount(ItemRow, {
            props: {
                heading: 'Title',
                shape: 'thumb',
                data: {
                    type: 'url',
                    url: 'https://example.com/image.jpg'
                    // No xmlid provided
                }
            }
        })

        const imgShape = wrapper.findComponent(ImgShape)
        expect(imgShape.props('avatar')).toBe(false)
    })

    it('should NOT enable avatar when xmlid is malformed', () => {
        const wrapper = mount(ItemTile, {
            props: {
                heading: 'Title',
                shape: 'square',
                data: {
                    type: 'url',
                    url: 'https://example.com/image.jpg',
                    xmlid: 'invalid' // Malformed xmlid (no dots)
                }
            }
        })

        const imgShape = wrapper.findComponent(ImgShape)
        expect(imgShape.props('avatar')).toBe(false)
    })

    it('should NOT enable avatar when data is undefined', () => {
        const wrapper = mount(ItemRow, {
            props: {
                heading: 'Title',
                shape: 'thumb'
                // No data prop
            }
        })

        const imgShape = wrapper.findComponent(ImgShape)
        expect(imgShape.exists()).toBe(false) // No ImgShape rendered
    })
})

describe('Avatar Option - ItemCard Design Constraint', () => {
    it('should NEVER enable avatar for ItemCard (wide shape by default)', () => {
        const wrapper = mount(ItemCard, {
            props: {
                heading: 'Event Title',
                // Default shape is 'wide'
                data: {
                    type: 'url',
                    url: 'https://example.com/event.jpg',
                    xmlid: 'tp.event.summer-2024'
                }
            }
        })

        const imgShape = wrapper.findComponent(ImgShape)
        expect(imgShape.props('avatar')).toBe(false)
    })

    it('should NEVER enable avatar for ItemCard even with explicit thumb shape', () => {
        const wrapper = mount(ItemCard, {
            props: {
                heading: 'Instructor Name',
                shape: 'thumb', // Explicitly set to thumb
                data: {
                    type: 'url',
                    url: 'https://example.com/instructor.jpg',
                    xmlid: 'tp.instructor.john-doe'
                }
            }
        })

        const imgShape = wrapper.findComponent(ImgShape)
        // ItemCard explicitly passes avatar=false regardless of entity type
        expect(imgShape.props('avatar')).toBe(false)
    })

    it('should NEVER enable avatar for ItemCard with vertical shape', () => {
        const wrapper = mount(ItemCard, {
            props: {
                heading: 'Post Title',
                shape: 'vertical',
                data: {
                    type: 'url',
                    url: 'https://example.com/post.jpg',
                    xmlid: 'tp.post.blog-post-2024'
                }
            }
        })

        const imgShape = wrapper.findComponent(ImgShape)
        expect(imgShape.props('avatar')).toBe(false)
    })
})

describe('Avatar Option - Default Shape Behavior', () => {
    it('should use default thumb shape for ItemRow when shape not specified', () => {
        const wrapper = mount(ItemRow, {
            props: {
                heading: 'Event Title',
                // No shape prop (defaults to 'thumb')
                data: {
                    type: 'url',
                    url: 'https://example.com/event.jpg',
                    xmlid: 'tp.event.summer-2024'
                }
            }
        })

        const imgShape = wrapper.findComponent(ImgShape)
        expect(imgShape.props('shape')).toBe('thumb')
        expect(imgShape.props('avatar')).toBe(true) // thumb + event = avatar
    })

    it('should use default square shape for ItemTile when shape not specified', () => {
        const wrapper = mount(ItemTile, {
            props: {
                heading: 'Instructor Name',
                // No shape prop (defaults to 'square')
                data: {
                    type: 'url',
                    url: 'https://example.com/instructor.jpg',
                    xmlid: 'tp.instructor.john-doe'
                }
            }
        })

        const imgShape = wrapper.findComponent(ImgShape)
        expect(imgShape.props('shape')).toBe('square')
        expect(imgShape.props('avatar')).toBe(true) // square + instructor = avatar
    })
})
