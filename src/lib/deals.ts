/**
 * Compatibility module — production tape is built in `feed.ts`.
 * Historical builds referenced `lib/deals.ts` as the static source.
 */
export { buildFeed } from "./feed";
export type { FeedItem, FeedResponse, FeedStats } from "./types";
