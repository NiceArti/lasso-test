chrome.runtime.onMessage.addListener((msg, _, sendResponse) => {
    if (msg.type === 'GET_DISMISSED_EMAILS') {
        chrome.storage.local.get(['dismissed_email'], (res) => {
            const raw = res.dismissed_email ?? {};
            const now = Date.now();

            const valid: Record<string, number> = {};
            const emails: string[] = [];

            for (const [email, ts] of Object.entries(raw)) {
                if (typeof ts === 'number' && ts >= now) {
                    valid[email] = ts;
                    emails.push(email);
                }
            }

            // 🧹 remove storage for not dismissed emails after timestamp done
            chrome.storage.local.set({ dismissed_email: valid });

            sendResponse(emails);
        });

        return true;
    }
});
