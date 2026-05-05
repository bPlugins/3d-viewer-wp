import { PanelBody, Flex, FlexItem } from "@wordpress/components";

const Upgrade = () => {
    return (
        <PanelBody>
            {/* <Flex flex={true} as="div"> */}
            <FlexItem className="bp3d-upgrade-panel">
                <h2>Upgrade to Pro</h2>
                <p>Upgrade to PDF Poster Pro to unlock all the features of PDF Poster.</p>
                <Flex>
                    <a className="button button-primary" href="/wp-admin/edit.php?post_type=bp3d-model-viewer&page=3d-viewer#/pricing" style={{ background: '#146ef5' }} target="_blank" rel="noopener noreferrer">Upgrade to Pro</a>
                    <a className="button button-primary" href="https://wordpress.org/support/plugin/3d-viewer" style={{ background: '#146ef5' }} target="_blank" rel="noopener noreferrer">Support</a>
                </Flex>
            </FlexItem>
            {/* </Flex> */}
        </PanelBody>
    );
};

export default Upgrade;