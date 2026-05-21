/**
 * Proje açıklamasını HTML'e çevirir (düz metin + basit markdown).
 * Zaten HTML ise olduğu gibi döner.
 */
export function formatProjectDescription(text) {
    if (!text || typeof text !== 'string') return '';

    const trimmed = text.trim();
    if (/<[a-z][\s\S]*>/i.test(trimmed)) {
        return trimmed;
    }

    const escapeHtml = (s) =>
        s
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

    const inlineFormat = (s) =>
        escapeHtml(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    const lines = trimmed.split('\n');
    let html = '';
    let inList = false;

    const closeList = () => {
        if (inList) {
            html += '</ul>';
            inList = false;
        }
    };

    for (const rawLine of lines) {
        const line = rawLine.trim();

        if (!line) {
            closeList();
            continue;
        }

        if (line.startsWith('## ')) {
            closeList();
            html += `<h2 class="project-desc-h2">${inlineFormat(line.slice(3))}</h2>`;
        } else if (line.startsWith('### ')) {
            closeList();
            html += `<h3 class="project-desc-h3">${inlineFormat(line.slice(4))}</h3>`;
        } else if (line.startsWith('- ')) {
            if (!inList) {
                html += '<ul class="project-desc-list">';
                inList = true;
            }
            html += `<li>${inlineFormat(line.slice(2))}</li>`;
        } else {
            closeList();
            html += `<p>${inlineFormat(line)}</p>`;
        }
    }

    closeList();
    return html;
}
