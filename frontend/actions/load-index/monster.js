import {assoc, reduce} from "ramda";
import api from "shared/api/monster";
import {inCache, getTotalPages, recommendOffset} from "frontend/helpers/pagination";
import state from "frontend/state";
import fetchIndex from "frontend/actions/fetch-index/monster";

let dataCursor = state.select(api.plural);
let itemsCursor = dataCursor.select("items");

export default function loadIndex() {
  console.debug(api.plural + ".loadIndex()");

  let {filters, sorts, offset, limit, ids} = dataCursor.get();

  if (ids.length) {
    let recommendedOffset = recommendOffset(ids.length, offset, limit);
    if (offset > recommendedOffset) {
      offset = dataCursor.set("offset", recommendedOffset);
      return loadIndex(filters, sorts, offset, limit);
    } else {
      if (inCache(offset, limit, ids.length, ids)) {
        // return cached items
        return Promise.resolve(reduce(
          (memo, id) => assoc(memo, id, itemsCursor.get(id)),
          {}, ids.slice(offset, offset + limit)
        ));
      } else {
        return fetchIndex(filters, sorts, offset, limit);
      }
    }
  } else {
    return fetchIndex(filters, sorts, offset, limit)
      .then(() => {
        let {filters, sorts, offset, limit, ids} = dataCursor.get();

        if (ids.length) {
          let recommendedOffset = recommendOffset(ids.length, offset, limit);
          if (offset > recommendedOffset) {
            offset = dataCursor.set("offset", recommendedOffset);
            return loadIndex(filters, sorts, offset, limit);
          }
        }
        // return fetched items
        return reduce(
          (memo, id) => assoc(memo, id, itemsCursor.get(id)),
          {}, ids.slice(offset, offset + limit)
        );
    });
  }
}
