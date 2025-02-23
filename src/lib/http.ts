export const STATUS_BAD_REQUEST = 400;

export function statusText(status: number): string {
    switch (status) {
        case STATUS_BAD_REQUEST:
            return "StatusBadRequest"
    }

    throw new Error(`Unknown Status Code: ${status}`)
}