export interface NoteInput {
    agentId: string;
    md: string;
    ts?: number;
}
export interface ListOptions {
    agentId?: string;
    after?: number;
    before?: number;
    limit?: number;
}
export interface Note {
    id: string;
    agentId: string;
    ts: number;
    md: string;
}
export declare function addNote(db: any, input: NoteInput): Promise<string>;
export declare function listNotes(db: any, options?: ListOptions): Promise<Note[]>;
