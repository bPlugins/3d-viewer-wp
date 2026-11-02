<?php

namespace BP3D\Integrations\FluentCart;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * GET / POST bp3d/v1/fluentcart/product/{id}: the admin form's read and save, the same route as Pro's basic tier.
 * Needs `edit_post` on that product and a `fluent-products` ID.
 */
final class Rest
{
    public const NAMESPACE = 'bp3d/v1/fluentcart';

    public function register(): void
    {
        add_action('rest_api_init', [$this, 'routes']);
    }

    public function routes(): void
    {
        $args = ['id' => ['type' => 'integer', 'required' => true, 'minimum' => 1]];

        register_rest_route(self::NAMESPACE, '/product/(?P<id>\d+)', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'get'],
                'permission_callback' => [$this, 'permission'],
                'args' => $args,
            ],
            [
                'methods' => \WP_REST_Server::CREATABLE,
                'callback' => [$this, 'save'],
                'permission_callback' => [$this, 'permission'],
                'args' => $args,
            ],
        ]);
    }

    /** @return true|\WP_Error */
    public function permission(\WP_REST_Request $request)
    {
        $id = (int) $request['id'];

        if (!ProductModel::isProduct($id)) {
            return new \WP_Error('bp3d_not_fluentcart_product', __('That is not a FluentCart product.', '3d-viewer'), ['status' => 404]);
        }
        if (!ProductModel::canEdit($id)) {
            return new \WP_Error('bp3d_forbidden', __('You are not allowed to edit this product.', '3d-viewer'), ['status' => 403]);
        }

        return true;
    }

    public function get(\WP_REST_Request $request): \WP_REST_Response
    {
        $id = (int) $request['id'];

        return rest_ensure_response(ProductModel::summary(ProductModel::read($id)));
    }

    /** @return \WP_REST_Response|\WP_Error */
    public function save(\WP_REST_Request $request)
    {
        $id = (int) $request['id'];
        $input = $request->get_json_params();
        if (!is_array($input)) {
            $input = $request->get_body_params();
        }

        $clean = ProductModel::sanitize(is_array($input) ? $input : []);

        if (!ProductModel::modelUrlOk($clean['model'])) {
            return new \WP_Error('bp3d_model_type', __('Choose a 3D model file, for example a .glb.', '3d-viewer'), ['status' => 400]);
        }

        return rest_ensure_response(ProductModel::save($id, $clean));
    }
}
