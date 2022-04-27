export type VppCallback = (err?: Error) => void
export type VppHandler = (req: any, res: any, next?: VppCallback) => void
