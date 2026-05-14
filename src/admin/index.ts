declare const jQuery: any;

/**
 * Admin page initialization.
 * Handles Codestar Framework field customization, shortcode copying,
 * and WooCommerce admin notice dismissal.
 */
jQuery(document).ready(function ($: any) {
    $("[name='_bp3dimages_[angle_property][top]']").attr('placeholder', 'X');
    $("[name='_bp3dimages_[angle_property][right]']").attr('placeholder', 'Y');
    $("[name='_bp3dimages_[angle_property][bottom]']").attr('placeholder', 'Z');

    $(document).on('click', '.bp3d_shortcode_copy_icon', function (e: Event) {
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

    $(document).on('click', '.bp3d_shortcode_copy_btn', function (e: Event) {
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

document.addEventListener('DOMContentLoaded', function () {
    // Custom CSS subtitle
    const subtitleElement = document.querySelector('.custom-css .csf-subtitle-text') as HTMLElement | null;
    if (subtitleElement) {
        const postId = (window as any).post_ID?.value;
        subtitleElement.innerText = `#bp_model_id_${parseInt(postId)}`;
    }
});
