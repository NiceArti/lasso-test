import { useEffect, useState } from "react";
import { IssueModal } from "./components/ui/issue-modal";
import { DISMISSED_EMAIL_KEY, DISMISSED_EMAIL_TTL, STORAGE_KEY, useApp } from "./providers";


type Issue = {
  id: string;
  timestamp: number;
  originalText: string;
  modifiedText: string;
  emails: string[];
};

/**
 * Persists a detected issue to browser storage.
 *
 * An issue represents a single interception event where sensitive
 * data (e.g. email addresses) was detected in user input.
 *
 * The function is intentionally minimal at the call site - it accepts
 * only the relevant business data, while internally generating
 * metadata such as unique identifiers and timestamps.
 *
 * @param emails - Detected email addresses.
 * @param originalText - Original user-submitted text.
 * @param modifiedText - User-approved (possibly anonymized) text.
 */
function storeEmails(
  emails: string[],
  originalText: string,
  modifiedText: string,
): void {
  const issue: Issue = {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    originalText,
    modifiedText,
    emails,
  };

  chrome.storage.local.get([STORAGE_KEY], (result) => {
    const existing: Issue[] = Array.isArray(result[STORAGE_KEY])
      ? result[STORAGE_KEY]
      : [];

    chrome.storage.local.set({
      [STORAGE_KEY]: [...existing, issue],
    });
  });
}



export default function App() {
  const {
    emails,
    text,
    history,
    setHistory,
  } = useApp();


  const [open, setOpen] = useState(false);


  const handleClearHistory = () => {
    setHistory([]);
    chrome.storage.local.remove("issues");
  }

  const handleClose = () => {
    window.dispatchEvent(new CustomEvent("lasso:cancel"));
    setOpen(false);
  }

  const handleDismissEmail = (dismiss: boolean, email: string) => {
    chrome.storage.local.get([DISMISSED_EMAIL_KEY], (result) => {
      // @ts-ignore
      const existing: Record<string, number> = result[DISMISSED_EMAIL_KEY] ?? {};

      if (dismiss) {
        const dismissedUntil = Date.now() + DISMISSED_EMAIL_TTL;

        const updated = {
          ...existing,
          [email]: dismissedUntil,
        };

        // 💾 persist
        chrome.storage.local.set({
          [DISMISSED_EMAIL_KEY]: updated,
        });
      } else {
        const { [email]: _, ...rest } = existing;

        // 💾 persist
        chrome.storage.local.set({
          [DISMISSED_EMAIL_KEY]: rest,
        });
      }
    });
  }

  const handleSubmit = (emails: string[], originalText: string, modifiedText: string) => {
    const issue = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      originalText,
      modifiedText,
      emails,
    };

    storeEmails(
      emails,
      originalText,
      modifiedText,
    );

    setHistory(prev =>
      [issue, ...prev].sort((a, b) => b.timestamp - a.timestamp)
    );

    window.dispatchEvent(
      new CustomEvent("lasso:submit", {
        detail: {
          originalText: originalText,
          modifiedText: modifiedText,
        }
      })
    );

    setOpen(false);
  }

  useEffect(() => {
    if(!emails.length) {
      handleClose();
      return;
    }
    setOpen(true);
  }, [emails]);


  return (
    <IssueModal
      isOpen={open}
      text={text}
      history={history}
      onCancel={handleClose}
      onSubmit={handleSubmit}
      onClearHistory={handleClearHistory}
      onDismissEmail24h={handleDismissEmail}
    />
  );
}