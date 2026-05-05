import { Modal } from "@wordpress/components";
import { __ } from "@wordpress/i18n";
import LockForProModal from "../../../../icons/LockForProModal";
import External from "../../../../icons/External";
import { threeDIcon } from "../../../../icons/ThreeDIcons";

const ProModal = ({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) => {

    if (!open) return null;
    return (
        <Modal title={<div className="bp3d-panel-icon">{threeDIcon} {__('Upgrade to PRO', '3d-viewer')}</div> as unknown as string} onRequestClose={() => setOpen(false)}>
            <div className="bp3d-upgrade-modal">
                <div className="bp3d-upgrade-modal-icon">
                    <LockForProModal width="200px" height="200px" />
                </div>
                <div className="bp3d-upgrade-modal-content">
                    <h2>{__('Upgrade to PRO version', '3d-viewer')}</h2>

                    <p>{__('Access advanced 3D features and controls by upgrading to PRO version', '3d-viewer')}</p>
                    <a className="button button-primary" href="/wp-admin/edit.php?post_type=bp3d-model-viewer&page=3d-viewer#/pricing" target="_blank" rel="noopener noreferrer">Upgrade to Pro <External fill={"#fff"} /></a>
                </div>
            </div>
        </Modal>
    )
}

export default ProModal
