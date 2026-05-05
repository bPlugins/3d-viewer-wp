export const options = {
    id: "admin-dashboard",
    title: "Admin Dashboard",
    sections: [
        {
            "name": "overview",
            "title": "Overview",
            "icon": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512' height='15px'><path d='M156.6 384.9L125.7 354c-8.5-8.5-11.5-20.8-7.7-32.2c3-8.9 7-20.5 11.8-33.8L24 288c-8.6 0-16.6-4.6-20.9-12.1s-4.2-16.7 .2-24.1l52.5-88.5c13-21.9 36.5-35.3 61.9-35.3l82.3 0c2.4-4 4.8-7.7 7.2-11.3C289.1-4.1 411.1-8.1 483.9 5.3c11.6 2.1 20.6 11.2 22.8 22.8c13.4 72.9 9.3 194.8-111.4 276.7c-3.5 2.4-7.3 4.8-11.3 7.2v82.3c0 25.4-13.4 49-35.3 61.9l-88.5 52.5c-7.4 4.4-16.6 4.5-24.1 .2s-12.1-12.2-12.1-20.9V380.8c-14.1 4.9-26.4 8.9-35.7 11.9c-11.2 3.6-23.4 .5-31.8-7.8zM384 168a40 40 0 1 0 0-80 40 40 0 1 0 0 80z' /></svg>",
            "fields": [
                {
                    "id": "text",
                    "title": "Text",
                    "field": "text",
                    "help": "Text help",
                    "attributes": {
                        "style": {
                            "width": "50%"
                        }
                    }
                },
                {
                    "id": "textarea",
                    "title": "Textarea",
                    "field": "textarea"
                },
                {
                    "id": "upload",
                    "title": "Upload",
                    "field": "media"
                },
                {
                    "id": "switcher",
                    "title": "Switcher",
                    "field": "switcher",
                    "label": "The label text of the switcher.",
                    "labelPosition": "right"
                },
                {
                    "id": "color",
                    "title": "Color",
                    "field": "color"
                },
                {
                    "id": "checkbox",
                    "title": "Checkbox",
                    "field": "checkbox",
                    "options": [
                        {
                            "label": "The label text for the checkbox.",
                            "value": "first"
                        }
                    ]
                },
                {
                    "id": "radio",
                    "title": "Radio",
                    "field": "radio",
                    "options": [
                        {
                            "label": "Yes, Please.",
                            "value": "yes"
                        },
                        {
                            "label": "No, Thank you.",
                            "value": "no"
                        }
                    ]
                },
                {
                    "id": "select",
                    "title": "Select",
                    "field": "select",
                    "options": [
                        {
                            "label": "Select an option",
                            "value": "default"
                        },
                        {
                            "label": "Option 1",
                            "value": "one"
                        },
                        {
                            "label": "Option 2",
                            "value": "two"
                        },
                        {
                            "label": "Option 3",
                            "value": "three"
                        }
                    ]
                },
                {
                    "id": "selectImage",
                    "title": "Select Image",
                    "field": "image_select",
                    "options": [
                        {
                            "label": "http://codestarframework.com/assets/images/placeholder/100x80-2ecc71.gif",
                            "value": "opt_1"
                        },
                        {
                            "label": "http://codestarframework.com/assets/images/placeholder/100x80-e74c3c.gif",
                            "value": "opt_2"
                        },
                        {
                            "label": "http://codestarframework.com/assets/images/placeholder/100x80-ffbc00.gif",
                            "value": "opt_3"
                        },
                        {
                            "label": "http://codestarframework.com/assets/images/placeholder/100x80-3498db.gif",
                            "value": "opt_4"
                        },
                        {
                            "label": "http://codestarframework.com/assets/images/placeholder/100x80-555555.gif",
                            "value": "opt_5"
                        }
                    ],
                    "default": "opt_1"
                },
                {
                    "id": "background",
                    "title": "Background",
                    "field": "background"
                }
            ]
        },
        {
            "name": "basic-fields",
            "title": "Basic Fields",
            "icon": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512' height='15px'><path d='M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM232 344V280H168c-13.3 0-24-10.7-24-24s10.7-24 24-24h64V168c0-13.3 10.7-24 24-24s24 10.7 24 24v64h64c13.3 0 24 10.7 24 24s-10.7 24-24 24H280v64c0 13.3-10.7 24-24 24s-24-10.7-24-24z' /></svg>",
            "children": [
                {
                    "name": "text",
                    "title": "Text",
                    "icon": "<svg stroke='currentColor' fill='currentColor' strokeWidth='0' viewBox='0 0 256 256' height='15px' xmlns='http://www.w3.org/2000/svg'><path d='M216,42H40A14,14,0,0,0,26,56V200a14,14,0,0,0,14,14H216a14,14,0,0,0,14-14V56A14,14,0,0,0,216,42Zm2,158a2,2,0,0,1-2,2H40a2,2,0,0,1-2-2V56a2,2,0,0,1,2-2H216a2,2,0,0,1,2,2Z'></path></svg>",
                    "fields": [
                        {
                            "id": "text2",
                            "title": "Text",
                            "field": "text",
                            "attributes": {
                                "style": {
                                    "width": "50%"
                                }
                            }
                        },
                        {
                            "id": "defaultText",
                            "title": "Text with default",
                            "field": "text",
                            "default": "Default Text",
                            "attributes": {
                                "style": {
                                    "width": "50%"
                                }
                            }
                        },
                        {
                            "id": "ingenuity",
                            "title": "Text field ingenuity",
                            "subtitle": "The field of subtitle text.",
                            "before": "The field of before text",
                            "after": "The field of after text",
                            "field": "text",
                            "attributes": {
                                "style": {
                                    "width": "50%"
                                }
                            }
                        },
                        {
                            "id": "placeholder",
                            "title": "Text with placeholder",
                            "placeholder": "Typed something...",
                            "field": "text",
                            "attributes": {
                                "style": {
                                    "width": "50%"
                                }
                            }
                        },
                        {
                            "id": "readonly",
                            "title": "Text readonly",
                            "default": "Readonly text field, can not be changed",
                            "field": "text",
                            "attributes": {
                                "style": {
                                    "width": "50%"
                                },
                                "readOnly": true
                            }
                        },
                        {
                            "id": "maxLength",
                            "title": "Text with maxlength (5)",
                            "default": "abc",
                            "attributes": {
                                "maxLength": 5,
                                "style": {
                                    "width": "50%"
                                }
                            },
                            "field": "text"
                        },
                        {
                            "id": "customStyle",
                            "title": "Text using custom styles",
                            "attributes": {
                                "style": {
                                    "borderColor": "#93C054",
                                    "padding": "8px 8px"
                                },
                                "outline": "#93C054"
                            },
                            "field": "text"
                        },
                        {
                            "id": "fullWidth",
                            "after": "It shows full width if there is no field of title.",
                            "attributes": {
                                "style": {
                                    "width": "50%"
                                }
                            },
                            "field": "text"
                        }
                    ]
                },
                {
                    "name": "textarea",
                    "title": "Textarea",
                    "icon": "<svg stroke='currentColor' fill='currentColor' strokeWidth='0' viewBox='0 0 256 256' height='15px' xmlns='http://www.w3.org/2000/svg'><path d='M216,42H40A14,14,0,0,0,26,56V200a14,14,0,0,0,14,14H216a14,14,0,0,0,14-14V56A14,14,0,0,0,216,42Zm2,158a2,2,0,0,1-2,2H40a2,2,0,0,1-2-2V56a2,2,0,0,1,2-2H216a2,2,0,0,1,2,2Z'></path></svg>",
                    "fields": [
                        {
                            "id": "textarea",
                            "title": "Textarea",
                            "field": "textarea"
                        },
                        {
                            "id": "default",
                            "title": "Textarea with default",
                            "field": "textarea",
                            "default": "This is default value"
                        },
                        {
                            "id": "placeholder",
                            "title": "Text with placeholder",
                            "field": "textarea",
                            "placeholder": "Typed something..."
                        },
                        {
                            "id": "ingenuity",
                            "title": "Textarea field ingenuity",
                            "subtitle": "The field of subtitle text.",
                            "before": "The field of before text",
                            "after": "The field of after text",
                            "field": "textarea",
                            "placeholder": "Typed something..."
                        },
                        {
                            "id": "fullWidth",
                            "after": "It shows full width if there is no field of title.",
                            "field": "textarea"
                        }
                    ]
                },
                {
                    "name": "select",
                    "title": "Select",
                    "icon": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512' height='15px'><path d='M40 48C26.7 48 16 58.7 16 72v48c0 13.3 10.7 24 24 24H88c13.3 0 24-10.7 24-24V72c0-13.3-10.7-24-24-24H40zM192 64c-17.7 0-32 14.3-32 32s14.3 32 32 32H480c17.7 0 32-14.3 32-32s-14.3-32-32-32H192zm0 160c-17.7 0-32 14.3-32 32s14.3 32 32 32H480c17.7 0 32-14.3 32-32s-14.3-32-32-32H192zm0 160c-17.7 0-32 14.3-32 32s14.3 32 32 32H480c17.7 0 32-14.3 32-32s-14.3-32-32-32H192zM16 232v48c0 13.3 10.7 24 24 24H88c13.3 0 24-10.7 24-24V232c0-13.3-10.7-24-24-24H40c-13.3 0-24 10.7-24 24zM40 368c-13.3 0-24 10.7-24 24v48c0 13.3 10.7 24 24 24H88c13.3 0 24-10.7 24-24V392c0-13.3-10.7-24-24-24H40z' /></svg>",
                    "fields": [
                        {
                            "id": "select",
                            "title": "Select",
                            "field": "select",
                            "options": [
                                {
                                    "label": "Select an option",
                                    "value": "default"
                                },
                                {
                                    "label": "Option 1",
                                    "value": "one"
                                },
                                {
                                    "label": "Option 2",
                                    "value": "two"
                                },
                                {
                                    "label": "Option 3",
                                    "value": "three"
                                }
                            ]
                        },
                        {
                            "id": "default",
                            "title": "Select with default",
                            "field": "select",
                            "options": [
                                {
                                    "label": "Select an option",
                                    "value": "default"
                                },
                                {
                                    "label": "Option 1",
                                    "value": "one"
                                },
                                {
                                    "label": "Option 2",
                                    "value": "two"
                                },
                                {
                                    "label": "Option 3",
                                    "value": "three"
                                }
                            ]
                        },
                        {
                            "id": "multipleSelect",
                            "title": "Select with multiple choice",
                            "field": "select",
                            "attributes": {
                                "multiple": true
                            },
                            "options": [
                                {
                                    "label": "Option 1",
                                    "value": "one"
                                },
                                {
                                    "label": "Option 2",
                                    "value": "two"
                                },
                                {
                                    "label": "Option 3",
                                    "value": "three"
                                },
                                {
                                    "label": "Option 4",
                                    "value": "four"
                                },
                                {
                                    "label": "Option 5",
                                    "value": "five"
                                },
                                {
                                    "label": "Option 6",
                                    "value": "six"
                                }
                            ]
                        },
                        {
                            "field": "notice",
                            "content": "Select with <b>chosen</b> style.",
                            "variant": "info"
                        },
                        {
                            "id": "chosen",
                            "title": "Select with chosen",
                            "field": "chosen",
                            "options": [
                                {
                                    "label": "Option 1",
                                    "value": "one"
                                },
                                {
                                    "label": "Option 2",
                                    "value": "two"
                                },
                                {
                                    "label": "Option 3",
                                    "value": "three"
                                },
                                {
                                    "label": "Option 4",
                                    "value": "four"
                                },
                                {
                                    "label": "Option 5",
                                    "value": "five"
                                }
                            ]
                        },
                        {
                            "id": "chosenMultiple",
                            "title": "Select with multiple chosen",
                            "field": "chosen",
                            "attributes": {
                                "multiple": true
                            },
                            "options": [
                                {
                                    "label": "Option 1",
                                    "value": "one"
                                },
                                {
                                    "label": "Option 2",
                                    "value": "two"
                                },
                                {
                                    "label": "Option 3",
                                    "value": "three"
                                },
                                {
                                    "label": "Option 4",
                                    "value": "four"
                                },
                                {
                                    "label": "Option 5",
                                    "value": "five"
                                }
                            ]
                        },
                        {
                            "id": "searchPage",
                            "title": "Select with multiple AJAX search Pages",
                            "field": "searchPage",
                            "type": "pages"
                        },
                        {
                            "id": "searchPage",
                            "title": "Select with multiple AJAX search Posts",
                            "field": "searchPage",
                            "type": "posts"
                        },
                        {
                            "field": "notice",
                            "content": "Select with <b>predefined wp query</b> options.",
                            "variant": "info"
                        },
                        {
                            "id": "selectPage",
                            "title": "Select with pages",
                            "field": "pages"
                        },
                        {
                            "id": "selectPost",
                            "title": "Select with posts",
                            "field": "posts"
                        },
                        {
                            "id": "selectCategory",
                            "title": "Select with categories",
                            "field": "categories"
                        },
                        {
                            "id": "selectRole",
                            "title": "Select with roles",
                            "field": "roles"
                        },
                        {
                            "id": "selectUser",
                            "title": "Select with users",
                            "field": "users"
                        },
                        {
                            "id": "selectPostType",
                            "title": "Select with postTypes",
                            "field": "postTypes"
                        },
                        {
                            "id": "selectMenu",
                            "title": "Select with menu",
                            "field": "menus"
                        }
                    ]
                },
                {
                    "name": "checkbox",
                    "title": "Checkbox",
                    "icon": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 448 512' height='15px'><path d='M64 32C28.7 32 0 60.7 0 96V416c0 35.3 28.7 64 64 64H384c35.3 0 64-28.7 64-64V96c0-35.3-28.7-64-64-64H64zM337 209L209 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L303 175c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z' /></svg>",
                    "fields": [
                        {
                            "id": "checkbox",
                            "title": "Checkbox",
                            "field": "checkbox",
                            "options": [
                                {
                                    "label": "The label text for the checkbox.",
                                    "value": "check"
                                }
                            ]
                        },
                        {
                            "id": "default",
                            "title": "Checkbox with default.",
                            "field": "checkbox",
                            "default": [
                                "first"
                            ],
                            "options": [
                                {
                                    "label": "The label text for the checkbox.",
                                    "value": "first"
                                }
                            ]
                        },
                        {
                            "id": "multipleChoice",
                            "title": "Checkbox with multiple choice.",
                            "field": "checkbox",
                            "options": [
                                {
                                    "label": "Option 1",
                                    "value": "option-1"
                                },
                                {
                                    "label": "Option 2",
                                    "value": "option-2"
                                },
                                {
                                    "label": "Option 3",
                                    "value": "option-3"
                                }
                            ]
                        },
                        {
                            "id": "inlineCheckbox",
                            "title": "Checkbox inline with multiple choice.",
                            "field": "checkbox",
                            "attributes": {
                                "direction": "row"
                            },
                            "options": [
                                {
                                    "label": "Option 1",
                                    "value": "option-1"
                                },
                                {
                                    "label": "Option 2",
                                    "value": "option-2"
                                },
                                {
                                    "label": "Option 3",
                                    "value": "option-3"
                                }
                            ]
                        },
                        {
                            "id": "multipleDefault",
                            "title": "Checkbox multiple choice with default.",
                            "field": "checkbox",
                            "default": [
                                "option-1",
                                "option-2"
                            ],
                            "options": [
                                {
                                    "label": "Option 1",
                                    "value": "option-1"
                                },
                                {
                                    "label": "Option 2",
                                    "value": "option-2"
                                },
                                {
                                    "label": "Option 3",
                                    "value": "option-3"
                                }
                            ]
                        },
                        {
                            "id": "manyItems",
                            "title": "Checkbox testing on many items.",
                            "field": "checkbox",
                            "after": "Vertical scroll showing automatically after add many items",
                            "options": [
                                {
                                    "label": "Option 1",
                                    "value": "option-1"
                                },
                                {
                                    "label": "Option 2",
                                    "value": "option-2"
                                },
                                {
                                    "label": "Option 3",
                                    "value": "option-3"
                                },
                                {
                                    "label": "Option 4",
                                    "value": "option-4"
                                },
                                {
                                    "label": "Option 5",
                                    "value": "option-5"
                                },
                                {
                                    "label": "Option 6",
                                    "value": "option-6"
                                },
                                {
                                    "label": "Option 7",
                                    "value": "option-7"
                                },
                                {
                                    "label": "Option 8",
                                    "value": "option-8"
                                },
                                {
                                    "label": "Option 9",
                                    "value": "option-9"
                                },
                                {
                                    "label": "Option 10",
                                    "value": "option-10"
                                },
                                {
                                    "label": "Option 11",
                                    "value": "option-11"
                                },
                                {
                                    "label": "Option 12",
                                    "value": "option-12"
                                },
                                {
                                    "label": "Option 13",
                                    "value": "option-13"
                                },
                                {
                                    "label": "Option 14",
                                    "value": "option-14"
                                },
                                {
                                    "label": "Option 15",
                                    "value": "option-15"
                                }
                            ]
                        },
                        {
                            "field": "notice",
                            "content": "Checkbox with <b>predefined wp query</b> options similar like <b>select</b> field. (see select field for all options models.)",
                            "variant": "info"
                        },
                        {
                            "id": "categories",
                            "title": "Checkbox with categories",
                            "field": "checkbox",
                            "categories": true
                        }
                    ]
                },
                {
                    "name": "radio",
                    "title": "Radio",
                    "icon": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512' height='15px'><path d='M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm0-352a96 96 0 1 1 0 192 96 96 0 1 1 0-192z' /></svg>",
                    "fields": [
                        {
                            "id": "radio",
                            "title": "Radio",
                            "field": "radio",
                            "options": [
                                {
                                    "label": "Option 1",
                                    "value": "option-1"
                                },
                                {
                                    "label": "Option 2",
                                    "value": "option-2"
                                },
                                {
                                    "label": "Option 3",
                                    "value": "option-3"
                                }
                            ]
                        },
                        {
                            "id": "default",
                            "title": "Radio with default",
                            "field": "radio",
                            "default": "option-2",
                            "options": [
                                {
                                    "label": "Option 1",
                                    "value": "option-1"
                                },
                                {
                                    "label": "Option 2",
                                    "value": "option-2"
                                },
                                {
                                    "label": "Option 3",
                                    "value": "option-3"
                                }
                            ]
                        },
                        {
                            "id": "inline",
                            "title": "Radio with inline style",
                            "field": "radio",
                            "attributes": {
                                "direction": "row"
                            },
                            "options": [
                                {
                                    "label": "Option 1",
                                    "value": "option-1"
                                },
                                {
                                    "label": "Option 2",
                                    "value": "option-2"
                                },
                                {
                                    "label": "Option 3",
                                    "value": "option-3"
                                }
                            ]
                        },
                        {
                            "id": "manyItems",
                            "title": "Radio testing on many items",
                            "field": "radio",
                            "after": "Vertical scroll showing automatically after add many items",
                            "options": [
                                {
                                    "label": "Option 1",
                                    "value": "option-1"
                                },
                                {
                                    "label": "Option 2",
                                    "value": "option-2"
                                },
                                {
                                    "label": "Option 3",
                                    "value": "option-3"
                                },
                                {
                                    "label": "Option 4",
                                    "value": "option-4"
                                },
                                {
                                    "label": "Option 5",
                                    "value": "option-5"
                                },
                                {
                                    "label": "Option 6",
                                    "value": "option-6"
                                },
                                {
                                    "label": "Option 7",
                                    "value": "option-7"
                                },
                                {
                                    "label": "Option 8",
                                    "value": "option-8"
                                },
                                {
                                    "label": "Option 9",
                                    "value": "option-9"
                                },
                                {
                                    "label": "Option 10",
                                    "value": "option-10"
                                },
                                {
                                    "label": "Option 11",
                                    "value": "option-11"
                                },
                                {
                                    "label": "Option 12",
                                    "value": "option-12"
                                },
                                {
                                    "label": "Option 13",
                                    "value": "option-13"
                                },
                                {
                                    "label": "Option 14",
                                    "value": "option-14"
                                },
                                {
                                    "label": "Option 15",
                                    "value": "option-15"
                                }
                            ]
                        },
                        {
                            "field": "notice",
                            "content": "Radio with <b>predefined wp query</b> options similar like <b>select</b> field. (see select field for all options models.)",
                            "variant": "info"
                        },
                        {
                            "id": "categories",
                            "title": "Radio with categories",
                            "field": "radio",
                            "categories": true
                        }
                    ]
                }
            ]
        },
        {
            "name": "repeater-fields",
            "title": "Repeater Fields",
            "icon": "<svg stroke='currentColor' fill='currentColor' strokeWidth='0' viewBox='0 0 512 512' height='15px' xmlns='http://www.w3.org/2000/svg'><path d='M464 0H144c-26.51 0-48 21.49-48 48v48H48c-26.51 0-48 21.49-48 48v320c0 26.51 21.49 48 48 48h320c26.51 0 48-21.49 48-48v-48h48c26.51 0 48-21.49 48-48V48c0-26.51-21.49-48-48-48zM362 464H54a6 6 0 0 1-6-6V150a6 6 0 0 1 6-6h42v224c0 26.51 21.49 48 48 48h224v42a6 6 0 0 1-6 6zm96-96H150a6 6 0 0 1-6-6V54a6 6 0 0 1 6-6h308a6 6 0 0 1 6 6v308a6 6 0 0 1-6 6z'></path></svg>",
            "children": [
                {
                    "name": "repeater",
                    "title": "Repeater",
                    "fields": [
                        {
                            "id": "repeater",
                            "title": "Repeater",
                            "help": "My Single repeater here. drag and drop to sort",
                            "field": "repeater",
                            "type": "repeater",
                            "fields": []
                        },
                        {
                            "id": "repeater_fields_2",
                            "title": "Repeater with default",
                            "help": "My Single repeater here. drag and drop to sort",
                            "field": "repeater",
                            "type": "repeater",
                            "fields": [
                                {
                                    "id": "repeat_name_11",
                                    "fields": [
                                        {
                                            "id": "text_12",
                                            "title": "Text",
                                            "help": "Enter your repeat field 1 data here here",
                                            "field": "text",
                                            "default": "Text default 1"
                                        }
                                    ]
                                },
                                {
                                    "id": "repeatName13",
                                    "fields": [
                                        {
                                            "id": "text_14",
                                            "title": "Text",
                                            "help": "Enter your repeat field 1 data here here",
                                            "field": "text",
                                            "default": "Text default 2"
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            "id": "multiple_fields",
                            "title": "Repeater with multiple fields",
                            "help": "My Single repeater here. drag and drop to sort",
                            "field": "repeater",
                            "type": "repeater",
                            "fields": [
                                {
                                    "id": "multiple_fields_1",
                                    "fields": [
                                        {
                                            "id": "switcher",
                                            "title": "Switcher",
                                            "field": "switcher",
                                            "default": false
                                        },
                                        {
                                            "id": "color",
                                            "title": "Color",
                                            "field": "color",
                                            "default": "#3498db"
                                        },
                                        {
                                            "id": "text",
                                            "title": "Text",
                                            "field": "text",
                                            "default": "Text default 1"
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            "id": "repeater_limit",
                            "title": "Repeater with limited (min - max items)",
                            "subtitle": "The maximum/minimum number of items the user can add. (In this example min:1, max:3)",
                            "field": "repeater",
                            "type": "repeater",
                            "button_title": "Add Text",
                            "min": 1,
                            "max": 3,
                            "fields": [
                                {
                                    "id": "repeater_limit_1",
                                    "fields": [
                                        {
                                            "id": "text_1",
                                            "title": "Text",
                                            "field": "text",
                                            "default": "Text default 1"
                                        }
                                    ]
                                },
                                {
                                    "id": "repeater_limit_2",
                                    "fields": [
                                        {
                                            "id": "text_2",
                                            "title": "Text",
                                            "field": "text",
                                            "default": "Text default 2"
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    "name": "group",
                    "title": "Group",
                    "fields": [
                        {
                            "id": "group_1",
                            "title": "Group",
                            "field": "repeater",
                            "type": "group",
                            "fields": [{
                                "id": "text",
                                "title": "Text",
                                "field": "text"
                            }],
                            "defaultFields": [
                                {
                                    "id": "text",
                                    "title": "Text",
                                    "field": "text"
                                },
                                {
                                    "id": "switcher",
                                    "title": "Switcher",
                                    "field": "switcher"
                                },
                                {
                                    "id": "textarea",
                                    "title": "Textarea",
                                    "field": "textarea"
                                }
                            ]
                        },
                        {
                            "id": "group_2",
                            "title": "Group with default",
                            "field": "repeater",
                            "type": "group",
                            "fields": [
                                {
                                    "id": "group_default_1",
                                    "title": "Some text 1",
                                    "fields": [
                                        {
                                            "id": "text",
                                            "title": "Text",
                                            "field": "text",
                                            "default": "Some text 1"
                                        },
                                        {
                                            "id": "switcher",
                                            "title": "Switcher",
                                            "field": "switcher",
                                            "default": true
                                        },
                                        {
                                            "id": "textarea",
                                            "title": "Textarea",
                                            "field": "textarea",
                                            "default": "Some textarea content 1"
                                        }
                                    ]
                                },
                                {
                                    "id": "group_default_2",
                                    "title": "Some text 2",
                                    "fields": [
                                        {
                                            "id": "text",
                                            "title": "Text",
                                            "field": "text",
                                            "default": "Some text 2"
                                        },
                                        {
                                            "id": "switcher",
                                            "title": "Switcher",
                                            "field": "switcher",
                                            "default": false
                                        },
                                        {
                                            "id": "textarea",
                                            "title": "Textarea",
                                            "field": "textarea",
                                            "default": "Some textarea content 2"
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            "id": "group_3",
                            "title": "Group with limited (min - max items)",
                            "subtitle": "The maximum/minimum number of items the user can add. (In this example min:1, max:3)",
                            "field": "repeater",
                            "type": "group",
                            "min": 1,
                            "max": 3,
                            "fields": [
                                {
                                    "id": "group_default_1",
                                    "title": "Limited text 1",
                                    "fields": [
                                        {
                                            "id": "text",
                                            "title": "Text",
                                            "field": "text",
                                            "default": "Limited text 1"
                                        },
                                        {
                                            "id": "textarea",
                                            "title": "Textarea",
                                            "field": "textarea",
                                            "default": "Limited textarea content 1"
                                        }
                                    ]
                                },
                                {
                                    "id": "group_default_2",
                                    "title": "Limited text 2",
                                    "fields": [
                                        {
                                            "id": "text",
                                            "title": "Text",
                                            "field": "text",
                                            "default": "Limited text 2"
                                        },
                                        {
                                            "id": "textarea",
                                            "title": "Textarea",
                                            "field": "textarea",
                                            "default": "Limited textarea content 2"
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            "id": "group_4",
                            "title": "Group with WP Editor",
                            "subtitle": "WP Editor integrated.",
                            "field": "repeater",
                            "type": "group",
                            "fields": [
                                {
                                    "id": "group_default_1",
                                    "title": "WP Editor 1",
                                    "fields": [
                                        {
                                            "id": "text",
                                            "title": "Text",
                                            "field": "text",
                                            "default": "WP Editor 1"
                                        },
                                        {
                                            "id": "wpEditor",
                                            "title": "WP Editor",
                                            "field": "wp_editor",
                                            "default": "Editor content 1"
                                        }
                                    ]
                                },
                                {
                                    "id": "group_default_2",
                                    "title": "WP Editor 2",
                                    "fields": [
                                        {
                                            "id": "text",
                                            "title": "Text",
                                            "field": "text",
                                            "default": "WP Editor 2"
                                        },
                                        {
                                            "id": "wpEditor",
                                            "title": "WP Editor",
                                            "field": "wp_editor",
                                            "default": "Editor content 2"
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            "name": "combineFields",
            "title": "Combine Fields",
            "icon": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 448 512' height='15px'><path d='M0 96C0 78.3 14.3 64 32 64H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32H32c-17.7 0-32-14.3-32-32s14.3-32 32-32H416c17.7 0 32 14.3 32 32z' /></svg>",
            "children": [
                {
                    "name": "accordion",
                    "title": "Accordion",
                    "fields": [
                        {
                            "title": "Accordion",
                            "id": "accordion",
                            "field": "accordion",
                            "fields": [
                                {
                                    "title": "Accordion 1",
                                    "id": "accordion1",
                                    "fields": [
                                        {
                                            "id": "opt-text-1",
                                            "field": "text",
                                            "title": "Text",
                                            "attributes": {
                                                "style": {
                                                    "width": "50%"
                                                }
                                            }
                                        },
                                        {
                                            "id": "opt-switcher-1",
                                            "field": "switcher",
                                            "title": "Switcher"
                                        },
                                        {
                                            "id": "opt-textarea-1",
                                            "field": "textarea",
                                            "title": "Textarea"
                                        }
                                    ]
                                },
                                {
                                    "title": "Accordion 2",
                                    "id": "accordion2",
                                    "fields": [
                                        {
                                            "id": "opt-text-1",
                                            "field": "text",
                                            "title": "Text",
                                            "attributes": {
                                                "style": {
                                                    "width": "50%"
                                                }
                                            }
                                        },
                                        {
                                            "id": "opt-switcher-1",
                                            "field": "color",
                                            "title": "Color"
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            "title": "Accordion with default",
                            "id": "default",
                            "field": "accordion",
                            "fields": [
                                {
                                    "title": "Fields 1",
                                    "id": "fields1",
                                    "fields": [
                                        {
                                            "title": "Text 1",
                                            "id": "text1",
                                            "field": "text",
                                            "default": "This is text 1 default value",
                                            "attributes": {
                                                "style": {
                                                    "width": "50%"
                                                }
                                            }
                                        },
                                        {
                                            "title": "Text 2",
                                            "id": "text2",
                                            "field": "text",
                                            "default": "This is text 2 default value",
                                            "attributes": {
                                                "style": {
                                                    "width": "50%"
                                                }
                                            }
                                        }
                                    ]
                                },
                                {
                                    "title": "Fields 2",
                                    "id": "fields2",
                                    "fields": [
                                        {
                                            "title": "Color 1",
                                            "id": "color1",
                                            "field": "color",
                                            "default": "#1e73be"
                                        },
                                        {
                                            "title": "Color 2",
                                            "id": "color2",
                                            "field": "color",
                                            "default": "#ffbc00"
                                        }
                                    ]
                                },
                                {
                                    "title": "Fields 3",
                                    "id": "fields3",
                                    "fields": [
                                        {
                                            "title": "Textarea 1",
                                            "id": "textarea1",
                                            "field": "textarea",
                                            "default": "This is textarea 1 default value"
                                        },
                                        {
                                            "title": "Textarea 2",
                                            "id": "textarea2",
                                            "field": "textarea",
                                            "default": "This is textarea 2 default value"
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            "title": "Accordion with custom icons",
                            "id": "customIcons",
                            "field": "accordion",
                            "fields": [
                                {
                                    "title": "Other 1",
                                    "icon": "<svg xmlns='http://www.w3.org/2000/svg' height='15px' viewBox='0 0 448 512'><path d='M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z'/></svg>",
                                    "id": "other1",
                                    "fields": [
                                        {
                                            "title": "Text 1",
                                            "id": "text1",
                                            "field": "text",
                                            "attributes": {
                                                "style": {
                                                    "width": "50%"
                                                }
                                            }
                                        }
                                    ]
                                },
                                {
                                    "title": "Other 2",
                                    "icon": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 576 512' height='15px' ><path d='M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z'/></svg>",
                                    "id": "other2",
                                    "fields": [
                                        {
                                            "title": "Text 2",
                                            "id": "text2",
                                            "field": "text",
                                            "attributes": {
                                                "style": {
                                                    "width": "50%"
                                                }
                                            }
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    "name": "tabbed",
                    "title": "Tabbed",
                    "fields": [
                        {
                            "id": "tabbed",
                            "title": "Tabbed",
                            "help": "Enter your wp editor name here",
                            "field": "tabbed",
                            "fields": [
                                {
                                    "id": "tabbed1",
                                    "title": "Tabbed 1",
                                    "fields": [
                                        {
                                            "id": "text1",
                                            "title": "Text 1",
                                            "field": "text",
                                            "attributes": {
                                                "style": {
                                                    "width": "50%"
                                                }
                                            }
                                        },
                                        {
                                            "id": "textarea1",
                                            "title": "Textarea 1",
                                            "field": "textarea"
                                        }
                                    ]
                                },
                                {
                                    "id": "tabbed2",
                                    "title": "Tabbed 2",
                                    "fields": [
                                        {
                                            "id": "text1",
                                            "title": "Text 2",
                                            "field": "text",
                                            "attributes": {
                                                "style": {
                                                    "width": "50%"
                                                }
                                            }
                                        },
                                        {
                                            "id": "textarea2",
                                            "title": "Textarea 2",
                                            "field": "textarea"
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            "id": "icon",
                            "title": "Tabbed with default and icons",
                            "field": "tabbed",
                            "fields": [
                                {
                                    "id": "fields1",
                                    "title": "Fields 1",
                                    "icon": "<svg xmlns='http://www.w3.org/2000/svg' height='15px' viewBox='0 0 448 512'><path d='M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z'/></svg>",
                                    "fields": [
                                        {
                                            "id": "text1",
                                            "title": "Text 1",
                                            "field": "text",
                                            "attributes": {
                                                "style": {
                                                    "width": "50%"
                                                }
                                            },
                                            "default": "This is text 1 default value"
                                        },
                                        {
                                            "id": "text2",
                                            "title": "Text 2",
                                            "field": "text",
                                            "attributes": {
                                                "style": {
                                                    "width": "50%"
                                                }
                                            },
                                            "default": "This is text 2 default value"
                                        }
                                    ]
                                },
                                {
                                    "id": "fields2",
                                    "title": "Fields 2",
                                    "icon": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 576 512' height='15px' ><path d='M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z'/></svg>",
                                    "fields": [
                                        {
                                            "id": "color1",
                                            "title": "Color 1",
                                            "field": "color",
                                            "default": "#1e73be"
                                        },
                                        {
                                            "id": "color2",
                                            "title": "Color 2",
                                            "field": "color",
                                            "default": "#ffbc00"
                                        }
                                    ]
                                },
                                {
                                    "id": "fields3",
                                    "title": "Fields 3",
                                    "icon": "<svg xmlns='http://www.w3.org/2000/svg' height='15px' viewBox='0 0 512 512'><path d='M495.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6c-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2c-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8c-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8c-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3c-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6c4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2c5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8c8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z'/></svg>",
                                    "fields": [
                                        {
                                            "id": "textarea1",
                                            "title": "Textarea 1",
                                            "field": "textarea",
                                            "default": "This is textarea 1 default value"
                                        },
                                        {
                                            "id": "textarea2",
                                            "title": "Textarea 2",
                                            "field": "textarea",
                                            "default": "This is textarea 2 default value"
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    "name": "fieldset",
                    "title": "Fieldset",
                    "fields": [
                        {
                            "id": "fieldset",
                            "title": "Fieldset",
                            "help": "Enter your wp editor name here",
                            "field": "fieldset",
                            "fields": [
                                {
                                    "id": "color",
                                    "title": "Color",
                                    "field": "color"
                                },
                                {
                                    "id": "text",
                                    "title": "Text",
                                    "field": "text",
                                    "attributes": {
                                        "style": {
                                            "width": "50%"
                                        }
                                    }
                                },
                                {
                                    "id": "textarea",
                                    "title": "Textarea",
                                    "field": "textarea"
                                }
                            ]
                        },
                        {
                            "id": "default",
                            "title": "Fieldset with default",
                            "field": "fieldset",
                            "fields": [
                                {
                                    "content": "Title of the fieldset"
                                },
                                {
                                    "id": "color",
                                    "title": "Color",
                                    "field": "color",
                                    "default": "#1e73be"
                                },
                                {
                                    "id": "text",
                                    "title": "Text",
                                    "field": "text",
                                    "default": "This is text default value"
                                },
                                {
                                    "id": "textarea",
                                    "title": "Textarea",
                                    "field": "textarea",
                                    "default": "This is textarea default value"
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            "name": "mediauploadfields",
            "title": "Media and Upload Fields",
            "icon": "<svg stroke='currentColor' fill='currentColor' strokeWidth='0' version='1.1' viewBox='0 0 16 16' height='15px' xmlns='http://www.w3.org/2000/svg'><path d='M7.5 11h-7.5v4h15v-4h-7.5zM14 13h-2v-1h2v1zM3.5 5l4-4 4 4h-2.5v5h-3v-5z'></path></svg>",
            "children": [
                {
                    "name": "media",
                    "title": "Media",
                    "fields": [
                        {
                            "id": "media",
                            "title": "Media",
                            "field": "media"
                        },
                        {
                            "id": "without_preview",
                            "title": "Media without preview",
                            "field": "media",
                            "preview": false
                        },
                        {
                            "id": "without_url",
                            "title": "Media without url",
                            "field": "media",
                            "url": false
                        },
                        {
                            "id": "imageType",
                            "title": "Media with only image type",
                            "field": "media",
                            "type": "image"
                        },
                        {
                            "id": "video",
                            "title": "Media with only video type",
                            "field": "media",
                            "type": "video"
                        },
                        {
                            "id": "audio",
                            "title": "Media with only video type",
                            "field": "media",
                            "type": "audio"
                        }
                    ]
                },
                {
                    "name": "upload",
                    "title": "Upload",
                    "fields": [
                        {
                            "id": "upload",
                            "title": "Upload",
                            "field": "media",
                            "preview": false
                        },
                        {
                            "id": "preview",
                            "title": "Upload with preview",
                            "field": "media",
                            "preview": true
                        },
                        {
                            "id": "placeholder",
                            "title": "Upload with placeholder",
                            "field": "media",
                            "preview": false,
                            "attributes": {
                                "placeholder": "http://"
                            }
                        },
                        {
                            "id": "image",
                            "title": "Upload with only image type",
                            "field": "media",
                            "preview": false,
                            "button_title": "Upload Image",
                            "type": "image"
                        },
                        {
                            "id": "video",
                            "title": "Upload with only video type",
                            "field": "media",
                            "button_title": "Upload Video",
                            "preview": false,
                            "type": "video"
                        },
                        {
                            "id": "audio",
                            "title": "Upload with only audio type",
                            "field": "media",
                            "button_title": "Upload audio",
                            "preview": false,
                            "type": "audio"
                        }
                    ]
                },
                {
                    "name": "gallery",
                    "title": "Gallery",
                    "fields": [
                        {
                            "id": "gallery",
                            "title": "Gallery",
                            "field": "gallery"
                        },
                        {
                            "id": "gallery",
                            "title": "Gallery with custom button names",
                            "field": "gallery",
                            "add_title": "Add Image(s)",
                            "edit_title": "Edit Images",
                            "clear_title": "Remove Images"
                        }
                    ]
                }
            ]
        },
        {
            "name": "editorFields",
            "title": "Editor Fields",
            "icon": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 512' height='15px'><path d='M392.8 1.2c-17-4.9-34.7 5-39.6 22l-128 448c-4.9 17 5 34.7 22 39.6s34.7-5 39.6-22l128-448c4.9-17-5-34.7-22-39.6zm80.6 120.1c-12.5 12.5-12.5 32.8 0 45.3L562.7 256l-89.4 89.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l112-112c12.5-12.5 12.5-32.8 0-45.3l-112-112c-12.5-12.5-32.8-12.5-45.3 0zm-306.7 0c-12.5-12.5-32.8-12.5-45.3 0l-112 112c-12.5 12.5-12.5 32.8 0 45.3l112 112c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256l89.4-89.4c12.5-12.5 12.5-32.8 0-45.3z' /></svg>",
            "children": [
                {
                    "name": "codeEditor",
                    "title": "Code Editor",
                    "fields": [
                        {
                            "id": "code_editor_1",
                            "title": "Code Editor",
                            "subtitle": "<strong>Default Editor</strong> Using: theme: default and mode: html",
                            "help": "Enter your wp editor name here",
                            "field": "code_editor"
                        },
                        {
                            "id": "code_editor_2",
                            "title": "Code Editor",
                            "subtitle": "<strong>HTML Editor</strong> Using: theme: solarized_dark and mode: html",
                            "settings": {
                                "theme": "solarized_dark"
                            },
                            "field": "code_editor",
                            "default": "<div class=\"wrapper\">\r\n  <h1>Hello world</h1>\r\n  <p>Lorem <strong>ipsum</strong> dollar.</p>\r\n</div>"
                        },
                        {
                            "id": "code_editor_3",
                            "title": "Code Editor",
                            "subtitle": "<strong>JS Editor</strong> Using: theme: dracula and mode: javascript",
                            "settings": {
                                "theme": "dracula",
                                "mode": "javascript"
                            },
                            "field": "code_editor",
                            "default": ";(function( $, window, document, undefined ) {\r\n  \"use strict\";\r\n\r\n  $(document).ready( function() {\r\n\r\n    // do stuff\r\n\r\n  });\r\n\r\n})( jQuery, window, document );"
                        },
                        {
                            "id": "code_editor_4",
                            "field": "code_editor",
                            "after": "<strong>CSS Editor</strong> It shows full width if there is no field of title and using: theme: merbivore and mode: css",
                            "settings": {
                                "theme": "merbivore",
                                "mode": "css"
                            },
                            "default": ".wrapper {\r\n\tfont-family: \"Open Sans\";\r\n\tfont-size: 13px;\r\n\twidth: 250px;\r\n\theight: 100px;\r\n\tcolor: #fff;\r\n\tbackground-color: #555;\r\n}"
                        }
                    ]
                },
                {
                    "name": "wpEditor",
                    "title": "WP Editor",
                    "fields": [
                        {
                            "id": "wp_editor_1",
                            "title": "WP Editor",
                            "field": "wp_editor"
                        },
                        {
                            "id": "wp_editor_2",
                            "title": "WP Editor with Custom Height and No Media Buttons",
                            "subtitle": "Settings:<br />height => 100px,<br />media_buttons => false",
                            "field": "wp_editor",
                            "height": "100px",
                            "media_button": false
                        },
                        {
                            "id": "wp_editor_3",
                            "title": "WP Editor without QuickTags and Media Buttons",
                            "subtitle": "Settings:<br />height => 100px,<br />media_buttons => false, <br/> quicktags => false",
                            "field": "wp_editor",
                            "height": "100px",
                            "media_button": false,
                            "quicktags": false
                        }
                    ]
                }
            ]
        },
        {
            "name": "colorFields",
            "title": "Color Fields",
            "icon": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 384 512' height='15px'><path d='M192 512C86 512 0 426 0 320C0 228.8 130.2 57.7 166.6 11.7C172.6 4.2 181.5 0 191.1 0h1.8c9.6 0 18.5 4.2 24.5 11.7C253.8 57.7 384 228.8 384 320c0 106-86 192-192 192zM96 336c0-8.8-7.2-16-16-16s-16 7.2-16 16c0 61.9 50.1 112 112 112c8.8 0 16-7.2 16-16s-7.2-16-16-16c-44.2 0-80-35.8-80-80z' /></svg>",
            "children": [
                {
                    "name": "color",
                    "title": "Color",
                    "fields": [
                        {
                            "id": "color",
                            "title": "Color",
                            "field": "color"
                        },
                        {
                            "id": "opt-color-2",
                            "field": "color",
                            "title": "Color with default (hex)",
                            "default": "#3498db"
                        },
                        {
                            "id": "opt-color-3",
                            "field": "color",
                            "title": "Color with default (rgba)",
                            "default": "rgba(255,255,0,0.25)"
                        },
                        {
                            "id": "opt-color-4",
                            "field": "color",
                            "title": "Color with default (transparent)",
                            "default": "transparent"
                        }
                    ]
                },
                {
                    "name": "linkColor",
                    "title": "Link Color",
                    "fields": [
                        {
                            "id": "link_color",
                            "title": "Link Color",
                            "field": "link_color"
                        },
                        {
                            "id": "link_color_2",
                            "field": "link_color",
                            "title": "Link Color with default",
                            "default": {
                                "color": "#1e73be",
                                "hover": "#259ded"
                            }
                        },
                        {
                            "id": "link_color_3",
                            "field": "link_color",
                            "title": "Link Color with more color options",
                            "color": true,
                            "hover": true,
                            "visited": true,
                            "active": true,
                            "focus": true
                        }
                    ]
                },
                {
                    "name": "colorGroup",
                    "title": "Color Group",
                    "fields": [
                        {
                            "id": "color_group_1",
                            "title": "Color Group",
                            "field": "color_group",
                            "options": {
                                "color_1": "Color 1",
                                "color_2": "Color 2"
                            }
                        },
                        {
                            "id": "color_group_2",
                            "title": "Color Group",
                            "field": "color_group",
                            "options": {
                                "color_1": "Color 1",
                                "color_2": "Color 2",
                                "color_3": "Color 3"
                            }
                        },
                        {
                            "id": "color_group_2",
                            "title": "Color Group with default",
                            "subtitle": "Can be add unlimited color options.",
                            "field": "color_group",
                            "options": {
                                "color_1": "Color 1",
                                "color_2": "Color 2",
                                "color_3": "Color 3",
                                "color_4": "Color 4",
                                "color_5": "Color 5"
                            },
                            "default": {
                                "color_1": "#000100",
                                "color_2": "#002642",
                                "color_3": "#ffce4b",
                                "color_4": "#ff595e",
                                "color_5": "#0052cc"
                            }
                        }
                    ]
                },
                {
                    "name": "colorPalette",
                    "title": "Color Palette",
                    "fields": [
                        {
                            "id": "palette_1",
                            "title": "Palette",
                            "subtitle": "Three set colors",
                            "field": "palette",
                            "options": [
                                {
                                    "colors": [
                                        "#f36e27",
                                        "#f3d430",
                                        "#ed1683"
                                    ],
                                    "value": "set-1"
                                },
                                {
                                    "colors": [
                                        "#4153ab",
                                        "#6e86c7",
                                        "#211f27"
                                    ],
                                    "value": "set-2"
                                },
                                {
                                    "colors": [
                                        "#162526",
                                        "#508486",
                                        "#C8C6CE"
                                    ],
                                    "value": "set-3"
                                },
                                {
                                    "colors": [
                                        "#ccab5e",
                                        "#fff55f",
                                        "#197c5d"
                                    ],
                                    "value": "set-4"
                                }
                            ],
                            "default": "set-1"
                        },
                        {
                            "id": "palette_2",
                            "title": "Palette",
                            "subtitle": "Four set colors",
                            "field": "palette",
                            "options": [
                                {
                                    "colors": [
                                        "#f04e36",
                                        "#f36e27",
                                        "#f3d430",
                                        "#ed1683"
                                    ],
                                    "value": "set-1"
                                },
                                {
                                    "colors": [
                                        "#f9ca06",
                                        "#b5b546",
                                        "#2f4d48",
                                        "#212b2f"
                                    ],
                                    "value": "set-2"
                                },
                                {
                                    "colors": [
                                        "#4153ab",
                                        "#6e86c7",
                                        "#211f27",
                                        "#d69762"
                                    ],
                                    "value": "set-3"
                                },
                                {
                                    "colors": [
                                        "#162526",
                                        "#508486",
                                        "#C8C6CE",
                                        "#B45F1A"
                                    ],
                                    "value": "set-4"
                                },
                                {
                                    "colors": [
                                        "#bbd5ff",
                                        "#ccab5e",
                                        "#fff55f",
                                        "#197c5d"
                                    ],
                                    "value": "set-5"
                                }
                            ],
                            "default": "set-3"
                        },
                        {
                            "id": "palette_3",
                            "title": "Palette",
                            "subtitle": "Five set colors",
                            "field": "palette",
                            "options": [
                                {
                                    "colors": [
                                        "#bbd5ff",
                                        "#ccab5e",
                                        "#fff55f",
                                        "#197c5d",
                                        "#bce2c4"
                                    ],
                                    "value": "set-1"
                                },
                                {
                                    "colors": [
                                        "#6d3264",
                                        "#edf7f6",
                                        "#fde8e9",
                                        "#006675",
                                        "#e49ab0"
                                    ],
                                    "value": "set-2"
                                },
                                {
                                    "colors": [
                                        "#000100",
                                        "#002642",
                                        "#ffce4b",
                                        "#ff595e",
                                        "#0052cc"
                                    ],
                                    "value": "set-3"
                                }
                            ],
                            "default": "set-1"
                        }
                    ]
                }
            ]
        },
        {
            "name": "designFields",
            "title": "Design Fields",
            "icon": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512' height='15px'><path d='M448 256c0-106-86-192-192-192V448c106 0 192-86 192-192zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256z' /></svg>",
            "children": [
                {
                    "name": "background",
                    "title": "Background",
                    "fields": [
                        {
                            "id": "background",
                            "title": "Background",
                            "field": "background"
                        },
                        {
                            "id": "background_2",
                            "title": "Background with default",
                            "field": "background",
                            "default": {
                                "background_color": "#e80000",
                                "background_position": "center center",
                                "background_repeat": "repeat-x",
                                "background_attachment": "fixed",
                                "background_size": "cover"
                            }
                        },
                        {
                            "id": "background_3",
                            "title": "Background with all features",
                            "field": "background",
                            "background_color": true,
                            "background_image": true,
                            "background_position": true,
                            "background_repeat": true,
                            "background_attachment": true,
                            "background_size": true,
                            "background_origin": true,
                            "background_clip": true,
                            "background_blend_mode": true,
                            "background_gradient": true,
                            "default": {
                                "background_color": "#009e44",
                                "background_gradient_color": "#81d742",
                                "background_gradient_direction": "135deg",
                                "background_position": "center center",
                                "background_repeat": "repeat-x",
                                "background_attachment": "fixed",
                                "background_size": "cover",
                                "background_origin": "border-box",
                                "background_clip": "padding-box",
                                "background_blend_mode": "normal"
                            }
                        }
                    ]
                },
                {
                    "name": "typography",
                    "title": "Typography",
                    "fields": [
                        {
                            "id": "typography",
                            "title": "Typography",
                            "field": "typography"
                        },
                        {
                            "id": "typography_2",
                            "title": "Typography with default",
                            "field": "typography",
                            "default": {
                                "font-family": "Barlow",
                                "font-weight": "600",
                                "text-align": "center",
                                "text-transform": "capitalize",
                                "font-size": "18px",
                                "line-height": "20px",
                                "letter-spacing": "-1px",
                                "color": "#009e44"
                            }
                        },
                        {
                            "id": "typography_3",
                            "title": "Typography with few features",
                            "field": "typography",
                            "text_align": false,
                            "text_transform": false,
                            "font_size": false,
                            "line_height": false,
                            "letter_spacing": false,
                            "color": false,
                            "default": {
                                "font-family": "Lato",
                                "font-weight": "900"
                            }
                        },
                        {
                            "id": "typography_4",
                            "title": "Typography with all features",
                            "field": "typography",
                            "font_family": true,
                            "font_weight": true,
                            "font_style": true,
                            "font_size": true,
                            "line_height": true,
                            "letter_spacing": true,
                            "text_align": true,
                            "text-transform": true,
                            "color": true,
                            "font_variant": true,
                            "word_spacing": true,
                            "text_decoration": true,
                            "default": {
                                "font-family": "Old Standard TT"
                            }
                        }
                    ]
                },
                {
                    "name": "dimensions",
                    "title": "Dimensions",
                    "fields": [
                        {
                            "id": "dimensions",
                            "title": "Dimensions",
                            "field": "dimensions"
                        },
                        {
                            "id": "dimensions_2",
                            "title": "Dimensions with default",
                            "field": "dimensions",
                            "default": {
                                "width": "100",
                                "height": "250",
                                "unit": "px"
                            }
                        },
                        {
                            "id": "dimensions_3",
                            "title": "Dimensions with custom text and units",
                            "field": "dimensions",
                            "width_icon": "width",
                            "height_icon": "height",
                            "units": [
                                "px",
                                "%",
                                "em",
                                "rem",
                                "pt"
                            ],
                            "default": {
                                "width": "100",
                                "height": "50",
                                "unit": "%"
                            }
                        },
                        {
                            "id": "dimensions_4",
                            "title": "Dimensions with single unit",
                            "field": "dimensions",
                            "units": [
                                "px"
                            ]
                        },
                        {
                            "id": "dimensions-5",
                            "field": "dimensions",
                            "title": "Dimensions without unit selector",
                            "unit": false
                        },
                        {
                            "id": "dimensions-6",
                            "field": "dimensions",
                            "title": "Dimensions with only width",
                            "height": false
                        },
                        {
                            "id": "dimensions-7",
                            "field": "dimensions",
                            "title": "Dimensions with only width and single unit",
                            "height": false,
                            "units": [
                                "px"
                            ]
                        }
                    ]
                },
                {
                    "name": "spacing",
                    "title": "Spacing",
                    "fields": [
                        {
                            "id": "spacing_1",
                            "title": "Spacing",
                            "field": "spacing"
                        },
                        {
                            "id": "spacing_2",
                            "title": "Spacing with default",
                            "field": "spacing",
                            "default": {
                                "top": "50",
                                "right": "100",
                                "bottom": "50",
                                "left": "100",
                                "unit": "px"
                            }
                        },
                        {
                            "id": "spacing_3",
                            "title": "Spacing without unit selector",
                            "field": "spacing",
                            "units": [
                                "px"
                            ],
                            "default": {
                                "top": "50",
                                "right": "100",
                                "bottom": "50",
                                "left": "100",
                                "unit": "px"
                            }
                        },
                        {
                            "id": "spacing_4",
                            "title": "Spacing with only left and right",
                            "field": "spacing",
                            "top": false,
                            "bottom": false
                        },
                        {
                            "id": "spacing_5",
                            "title": "Spacing with only top and bottom",
                            "field": "spacing",
                            "left": false,
                            "right": false
                        },
                        {
                            "id": "spacing_6",
                            "title": "Spacing with all directions",
                            "field": "spacing",
                            "all": true
                        }
                    ]
                },
                {
                    "name": "border",
                    "title": "Border",
                    "fields": [
                        {
                            "id": "border_1",
                            "title": "Border",
                            "field": "border"
                        },
                        {
                            "id": "border_2",
                            "title": "Border with default",
                            "field": "border",
                            "default": {
                                "top": "4",
                                "right": "8",
                                "bottom": "4",
                                "left": "8",
                                "style": "dashed",
                                "color": "#1e73be"
                            }
                        },
                        {
                            "id": "border_3",
                            "title": "Border with only left and right",
                            "field": "border",
                            "top": false,
                            "bottom": false
                        },
                        {
                            "id": "border_4",
                            "title": "Border with only top and bottom",
                            "field": "border",
                            "left": false,
                            "right": false
                        },
                        {
                            "id": "border_5",
                            "title": "Border with all directions",
                            "field": "border",
                            "all": true
                        }
                    ]
                },
                {
                    "name": "spinner",
                    "title": "Spinner",
                    "fields": [
                        {
                            "id": "spinner_1",
                            "title": "Spinner",
                            "subtitle": "max:100 | min:0 | step:1",
                            "field": "spinner",
                            "max": 100,
                            "min": 0,
                            "step": 1,
                            "default": 25
                        },
                        {
                            "id": "opt-spinner-2",
                            "field": "spinner",
                            "title": "Spinner",
                            "subtitle": "max:200 | min:100 | step:10",
                            "max": 200,
                            "min": 100,
                            "step": 10,
                            "default": 100
                        },
                        {
                            "id": "spinner-3",
                            "field": "spinner",
                            "title": "Spinner",
                            "subtitle": "max:1 | min:0 | step:0.1 | unit:px",
                            "max": 1,
                            "min": 0,
                            "step": 0.1,
                            "unit": "px"
                        }
                    ]
                },
                {
                    "name": "number",
                    "title": "Number",
                    "fields": [
                        {
                            "id": "number_1",
                            "title": "Number",
                            "field": "number"
                        },
                        {
                            "id": "number_2",
                            "title": "Number with unit",
                            "field": "number",
                            "unit": "px"
                        },
                        {
                            "id": "number_3",
                            "title": "Number with default",
                            "field": "number",
                            "unit": "width",
                            "default": 100
                        }
                    ]
                }
            ]
        },
        {
            "name": "additionalFields",
            "title": "Additional Fields",
            "icon": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 384 512' height='15px'><path d='M192 32c17.7 0 32 14.3 32 32V199.5l111.5-66.9c15.2-9.1 34.8-4.2 43.9 11s4.2 34.8-11 43.9L254.2 256l114.3 68.6c15.2 9.1 20.1 28.7 11 43.9s-28.7 20.1-43.9 11L224 312.5V448c0 17.7-14.3 32-32 32s-32-14.3-32-32V312.5L48.5 379.4c-15.2 9.1-34.8 4.2-43.9-11s-4.2-34.8 11-43.9L129.8 256 15.5 187.4c-15.2-9.1-20.1-28.7-11-43.9s28.7-20.1 43.9-11L160 199.5V64c0-17.7 14.3-32 32-32z' /></svg>",
            "children": [
                {
                    "name": "slider",
                    "title": "Slider",
                    "icon": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512' height='15px'><path d='M0 416c0 17.7 14.3 32 32 32l54.7 0c12.3 28.3 40.5 48 73.3 48s61-19.7 73.3-48L480 448c17.7 0 32-14.3 32-32s-14.3-32-32-32l-246.7 0c-12.3-28.3-40.5-48-73.3-48s-61 19.7-73.3 48L32 384c-17.7 0-32 14.3-32 32zm128 0a32 32 0 1 1 64 0 32 32 0 1 1 -64 0zM320 256a32 32 0 1 1 64 0 32 32 0 1 1 -64 0zm32-80c-32.8 0-61 19.7-73.3 48L32 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l246.7 0c12.3 28.3 40.5 48 73.3 48s61-19.7 73.3-48l54.7 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-54.7 0c-12.3-28.3-40.5-48-73.3-48zM192 128a32 32 0 1 1 0-64 32 32 0 1 1 0 64zm73.3-64C253 35.7 224.8 16 192 16s-61 19.7-73.3 48L32 64C14.3 64 0 78.3 0 96s14.3 32 32 32l86.7 0c12.3 28.3 40.5 48 73.3 48s61-19.7 73.3-48L480 128c17.7 0 32-14.3 32-32s-14.3-32-32-32L265.3 64z' /></svg>",
                    "fields": [
                        {
                            "id": "slider",
                            "title": "Slider",
                            "field": "slider"
                        },
                        {
                            "id": "slider_2",
                            "title": "Slider with default",
                            "field": "slider",
                            "default": 50
                        },
                        {
                            "id": "slider_3",
                            "title": "Slider with unit text",
                            "field": "slider",
                            "unit": "%",
                            "default": 50
                        },
                        {
                            "id": "slider_4",
                            "title": "Slider with min/max allowed value",
                            "subtitle": "Min: 1 | Max: 10 | Step: 0.1 | Default: 5.5",
                            "field": "slider",
                            "unit": "px",
                            "min": 1,
                            "max": 10,
                            "step": 0.1,
                            "default": 5.5
                        }
                    ]
                },
                {
                    "name": "sorter",
                    "title": "Sorter",
                    "icon": "<svg stroke='currentColor' fill='currentColor' strokeWidth='0' viewBox='0 0 448 512' height='15px' xmlns='http://www.w3.org/2000/svg'><path d='M304 96h16v64h-16a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h96a16 16 0 0 0 16-16v-32a16 16 0 0 0-16-16h-16V48a16 16 0 0 0-16-16h-48a16 16 0 0 0-14.29 8.83l-16 32A16 16 0 0 0 304 96zm26.15 162.91a79 79 0 0 0-55 54.17c-14.25 51.05 21.21 97.77 68.85 102.53a84.07 84.07 0 0 1-20.85 12.91c-7.57 3.4-10.8 12.47-8.18 20.34l9.9 20c2.87 8.63 12.53 13.49 20.9 9.91 58-24.76 86.25-61.61 86.25-132V336c-.02-51.21-48.4-91.34-101.85-77.09zM352 356a20 20 0 1 1 20-20 20 20 0 0 1-20 20zm-176-4h-48V48a16 16 0 0 0-16-16H80a16 16 0 0 0-16 16v304H16c-14.19 0-21.36 17.24-11.29 27.31l80 96a16 16 0 0 0 22.62 0l80-96C197.35 369.26 190.22 352 176 352z'></path></svg>",
                    "fields": [
                        {
                            "field": "content",
                            "content": "<h2>Coming soon.</h2>"
                        }
                    ]
                },
                {
                    "name": "sortable",
                    "title": "Sortable",
                    "icon": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512' height='15px'><path d='M278.6 9.4c-12.5-12.5-32.8-12.5-45.3 0l-64 64c-9.2 9.2-11.9 22.9-6.9 34.9s16.6 19.8 29.6 19.8h32v96H128V192c0-12.9-7.8-24.6-19.8-29.6s-25.7-2.2-34.9 6.9l-64 64c-12.5 12.5-12.5 32.8 0 45.3l64 64c9.2 9.2 22.9 11.9 34.9 6.9s19.8-16.6 19.8-29.6V288h96v96H192c-12.9 0-24.6 7.8-29.6 19.8s-2.2 25.7 6.9 34.9l64 64c12.5 12.5 32.8 12.5 45.3 0l64-64c9.2-9.2 11.9-22.9 6.9-34.9s-16.6-19.8-29.6-19.8H288V288h96v32c0 12.9 7.8 24.6 19.8 29.6s25.7 2.2 34.9-6.9l64-64c12.5-12.5 12.5-32.8 0-45.3l-64-64c-9.2-9.2-22.9-11.9-34.9-6.9s-19.8 16.6-19.8 29.6v32H288V128h32c12.9 0 24.6-7.8 29.6-19.8s2.2-25.7-6.9-34.9l-64-64z' /></svg>",
                    "fields": [
                        {
                            "id": "sortable_1",
                            "title": "Sortable",
                            "field": "sortable",
                            "fields": [
                                {
                                    "id": "text_1",
                                    "field": "text",
                                    "title": "Text 1"
                                },
                                {
                                    "id": "text_2",
                                    "field": "text",
                                    "title": "Text 2"
                                },
                                {
                                    "id": "text_3",
                                    "field": "text",
                                    "title": "Text 3"
                                }
                            ]
                        },
                        {
                            "id": "sortable_2",
                            "title": "Sortable with default",
                            "field": "sortable",
                            "fields": [
                                {
                                    "id": "text_1",
                                    "field": "text",
                                    "title": "Text 1",
                                    "default": "This is text 1 default"
                                },
                                {
                                    "id": "text_2",
                                    "field": "text",
                                    "title": "Text 2",
                                    "default": "This is text 2 default"
                                },
                                {
                                    "id": "text_3",
                                    "field": "text",
                                    "title": "Text 3",
                                    "default": "This is text 3 default"
                                }
                            ]
                        }
                    ]
                },
                {
                    "name": "switcher",
                    "title": "Switcher",
                    "icon": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 576 512' height='15px'><path d='M192 64C86 64 0 150 0 256S86 448 192 448H384c106 0 192-86 192-192s-86-192-192-192H192zm192 96a96 96 0 1 1 0 192 96 96 0 1 1 0-192z' /></svg>",
                    "fields": [
                        {
                            "id": "switcher",
                            "title": "Switcher",
                            "field": "switcher"
                        },
                        {
                            "id": "switcher_2",
                            "title": "Switcher with default",
                            "field": "switcher",
                            "default": true
                        },
                        {
                            "id": "switcher_3",
                            "title": "Switcher with label",
                            "field": "switcher",
                            "label": "The label text of the switcher."
                        },
                        {
                            "id": "switcher_4",
                            "title": "Switcher with Yes/No",
                            "field": "switcher",
                            "text_on": "Yes",
                            "text_off": "No"
                        },
                        {
                            "id": "switcher_5",
                            "title": "Switcher with custom text Enabled/Disabled",
                            "field": "switcher",
                            "text_on": "Enabled",
                            "text_off": "Disabled",
                            "text_width": "100"
                        }
                    ]
                },
                {
                    "name": "icons",
                    "title": "Icons",
                    "icon": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 576 512' height='15px'><path d='M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z' /></svg>",
                    "fields": [
                        {
                            "field": "content",
                            "content": "<h2>Coming soon.</h2>"
                        }
                    ]
                },
                {
                    "name": "map",
                    "title": "Map",
                    "icon": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 384 512' height='15px'><path d='M384 192c0 87.4-117 243-168.3 307.2c-12.3 15.3-35.1 15.3-47.4 0C117 435 0 279.4 0 192C0 86 86 0 192 0S384 86 384 192z' /></svg>",
                    "fields": [
                        {
                            "id": "map_1",
                            "title": "Map",
                            "field": "map"
                        },
                        {
                            "id": "map_2",
                            "title": "Map with Default",
                            "field": "map",
                            "default": {
                                "address": "New York, United States of America",
                                "latitude": "40.7127281",
                                "longitude": "-74.0060152",
                                "zoom": "12"
                            }
                        }
                    ]
                },
                {
                    "name": "link",
                    "title": "Link",
                    "icon": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 512' height='15px'><path d='M579.8 267.7c56.5-56.5 56.5-148 0-204.5c-50-50-128.8-56.5-186.3-15.4l-1.6 1.1c-14.4 10.3-17.7 30.3-7.4 44.6s30.3 17.7 44.6 7.4l1.6-1.1c32.1-22.9 76-19.3 103.8 8.6c31.5 31.5 31.5 82.5 0 114L422.3 334.8c-31.5 31.5-82.5 31.5-114 0c-27.9-27.9-31.5-71.8-8.6-103.8l1.1-1.6c10.3-14.4 6.9-34.4-7.4-44.6s-34.4-6.9-44.6 7.4l-1.1 1.6C206.5 251.2 213 330 263 380c56.5 56.5 148 56.5 204.5 0L579.8 267.7zM60.2 244.3c-56.5 56.5-56.5 148 0 204.5c50 50 128.8 56.5 186.3 15.4l1.6-1.1c14.4-10.3 17.7-30.3 7.4-44.6s-30.3-17.7-44.6-7.4l-1.6 1.1c-32.1 22.9-76 19.3-103.8-8.6C74 372 74 321 105.5 289.5L217.7 177.2c31.5-31.5 82.5-31.5 114 0c27.9 27.9 31.5 71.8 8.6 103.9l-1.1 1.6c-10.3 14.4-6.9 34.4 7.4 44.6s34.4 6.9 44.6-7.4l1.1-1.6C433.5 260.8 427 182 377 132c-56.5-56.5-148-56.5-204.5 0L60.2 244.3z' /></svg>",
                    "fields": [
                        {
                            "id": "link",
                            "title": "Link",
                            "field": "link"
                        },
                        {
                            "id": "link_2",
                            "title": "Link with default",
                            "field": "link",
                            "default": {
                                "url": "http://bplugins.com",
                                "text": "B Plugins",
                                "target": "_blank"
                            }
                        }
                    ]
                },
                {
                    "name": "date",
                    "title": "Date",
                    "icon": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 448 512' height='15px'><path d='M96 32V64H48C21.5 64 0 85.5 0 112v48H448V112c0-26.5-21.5-48-48-48H352V32c0-17.7-14.3-32-32-32s-32 14.3-32 32V64H160V32c0-17.7-14.3-32-32-32S96 14.3 96 32zM448 192H0V464c0 26.5 21.5 48 48 48H400c26.5 0 48-21.5 48-48V192z' /></svg>",
                    "fields": [
                        {
                            "id": "date",
                            "title": "Date",
                            "field": "date"
                        },
                        {
                            "id": "date_2",
                            "title": "Date with custom settings",
                            "field": "date",
                            "settings": {
                                "changeMonth": true,
                                "changeYear": true,
                                "showWeek": true,
                                "weekHeader": "Week"
                            }
                        },
                        {
                            "id": "date_3",
                            "title": "Date with From & To",
                            "field": "date",
                            "from_to": true
                        },
                        {
                            "id": "date_4",
                            "title": "Date with custom texts Begin & End",
                            "field": "date",
                            "from_to": true,
                            "text_from": "Begin",
                            "text_to": "End"
                        }
                    ]
                },
                {
                    "name": "dateAndTime",
                    "title": "Date and Time",
                    "icon": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 448 512' height='15px'><path d='M96 32V64H48C21.5 64 0 85.5 0 112v48H448V112c0-26.5-21.5-48-48-48H352V32c0-17.7-14.3-32-32-32s-32 14.3-32 32V64H160V32c0-17.7-14.3-32-32-32S96 14.3 96 32zM448 192H0V464c0 26.5 21.5 48 48 48H400c26.5 0 48-21.5 48-48V192z' /></svg>",
                    "fields": [
                        {
                            "id": "datetime_11",
                            "title": "Date",
                            "field": "datetime",
                            "settings": {
                                "changeMonth": true,
                                "changeYear": true
                            }
                        },
                        {
                            "id": "datetime_12",
                            "title": "Date",
                            "subtitle": "Human-friendly Dates",
                            "field": "datetime",
                            "settings": {
                                "dateFormat": "yyyy-MM-dd",
                                "changeMonth": true,
                                "changeYear": true
                            }
                        },
                        {
                            "id": "datetime_13",
                            "title": "Date",
                            "subtitle": "Start week on Monday",
                            "field": "datetime",
                            "settings": {
                                "startWeek": 1,
                                "changeMonth": true,
                                "changeYear": true
                            }
                        },
                        {
                            "id": "datetime_14",
                            "title": "Date and Time",
                            "subtitle": "Date and Time Both",
                            "field": "datetime",
                            "settings": {
                                "enableTime": true,
                                "dateFormat": "yyyy-MM-dd",
                                "changeMonth": true,
                                "changeYear": true
                            }
                        },
                        {
                            "id": "datetime_15",
                            "title": "Time",
                            "subtitle": "Only Time",
                            "field": "datetime",
                            "settings": {
                                "calender": false,
                                "enableTime": true
                            }
                        },
                        {
                            "id": "datetime_16",
                            "title": "Time",
                            "subtitle": "24-hour Time without PM:AM",
                            "field": "datetime",
                            "settings": {
                                "calender": false,
                                "enableTime": true,
                                "time_24hr": true
                            }
                        },
                        {
                            "id": "datetime_17",
                            "title": "Date Range",
                            "subtitle": "Range Mode",
                            "field": "datetime",
                            "settings": {
                                "mode": "range",
                                "changeMonth": true,
                                "changeYear": true
                            }
                        },
                        {
                            "id": "datetime_18",
                            "title": "Date From - To",
                            "subtitle": "Date with \"From\" and \"To\"",
                            "field": "datetime",
                            "from_to": true,
                            "settings": {
                                "changeMonth": true,
                                "changeYear": true
                            }
                        },
                        {
                            "id": "datetime_19",
                            "title": "Date Begin - End",
                            "subtitle": "Date with \"Begin\" and \"End\" Custom Text",
                            "field": "datetime",
                            "from_to": true,
                            "text_from": "Begin",
                            "text_to": "End",
                            "settings": {
                                "changeMonth": true,
                                "changeYear": true
                            }
                        },
                        {
                            "id": "datetime_20",
                            "title": "Date",
                            "subtitle": "Ready-Only Input",
                            "field": "datetime",
                            "settings": {
                                "readOnly": true
                            }
                        }
                    ]
                },
                {
                    "name": "imageSelect",
                    "title": "Image Select",
                    "icon": "<svg stroke='currentColor' fill='currentColor' strokeWidth='0' viewBox='0 0 16 16' height='15px' xmlns='http://www.w3.org/2000/svg'><path d='M1 2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1zm5 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1zm5 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1zM1 7a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1zm5 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1zm5 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1zM1 12a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1zm5 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1zm5 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1z'></path></svg>",
                    "fields": [
                        {
                            "id": "selectImage_1",
                            "title": "Image Select",
                            "field": "image_select",
                            "options": [
                                {
                                    "label": "http://codestarframework.com/assets/images/placeholder/150x125-2ecc71.gif",
                                    "value": "opt_1"
                                },
                                {
                                    "label": "http://codestarframework.com/assets/images/placeholder/150x125-e74c3c.gif",
                                    "value": "opt_2"
                                },
                                {
                                    "label": "http://codestarframework.com/assets/images/placeholder/150x125-ffbc00.gif",
                                    "value": "opt_3"
                                },
                                {
                                    "label": "http://codestarframework.com/assets/images/placeholder/150x125-3498db.gif",
                                    "value": "opt_4"
                                }
                            ]
                        },
                        {
                            "id": "selectImage_2",
                            "title": "Image Select with default",
                            "field": "image_select",
                            "options": [
                                {
                                    "label": "http://codestarframework.com/assets/images/placeholder/80x80-2c3e50.gif",
                                    "value": "opt_1"
                                },
                                {
                                    "label": "http://codestarframework.com/assets/images/placeholder/80x80-2c3e50.gif",
                                    "value": "opt_2"
                                },
                                {
                                    "label": "http://codestarframework.com/assets/images/placeholder/80x80-2c3e50.gif",
                                    "value": "opt_3"
                                },
                                {
                                    "label": "http://codestarframework.com/assets/images/placeholder/80x80-2c3e50.gif",
                                    "value": "opt_4"
                                },
                                {
                                    "label": "http://codestarframework.com/assets/images/placeholder/80x80-2c3e50.gif",
                                    "value": "opt_5"
                                },
                                {
                                    "label": "http://codestarframework.com/assets/images/placeholder/80x80-2c3e50.gif",
                                    "value": "opt_6"
                                },
                                {
                                    "label": "http://codestarframework.com/assets/images/placeholder/80x80-2c3e50.gif",
                                    "value": "opt_7"
                                }
                            ],
                            "default": "opt_4"
                        },
                        {
                            "id": "selectImage_3",
                            "title": "Image Select with multiple choice",
                            "field": "image_select",
                            "multiple": true,
                            "options": [
                                {
                                    "label": "http://codestarframework.com/assets/images/placeholder/80x80-e74c3c.gif",
                                    "value": "opt_1"
                                },
                                {
                                    "label": "http://codestarframework.com/assets/images/placeholder/80x80-ffbc00.gif",
                                    "value": "opt_2"
                                },
                                {
                                    "label": "http://codestarframework.com/assets/images/placeholder/80x80-3498db.gif",
                                    "value": "opt_3"
                                },
                                {
                                    "label": "http://codestarframework.com/assets/images/placeholder/80x80-2ecc71.gif",
                                    "value": "opt_4"
                                }
                            ]
                        },
                        {
                            "id": "selectImage_4",
                            "title": "Image Select with multiple choice and default",
                            "field": "image_select",
                            "multiple": true,
                            "options": [
                                {
                                    "label": "http://codestarframework.com/assets/images/placeholder/80x80-2c3e50.gif",
                                    "value": "opt_1"
                                },
                                {
                                    "label": "http://codestarframework.com/assets/images/placeholder/80x80-2c3e50.gif",
                                    "value": "opt_2"
                                },
                                {
                                    "label": "http://codestarframework.com/assets/images/placeholder/80x80-e74c3c.gif",
                                    "value": "opt_3"
                                },
                                {
                                    "label": "http://codestarframework.com/assets/images/placeholder/80x80-ffbc00.gif",
                                    "value": "opt_4"
                                },
                                {
                                    "label": "http://codestarframework.com/assets/images/placeholder/80x80-3498db.gif",
                                    "value": "opt_5"
                                },
                                {
                                    "label": "http://codestarframework.com/assets/images/placeholder/80x80-2ecc71.gif",
                                    "value": "opt_6"
                                },
                                {
                                    "label": "http://codestarframework.com/assets/images/placeholder/80x80-2c3e50.gif",
                                    "value": "opt_7"
                                },
                                {
                                    "label": "http://codestarframework.com/assets/images/placeholder/80x80-2c3e50.gif",
                                    "value": "opt_8"
                                }
                            ],
                            "default": [
                                "opt_3",
                                "opt_4",
                                "opt_5",
                                "opt_6"
                            ]
                        },
                        {
                            "id": "selectImage_5",
                            "title": "Image Select inline style",
                            "field": "image_select",
                            "inline": true,
                            "options": [
                                {
                                    "label": "http://codestarframework.com/assets/images/placeholder/80x80-e74c3c.gif",
                                    "value": "opt_1"
                                },
                                {
                                    "label": "http://codestarframework.com/assets/images/placeholder/80x80-ffbc00.gif",
                                    "value": "opt_2"
                                },
                                {
                                    "label": "http://codestarframework.com/assets/images/placeholder/80x80-3498db.gif",
                                    "value": "opt_3"
                                },
                                {
                                    "label": "http://codestarframework.com/assets/images/placeholder/80x80-2ecc71.gif",
                                    "value": "opt_4"
                                }
                            ],
                            "default": "opt_1"
                        }
                    ]
                },
                {
                    "name": "buttonSet",
                    "title": "Button Set",
                    "icon": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 448 512' height='15px'><path d='M8 256a56 56 0 1 1 112 0A56 56 0 1 1 8 256zm160 0a56 56 0 1 1 112 0 56 56 0 1 1 -112 0zm216-56a56 56 0 1 1 0 112 56 56 0 1 1 0-112z' /></svg>",
                    "fields": [
                        {
                            "id": "button_set_1",
                            "title": "Button Set",
                            "field": "button_set",
                            "options": [
                                {
                                    "label": "Enabled",
                                    "value": "enabled"
                                },
                                {
                                    "label": "Disabled",
                                    "value": "disabled"
                                }
                            ]
                        },
                        {
                            "id": "button_set_2",
                            "title": "Button Set with default",
                            "field": "button_set",
                            "options": [
                                {
                                    "label": "Enabled",
                                    "value": "enabled"
                                },
                                {
                                    "label": "Default",
                                    "value": "default"
                                },
                                {
                                    "label": "Disabled",
                                    "value": "disabled"
                                }
                            ],
                            "default": "default"
                        },
                        {
                            "id": "button_set_3",
                            "title": "Button Set",
                            "field": "button_set",
                            "options": [
                                {
                                    "label": "Activate",
                                    "value": "activate"
                                },
                                {
                                    "label": "Deactivate",
                                    "value": "deactivate"
                                }
                            ],
                            "default": "activate"
                        },
                        {
                            "id": "button_set_4",
                            "title": "Button Set",
                            "field": "button_set",
                            "options": [
                                {
                                    "label": "ON",
                                    "value": "on"
                                },
                                {
                                    "label": "OFF",
                                    "value": "off"
                                }
                            ],
                            "default": "on"
                        },
                        {
                            "id": "button_set_5",
                            "title": "Button Set",
                            "field": "button_set",
                            "multiple": true,
                            "options": [
                                {
                                    "label": "Option 1",
                                    "value": "opt_1"
                                },
                                {
                                    "label": "Option 2",
                                    "value": "opt_2"
                                },
                                {
                                    "label": "Option 3",
                                    "value": "opt_3"
                                },
                                {
                                    "label": "Option 4",
                                    "value": "opt_4"
                                },
                                {
                                    "label": "Option 5",
                                    "value": "opt_5"
                                }
                            ]
                        },
                        {
                            "id": "button_set_6",
                            "title": "Button Set with multiple choice and default",
                            "field": "button_set",
                            "multiple": true,
                            "options": [
                                {
                                    "label": "Option 1",
                                    "value": "opt_1"
                                },
                                {
                                    "label": "Option 2",
                                    "value": "opt_2"
                                },
                                {
                                    "label": "Option 3",
                                    "value": "opt_3"
                                },
                                {
                                    "label": "Option 4",
                                    "value": "opt_4"
                                },
                                {
                                    "label": "Option 5",
                                    "value": "opt_5"
                                }
                            ],
                            "default": [
                                "opt_2",
                                "opt_4"
                            ]
                        }
                    ]
                }
            ]
        },
        {
            "name": "dependencies",
            "title": "Dependencies",
            "icon": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 448 512' height='15px'><path d='M80 104a24 24 0 1 0 0-48 24 24 0 1 0 0 48zm80-24c0 32.8-19.7 61-48 73.3v87.8c18.8-10.9 40.7-17.1 64-17.1h96c35.3 0 64-28.7 64-64v-6.7C307.7 141 288 112.8 288 80c0-44.2 35.8-80 80-80s80 35.8 80 80c0 32.8-19.7 61-48 73.3V160c0 70.7-57.3 128-128 128H176c-35.3 0-64 28.7-64 64v6.7c28.3 12.3 48 40.5 48 73.3c0 44.2-35.8 80-80 80s-80-35.8-80-80c0-32.8 19.7-61 48-73.3V352 153.3C19.7 141 0 112.8 0 80C0 35.8 35.8 0 80 0s80 35.8 80 80zm232 0a24 24 0 1 0 -48 0 24 24 0 1 0 48 0zM80 456a24 24 0 1 0 0-48 24 24 0 1 0 0 48z' /></svg>",
            "fields": [
                {
                    "field": "content",
                    "content": "<h2>Coming soon.</h2>"
                }
            ]
        },
        {
            "name": "validate",
            "title": "Validate",
            "icon": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512' height='15px'><path d='M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z' /></svg>",
            "fields": [
                {
                    "id": "validate_1",
                    "title": "Email validate",
                    "field": "validate",
                    "default": "info@domain.com",
                    "validate": "email"
                },
                {
                    "id": "validate_2",
                    "title": "Numeric validate",
                    "field": "validate",
                    "subtitle": "This text field only allows numbers",
                    "default": "123456",
                    "validate": "numeric"
                },
                {
                    "id": "validate_3",
                    "title": "Required validate",
                    "field": "validate",
                    "subtitle": "This text field is required, cannot be pass empty.",
                    "default": "Lorem ipsum value",
                    "validate": "required"
                },
                {
                    "id": "validate_4",
                    "title": "URL validate",
                    "field": "validate",
                    "subtitle": "This text field only allows validated url address.",
                    "default": "http://bplugins.com",
                    "validate": "url"
                }
            ]
        },
        {
            "name": "sanitize",
            "title": "Sanitize",
            "icon": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512' height='15px'><path d='M463.5 224H472c13.3 0 24-10.7 24-24V72c0-9.7-5.8-18.5-14.8-22.2s-19.3-1.7-26.2 5.2L413.4 96.6c-87.6-86.5-228.7-86.2-315.8 1c-87.5 87.5-87.5 229.3 0 316.8s229.3 87.5 316.8 0c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0c-62.5 62.5-163.8 62.5-226.3 0s-62.5-163.8 0-226.3c62.2-62.2 162.7-62.5 225.3-1L327 183c-6.9 6.9-8.9 17.2-5.2 26.2s12.5 14.8 22.2 14.8H463.5z' /></svg>",
            "fields": [
                {
                    "id": "sanitize_1",
                    "title": "Sanitize (a) to (b)",
                    "subtitle": "Replacing letter (a) to letter (b). for eg. apple to bpple",
                    "field": "sanitize",
                    "sanitize": "a_to_b"
                },
                {
                    "id": "sanitize_2",
                    "title": "Sanitize Title",
                    "subtitle": "Converting (space) to (-) and (uppercase) letters to (lowercase) letters. for eg. Hello World to hello-world",
                    "field": "sanitize",
                    "sanitize": "title"
                }
            ]
        },
        {
            "name": "backup",
            "title": "Backup",
            "icon": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512' height='15px'><path d='M256 0c4.6 0 9.2 1 13.4 2.9L457.7 82.8c22 9.3 38.4 31 38.3 57.2c-.5 99.2-41.3 280.7-213.6 363.2c-16.7 8-36.1 8-52.8 0C57.3 420.7 16.5 239.2 16 140c-.1-26.2 16.3-47.9 38.3-57.2L242.7 2.9C246.8 1 251.4 0 256 0zm0 66.8V444.8C394 378 431.1 230.1 432 141.4L256 66.8l0 0z' /></svg>",
            "fields": [
                {
                    "field": "backup"
                }
            ]
        },
        {
            "name": "other",
            "title": "Other",
            "icon": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 448 512' height='15px'><path d='M349.4 44.6c5.9-13.7 1.5-29.7-10.6-38.5s-28.6-8-39.9 1.8l-256 224c-10 8.8-13.6 22.9-8.9 35.3S50.7 288 64 288H175.5L98.6 467.4c-5.9 13.7-1.5 29.7 10.6 38.5s28.6 8 39.9-1.8l256-224c10-8.8 13.6-22.9 8.9-35.3s-16.6-20.7-30-20.7H272.5L349.4 44.6z' /></svg>",
            "fields": [
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
        }
    ]
}