/*
 * Copyright (c) 2021 Anton Bagdatyev (Tonix)
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */

import { lazyMap } from "./lazyMap";
import { DEFAULT_KEY_PROP_NAME } from "../constants";

/**
 * Shortcut function returning a factory function to create a lazy map for a given key property name "keyPropName".
 *
 * Example:
 *
 * ```
 * const mapFactory = lazyMapFactory("item_id");
 *
 * let map = mapFactory([{item_id: 1, prop: "a"}, {item_id: 2, prop: "b"}, {item_id: 3, prop: "c"}]);
 *
 * map.get(1); // {item_id: 1, prop: "a"}
 *
 * map = map.set({item_id: 4, prop: "d"}); // Append
 * //map = map.set({item_id: 4, prop: "d"}, true); // Prepend
 *
 * map.get(4); // {item_id: 4, prop: "d"}
 *
 * map.get(5); // undefined
 *
 * map = map.unset(4);
 * map.get(4); // undefined
 * ```
 *
 * @param {string} keyPropName The key property name to use for the items in the map that will be created by the returned factory function.
 * @return {(initialItems: Array) => ImmutableLinkedOrderedMap} A factory function to create a lazy map for the given property name "keyPropName".
 */
export const lazyMapFactory = (keyPropName = DEFAULT_KEY_PROP_NAME) => (
  initialItems = []
) =>
  lazyMap({
    keyPropName,
    initialItems,
  });
