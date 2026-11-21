import Notice from '../../../../../../bpl-tools/Components/Notice';
import useSpecGlossCheck from '../../../../hooks/useSpecGlossCheck';
import { anchorUrl } from '../../../../utils/health/anchors';
import { specGlossMessages } from '../../../../utils/specGloss/messages';

interface SpecGlossNoticeProps {
    modelUrl?: string;
    currentViewer?: string;
}

// Informational only; health check H14 (EditorHealthNotice) stays quiet while this shows.
const SpecGlossNotice = ({ modelUrl, currentViewer = 'modelViewer' }: SpecGlossNoticeProps) => {
    const status = useSpecGlossCheck(currentViewer === 'modelViewer' ? modelUrl : undefined);

    if (status !== 'specgloss') return null;

    const text = specGlossMessages();

    return (
        <Notice status='warning' className='bp3dSpecGlossNotice' isIcon>
            <strong>{text.title}</strong>{' '}
            {text.body}{' '}
            {text.reExport}{' '}
            <a href={anchorUrl('H14')} target='_blank' rel='noreferrer'>{text.howToFix}</a>
        </Notice>
    );
};

export default SpecGlossNotice;
