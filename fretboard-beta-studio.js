(() => {
    'use strict';
    document.addEventListener('DOMContentLoaded', () => {
        const dialog = document.getElementById('fretboard-word-beta');
        if (!dialog) return;
        const body = dialog.querySelector('.beta-body');
        const cards = {
            patterns: dialog.querySelector('.beta-main'), keys: dialog.querySelector('.beta-side > .beta-card'),
            order: dialog.querySelector('.beta-order-card'), page: document.getElementById('beta-page-heading').closest('details'),
            text: document.getElementById('beta-text-heading').closest('details'), saved: dialog.querySelector('.beta-config-card')
        };
        const tabs = document.createElement('div');
        tabs.className = 'beta-studio-tabs'; tabs.setAttribute('role', 'tablist'); tabs.setAttribute('aria-label', 'Export settings');
        dialog.querySelector('.beta-header').after(tabs);
        const advancedCards = FretboardBetaAdvancedSchema.mount(dialog);
        const panels = [];
        for (const [id, title, members] of [
            ['selection', 'Patterns & keys', [cards.patterns, cards.keys, cards.order]],
            ['layout', 'Page & diagram', [cards.page]],
            ['text', 'Text & labels', [cards.text]],
            ['saved', 'Saved setups', [cards.saved]],
            ...FretboardBetaAdvancedSchema.tabs.map((tab, i) => [tab.id, tab.title, [advancedCards[i]]])
        ]) {
            const panel = document.createElement('section'); panel.id = 'beta-panel-' + id;
            panel.className = 'beta-studio-panel beta-panel-' + id;
            panel.setAttribute('role', 'tabpanel'); panel.setAttribute('aria-labelledby', 'beta-tab-' + id);
            const tab = document.createElement('button'); tab.id = 'beta-tab-' + id; tab.type = 'button'; tab.textContent = title;
            tab.setAttribute('role', 'tab'); tab.setAttribute('aria-controls', panel.id);
            for (const card of members) { card.open = true; panel.append(card); }
            tabs.append(tab); panels.push({ tab, panel });
        }
        body.replaceChildren(...panels.map(item => item.panel));
        function activate(index) {
            panels.forEach(({ tab, panel }, i) => {
                tab.setAttribute('aria-selected', String(i === index)); tab.tabIndex = i === index ? 0 : -1;
                panel.hidden = i !== index;
            });
            body.scrollTop = 0;
        }
        panels.forEach(({ tab }, i) => {
            tab.addEventListener('click', () => activate(i));
            tab.addEventListener('keydown', event => {
                let next;
                if (event.key === 'ArrowRight') next = (i + 1) % panels.length;
                else if (event.key === 'ArrowLeft') next = (i + panels.length - 1) % panels.length;
                else if (event.key === 'Home') next = 0;
                else if (event.key === 'End') next = panels.length - 1;
                else return;
                event.preventDefault(); activate(next); panels[next].tab.focus();
            });
        });
        activate(0);
        function groupFields(card, groups) {
            const grid = card.querySelector('.beta-option-grid');
            const container = document.createElement('div'); container.className = 'beta-field-sections';
            for (const [title, ids] of groups) {
                const group = document.createElement('fieldset'); group.className = 'beta-field-section';
                const legend = document.createElement('legend'); legend.textContent = title; group.append(legend);
                const fields = document.createElement('div'); fields.className = 'beta-option-grid';
                for (const id of ids) {
                    const label = document.getElementById('beta-' + id)?.closest('label');
                    if (label) fields.append(label);
                }
                group.append(fields); container.append(group);
            }
            if (grid.children.length) {
                const extra = document.createElement('fieldset'); extra.className = 'beta-field-section';
                const legend = document.createElement('legend'); legend.textContent = 'Typography & styling'; extra.append(legend, grid); container.append(extra);
            } else grid.remove();
            card.querySelector('.beta-card-body').prepend(container);
        }
        groupFields(cards.page, [
            ['Paper & layout', ['paper', 'orientation', 'custom-width', 'custom-height', 'margin', 'columns', 'per-page', 'gap-x', 'gap-y', 'align-x', 'align-y', 'category-break', 'key-break']],
            ['Diagram size & quality', ['image-width', 'image-height', 'dpi', 'jpeg-quality', 'diagram-padding']],
            ['Instrument & fret range', ['tuning-preset', 'tuning', 'start-fret', 'end-fret']],
            ['Diagram appearance', ['display-mode', 'background', 'transparent', 'grayscale', 'diagram-opacity', 'rotate-diagram', 'marker-shape', 'marker-size', 'marker-font-size', 'string-thickness', 'fret-thickness', 'fret-number-placement', 'fret-number-position', 'fret-number-size', 'border-style', 'border-color', 'border-width']]
        ]);
        groupFields(cards.text, [
            ['Document', ['document-title', 'subtitle', 'author', 'introduction', 'date-text', 'tuning-text', 'range-text']],
            ['Headings & captions', ['category-text', 'category-note', 'key-text', 'key-note', 'caption-text', 'caption-position', 'heading-numbers', 'diagram-numbers', 'uppercase-headings', 'uppercase-captions']],
            ['Page header & footer', ['page-header', 'page-footer', 'page-numbers']]
        ]);
        const format = document.getElementById('beta-export-format');
        const note = document.createElement('p'); note.id = 'beta-format-note'; note.className = 'beta-format-note';
        format.closest('label').append(note); format.setAttribute('aria-describedby', note.id);
        const formatGroups = [
            ['Documents & print', ['docx', 'pdf-single', 'pdf-zip', 'html']],
            ['Individual diagrams', ['png-zip', 'jpg-zip', 'svg-zip', 'webp-zip', 'markdown-zip']],
            ['Page images', ['svg-pages-zip', 'png-pages-zip', 'jpg-pages-zip']],
            ['Spreadsheets & catalogs', ['xlsx', 'ods', 'xls', 'csv', 'tsv', 'txt', 'rtf', 'word-xml']],
            ['Structured data', ['json', 'xml', 'ndjson', 'yaml']]
        ];
        const selectedFormat = format.value;
        const options = new Map([...format.options].map(option => [option.value, option]));
        for (const [title, ids] of formatGroups) {
            const group = document.createElement('optgroup'); group.label = title;
            ids.forEach(id => group.append(options.get(id))); format.append(group);
        }
        format.value = selectedFormat;
        function refresh() {
            const kind = format.value;
            const paged = ['docx', 'pdf-single', 'html', 'svg-pages-zip', 'png-pages-zip', 'jpg-pages-zip'].includes(kind);
            const catalog = ['xlsx', 'ods', 'xls', 'csv', 'tsv', 'txt', 'rtf', 'word-xml', 'json', 'xml', 'ndjson', 'yaml'].includes(kind);
            note.textContent = kind === 'docx' ? 'Editable Word document. Auto size fills the printable row width without cropping.'
                : paged ? 'Complete pages with your layout, headings and captions.'
                : kind === 'pdf-zip' ? 'One full-width diagram per PDF, bundled in a ZIP.'
                : catalog ? 'Text and data only; no diagram images. JSON includes all export settings.'
                : kind === 'markdown-zip' ? 'Markdown collection with captions and linked PNG diagrams.'
                : 'One image per diagram, bundled in a ZIP. JPG always has a solid background.';
            document.getElementById('beta-export').title = options.get(kind)?.textContent || 'Export';
            for (const id of ['custom-width', 'custom-height']) document.getElementById('beta-' + id).closest('label').hidden = document.getElementById('beta-paper').value !== 'custom';
            for (const id of ['border-color', 'border-width']) document.getElementById('beta-' + id).closest('label').hidden = document.getElementById('beta-border-style').value === 'none';
        }
        dialog.addEventListener('change', refresh);
        dialog.addEventListener('click', () => queueMicrotask(refresh));
        new MutationObserver(refresh).observe(dialog, { attributes: true, attributeFilter: ['open'] });
        refresh();
    });
})();
