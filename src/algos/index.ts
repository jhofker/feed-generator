import { AppContext } from '../config';
import {
  QueryParams,
  OutputSchema as AlgoOutput,
} from '../lexicon/types/app/bsky/feed/getFeedSkeleton';
import * as huskers from './huskers';
import * as nePolitics from './ne-politics';
import * as lincoln from './lincoln';

type AlgoHandler = (
  ctx: AppContext,
  params: QueryParams,
) => Promise<AlgoOutput>;

const algos: Record<string, AlgoHandler> = {
  [huskers.shortname]: huskers.handler,
  [nePolitics.shortname]: nePolitics.handler,
  [lincoln.shortname]: lincoln.handler,
};

export default algos;
