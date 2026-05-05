export const options = {
    id: "admin-dashboard-seconds",
    title: "Admin Dashboard",
    saveType: "serialized",
    sections: [
        {
            "name": "overview2",
            "title": "Overview",
            "icon": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512' height='15px'><path d='M156.6 384.9L125.7 354c-8.5-8.5-11.5-20.8-7.7-32.2c3-8.9 7-20.5 11.8-33.8L24 288c-8.6 0-16.6-4.6-20.9-12.1s-4.2-16.7 .2-24.1l52.5-88.5c13-21.9 36.5-35.3 61.9-35.3l82.3 0c2.4-4 4.8-7.7 7.2-11.3C289.1-4.1 411.1-8.1 483.9 5.3c11.6 2.1 20.6 11.2 22.8 22.8c13.4 72.9 9.3 194.8-111.4 276.7c-3.5 2.4-7.3 4.8-11.3 7.2v82.3c0 25.4-13.4 49-35.3 61.9l-88.5 52.5c-7.4 4.4-16.6 4.5-24.1 .2s-12.1-12.2-12.1-20.9V380.8c-14.1 4.9-26.4 8.9-35.7 11.9c-11.2 3.6-23.4 .5-31.8-7.8zM384 168a40 40 0 1 0 0-80 40 40 0 1 0 0 80z' /></svg>",
            fields: [
                {
                    id: 'opt-text',
                    field: 'text',
                    title: 'Simple Text',
                    dependency: ['opt-select-1', '==', 'opt-2']
                },
                {
                    id: "opt-textarea",
                    field: "textarea",
                    title: "Textarea",
                    help: "The help text of the field"
                },
                {
                    id: "opt-select-1",
                    field: "select",
                    title: "Select",
                    placeholder: "Select an option",
                    options: {
                        "opt-1": "Option 1",
                        "opt-2": "Option 2",
                        "opt-3": "Option 3"
                    }
                },
                {
                    id: "opt-checkbox-2",
                    field: "checkbox",
                    title: "Checkbox with default",
                    label: "The label text of the checkbox.",
                    default: true
                },
                {
                    id: "opt-checkbox-4",
                    field: "checkbox",
                    title: "Checkbox inline with multiple choice",
                    inline: true,
                    options: {
                        "opt-1": "Option 1",
                        "opt-2": "Option 2",
                        "opt-3": "Option 3"
                    }
                },
                {
                    id: "opt-checkbox-7",
                    field: "checkbox",
                    title: "Checkbox testing on many items",
                    options: {
                        "opt-1": "Option 1",
                        "opt-2": "Option 2",
                        "opt-3": "Option 3",
                        "opt-4": "Option 4",
                        "opt-5": "Option 5",
                        "opt-6": "Option 6",
                        "opt-7": "Option 7",
                        "opt-8": "Option 8",
                        "opt-9": "Option 9",
                        "opt-10": "Option 10",
                        "opt-11": "Option 11",
                        "opt-12": "Option 12",
                        "opt-13": "Option 13",
                        "opt-14": "Option 14",
                        "opt-15": "Option 15"
                    },
                    desc: "Vertical scroll showing automatically after add many items"
                },
                {
                    id: "opt-radio-1",
                    field: "radio",
                    title: "Radio",
                    options: {
                        "opt-1": "Option 1",
                        "opt-2": "Option 2",
                        "opt-3": "Option 3"
                    }
                },
                {
                    id: "opt-radio-3",
                    field: "radio",
                    title: "Radio with inline style",
                    inline: true,
                    options: {
                        "opt-1": "Option 1",
                        "opt-2": "Option 2",
                        "opt-3": "Option 3"
                    }
                },
                {
                    id: "opt-repeater-1",
                    field: "repeater",
                    title: "Repeater",
                    fields: [
                        {
                            id: "opt-text",
                            field: "text",
                            title: "Text"
                        },
                        {
                            id: "opt-text-two",
                            field: "text",
                            title: "Text"
                        }
                    ]
                },
                {
                    id: "opt-group-1",
                    field: "group",
                    title: "Group",
                    fields: [
                        {
                            id: "opt-text",
                            field: "text",
                            title: "Text"
                        },
                        {
                            id: "opt-switcher",
                            field: "switcher",
                            title: "Switcher"
                        },
                        {
                            id: "opt-textarea",
                            field: "textarea",
                            title: "Textarea"
                        }
                    ]
                },
                {
                    id: "opt-group-2",
                    field: "group",
                    title: "Group with default",
                    fields: [
                        {
                            id: "opt-text",
                            field: "text",
                            title: "Text"
                        },
                        {
                            id: "opt-switcher",
                            field: "switcher",
                            title: "Switcher"
                        },
                        {
                            id: "opt-textarea",
                            field: "textarea",
                            title: "Textarea"
                        }
                    ],
                    default: [
                        {
                            "opt-text": "Some text 1",
                            "opt-switcher": true,
                            "opt-textarea": "Some textarea content 1"
                        },
                        {
                            "opt-text": "Some text 2",
                            "opt-switcher": false,
                            "opt-textarea": "Some textarea content 2"
                        }
                    ]
                },
                {
                    id: "opt-accordion-1",
                    field: "accordion",
                    title: "Accordion",
                    fields: [
                        {
                            title: "Accordion 1",
                            fields: [
                                {
                                    id: "opt-text-1",
                                    field: "text",
                                    title: "Text"
                                },
                                {
                                    id: "opt-switcher-1",
                                    field: "switcher",
                                    title: "Switcher"
                                },
                                {
                                    id: "opt-textarea-1",
                                    field: "textarea",
                                    title: "Textarea"
                                }
                            ]
                        },
                        {
                            title: "Accordion 2",
                            fields: [
                                {
                                    id: "opt-text-2",
                                    field: "text",
                                    title: "Text"
                                },
                                {
                                    id: "opt-color-1",
                                    field: "color",
                                    title: "Color"
                                }
                            ]
                        }
                    ]
                },
                {
                    id: "opt-tabbed-1",
                    field: "tabbed",
                    title: "Tabbed",
                    tabs: [
                        {
                            title: "Tab 1",
                            fields: [
                                {
                                    id: "opt-text-1",
                                    field: "text",
                                    title: "Text 1"
                                },
                                {
                                    id: "opt-textarea-1",
                                    field: "textarea",
                                    title: "Textarea 1"
                                }
                            ]
                        },
                        {
                            title: "Tab 2",
                            fields: [
                                {
                                    id: "opt-text-2",
                                    field: "text",
                                    title: "Text 2"
                                },
                                {
                                    id: "opt-textarea-2",
                                    field: "textarea",
                                    title: "Textarea 2"
                                }
                            ]
                        }
                    ]
                },
                {
                    id: "opt-tabbed-2",
                    field: "tabbed",
                    title: "Tabbed with default and icons",
                    tabs: [
                        {
                            title: "Fields 1",
                            icon: "fas fa-check",
                            fields: [
                                {
                                    id: "opt-text-1",
                                    field: "text",
                                    title: "Text 1"
                                },
                                {
                                    id: "opt-text-2",
                                    field: "text",
                                    title: "Text 2"
                                }
                            ]
                        },
                        {
                            title: "Fields 2",
                            icon: "fas fa-star",
                            fields: [
                                {
                                    id: "opt-color-1",
                                    field: "color",
                                    title: "Color 1"
                                },
                                {
                                    id: "opt-color-2",
                                    field: "color",
                                    title: "Color 2"
                                }
                            ]
                        },
                        {
                            title: "Fields 3",
                            icon: "fas fa-cog",
                            fields: [
                                {
                                    id: "opt-textarea-1",
                                    field: "textarea",
                                    title: "Textarea 1"
                                },
                                {
                                    id: "opt-textarea-2",
                                    field: "textarea",
                                    title: "Textarea 2"
                                }
                            ]
                        }
                    ],
                    default: {
                        "opt-text-1": "This is text 1 default value",
                        "opt-text-2": "This is text 2 default value",
                        "opt-color-1": "#1e73be",
                        "opt-color-2": "#ffbc00",
                        "opt-textarea-1": "This is textarea 1 default value",
                        "opt-textarea-2": "This is textarea 2 default value"
                    }
                },
                {
                    id: "opt-fieldset-1",
                    field: "fieldset",
                    title: "Fieldset",
                    fields: [
                        {
                            field: "subheading",
                            content: "Title of the fieldset"
                        },
                        {
                            id: "opt-color",
                            field: "color",
                            title: "Color"
                        },
                        {
                            id: "opt-text",
                            field: "text",
                            title: "Text"
                        },
                        {
                            id: "opt-textarea",
                            field: "textarea",
                            title: "Textarea"
                        }
                    ]
                },
                {
                    id: "opt-media-1",
                    field: "media",
                    title: "Media"
                },
                {
                    id: "opt-media-2",
                    field: "media",
                    title: "Media without preview",
                    preview: false
                },
                {
                    id: "opt-media-3",
                    field: "media",
                    title: "Media without url",
                    url: false
                },
                {
                    id: "opt-media-4",
                    field: "media",
                    title: "Media with only image type",
                    library: "image"
                },
                {
                    id: "opt-media-5",
                    field: "media",
                    title: "Media with only video type",
                    library: "video"
                },
                {
                    id: "opt-media-6",
                    field: "media",
                    title: "Media with only audio type",
                    library: "audio"
                },
                {
                    id: "opt-upload-1",
                    field: "upload",
                    title: "Upload"
                },
                {
                    id: "opt-upload-2",
                    field: "upload",
                    title: "Upload with preview",
                    preview: true
                },
                {
                    id: "opt-upload-3",
                    field: "upload",
                    title: "Upload with placeholder",
                    placeholder: "http://"
                },
                {
                    id: "opt-upload-4",
                    field: "upload",
                    title: "Upload with only image type",
                    library: "image",
                    buttonTitle: "Upload Image"
                },
                {
                    id: "opt-upload-5",
                    field: "upload",
                    title: "Upload with only video type",
                    library: "video",
                    buttonTitle: "Upload Video"
                },
                {
                    id: "opt-upload-6",
                    field: "upload",
                    title: "Upload with only audio type",
                    library: "audio",
                    buttonTitle: "Upload Audio"
                },
                {
                    id: "opt-gallery-1",
                    field: "gallery",
                    title: "Gallery"
                },
                {
                    id: "opt-gallery-2",
                    field: "gallery",
                    title: "Gallery with custom button names",
                    addTitle: "Add Image(s)",
                    editTitle: "Edit Images",
                    clearTitle: "Remove Images"
                },
                {
                    id: "opt-code-editor-1",
                    field: "code_editor",
                    title: "Code Editor",
                    subtitle: "<strong>Default Editor</strong> Using: theme: default and mode: htmlmixed"
                },
                {
                    id: "code_editor_2",
                    field: "code_editor",
                    title: "Code Editor",
                    subtitle: "<strong>HTML Editor</strong> Using: theme: shadowfox and mode: htmlmixed",
                    settings: {
                        theme: "solarized_dark",
                        mode: "htmlmixed"
                    },
                    default: '<div class="wrapper">\n        <h1>Hello world</h1>\n    <p>Lorem <strong>ipsum</strong> dollar.</p>\n    </div>'
                },
                {
                    id: "opt-wp-editor-1",
                    field: "wp_editor",
                    title: "WP Editor"
                },
                {
                    id: "opt-wp-editor-2",
                    field: "wp_editor",
                    title: "WP Editor with Custom Height and No Media Buttons",
                    subtitle: "Settings:<br />height => 100px,<br />media_buttons => false",
                    height: "100px",
                    mediaButtons: false
                },
                {
                    id: "opt-wp-editor-3",
                    field: "wp_editor",
                    title: "WP Editor without QuickTags and Media Buttons",
                    subtitle: "Settings:<br />height => 100px,<br />media_buttons => false,<br />quicktags => false",
                    height: "100px",
                    mediaButtons: false,
                    quicktags: false
                },
                {
                    id: "opt-color-1",
                    field: "color",
                    title: "Color"
                },
                {
                    id: "opt-color-2",
                    field: "color",
                    title: "Color with default (hex)",
                    default: "#3498db"
                },
                {
                    id: "opt-color-3",
                    field: "color",
                    title: "Color with default (rgba)",
                    default: "rgba(255,255,0,0.25)"
                },
                {
                    id: "opt-color-4",
                    field: "color",
                    title: "Color with default (transparent)",
                    default: "transparent"
                },
                {
                    id: "opt-link-color-1",
                    field: "link_color",
                    title: "Link Color"
                },
                {
                    id: "opt-link-color-2",
                    field: "link_color",
                    title: "Link Color with default",
                    default: {
                        color: "#1e73be",
                        hover: "#259ded"
                    }
                },
                {
                    id: "opt-link-color-3",
                    field: "link_color",
                    title: "Link Color with more color options",
                    color: true,
                    hover: true,
                    visited: true,
                    active: true,
                    focus: true
                },
                {
                    id: "opt-color-group-1",
                    field: "color_group",
                    title: "Color Group",
                    options: {
                        "color-1": "Color 1",
                        "color-2": "Color 2"
                    }
                },
                {
                    id: "opt-color-group-2",
                    field: "color_group",
                    title: "Color Group",
                    options: {
                        "color-1": "Color 1",
                        "color-2": "Color 2",
                        "color-3": "Color 3"
                    }
                },
                {
                    id: "opt-color-group-3",
                    field: "color_group",
                    title: "Color Group with default",
                    subtitle: "Can be add unlimited color options.",
                    options: {
                        "color-1": "Color 1",
                        "color-2": "Color 2",
                        "color-3": "Color 3",
                        "color-4": "Color 4",
                        "color-5": "Color 5"
                    },
                    default: {
                        "color-1": "#000100",
                        "color-2": "#002642",
                        "color-3": "#ffce4b",
                        "color-4": "#ff595e",
                        "color-5": "#0052cc"
                    }
                },
                {
                    id: "opt-palette-1",
                    field: "palette",
                    title: "Palette",
                    subtitle: "Three set colors",
                    options: {
                        "set-1": ["#f36e27", "#f3d430", "#ed1683"],
                        "set-2": ["#4153ab", "#6e86c7", "#211f27"],
                        "set-3": ["#162526", "#508486", "#C8C6CE"],
                        "set-4": ["#ccab5e", "#fff55f", "#197c5d"]
                    },
                    default: "set-1"
                },
                {
                    id: "opt-palette-2",
                    field: "palette",
                    title: "Palette",
                    subtitle: "Four set colors",
                    options: {
                        "set-1": ["#f04e36", "#f36e27", "#f3d430", "#ed1683"],
                        "set-2": ["#f9ca06", "#b5b546", "#2f4d48", "#212b2f"],
                        "set-3": ["#4153ab", "#6e86c7", "#211f27", "#d69762"],
                        "set-4": ["#162526", "#508486", "#C8C6CE", "#B45F1A"],
                        "set-5": ["#bbd5ff", "#ccab5e", "#fff55f", "#197c5d"]
                    },
                    default: "set-3"
                },
                {
                    id: "opt-palette-3",
                    field: "palette",
                    title: "Palette",
                    subtitle: "Five set colors",
                    options: {
                        "set-1": ["#bbd5ff", "#ccab5e", "#fff55f", "#197c5d", "#bce2c4"],
                        "set-2": ["#6d3264", "#edf7f6", "#fde8e9", "#006675", "#e49ab0"],
                        "set-3": ["#000100", "#002642", "#ffce4b", "#ff595e", "#0052cc"]
                    },
                    default: "set-1"
                },
                {
                    id: "opt-background-1",
                    field: "background",
                    title: "Background"
                },
                {
                    id: "opt-background-2",
                    field: "background",
                    title: "Background with default",
                    default: {
                        "background-color": "#e80000",
                        "background-position": "center center",
                        "background-repeat": "repeat-x",
                        "background-attachment": "fixed",
                        "background-size": "cover"
                    }
                },
                {
                    id: "opt-background-3",
                    field: "background",
                    title: "Background with all features",
                    background_color: true,
                    background_image: true,
                    background_position: true,
                    background_repeat: true,
                    background_attachment: true,
                    background_size: true,
                    background_origin: true,
                    background_clip: true,
                    background_blend_mode: true,
                    background_gradient: true,
                    default: {
                        background_color: "#009e44",
                        background_gradient_color: "#81d742",
                        background_gradient_direction: "135deg",
                        background_position: "center center",
                        background_repeat: "repeat-x",
                        background_attachment: "fixed",
                        background_size: "cover",
                        background_origin: "border-box",
                        background_clip: "padding-box",
                        background_blend_mode: "normal"
                    }
                },
                {
                    id: "opt-typography-1",
                    field: "typography",
                    title: "Typography"
                },
                {
                    id: "opt-typography-2",
                    field: "typography",
                    title: "Typography with default",
                    default: {
                        "font-family": "Barlow",
                        "font-weight": "600",
                        "subset": "latin-ext",
                        "type": "google",
                        "text-align": "center",
                        "text-transform": "capitalize",
                        "font-size": "18",
                        "line-height": "20",
                        "letter-spacing": "-1",
                        "color": "#009e44"
                    }
                },
                {
                    id: "opt-typography-3",
                    field: "typography",
                    title: "Typography with few features",
                    textAlign: false,
                    textTransform: false,
                    fontSize: false,
                    lineHeight: false,
                    letterSpacing: false,
                    color: false,
                    default: {
                        "font-family": "Lato",
                        "font-weight": "900",
                        "subset": "latin",
                        "type": "google"
                    }
                },
                {
                    id: "opt-typography-4",
                    field: "typography",
                    title: "Typography with all features",
                    fontFamily: true,
                    fontWeight: true,
                    fontStyle: true,
                    fontSize: true,
                    lineHeight: true,
                    letterSpacing: true,
                    textAlign: true,
                    textTransform: true,
                    color: true,
                    subset: true,
                    backupFontFamily: true,
                    fontVariant: true,
                    wordSpacing: true,
                    textDecoration: true,
                    default: {
                        "font-family": "Old Standard TT",
                        "type": "google"
                    }
                },
                {
                    id: "opt-dimensions-1",
                    field: "dimensions",
                    title: "Dimensions"
                },
                {
                    id: "opt-dimensions-2",
                    field: "dimensions",
                    title: "Dimensions with default",
                    default: {
                        width: "100",
                        height: "250",
                        unit: "px"
                    }
                },
                {
                    id: "opt-dimensions-3",
                    field: "dimensions",
                    title: "Dimensions with custom text and units",
                    width_icon: "width",
                    height_icon: "height",
                    units: ["px", "%", "em", "rem", "pt"],
                    default: {
                        width: "100",
                        height: "50",
                        unit: "%"
                    }
                },
                {
                    id: "opt-dimensions-4",
                    field: "dimensions",
                    title: "Dimensions with single unit",
                    units: ["px"]
                },
                {
                    id: "opt-dimensions-5",
                    field: "dimensions",
                    title: "Dimensions without unit selector",
                    unit: false
                },
                {
                    id: "opt-dimensions-6",
                    field: "dimensions",
                    title: "Dimensions with only width",
                    height: false
                },
                {
                    id: "opt-dimensions-7",
                    field: "dimensions",
                    title: "Dimensions with only width and single unit",
                    height: false,
                    units: ["px"]
                },
                {
                    id: "opt-spacing-1",
                    field: "spacing",
                    title: "Spacing"
                },
                {
                    id: "opt-spacing-2",
                    field: "spacing",
                    title: "Spacing with default",
                    default: {
                        top: "50",
                        right: "100",
                        bottom: "50",
                        left: "100",
                        unit: "px"
                    }
                },
                {
                    id: "opt-spacing-2",
                    field: "spacing",
                    title: "Spacing without unit selector",
                    units: ["px"],
                    default: {
                        top: "50",
                        right: "100",
                        bottom: "50",
                        left: "100",
                        unit: "px"
                    }
                },
                {
                    id: "opt-spacing-3",
                    field: "spacing",
                    title: "Spacing with only left and right",
                    top: false,
                    bottom: false
                },
                {
                    id: "opt-spacing-4",
                    field: "spacing",
                    title: "Spacing with only top and bottom",
                    left: false,
                    right: false
                },
                {
                    id: "opt-spacing-5",
                    field: "spacing",
                    title: "Spacing with all directions",
                    all: true
                },
                {
                    id: "opt-border-1",
                    field: "border",
                    title: "Border"
                },
                {
                    id: "opt-border-2",
                    field: "border",
                    title: "Border with default",
                    default: {
                        top: "4",
                        right: "8",
                        bottom: "4",
                        left: "8",
                        style: "dashed",
                        color: "#1e73be"
                    }
                },
                {
                    id: "opt-border-3",
                    field: "border",
                    title: "Border with only left and right",
                    top: false,
                    bottom: false
                },
                {
                    id: "opt-border-4",
                    field: "border",
                    title: "Border with only top and bottom",
                    left: false,
                    right: false
                },
                {
                    id: "opt-border-5",
                    field: "border",
                    title: "Border with all directions",
                    all: true
                },
                {
                    id: "opt-spinner-1",
                    field: "spinner",
                    title: "Spinner",
                    subtitle: "max:100 | min:0 | step:1",
                    max: 100,
                    min: 0,
                    step: 1,
                    default: 25
                },
                {
                    id: "opt-spinner-2",
                    field: "spinner",
                    title: "Spinner",
                    subtitle: "max:200 | min:100 | step:10",
                    max: 200,
                    min: 100,
                    step: 10,
                    default: 100
                },
                {
                    id: "opt-spinner-3",
                    field: "spinner",
                    title: "Spinner",
                    subtitle: "max:1 | min:0 | step:0.1 | unit:px",
                    max: 1,
                    min: 0,
                    step: 0.1,
                    unit: "px",
                    default: 0.5
                },
                {
                    id: "opt-number-1",
                    field: "number",
                    title: "Number"
                },
                {
                    id: "opt-number-2",
                    field: "number",
                    title: "Number with unit",
                    unit: "px"
                },
                {
                    id: "opt-number-3",
                    field: "number",
                    title: "Number with default",
                    unit: "width",
                    default: 100
                },
                {
                    id: "opt-slider-1",
                    field: "slider",
                    title: "Slider"
                },
                {
                    id: "opt-slider-2",
                    field: "slider",
                    title: "Slider with default",
                    default: 50
                },
                {
                    id: "opt-slider-3",
                    field: "slider",
                    title: "Slider with unit text",
                    unit: "%",
                    default: 75
                },
                {
                    id: "opt-slider-4",
                    field: "slider",
                    title: "Slider with min/max allowed value",
                    subtitle: "Min: 1 | Max: 10 | Step: 0.1 | Default: 5.5",
                    unit: "px",
                    min: 1,
                    max: 10,
                    step: 0.1,
                    default: 5.5
                },
                {
                    id: "opt-sortable-1",
                    field: "sortable",
                    title: "Sortable",
                    fields: [
                        {
                            id: "opt-text-1",
                            field: "text",
                            title: "Text 1"
                        },
                        {
                            id: "opt-text-2",
                            field: "text",
                            title: "Text 2"
                        },
                        {
                            id: "opt-text-3",
                            field: "text",
                            title: "Text 3"
                        }
                    ]
                },
                {
                    id: "opt-sortable-2",
                    field: "sortable",
                    title: "Sortable with default",
                    fields: [
                        {
                            id: "opt-text-1",
                            field: "text",
                            title: "Text 1"
                        },
                        {
                            id: "opt-text-2",
                            field: "text",
                            title: "Text 2"
                        },
                        {
                            id: "opt-text-3",
                            field: "text",
                            title: "Text 3"
                        }
                    ],
                    default: {
                        "opt-text-1": "This is text 1 default",
                        "opt-text-2": "This is text 2 default",
                        "opt-text-3": "This is text 3 default"
                    }
                },
                {
                    id: "opt-switcher-1",
                    field: "switcher",
                    title: "Switcher"
                },
                {
                    id: "opt-switcher-2",
                    field: "switcher",
                    title: "Switcher with default",
                    default: true
                },
                {
                    id: "opt-switcher-3",
                    field: "switcher",
                    title: "Switcher with label",
                    label: "The label text of the switcher."
                },
                {
                    id: "opt-switcher-4",
                    field: "switcher",
                    title: "Switcher with Yes/No",
                    textOn: "Yes",
                    textOff: "No"
                },
                {
                    id: "opt-switcher-5",
                    field: "switcher",
                    title: "Switcher with custom text Enabled/Disabled",
                    text_on: "Enabled",
                    text_off: "Disabled",
                    text_width: "100"
                },
                // {
                //     id: "opt-map-1",
                //     field: "map",
                //     title: "Map"
                // },
                // {
                //     id: "opt-map-2",
                //     field: "map",
                //     title: "Map with Default",
                //     default: {
                //         address: "New York, United States of America",
                //         latitude: "40.7127281",
                //         longitude: "-74.0060152",
                //         zoom: "12"
                //     }
                // },
                {
                    id: "opt-link-1",
                    field: "link",
                    title: "Link"
                },
                {
                    id: "opt-link-2",
                    field: "link",
                    title: "Link with default",
                    default: {
                        url: "http://codestarframework.com/",
                        text: "Codestar Framework",
                        target: "_blank"
                    }
                },
                {
                    id: "opt-date-1",
                    field: "date",
                    title: "Date"
                },
                {
                    id: "opt-date-2",
                    field: "date",
                    title: "Date with custom settings",
                    settings: {
                        dateFormat: "mm/dd/yy",
                        changeMonth: true,
                        changeYear: true,
                        showWeek: true,
                        showButtonPanel: true,
                        weekHeader: "Week",
                        monthNamesShort: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
                        dayNamesMin: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
                    }
                },
                {
                    id: "opt-date-3",
                    field: "date",
                    title: "Date with From & To",
                    from_to: true
                },
                {
                    id: "opt-date-4",
                    field: "date",
                    title: "Date with custom texts Begin & End",
                    from_to: true,
                    text_from: "Begin",
                    text_to: "End"
                },
                {
                    id: "opt-image-select-1",
                    field: "image_select",
                    title: "Image Select",
                    options: {
                        "opt-1": "http://codestarframework.com/assets/images/placeholder/150x125-2ecc71.gif",
                        "opt-2": "http://codestarframework.com/assets/images/placeholder/150x125-e74c3c.gif",
                        "opt-3": "http://codestarframework.com/assets/images/placeholder/150x125-ffbc00.gif",
                        "opt-4": "http://codestarframework.com/assets/images/placeholder/150x125-3498db.gif"
                    }
                },
                {
                    id: "opt-image-select-2",
                    field: "image_select",
                    title: "Image Select with default",
                    options: {
                        "opt-1": "http://codestarframework.com/assets/images/placeholder/80x80-2c3e50.gif",
                        "opt-2": "http://codestarframework.com/assets/images/placeholder/80x80-2c3e50.gif",
                        "opt-3": "http://codestarframework.com/assets/images/placeholder/80x80-2c3e50.gif",
                        "opt-4": "http://codestarframework.com/assets/images/placeholder/80x80-2c3e50.gif",
                        "opt-5": "http://codestarframework.com/assets/images/placeholder/80x80-2c3e50.gif",
                        "opt-6": "http://codestarframework.com/assets/images/placeholder/80x80-2c3e50.gif",
                        "opt-7": "http://codestarframework.com/assets/images/placeholder/80x80-2c3e50.gif"
                    },
                    default: "opt-4"
                },
                {
                    id: "opt-image-select-3",
                    field: "image_select",
                    title: "Image Select with multiple choice",
                    multiple: true,
                    options: {
                        "opt-1": "http://codestarframework.com/assets/images/placeholder/80x80-e74c3c.gif",
                        "opt-2": "http://codestarframework.com/assets/images/placeholder/80x80-ffbc00.gif",
                        "opt-3": "http://codestarframework.com/assets/images/placeholder/80x80-3498db.gif",
                        "opt-4": "http://codestarframework.com/assets/images/placeholder/80x80-2ecc71.gif"
                    }
                },
                {
                    id: "opt-image-select-4",
                    field: "image_select",
                    title: "Image Select with multiple choice and default",
                    multiple: true,
                    options: {
                        "opt-1": "http://codestarframework.com/assets/images/placeholder/80x80-2c3e50.gif",
                        "opt-2": "http://codestarframework.com/assets/images/placeholder/80x80-2c3e50.gif",
                        "opt-3": "http://codestarframework.com/assets/images/placeholder/80x80-e74c3c.gif",
                        "opt-4": "http://codestarframework.com/assets/images/placeholder/80x80-ffbc00.gif",
                        "opt-5": "http://codestarframework.com/assets/images/placeholder/80x80-3498db.gif",
                        "opt-6": "http://codestarframework.com/assets/images/placeholder/80x80-2ecc71.gif",
                        "opt-7": "http://codestarframework.com/assets/images/placeholder/80x80-2c3e50.gif",
                        "opt-8": "http://codestarframework.com/assets/images/placeholder/80x80-2c3e50.gif"
                    },
                    default: ["opt-3", "opt-4", "opt-5", "opt-6"]
                },
                {
                    id: "opt-image-select-5",
                    field: "image_select",
                    title: "Image Select inline style",
                    inline: true,
                    options: {
                        "opt-1": "http://codestarframework.com/assets/images/placeholder/80x80-e74c3c.gif",
                        "opt-2": "http://codestarframework.com/assets/images/placeholder/80x80-ffbc00.gif",
                        "opt-3": "http://codestarframework.com/assets/images/placeholder/80x80-3498db.gif",
                        "opt-4": "http://codestarframework.com/assets/images/placeholder/80x80-2ecc71.gif"
                    },
                    default: "opt-1"
                },
                {
                    id: "opt-button-set-1",
                    field: "button_set",
                    title: "Button Set",
                    options: {
                        enabled: "Enabled",
                        disabled: "Disabled"
                    }
                },
                {
                    id: "opt-button-set-2",
                    field: "button_set",
                    title: "Button Set with default",
                    options: {
                        enabled: "Enabled",
                        default: "Default",
                        disabled: "Disabled"
                    }
                },
                {
                    id: "opt-button-set-3",
                    field: "button_set",
                    title: "Button Set",
                    options: {
                        activate: "Activate",
                        deactivate: "Deactivate"
                    },
                    default: "activate"
                },
                {
                    id: "opt-button-set-4",
                    field: "button_set",
                    title: "Button Set",
                    options: {
                        on: "ON",
                        off: "OFF"
                    },
                    default: "on"
                },
                {
                    id: "opt-button-set-5",
                    field: "button_set",
                    title: "Button Set with multiple choice",
                    multiple: true,
                    options: {
                        "opt-1": "Option 1",
                        "opt-2": "Option 2",
                        "opt-3": "Option 3",
                        "opt-4": "Option 4",
                        "opt-5": "Option 5"
                    }
                },
                {
                    id: "opt-button-set-6",
                    field: "button_set",
                    title: "Button Set with multiple choice and default",
                    multiple: true,
                    options: {
                        "opt-1": "Option 1",
                        "opt-2": "Option 2",
                        "opt-3": "Option 3",
                        "opt-4": "Option 4",
                        "opt-5": "Option 5"
                    },
                    default: ["opt-2", "opt-4"]
                },
                {
                    "id": "opt-validate-1",
                    "title": "Sanitize (a) to (b)",
                    "subtitle": "Replacing letter (a) to letter (b). for eg. apple to bpple",
                    "field": "sanitize",
                    "sanitize": "a_to_b"
                },
                {
                    "id": "opt-validate-2",
                    "title": "Sanitize Title",
                    "subtitle": "Converting (space) to (-) and (uppercase) letters to (lowercase) letters. for eg. Hello World to hello-world",
                    "field": "sanitize",
                    "sanitize": "title"
                },
                {
                    "field": "heading",
                    "content": "This is a heading field"
                },
                {
                    "field": "subheading",
                    "content": "This is a subheading field"
                },
                {
                    "field": "content",
                    "content": "This is a content field"
                },
                {
                    "field": "submessage",
                    "type": "success",
                    "content": "This is a <strong>submessage</strong> field. And using style <strong>success</strong>"
                },
                {
                    "field": "content",
                    "content": "This is a content field"
                },
                {
                    "field": "submessage",
                    "type": "info",
                    "content": "This is a <strong>submessage</strong> field. And using style <strong>info</strong>"
                },
                {
                    "field": "submessage",
                    "type": "warning",
                    "content": "This is a <strong>submessage</strong> field. And using style <strong>warning</strong>"
                },
                {
                    "field": "submessage",
                    "type": "danger",
                    "content": "This is a <strong>submessage</strong> field. And using style <strong>danger</strong>"
                },
                {
                    "field": "notice",
                    "type": "success",
                    "content": "This is a <strong>notice</strong> field. And using style <strong>success</strong>"
                },
                {
                    "field": "notice",
                    "type": "info",
                    "content": "This is a <strong>notice</strong> field. And using style <strong>info</strong>"
                },
                {
                    "field": "notice",
                    "type": "warning",
                    "content": "This is a <strong>notice</strong> field. And using style <strong>warning</strong>"
                },
                {
                    "field": "notice",
                    "type": "danger",
                    "content": "This is a <strong>notice</strong> field. And using style <strong>danger</strong>"
                },
                {
                    "field": "content",
                    "content": "This is a <strong>content</strong> field. You can write some contents here."
                }
            ]
        },
        {
            "name": "Hero",
            "title": "Hero",
            "icon": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512' height='15px'><path d='M156.6 384.9L125.7 354c-8.5-8.5-11.5-20.8-7.7-32.2c3-8.9 7-20.5 11.8-33.8L24 288c-8.6 0-16.6-4.6-20.9-12.1s-4.2-16.7 .2-24.1l52.5-88.5c13-21.9 36.5-35.3 61.9-35.3l82.3 0c2.4-4 4.8-7.7 7.2-11.3C289.1-4.1 411.1-8.1 483.9 5.3c11.6 2.1 20.6 11.2 22.8 22.8c13.4 72.9 9.3 194.8-111.4 276.7c-3.5 2.4-7.3 4.8-11.3 7.2v82.3c0 25.4-13.4 49-35.3 61.9l-88.5 52.5c-7.4 4.4-16.6 4.5-24.1 .2s-12.1-12.2-12.1-20.9V380.8c-14.1 4.9-26.4 8.9-35.7 11.9c-11.2 3.6-23.4 .5-31.8-7.8zM384 168a40 40 0 1 0 0-80 40 40 0 1 0 0 80z' /></svg>",
            fields: [
                {
                    id: "opt-textarea-6",
                    field: "textarea",
                    title: "Textarea",
                    help: "The help text of the field"
                },
                {
                    id: "opt-select-1",
                    field: "select",
                    title: "Select",
                    placeholder: "Select an option",
                    options: {
                        "opt-1": "Option 1",
                        "opt-2": "Option 2",
                        "opt-3": "Option 3"
                    }
                },
            ]
        }
    ]
}




