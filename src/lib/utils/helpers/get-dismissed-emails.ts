export function getDismissedEmails(): Promise<string[]> {
    return new Promise((resolve) => {
        const handler = (e: MessageEvent) => {
            if (e.data?.source !== 'LASSO_EXT') return;
            if (e.data?.type !== 'DISMISSED_EMAILS') return;

            window.removeEventListener('message', handler);

            const raw = e.data.payload;
            const emails = Array.isArray(raw)
                ? raw.map((x: string) => x.toLowerCase().trim())
                : [];

            resolve(emails);
        };

        window.addEventListener('message', handler);

        window.postMessage(
            { source: 'LASSO_PAGE', type: 'NEED_DISMISSED_EMAILS' },
            '*'
        );
    });
}