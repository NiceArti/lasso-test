export type IssueHistoryItem = {
    id: string;
    timestamp: number;
    originalText: string;
    modifiedText: string;
    emails: string[];
    dismissedEmails?: {email: string, deadline: number}[];
};

export type LassoEmailDetails = {
    text?: string;
    emails?: string[];
};

export type LassoEvent =
    "lasso:start" |
    "lasso:end" |
    "lasso:submit" |
    "lasso:cancel";



// Chat GPT types
export type MessagePart = string | Record<string, unknown>;

export type MessageContent = {
    content_type: "text";
    parts: MessagePart[];
};

export type MessageMetadata = {
    developer_mode_connector_ids?: string[];
    selected_sources?: unknown[];
    selected_github_repos?: unknown[];
    selected_all_github_repos?: boolean;
    serialization_metadata?: {
        custom_symbol_offsets?: unknown[];
    };
};

export type ClientContextualInfo = {
    is_dark_mode: boolean;
    time_since_loaded: number;
    page_height: number;
    page_width: number;
    pixel_ratio: number;
    screen_height: number;
    screen_width: number;
    app_name: string;
};


export type ChatMessage = {
    id: string;
    author: {
        role: "user" | "assistant" | "system" | "tool";
    };
    create_time: number;
    content: MessageContent;
    metadata?: MessageMetadata;
};

export type ChatGPTConversationPayload = {
    action: "next";
    messages: ChatMessage[];
    conversation_id: string;
    parent_message_id: string;
    model: string;
    timezone_offset_min: number;
    timezone: string;
    conversation_mode: {
        kind: string;
    };
    enable_message_followups: boolean;
    system_hints: unknown[];
    supports_buffering: boolean;
    supported_encodings: string[];
    client_contextual_info: ClientContextualInfo;
    paragen_cot_summary_display_override?: string;
    force_parallel_switch?: string;
};