<?php

namespace BP3D\Base;

if (!defined('ABSPATH')) {
    exit;
}

class ExtendMimeType
{

    public function register()
    {
        add_filter('upload_mimes', [$this, 'bplugins_stp_mime_types']);
        add_filter('wp_check_filetype_and_ext', [$this, 'bplugins_stp_add_allow_upload_extension_exception'], 10, 5);
    }

    public function getActiveMimeTypes()
    {
        $settings = get_option('_bp3d_settings_', []);
        $allowed_mimes = isset($settings['allowed_mime_types']) ? $settings['allowed_mime_types'] : [];
        if (!is_array($allowed_mimes)) {
            $allowed_mimes = [];
        }
        return $allowed_mimes;
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
            // Hardening: Stop double-extension execution bypass (e.g. script.php.glb)
            $dangerous_extensions = [
                'php', 'php3', 'php4', 'php5', 'php7', 'php8', 
                'phtml', 'phar', 'cgi', 'pl', 'py', 'asp', 'aspx', 
                'jsp', 'exe', 'bat', 'cmd', 'sh', 'js', 'html', 'htm'
            ];
            for ($i = 0; $i < $f_exp_count - 1; $i++) {
                if (in_array(strtolower($f_sp[$i]), $dangerous_extensions, true)) {
                    return $data; // Reject
                }
            }

            // Hardening: Prevent execution bypass if Magic Mime engine matches PHP
            if ($real_mime !== null && strpos(strtolower($real_mime), 'php') !== false) {
                return $data; // Reject
            }

            $type = $extendedMimes[$ext];
            $proper_filename = '';
            return compact('ext', 'type', 'proper_filename');
        }
        return $data;
    }

    private function getMimeTypes(): array
    {
        $mimes = [
            'glb' => 'model/gltf-binary',
            'gltf' => 'model/gltf-binary',
            'obj' => 'model/obj',
            '3ds' => 'application/x-3ds',
            'step' => 'application/step',
            'stl' => 'application/vnd.ms-pki.stl',
            'fbx' => 'application/octet-stream',
            '3dml' => 'text/vnd.in3d.3dml',
            'dae' => 'application/collada+xml',
            'wrl' => 'model/vrml',
            '3mf' => 'application/vnd.ms-3mfdocument',
            'mtl' => 'model/mtl',
            'hdr' => 'image/vnd.radiance',
            'usdz' => 'model/vnd.pixar.usd',
        ];

        return $mimes;
    }
}

