import type { IssueHistoryItem, LassoEmailDetails } from "@/lib/types";
import React, { createContext, useContext, useEffect, useState } from "react";

export const STORAGE_KEY = "issues";

export const DISMISSED_EMAIL_KEY = "dismissed_email";
export const DISMISSED_EMAIL_TTL = 24 * 60 * 60 * 1000; // 24h

type IssuesContextValue = {
    text: string;
    setText: React.Dispatch<React.SetStateAction<string>>;

    emails: string[];
    setEmails: React.Dispatch<React.SetStateAction<string[]>>;

    dismissedEmails: { email: string, deadline: number }[];
    setDismissedEmails: React.Dispatch<React.SetStateAction<{ email: string, deadline: number }[]>>;

    history: IssueHistoryItem[];
    setHistory: React.Dispatch<
        React.SetStateAction<IssueHistoryItem[]>
    >;
};

const AppContext = createContext<IssuesContextValue | null>(
    null
);

export const AppProvider: React.FC<{
    children: React.ReactNode;
}> = ({ children }) => {
    const [text, setText] = useState<string>("");
    const [emails, setEmails] = useState<string[]>([]);
    const [dismissedEmails, setDismissedEmails] = useState<{ email: string, deadline: number }[]>([]);
    const [history, setHistory] = useState<IssueHistoryItem[]>([]);

    useEffect(() => {
        const handler = (event: Event) => {
            const custom = event as CustomEvent<LassoEmailDetails>;
            const incomingText = custom.detail?.text;

            if (!incomingText) return;

            const matches =
                incomingText.match(
                    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi
                ) ?? [];

            const extractedEmails = Array.from(
                new Set(matches.map(e => e.toLowerCase().trim()))
            );

            if (extractedEmails.length === 0) {
                setText(incomingText);
                setEmails([]);
                return;
            }

            chrome.storage.local.get(
                [DISMISSED_EMAIL_KEY],
                (result) => {
                    const raw = result[DISMISSED_EMAIL_KEY];
                    // @ts-ignore
                    const dismissedMap: Record<string, number> =
                        typeof raw === "object" && raw !== null ? raw : {};

                    const now = Date.now();

                    // ⛔ delete dismissed emails
                    const activeEmails = extractedEmails.filter(
                        (email) => {
                            const until = dismissedMap[email];
                            return !(
                                typeof until === "number" && until > now
                            );
                        }
                    );

                    setText(incomingText);
                    setEmails(activeEmails);
                }
            );
        };

        window.addEventListener("lasso:open", handler);
        return () =>
            window.removeEventListener("lasso:open", handler);
    }, []);

    useEffect(() => {
        chrome.storage.local.get(
            [STORAGE_KEY, DISMISSED_EMAIL_KEY],
            (result) => {
                const issues = Array.isArray(result[STORAGE_KEY])
                    ? result[STORAGE_KEY] as IssueHistoryItem[]
                    : [];

                    console.log(issues)

                const rawDismissedMap =
                    (result[DISMISSED_EMAIL_KEY] as Record<string, number> | undefined) ?? {};

                const now = Date.now();

                // ✅ Нормализуем dismissedMap (ключи приводим к lower+trim)
                const dismissedMap: Record<string, number> = {};
                for (const [email, deadline] of Object.entries(rawDismissedMap)) {
                    const normalized = email.toLowerCase().trim();
                    const numDeadline = Number(deadline);
                    if (!Number.isNaN(numDeadline)) {
                        dismissedMap[normalized] = numDeadline;
                    }
                }

                // ✅ глобальный dismissedEmails (активные)
                const validDismissedEmails = Object.entries(dismissedMap)
                    .filter(([_, deadline]) => deadline > now)
                    .map(([email, deadline]) => ({ email, deadline }));

                setDismissedEmails(validDismissedEmails);

                // ✅ гидратация history: добавляем dismissedEmails на основе нормализованного lookup
                const hydrated: IssueHistoryItem[] = [];

                for (const issue of issues) {
                    const issueDismissedEmails: { email: string; deadline: number }[] = [];
                    for(const email of issue.emails) {
                        const normalized = email.toLowerCase().trim();
                        const deadline = dismissedMap[normalized];

                        if (typeof deadline === "number" && deadline > now) {
                            issueDismissedEmails.push({ email, deadline });
                        }
                    }
                    
                    // собираем issue
                    if (issueDismissedEmails.length > 0) {
                        hydrated.push({
                            ...issue,
                            emails: issue.emails ?? [],
                            dismissedEmails: issueDismissedEmails,
                        });
                    } else {
                        hydrated.push({
                            ...issue,
                        });
                    }
                }

                hydrated.sort((a, b) => b.timestamp - a.timestamp);

                setHistory(hydrated);
            }
        );
    }, []);





    return (
        <AppContext.Provider
            value={{
                text,
                setText,

                emails,
                setEmails,

                history,
                setHistory,

                dismissedEmails,
                setDismissedEmails,
            }}
        >
            {children}
        </AppContext.Provider>
    );
};

export function useApp() {
    const ctx = useContext(AppContext);
    if (!ctx) {
        throw new Error(
            "useIssues must be used inside AppProvider"
        );
    }
    return ctx;
}
