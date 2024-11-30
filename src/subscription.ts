import {
  OutputSchema as RepoEvent,
  isCommit,
} from './lexicon/types/com/atproto/sync/subscribeRepos';
import { FirehoseSubscriptionBase, getOpsByType } from './util/subscription';

const filters = ['huskers', '#gbr', 'go big red'];
const excludes = [];

export class FirehoseSubscription extends FirehoseSubscriptionBase {
  async handleEvent(evt: RepoEvent) {
    if (!isCommit(evt)) return;

    const ops = await getOpsByType(evt);

    const postsToDelete = ops.posts.deletes.map((del) => del.uri);
    const filteredPosts = ops.posts.creates.filter((create) => {
      const text = create.record.text.toLowerCase();

      return (
        !excludes.some((e) => text.includes(e)) &&
        filters.some((f) => text.includes(f))
      );
    });
    const postsToCreate = filteredPosts.map((create) => {
      return {
        uri: create.uri,
        cid: create.cid,
        indexedAt: new Date().toISOString(),
      };
    });
    filteredPosts.forEach((create) => {
      console.log(create.record.text);
    });

    if (postsToDelete.length > 0) {
      await this.db
        .deleteFrom('post')
        .where('uri', 'in', postsToDelete)
        .execute();
    }
    if (postsToCreate.length > 0) {
      await this.db
        .insertInto('post')
        .values(postsToCreate)
        .onConflict((oc) => oc.doNothing())
        .execute();
    }
  }
}
