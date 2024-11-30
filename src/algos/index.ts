import { AppContext } from '../config';
import {
  QueryParams,
  OutputSchema as AlgoOutput,
} from '../lexicon/types/app/bsky/feed/getFeedSkeleton';
import * as huskers from './huskers';

type AlgoHandler = (
  ctx: AppContext,
  params: QueryParams,
) => Promise<AlgoOutput>;

const algos: Record<string, AlgoHandler> = {
  [huskers.shortname]: huskers.handler,
};

export default algos;
