import {
  OutputSchema as RepoEvent,
  isCommit,
} from './lexicon/types/com/atproto/sync/subscribeRepos';
import { FirehoseSubscriptionBase, getOpsByType } from './util/subscription';

const feedFilters = {
  huskers: [
    'huskers',
    '#gbr',
    'go big red',
    'nebrasketball',
    'nebraska volleyball',
    'husker volleyball',
  ],
  'ne-politics': [
    'nebraska politics',
    'nebraska governor',
    'nebraska legislature',
    'nebraska senator',
    'nebraska representative',
    'nebraska election',
    'pillen', // Current NE governor
    '#nepol',
    '#neleg',
  ]
};

const excludes = [];

export class FirehoseSubscription extends FirehoseSubscriptionBase {
  async handleEvent(evt: RepoEvent) {
    if (!isCommit(evt)) return;

    const ops = await getOpsByType(evt);

    const postsToDelete = ops.posts.deletes.map((del) => del.uri);
    
    // Process posts for each feed type
    let allPostsToCreate: Array<{
      uri: string;
      cid: string;
      indexedAt: string;
      feed_type: string;
    }> = [];
    
    for (const [feedType, filters] of Object.entries(feedFilters)) {
      const filteredPosts = ops.posts.creates.filter((create) => {
        const text = create.record.text.toLowerCase();
        
        return (
          !excludes.some((e) => text.includes(e)) &&
          filters.some((f) => text.includes(f.toLowerCase()))
        );
      });
      
      const postsToCreate = filteredPosts.map((create) => {
        return {
          uri: create.uri,
          cid: create.cid,
          indexedAt: new Date().toISOString(),
          feed_type: feedType
        };
      });
      
      allPostsToCreate = [...allPostsToCreate, ...postsToCreate];
    }

    if (postsToDelete.length > 0) {
      await this.db
        .deleteFrom('post')
        .where('uri', 'in', postsToDelete)
        .execute();
    }
    
    if (allPostsToCreate.length > 0) {
      await this.db
        .insertInto('post')
        .values(allPostsToCreate)
        .onConflict((oc) => oc.doNothing())
        .execute();
    }
  }
}
