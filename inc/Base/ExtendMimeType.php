<?php

namespace BP3D\Base;

use BP3D\Helper\Utils;

if (!defined('ABSPATH')) {
    exit;
}

class ExtendMimeType
{

    public function register()
    {
        add_filter('upload_mimes', [$this, 'bplugins_stp_mime_types']);
        add_filter('wp_check_filetype_and_ext', [$this, 'bplugins_stp_add_allow_upload_extension_exception'], 10, 5);
        add_action('wp_enqueue_media', [$this, 'restrictModelPickerUploads']);
    }

    /**
     * A media frame whose library is filtered to models (Utils::modelLibraryTypes(), or the block's model/* list) refuses other files on upload too,
     * instead of uploading them and hiding them from the frame.
     */
    public function restrictModelPickerUploads(): void
    {
        $extensions = Utils::modelExtensions();
        // The Advanced viewer's other formats too: the server still decides what may be uploaded, so this never blocks more than it does.
        $accepted = array_values(array_unique(array_merge($extensions, ['ply', 'off', '3dm', 'amf', 'ifc', 'brep', 'brp', 'iges', 'igs', 'stp', 'fcstd', 'bim'])));
        $settings = [
            'extensions' => implode(',', $accepted),
            'accept' => '.' . implode(',.', $accepted),
            'types' => Utils::modelLibraryTypes(),
            'title' => __('3D models', '3d-viewer'),
            /* translators: %s: comma-separated list of 3D model file extensions. */
            'message' => sprintf(__('This is not a 3D model file. Upload one of: %s.', '3d-viewer'), strtoupper(implode(', ', $accepted))),
        ];

        wp_add_inline_script('media-views', '(function (media, settings) {
    var Select = media && media.view && media.view.MediaFrame && media.view.MediaFrame.Select;
    if (!Select || !window.plupload) return;
    var initialize = Select.prototype.initialize;
    Select.prototype.initialize = function () {
        initialize.apply(this, arguments);
        // Only frames filtered to 3D files alone; the block filters by the ticked formats (model/gltf-binary, ...) rather than by `model`.
        var types = [].concat((this.options.library && this.options.library.type) || []);
        var isModel = function (t) { return t === "model" || String(t).indexOf("model/") === 0; };
        if (!types.some(isModel) || !types.every(function (t) { return isModel(t) || settings.types.indexOf(t) > -1; })) return;
        this.on("open", function () {
            var wpUploader = this.uploader && this.uploader.uploader;
            var up = wpUploader && wpUploader.uploader;
            if (!up || !up.setOption) return;
            var $frame = this.$el;
            var accept = function () {
                $frame.find("input[type=file]").attr("accept", settings.accept);
            };
            up.setOption("filters", Object.assign({}, up.getOption("filters"), { mime_types: [{ title: settings.title, extensions: settings.extensions }] }));
            accept();
            if (up.bp3dModelOnly) return;
            up.bp3dModelOnly = true;
            // The file input is created once the uploader initialises, after the frame opens.
            up.bind("PostInit Refresh", accept);
            // Runs before the core handler, whose message for this reads like a server fault.
            up.bind("Error", function (uploader, error) {
                if (error.code !== window.plupload.FILE_EXTENSION_ERROR) return;
                window.wp.Uploader.errors.unshift({ message: settings.message, data: error, file: error.file });
                wpUploader.error(settings.message, error, error.file);
                return false;
            }, null, 100);
        }, this);
    };
})(window.wp && window.wp.media, ' . wp_json_encode($settings) . ');');
    }

    public function getActiveMimeTypes()
    {
        return Utils::getAllowedMimeTypes();
    }

    private function getFilteredMimeTypes(): array
    {
        $all_mimes = $this->getMimeTypes();
        $allowed_keys = $this->getActiveMimeTypes();

        $filtered = [];
        foreach ($allowed_keys as $key) {
            if (isset($all_mimes[$key])) {
                $filtered[$key] = $all_mimes[$key];
            }
        }
        return $filtered;
    }

    public function bplugins_stp_mime_types($mimes)
    {
        return wp_parse_args($mimes, $this->getFilteredMimeTypes());
    }

    public function bplugins_stp_add_allow_upload_extension_exception($data, $file, $filename, $mimes, $real_mime = null)
    {
        // If file extension is 2 or more 
        $f_sp = explode(".", $filename);
        $f_exp_count = count($f_sp);

        if ($f_exp_count <= 1) {
            return $data;
        }

        $ext = strtolower($f_sp[$f_exp_count - 1]);

        $extendedMimes = $this->getFilteredMimeTypes();

        if (isset($extendedMimes[$ext])) {
            // A caller with its own narrower allow-list (another plugin's uploader) keeps core's decision.
            if (!self::extensionAllowed($ext, is_array($mimes) ? $mimes : get_allowed_mime_types())) {
                return $data;
            }

            // A denial has to be spelled out: `$data` carries what core already
            // decided, and core accepts these names because the upload_mimes
            // filter above registered the extension. Returning it would pass
            // the file through rather than block it.
            $reject = ['ext' => false, 'type' => false, 'proper_filename' => false];

            // Hardening: Stop double-extension execution bypass (e.g. script.php.glb)
            $dangerous_extensions = [
                'php', 'php3', 'php4', 'php5', 'php7', 'php8', 
                'phtml', 'phar', 'cgi', 'pl', 'py', 'asp', 'aspx', 
                'jsp', 'exe', 'bat', 'cmd', 'sh', 'js', 'html', 'htm'
            ];
            for ($i = 0; $i < $f_exp_count - 1; $i++) {
                if (in_array(strtolower($f_sp[$i]), $dangerous_extensions, true)) {
                    return $reject;
                }
            }

            // Hardening: Prevent execution bypass if Magic Mime engine matches PHP
            if ($real_mime !== null && strpos(strtolower($real_mime), 'php') !== false) {
                return $reject;
            }

            // Hardening: markup renamed to a model extension would be sniffed as HTML/SVG when served without a content type.
            if (self::isMarkup($file, $real_mime)) {
                return $reject;
            }

            $type = $extendedMimes[$ext];
            $proper_filename = '';
            return compact('ext', 'type', 'proper_filename');
        }
        return $data;
    }

    private function getMimeTypes(): array
    {
        return Utils::SUPPORTED_MIME_TYPES;
    }

    /** Whether $ext is in a core-style mime map whose keys may be `jpg|jpeg|jpe`. */
    private static function extensionAllowed(string $ext, array $mimes): bool
    {
        foreach (array_keys($mimes) as $exts) {
            if (in_array($ext, explode('|', strtolower((string) $exts)), true)) {
                return true;
            }
        }
        return false;
    }

    private static function isMarkup(string $file, ?string $real_mime): bool
    {
        $markup = ['text/html', 'application/xhtml+xml', 'image/svg+xml', 'application/javascript', 'application/x-javascript', 'text/javascript', 'application/ecmascript'];
        if ($real_mime !== null && in_array(strtolower($real_mime), $markup, true)) {
            return true;
        }

        $head = is_readable($file) ? (string) file_get_contents($file, false, null, 0, 1024) : '';
        // Tags no 3D format uses; XML models (DAE, AMF) have none of them.
        return (bool) preg_match('/<\s*(!doctype\s+html|html|body|script|iframe|svg|object|embed|img|div|style|a\s+href)\b/i', $head);
    }
}

