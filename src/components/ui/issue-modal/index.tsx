import { useEffect, useMemo, useState } from "react";
import {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
} from "@/components/ui/tabs";

import { EMAIL_REGEX, TEMPLATE_EMAIL } from "@/lib/constants";
import { Button } from "../button";
import type { IssueHistoryItem } from "@/lib/types";

import { IoIosClose } from "react-icons/io";
import { FaBug } from "react-icons/fa";
import { MdHistory } from "react-icons/md";
import { DismissEmailButton } from "./dismiss-email-button";
export type IssueModalProps = {
    text?: string,
    history?: IssueHistoryItem[],
    dismissedEmails?: { email: string, deadline: number }[],
    isOpen?: boolean,
    onSubmit?: (emails: string[], dismissedEmails: {email: string, deadline: number}[], originalText: string, modifiedText: string) => void;
    onCancel?: () => void;
    onClearHistory?: () => void;
    onDismissEmail24h?: (dismiss: boolean, email: string) => void;
}


export function IssueModal({
    text = "",
    history = [],
    isOpen = false,
    dismissedEmails,
    onSubmit,
    onCancel,
    onClearHistory,
    onDismissEmail24h,
}: IssueModalProps) {
    const {
        initialModifiedText,
        emailCount,
        emails,
        dismissedEmailsInText,
    } = useMemo(() => {
        if (!text) {
            return {
                emails: [],
                dismissedEmailsInText: [],
                initialModifiedText: "",
                emailCount: 0,
            };
        }

        const matches = text.match(EMAIL_REGEX) ?? [];

        const dismissedMap = new Map(
            (dismissedEmails ?? []).map(d => [
                d.email.toLowerCase().trim(),
                d.deadline,
            ])
        );

        const filteredEmails: string[] = [];
        const dismissedFound: { email: string; deadline: number }[] = [];

        for (const email of matches) {
            const normalized = email.toLowerCase().trim();
            const deadline = dismissedMap.get(normalized);

            if (typeof deadline === "number") {
                dismissedFound.push({ email, deadline });
            } else {
                filteredEmails.push(email);
            }
        }

        // маскируем только non-dismissed
        const modifiedText = text.replace(EMAIL_REGEX, (match) => {
            const normalized = match.toLowerCase().trim();
            return dismissedMap.has(normalized)
                ? match
                : TEMPLATE_EMAIL;
        });

        return {
            initialModifiedText: modifiedText,
            emailCount: filteredEmails.length,
            emails: filteredEmails,
            dismissedEmailsInText: dismissedFound, // ✅ ВАЖНО
        };
    }, [text, dismissedEmails]);



    const [modifiedText, setModifiedText] = useState<string>(initialModifiedText);

    useEffect(() => {
        setModifiedText(initialModifiedText);
    }, [initialModifiedText]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center">
            {/* overlay */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={onCancel}
            />

            {/* modal */}
            <div className="relative z-10 w-full max-w-200 px-4">
                {/* content */}
                <Tabs defaultValue="issues" className="w-full rounded-lg bg-[#212121] border border-[#3a3a3a] text-white shadow-xl p-1 pb-2">
                    {/* Tabs Header */}
                    <div className="inline-flex justify-between items-center">
                        <TabsList className="bg-transparent font-semibold gap-1">
                            <TabsTrigger value="issues">
                                <FaBug /> Issues Found
                            </TabsTrigger>
                            <TabsTrigger value="history">
                                <MdHistory /> History
                            </TabsTrigger>
                        </TabsList>

                        <Button
                            onClick={onCancel}
                            variant={'ghost'}
                            className="text-white/50 items-start w-0 h-full hover:bg-transparent hover:text-white"
                        >
                            <IoIosClose className="size-6" />
                        </Button>
                    </div>

                    <TabsContent value="issues" className="space-y-4 mt-4 px-2">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-white">
                                Potential sensitive info found · {emailCount}
                            </h3>
                        </div>

                        <div className="h-auto max-h-[300px] flex flex-col gap-2 overflow-y-auto">
                            {emails.map((email) => (
                                <DismissEmailButton
                                    email={email}
                                    onClick={(dismiss) => onDismissEmail24h?.(dismiss, email)}
                                />
                            ))}
                        </div>

                        {/* Modified (editable) */}
                        <div className="space-y-2">
                            <label className="text-xs text-white/60">
                                Message to send (editable)
                            </label>

                            <textarea
                                value={modifiedText}
                                onChange={(e) => setModifiedText(e.target.value)}
                                rows={4}
                                className="w-full rounded-md bg-[#2a2a2a] border border-[#3a3a3a] text-sm text-white p-3"
                            />
                        </div>

                        {/* Original (read-only) */}
                        <div className="space-y-2">
                            <label className="text-xs text-white/40">
                                Original message (read-only)
                            </label>

                            <div className="w-full rounded-md bg-[#1e1e1e] border border-[#2a2a2a] text-sm text-white/40 p-3 whitespace-pre-wrap">
                                {text}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent
                        value="history"
                        className="relative mt-4 px-2 max-h-150 overflow-y-auto"
                    >
                        {/* Sticky header */}
                        <div className="sticky top-0 z-10 flex justify-end bg-linear-to-b from-[#212121] to-transparent pb-2">
                            <Button
                                onClick={onClearHistory}
                                className="text-xs rounded-md border border-white/10 bg-[#1e1e1e] px-3 py-1.5 text-white/70 hover:text-white hover:border-white/20 transition"
                            >
                                Clear history
                            </Button>
                        </div>

                        {/* History list */}
                        <div className="space-y-3">
                            {history.length === 0 ? (
                                <p className="text-sm text-white/40">
                                    No issues detected yet
                                </p>
                            ) : (
                                history.map((item) => {

                                    const dismissedMap = new Map(
                                        item.dismissedEmails?.map(d => [
                                            d.email.toLowerCase().trim(),
                                            d.deadline,
                                        ])
                                    );

                                    return (
                                        <div
                                            key={item.id}
                                            className="rounded-md border border-white/10 bg-[#1e1e1e] p-3 space-y-2"
                                        >
                                            {/* Header */}
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-white/50">
                                                    {new Date(item.timestamp).toLocaleString()}
                                                </span>
                                                <span className="text-xs text-white/40">
                                                    {item.emails.length} email(s)
                                                </span>
                                            </div>

                                            {/* Emails (all) */}
                                            <div className="space-y-1">
                                                <span className="text-xs text-white/50 block">
                                                    Emails
                                                </span>

                                                <div className="space-y-1">
                                                    {item.emails.map((email) => {
                                                        const normalized = email.toLowerCase().trim();
                                                        const deadline = dismissedMap.get(normalized);

                                                        return (
                                                            <div
                                                                key={email}
                                                                className="flex items-center gap-2 text-xs"
                                                            >
                                                                <span
                                                                    className={
                                                                        deadline
                                                                            ? "line-through text-white/30"
                                                                            : "text-white"
                                                                    }
                                                                >
                                                                    {email}
                                                                </span>

                                                                {deadline && (
                                                                    <span className="text-[10px] text-yellow-500">
                                                                        dismissed until{" "}
                                                                        {new Date(deadline).toLocaleTimeString()}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Modified */}
                                            <div className="text-sm text-white">
                                                <span className="text-xs text-white/50 block mb-1">
                                                    Modified
                                                </span>
                                                <div className="whitespace-pre-wrap rounded bg-[#2a2a2a] p-2">
                                                    {item.modifiedText ?? "[EMAIL_ADDRESS]"}
                                                </div>
                                            </div>

                                            {/* Original */}
                                            <div className="text-sm text-white/40">
                                                <span className="text-xs block mb-1">
                                                    Original
                                                </span>
                                                <div className="whitespace-pre-wrap rounded bg-[#151515] p-2">
                                                    {item.originalText ?? "-"}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })

                            )}
                        </div>

                    </TabsContent>



                    {/* Footer */}
                    <div className="mt-4 flex items-center justify-end gap-2 border-t border-white/10 pt-3 px-2">
                        <Button
                            variant="ghost"
                            onClick={onCancel}
                            className="text-white/60"
                        >
                            Cancel
                        </Button>

                        <Button
                            disabled={emailCount === 0}
                            onClick={() => {
                                onSubmit?.(
                                    dismissedEmailsInText ?
                                        [...emails, ...dismissedEmailsInText.map(item => item.email)] :
                                        emails,
                                    dismissedEmails ?? [],
                                    text,
                                    modifiedText
                                )
                            }}
                            className="bg-white text-black hover:bg-white/90"
                        >
                            Send
                        </Button>
                    </div>

                </Tabs>
            </div>
        </div>
    );
}
