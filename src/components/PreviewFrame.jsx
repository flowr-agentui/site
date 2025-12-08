import './PreviewFrame.css';
import { Share2, Maximize2 } from 'lucide-react';

export function PreviewFrame({ htmlContent }) {

    if (!htmlContent) {
        return (
            <div className="preview-placeholder">
                <div className="placeholder-content">
                    <div className="browser-mockup">
                        <div className="browser-header">
                            <div className="dots">
                                <span></span><span></span><span></span>
                            </div>
                        </div>
                        <div className="browser-body"></div>
                    </div>
                    <h3>Ready to Build</h3>
                    <p>Answer the agent's questions to generate your website preview here.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="preview-container">
            <div className="preview-toolbar">
                <div className="url-bar">
                    https://generated-site.app
                </div>
                <div className="toolbar-actions">
                    {/* Placeholder for future actions */}
                </div>
            </div>
            <iframe
                title="Preview"
                srcDoc={htmlContent}
                className="preview-iframe"
                sandbox="allow-scripts allow-modals"
            />
        </div>
    );
}
