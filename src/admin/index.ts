declare const jQuery: any;

/**
 * Admin page initialization.
 * Handles shortcode copying
 */
jQuery(document).ready(function ($: any) {
    $(document).on('click', '.bp3d_shortcode_copy_icon', function (this: HTMLElement, e: Event) {
        e.preventDefault();

        const text = $(this).data('clipboard-text');
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
        } else {
            const tempInput = document.createElement('input');
            tempInput.value = text;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
        }

        $(this).css('width', '18px');
        setTimeout(() => {
            $(this).css('width', '22px');
        }, 200);
    });

    $(document).on('click', '.bp3d_shortcode_copy_btn', function (this: HTMLElement, e: Event) {
        e.preventDefault();

        const text = $(this).data('clipboard-text');
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
        } else {
            const tempInput = document.createElement('input');
            tempInput.value = text;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
        }
        $(this).text('Copied!');
        setTimeout(() => {
            $(this).text('Copy Shortcode');
        }, 2000);
    });
});
