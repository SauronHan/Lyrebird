export interface VoiceProfile {
    id: string;
    name: string;
    type: string;
    path: string;
    created_at: string;
}

export interface VoiceSelection {
    hostId: string;
    guestId: string;
}
