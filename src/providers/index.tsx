import type { LassoEmailDetails } from "@/lib/types";
import React, { createContext, useContext, useEffect, useState } from "react";

export const STORAGE_KEY = "issues";

export const DISMISSED_EMAIL_KEY = "dismissed_email";
export const DISMISSED_EMAIL_TTL = 24 * 60 * 60 * 1000; // 24h

export type IssueHistoryItem = {
    id: string;
    timestamp: number;
    originalText: string;
    modifiedText: string;
    emails: string[];
    dismissTimestamp?: number;
};

type IssuesContextValue = {
    text: string;
    setText: React.Dispatch<React.SetStateAction<string>>;

    emails: string[];
    setEmails: React.Dispatch<React.SetStateAction<string[]>>;

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
                const issues = Array.isArray(result.issues)
                    ? result.issues
                    : [];


                // @ts-ignore
                const dismissedMap: Record<string, number> =
                    result[DISMISSED_EMAIL_KEY] ?? {};

                const now = Date.now();

                const hydrated = issues.map((issue) => {
                    const activeDismissUntil = issue.emails
                        .map((email: string) => dismissedMap[email])
                        .find(
                            (until: number) =>
                                typeof until === "number" && until > now
                        );

                    if (activeDismissUntil) {
                        return {
                            ...issue,
                            dismissTimestamp: activeDismissUntil,
                        };
                    }

                    return issue;
                });

                hydrated.sort(
                    (a, b) => b.timestamp - a.timestamp
                );

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
