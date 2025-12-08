import { useState, useEffect, useRef } from 'react';
import './PreviewFrame.css';
import { Share2, Maximize2, MousePointerClick, Download } from 'lucide-react';

const SELECTION_SCRIPT = `
<script>
(function() {
  let active = false;
  let hovered = null;

  window.addEventListener('message', (e) => {
    if (e.data.type === 'TOGGLE_SELECTION') {
      active = e.data.active;
      if (active) {
        document.body.style.cursor = 'crosshair';
        document.addEventListener('mouseover', onMouseOver, true);
        document.addEventListener('click', onClick, true);
      } else {
        document.body.style.cursor = '';
        document.removeEventListener('mouseover', onMouseOver, true);
        document.removeEventListener('click', onClick, true);
        if (hovered) {
          hovered.style.outline = '';
          hovered = null;
        }
      }
    }
  });

  function onMouseOver(e) {
    if (!active) return;
    e.stopPropagation();
    if (hovered) hovered.style.outline = '';
    hovered = e.target;
    hovered.style.outline = '2px solid #e11d48'; // Flowr accent color roughly
  }

  function onClick(e) {
    if (!active) return;
    e.preventDefault();
    e.stopPropagation();
    
    const el = e.target;
    // Generate a simple selector
    const tagName = el.tagName.toLowerCase();
    const id = el.id ? '#' + el.id : '';
    const className = el.className && typeof el.className === 'string' ? '.' + el.className.split(' ').join('.') : '';
    const text = el.innerText ? el.innerText.substring(0, 100) : '';

    const data = {
        tagName,
        id,
        className,
        text,
        fullSelector: tagName + id + className,
        // Send a snippet of the code to help LLM find it
        outerHTML: el.outerHTML.substring(0, 1000) // Limit size
    };

    window.parent.postMessage({ type: 'ELEMENT_SELECTED', element: data }, '*');
    
    // Cleanup
    active = false;
    document.body.style.cursor = '';
    document.removeEventListener('mouseover', onMouseOver, true);
    document.removeEventListener('click', onClick, true);
    if (hovered) hovered.style.outline = '';
  }
})();
</script>
`;

export function PreviewFrame({ htmlContent, onElementSelect }) {
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const iframeRef = useRef(null);

    // Communicate mode change to iframe
    useEffect(() => {
        if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage({
                type: 'TOGGLE_SELECTION',
                active: isSelectionMode
            }, '*');
        }
    }, [isSelectionMode, htmlContent]); // Re-send if content updates

    // Listen for selection events from iframe
    useEffect(() => {
        const handleMessage = (e) => {
            if (e.data.type === 'ELEMENT_SELECTED') {
                onElementSelect(e.data.element);
                setIsSelectionMode(false);
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [onElementSelect]);

    const getAugmentedContent = () => {
        if (!htmlContent) return '';
        // Inject script at the end of body
        return htmlContent + SELECTION_SCRIPT;
    };

    const handleDownload = () => {
        if (!htmlContent) return;
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'index.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

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
                    <button
                        className={`action-btn ${isSelectionMode ? 'active' : ''}`}
                        onClick={() => setIsSelectionMode(!isSelectionMode)}
                        title="Select Element to Edit"
                    >
                        <MousePointerClick size={16} />
                        <span>{isSelectionMode ? 'Cancel Selection' : 'Select Element'}</span>
                    </button>
                    <button
                        className="action-btn"
                        onClick={handleDownload}
                        title="Download Code"
                    >
                        <Download size={16} />
                        <span>Download</span>
                    </button>
                </div>
            </div>
            <iframe
                ref={iframeRef}
                title="Preview"
                srcDoc={getAugmentedContent()}
                className="preview-iframe"
                sandbox="allow-scripts allow-modals allow-same-origin"
            />
        </div>
    );
}
