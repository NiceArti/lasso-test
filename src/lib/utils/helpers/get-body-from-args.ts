/**
 * Extracts the request body from a `fetch` call argument list.
 *
 * The Fetch API allows request payloads to be provided either:
 * 1) directly via the `init.body` parameter, or
 * 2) encapsulated within a `Request` object passed as the first argument.
 *
 * This helper normalizes both cases and returns the request body
 * in a consistent manner, enabling reliable inspection and modification
 * of outgoing payloads before dispatch.
 *
 * @param args - Arguments passed to the intercepted `fetch` call.
 * @returns The request body if present, otherwise `null`.
 */
export function getBodyFromArgs(args: any) {
    if (args[1]?.body) {
        return args[1].body;
    }

    if (args[0] instanceof Request) {
        return args[0].body;
    }

    return null;
}