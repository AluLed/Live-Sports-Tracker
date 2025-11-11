export interface Location {
    lat: number;
    lng: number;
}

export type ParticipantStatus = 'tracking' | 'panic' | 'finished';

export interface Participant {
    id: string;
    name: string;
    number: string;
    eventId: string;
    location?: Location;
    status: ParticipantStatus;
    lastUpdate?: number;
}

export interface Event {
    id: string;
    name: string;
    active: boolean;
}

export interface LocationUpdate {
    participantId: string;
    location: Location;
    timestamp: number;
}