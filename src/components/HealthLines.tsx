import type { HealthView } from '../utils/health/messages';

const NewTab = ({ href, children }: { href: string; children: string }) => (
    <a href={href} target='_blank' rel='noreferrer'>{children}</a>
);

export interface HealthLinesProps {
    view: HealthView;
    /** One element per line: `span` (styled as blocks), or `p` / `div` where the host notice has no stylesheet of ours. */
    tag?: 'span' | 'p' | 'div';
    lineClass?: string;
}

/** The health view's lines and "+N more", for any host notice. Text only: names from model files never become HTML. */
const HealthLines = ({ view, tag: Line = 'span', lineClass = 'bp3dModelHealthNotice__line' }: HealthLinesProps) => (
    <>
        {view.lines.map((line, index) => (
            <Line key={`${line.id}-${index}`} className={lineClass}>
                <strong>{line.heading}</strong>{' '}{line.text}
                {line.action && <>{' '}<NewTab href={line.action.href}>{line.action.label}</NewTab></>}
                {' '}<NewTab href={line.howToFix.href}>{line.howToFix.label}</NewTab>
            </Line>
        ))}
        {view.more && (
            <Line className={lineClass}>
                <NewTab href={view.more.href}>{view.more.label}</NewTab>
            </Line>
        )}
    </>
);

export default HealthLines;
