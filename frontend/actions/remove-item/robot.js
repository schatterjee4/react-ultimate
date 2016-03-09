import {indexOf, insert, reject} from "ramda";
import {ALERT} from "shared/constants";
import api from "shared/api/robot";
import {recommendOffset} from "frontend/helpers/pagination";
import state from "frontend/state";
import {indexRouter} from "frontend/router";
import ajax from "frontend/ajax";
import * as alertActions from "frontend/actions/alert";
import fetchIndex from "frontend/actions/fetch-index/robot";

let urlCursor = state.select("url");
let dataCursor = state.select(api.plural);
let itemsCursor = dataCursor.select("items");

// Id -> Promise Robot
export default function removeItem(id) {
  console.debug(api.plural + `.removeItem(${id})`);

  let {items, ids} = dataCursor.get();

  // Optimistic update
  let oldItem = items[id];
  let oldIndex = indexOf(id, ids);

  itemsCursor.unset(id);
  dataCursor.apply("ids", ids => reject(_id => _id == id, ids));

  if (urlCursor.get("route") == api.singular + "-index") {
    setImmediate(() => {
      let {ids, offset, limit} = dataCursor.get();

      let recommendedOffset = recommendOffset(ids.length, offset, limit);
      if (offset > recommendedOffset) {
        indexRouter.transitionTo(undefined, {offset: recommendedOffset});
      }
    });
  }

  return ajax.delete(api.itemUrl.replace(":id", id))
    .then(response => {
      let {filters, sorts, offset, limit, ids} = dataCursor.get();

      if (response.status.startsWith("2")) {
        if (urlCursor.get("route") == api.singular + "-index") {
          if (!ids[offset + limit - 1]) {
            fetchIndex(filters, sorts, offset + limit - 1, 1);
          }
        }
        return oldItem;
      } else {
        itemsCursor.set(id, oldItem);
        if (oldIndex != -1) {
          dataCursor.apply("ids", ids => insert(oldIndex, id, ids));
        }
        alertActions.addItem({message: "Remove Robot failed with message " + response.statusText, category: "error"});
        return undefined;
      }
    });
}
