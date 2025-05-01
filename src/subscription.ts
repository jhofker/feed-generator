import {
  OutputSchema as RepoEvent,
  isCommit,
} from './lexicon/types/com/atproto/sync/subscribeRepos';
import { FirehoseSubscriptionBase, getOpsByType } from './util/subscription';

interface FeedFilter {
  include: string[];
  exclude: string[];
}

const feedFilters: Record<string, FeedFilter> = {
  huskers: {
    include: [
      'huskers',
      '#gbr',
      'go big red',
      'nebrasketball',
      'nebraska volleyball',
      'husker volleyball',
    ],
    exclude: [],
  },
  'ne-politics': {
    include: [
      'nebraska politics',
      'nebraska governor',
      'nebraska legislature',
      'nebraska senator',
      'nebraska representative',
      'nebraska election',
      '#nepol',
      '#neleg',
    ],
    exclude: [],
  },
  lincoln: {
    include: ['#lnk', '#lnkwx'],
    exclude: ['#apt', '#ladynokids'],
  },
};

export class FirehoseSubscription extends FirehoseSubscriptionBase {
  async handleEvent(evt: RepoEvent) {
    if (!isCommit(evt)) return;

    try {
      const ops = await getOpsByType(evt);

      // Process posts for each feed type
      let allPostsToCreate: Array<{
        uri: string;
        cid: string;
        indexedAt: string;
        feed_type: string;
      }> = [];

      for (const [feedType, filters] of Object.entries(feedFilters)) {
        const filteredPosts = ops.posts.creates.filter((create) => {
          try {
            const text = create.record.text.toLowerCase();
            return (
              !filters.exclude.some((e) => text.includes(e.toLowerCase())) &&
              filters.include.some((f) => text.includes(f.toLowerCase()))
            );
          } catch (err) {
            console.error('Error processing post:', err);
            return false;
          }
        });

        const postsToCreate = filteredPosts.map((create) => ({
          uri: create.uri,
          cid: create.cid,
          indexedAt: new Date().toISOString(),
          feed_type: feedType,
        }));

        allPostsToCreate = [...allPostsToCreate, ...postsToCreate];
      }

      // Batch database operations
      if (ops.posts.deletes.length > 0) {
        await this.db
          .deleteFrom('post')
          .where(
            'uri',
            'in',
            ops.posts.deletes.map((del) => del.uri),
          )
          .execute();
      }

      if (allPostsToCreate.length > 0) {
        await this.db
          .insertInto('post')
          .values(allPostsToCreate)
          .onConflict((oc) => oc.doNothing())
          .execute();
      }
    } catch (err) {
      console.error('Error processing event:', err);
      // Don't throw the error, just log it and continue
    }
  }
}
