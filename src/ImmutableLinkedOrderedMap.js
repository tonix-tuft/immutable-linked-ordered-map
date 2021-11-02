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

/*!
 * =========================
 * ImmutableLinkedOrderedMap
 * =========================
 *
 * Copyright (c) 2021 Anton Bagdatyev (Tonix)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * @author Anton Bagdatyev (Tonix) <antonytuft@gmail.com>
 */

/* ======================================================================================================== */

import { lazyObject } from "pigretto";
import { DEFAULT_KEY_PROP_NAME } from "./constants";
import { lazyMapFactory } from "./shortcuts/lazyMapFactory";

/**
 * @type {string}
 */
const MAP_TAG = "ImmutableLinkedOrderedMapEWoFkvQyQsM32wK4a5Kd";

/**
 * @type {string}
 */
const MAP_TAG_VALUE = true;

/**
 * @type {string}
 */
const MULTIWAY_MODE_INITIAL_MAP_TREE_DEPTH_VERSION = "";

/**
 * @type {string}
 */
const MULTIWAY_MODE_MAP_TREE_DEPTH_VERSION_SEPARATOR = "#";

/**
 * @type {Object}
 */
const ImmutableLinkedOrderedMapMode = {
  SINGLE: 1,
  MULTIWAY: 2,
  LIGHTWEIGHT: 3,
};

/**
 * @type {number}
 */
const DEFAULT_MAP_MODE = ImmutableLinkedOrderedMapMode.MULTIWAY;

/* ======================================================================================================== */

/**
 * Factory method to create a new immutable linked ordered map.
 *
 * @param {Array} [initialItems] Initial array of items to add to the map (defaults to an empty array).
 *                               Each item of the map MUST be an object with the following shape:
 *
 *                                   {
 *                                       [keyPropName]: keyPropValue,
 *                                       property: propertyValue,
 *                                       otherProperty: otherPropertyValue,
 *                                       ...
 *                                   }
 *
 *                               Where "[keyPropName]" is the name of the key property of the item.
 *                               In this case the map will map the value "keyPropValue" (the key)
 *                               to the whole item, which will be treated as the value of the map value, e.g.:
 *
 *                                   const map = new ImmutableLinkedOrderedMap({
 *                                       initialItems: [
 *                                           {
 *                                              id: 1, // <--- "[keyPropName] === 'id'"
 *                                              property: "A value",
 *                                              // ...
 *                                           },
 *                                           {
 *                                              id: 2,
 *                                              property: "Another value",
 *                                              // ...
 *                                           },
 *                                           // ...
 *                                       ]
 *                                   })
 *                                   map.get(2) // Will return: { id: 2, property: "Another value" }
 *
 *                               Or an object with a single property with the following shape (useful for primitives):
 *
 *                                   {
 *                                       key: value
 *                                   }
 *
 *                               In this case the map will map the key "key" to the value "value", and "value"
 *                               will be treated as the value of the map for the key "key", e.g.:
 *
 *                                   const map = new ImmutableLinkedOrderedMap({
 *                                       initialItems: [
 *                                           {
 *                                              key1: "abc"
 *                                           },
 *                                           {
 *                                              key2: "def"
 *                                           },
 *                                           // ...
 *                                       ]
 *                                   })
 *                                   map.get("key1") // Will return: "abc"
 *
 *                               Both items' shapes may coexist in the same map if client code is mixing pears with apples.
 *
 *                               Note that if an object with a single property which name is "[keyPropName]" is given,
 *                               then the whole object will be mapped and treated as the map's value, e.g. when "keyPropName === 'id'":
 *
 *                                   const map = new ImmutableLinkedOrderedMap({
 *                                       initialItems: [
 *                                           {
 *                                              id: 123
 *                                           },
 *                                           {
 *                                              id: 456
 *                                           },
 *                                           ...
 *                                       ]
 *                                   })
 *                                   map.get(123) // Will return: { id: 123 }
 *
 *                               The same item format is used for all mutation operations where an item or items may be given as parameters,
 *                               e.g. for "set", "replace", etc... .
 *
 * @param {string} [keyPropName] The name of the key property of an item which value should be used for the key of the map (defaults to "id").
 * @param {number} mode The mode of the map (a value of the enum-like object "ImmutableLinkedOrderedMapMode").
 *                      When the map is single mode ("ImmutableLinkedOrderedMapMode.SINGLE"), it will only allow a single mutation operation
 *                      per linked ordered immutable map instance.
 *                      This mode allows faster lookups as the version tree of the map will consist of only
 *                      one branch and should cover almost all practical use cases.
 *                      E.g.:
 *
 *                          const map = new ImmutableLinkedOrderedMap({
 *                              mode: ImmutableLinkedOrderedMapMode.SINGLE
 *                          })
 *                          const item = { id: 1, value: "A value" }
 *                          const newMap = map.set(item)
 *                          //const anotherNewMapFromMap = map.set({ id: 2, value: "Another value" }) // This line, if uncommented, will throw an error in single mode, as a mutation operation already occurred on "map"!
 *                          const anotherNewMapFromNewMap = newMap.set({ id: 2, value: "Another value" }) // This will work, as a mutation operation did not occur yet on "newMap".
 *                          const yetAnotherMap = newMap.set(item) // This works, because "newMap === yetAnotherMap" as the given item is the same and already existed in "newMap".
 *                          //const thisMapWouldNotWork = newMap.set({ id: 3, value: "Yet another value" }) // This will throw an error in single mode as for "anotherNewMapFromMap".
 *                          // ...
 *
 *                      The version tree of this map in single mode will look like the following:
 *
 *                          map (Initial version)
 *                             \
 *                             newMap/yetAnotherMap (Second version, remember, in this case "newMap === yetAnotherMap")
 *                                \
 *                                anotherNewMapFromNewMap (Third version)
 *
 *                      The other available mode is multiway mode ("ImmutableLinkedOrderedMapMode.MULTIWAY").
 *                      This is the default mode.
 *                      In this mode, multiple mutation operations can occur on the same map, each leading to a different
 *                      branch.
 *                      Lookups may be slower, particularly if a lot of mutation operations have happened,
 *                      as the structural sharing code will need to determine the right branch of the version tree
 *                      given a map which tries to lookup its data for a given key.
 *                      E.g.:
 *
 *                          const map = new ImmutableLinkedOrderedMap() // "ImmutableLinkedOrderedMapMode.MULTIWAY" is the default mode.
 *                          const newMap = map.set({ id: 1, value: "A value" })
 *                          const anotherNewMapFromMap = map.set({ id: 2, value: "Another value" }) // This will work in multiway mode, but not in single mode.
 *                          const anotherNewMapFromNewMap = newMap.set({ id: 2, value: "Another value" })
 *                          // ...
 *
 *                      The version tree of this map in multiway mode will look like the following:
 *
 *                                                                             map (Initial version, root node)
 *                                                                            /   \
 *                                                                           /     newMap (Second version, first branch)
 *                                                                          /        \
 *                          (Third version, second branch) anotherNewMapFromMap       \
 *                                                                                    anotherNewMapFromNewMap (Fourth version, first branch)
 *
 *                      This mode should be used only if client code needs to perform several mutation operations on the same map instance over time.
 *                      Also, a single mode map cannot become a multiway and viceversa.
 *
 *                      The last available mode is lightweight mode ("ImmutableLinkedOrderedMapMode.LIGHTWEIGHT").
 *                      This mode is the most restrictive and does not allow to perform any operation on a map on which a mutation operation
 *                      has occurred (basically once a mutation operation occurs on a map, it becomes useless and only the new map
 *                      could be used further).
 *                      The advantage is that a map in this mode will have the fastest lookups, as in this mode there isn't any version tree.
 *                      E.g.:
 *
 *                          const map = new ImmutableLinkedOrderedMap({
 *                              mode: ImmutableLinkedOrderedMapMode.LIGHTWEIGHT
 *                          })
 *                          const item = { id: 1, value: "A value" }
 *                          const newMap = map.set(item)
 *                          //const anotherNewMapFromMap = map.set({ id: 2, value: "Another value" }) // This line, if uncommented, will throw an error in lightweight mode, as with single mode.
 *                          //const value = map.get(1) // In lightweight mode, even this line will throw an error, as after a mutation operation occurs on a map, it will become useless.
 *                          const valueOfNewMap = newMap.get(1) // This works.
 *                          const anotherNewMapFromNewMap = newMap.unset(1) // This will also work, and from this point on, "newMap" will become useless and a further operation will have to be performed on "anotherNewMapFromNewMap"
 *                          // ...
 *
 *                      Note that the mentioned version tree is only an abstraction, a conceptual idea behind the structural sharing code of the map.
 *                      Internally, the structural sharing code does not create any tree.
 *                      For multiway mode, though, the structural sharing code keeps track of the version of the map in a string
 *                      which is then used to determine if a map is a descendant of another one during lookup operations.
 * @return {ImmutableLinkedOrderedMap} The new immutable linked ordered map.
 */
function newImmutableLinkedOrderedMap({
  initialItems = [],
  keyPropName = DEFAULT_KEY_PROP_NAME,
  mode = DEFAULT_MAP_MODE,
  lazy = false,
} = {}) {
  mode =
    (ImmutableLinkedOrderedMapForMode[mode] && mode) ||
    (mode = DEFAULT_MAP_MODE);
  let map = newMapFromMode(mode);
  hydrateNew.call(map, { keyPropName, mode });
  if (lazy) {
    map = newLazyMap(map, initialItems);
  } else {
    appendInitialItemsToMap(map, initialItems);
  }
  return map;
}

/* ======================================================================================================== */

/**
 * Creates a new map given the mode.
 *
 * @param {number} mode The mode of the map (a property value of the enum-like object "ImmutableLinkedOrderedMapMode").
 * @return {ImmutableLinkedOrderedMap} A new immutable linked ordered map.
 */
function newMapFromMode(mode) {
  const ImmutableLinkedOrderedMapClass =
    ImmutableLinkedOrderedMapForMode[mode].ImmutableLinkedOrderedMapClass;
  return new ImmutableLinkedOrderedMapClass();
}

/* ======================================================================================================== */

/**
 * Defines a getter and optional setter on an object's property.
 *
 * @param {Object} obj An object (may be a prototype).
 * @param {string} propname The property name.
 * @param {Function} getfn Getter function.
 * @param {Function} setfn Setter function.
 * @return {undefined}
 */
function prop(obj, propname, getfn, setfn) {
  const propObj = {};
  propObj[propname] = {
    get: getfn,
    set: setfn,
  };
  Object.defineProperties(obj, propObj);
}

/**
 * Makes a new node (used internally).
 *
 * @param {Object} previous Previous node.
 * @param {Object} next Next node.
 * @param {*} element The element of the node.
 * @return {Object} The node.
 */
function makeNode(previous, next, element) {
  return {
    previous,
    next,
    element,
  };
}

/* ======================================================================================================== */

/**
 * Hydrates a new map when the client code creates it.
 *
 * @param {string} keyPropName Name of the property to use for the keys of the map.
 * @param {number} mode The mode of the map (a property value of the enum-like object "ImmutableLinkedOrderedMapMode").
 * @return {undefined}
 */
function hydrateNew({ keyPropName, mode }) {
  /**
   * Each new map created from client code has a reference to a shared data structure called heap map.
   *
   * Beside the fancy name, it basically stores all the nodes holding the values of the map
   * linked together in order to maintain insertion order and maps all the keys which were ever added
   * to all the maps forked from the original one.
   *
   * The heap map maps keys to depths. Each time a new map is forked from a previous one,
   * the depth of the new forked map increases.
   *
   * For single mode each depth in turn maps directly to the node representing the value
   * of that key for that particular map. This allows quick lookups.
   *
   * For multiway mode each depth additionally maps to a stack which associates map versions for that depth
   * in the order they have been added to the version tree for that depth.
   * It may sound complicated, but basically each version represents a mutation on a map at any given time.
   * Lookups are slower because in this case when calling "map.get('key')", the structural sharing code must
   * determine if the given version in the stack of the heap map for that key and depth is an ancestor
   * of the version of the map on which "get" is called.
   */
  const heapMap = {};
  hydrate.call(this, {
    heapMap,
    depth: 0,
    length: 0,
    keyPropName,
    mode,
  });

  const hydrateMode = ImmutableLinkedOrderedMapForMode[mode].hydrate;
  hydrateMode && hydrateMode.call(this);
}

/**
 * Hydrates a map.
 *
 * @param {Object} heapMap The heap map is an object which maps a key to a linked ordered map
 *                         which in turn maps a depth of the version tree to a stack
 *                         (another linked oredered map used as a stack) of all the maps with that depth
 *                         with the first map being the last created map for that depth.
 * @param {number|undefined} depth The depth of the version tree.
 * @param {number|undefined} length The length of the map.
 * @param {string} keyPropName Name of the property to use for the keys of the map.
 * @param {number} mode The mode of the map (a value of the enum-like object "ImmutableLinkedOrderedMapMode").
 * @param {Object|undefined} head Head of the map.
 * @param {Object|undefined} tail Tail of the map.
 * @return {undefined}
 */
function hydrate({
  heapMap,
  depth,
  length,
  keyPropName,
  mode,
  head,
  tail,
  ancestorMap,
} = {}) {
  prop(this, "heapMap", () => heapMap);
  this.depth = depth || 0;
  this.length = length || 0;
  this.keyPropName = keyPropName;
  prop(this, "mode", () => mode);
  this.head = head || null;
  this.tail = tail || null;
  this.ancestorMap = ancestorMap || null;
  this.shouldNextForEachBreak = false;
  this.forEachNextFn = void 0;
  this.change = null;
  this[MAP_TAG] = MAP_TAG_VALUE;
}

/**
 * Returns a node or undefined if the node is an orphan node.
 *
 * @param {Object|undefined} node
 * @return {*} The node if it is valid and is not an orphan node, or "undefined" otherwise.
 */
function nodeOrUndefined(node) {
  return node && !isOrphanNode(node) ? node : void 0;
}

/**
 * Tests if a node is an orphan node or not.
 *
 * @param {Object} node The node to test.
 * @return {boolean} "true" if the node is orphan, "false" otherwise.
 */
function isOrphanNode(node) {
  return node.isOrphanNode;
}

/**
 * Creates a new lazy map which appends its initial items only when the map is used for the very first time
 * (by calling a method, accessing or setting one of its properties).
 *
 * @param {ImmutableLinkedOrderedMap} map The map.
 * @param {Array} items Array of items to append.
 * @return {ImmutableLinkedOrderedMap} The lazy map.
 */
function newLazyMap(map, initialItems = []) {
  map.length = initialItems.length;
  const lazyMap = lazyObject(map, {
    onceCallback: () => {
      map.length = 0;
      appendInitialItemsToMap(map, initialItems);
    },
  });
  return lazyMap;
}

/**
 * Mutates a map's shared structure (structural sharing) by appending items to the map.
 * This internal function assumes that the given map is empty.
 *
 * @param {ImmutableLinkedOrderedMap} map The map.
 * @param {Array} items Array of items to append.
 * @return {undefined}
 */
function appendInitialItemsToMap(map, items = []) {
  const { mode, keyPropName } = map;

  const keysMap = {};
  const length = items.length;
  if (length) {
    // There's at least one element.
    // Update tail.
    const lastItem = items[length - 1];
    const { key: tailKey, value: tailValue } = keyValueForItem(
      keyPropName,
      lastItem
    );

    // New tail.
    const newTail = ImmutableLinkedOrderedMapForMode[
      mode
    ].makeImmutableLinkedOrderedMapNode(map, null, null, tailKey, tailValue);
    ImmutableLinkedOrderedMapForMode[mode].updateHeapMap(map, newTail);

    // Previous tail.
    const previousTail = map.tail;
    map.tail = newTail;

    // The tail does not change.
    keysMap[tailKey] || (map.length++ && (keysMap[tailKey] = true));

    if (length > 1) {
      // There are at least two items.
      let lastNode = map.tail;

      // Looping on all the nodes below the last one, in reverse order to ignore previous duplicate keys.
      for (let i = length - 2; i >= 0; i--) {
        const item = items[i];
        const { key, value } = keyValueForItem(keyPropName, item);
        if (!keysMap[key]) {
          const node = ImmutableLinkedOrderedMapForMode[
            mode
          ].makeImmutableLinkedOrderedMapNode(map, null, null, key, value);
          ImmutableLinkedOrderedMapForMode[mode].updateHeapMap(map, node);
          ImmutableLinkedOrderedMapForMode[mode].bindNodes(map, node, lastNode);
          lastNode = node;
          map.length++ && (keysMap[key] = true);
        }
      }

      if (map.head === null) {
        map.head = lastNode;
      }
    } else {
      if (previousTail === null) {
        // "newTail" is the first node ever of this map.
        map.head = newTail;
      } else {
        // Only one item, i.e. only the one in "newTail".
        // There was a previous tail, though.
        ImmutableLinkedOrderedMapForMode[mode].bindNodes(
          map,
          previousTail,
          map.tail
        );
      }
    }
  }
}

/**
 * Gets the key and the value of an item.
 *
 * @param {string} keyPropName The name of the key property to use for the items of the map.
 * @param {Object} item An item.
 * @return {Object} An object with a "key" and a "value" property.
 */
function keyValueForItem(keyPropName, item) {
  let key;
  let value;
  if (item) {
    key = item[keyPropName];
    if (typeof key !== "undefined") {
      value = item;
    } else {
      for (const prop in item) {
        key = prop;
        break;
      }
      value = item[key];
    }
  }
  return {
    key,
    value,
  };
}

/**
 * Stores a change on a map.
 *
 * @param {ImmutableLinkedOrderedMap} map The map.
 * @param {string} changeLabel The label identifying the change.
 * @param {*} [payload] The optional payload of the change.
 * @return {undefined}
 */
function mapChange(map, changeLabel, payload = true) {
  map.change = {
    [changeLabel]: payload,
  };
}

/**
 * @type {boolean}
 */
let isFork = false;

/**
 * Forks a new map from an existent one, hydrating it as needed.
 *
 * @param {ImmutableLinkedOrderedMap} map The map from which to fork.
 * @return {ImmutableLinkedOrderedMap} The new forked map instance.
 */
function forkMap(map) {
  isFork = true;
  const newMap = newMapFromMode(map.mode);
  isFork = false;
  hydrate.call(newMap, {
    heapMap: map.heapMap,
    depth: map.depth,
    length: map.length,
    keyPropName: map.keyPropName,
    mode: map.mode,
    head: map.head,
    tail: map.tail,
    ancestorMap: map,
  });
  newMap.depth++;

  const fork = ImmutableLinkedOrderedMapForMode[map.mode].fork;
  fork && fork(map, newMap);
  return newMap;
}

/**
 * Adds an orphan node with "undefined" as a value to the given map for the given key.
 *
 * @param {ImmutableLinkedOrderedMap} map The map.
 * @param {string|number} key The key.
 * @return {undefined}
 */
function addImmutableLinkedOrderedMapOrphanNode(map, key) {
  const newNode = ImmutableLinkedOrderedMapForMode[
    map.mode
  ].makeImmutableLinkedOrderedMapNode(map, null, null, key, void 0);
  newNode.isOrphanNode = true;
  ImmutableLinkedOrderedMapForMode[map.mode].updateHeapMap(map, newNode);
}

/**
 * @type {boolean}
 */
let creatingNew = false;

/**
 * Base class of an immutable linked ordered map.
 *
 * This is the only class exposed to the code of the client using this library.
 * Internally it uses the factory function "newImmutableLinkedOrderedMap"
 * to return the correct subclass given the passed options.
 */
class ImmutableLinkedOrderedMap {
  /**
   * Constructor.
   *
   * @constructor
   *
   * @param {Object} options Options.
   */
  constructor(options) {
    if (isFork) {
      return;
    }
    if (!creatingNew) {
      creatingNew = true;
      const instance = newImmutableLinkedOrderedMap(options);
      return instance;
    } else {
      creatingNew = false;
      return this;
    }
  }

  /**
   * Getter for "Symbol.toStringTag" used for "Object.prototype.toString".
   */
  get [Symbol.toStringTag]() {
    return this.constructor.name;
  }

  /**
   * Sets a value or multiple values and returns a new updated version of this map
   * with the new values set.
   *
   * The same map instance will be returned if for the given item or all the given items
   * the values at their respective keys are the same (using the triple equality operator "===").
   *
   * @param {Object|Array} items An object representing the item to set or an array of items to set (same structure as for the the "initialItems" option
   *                             when creating a new map from scratch).
   * @param {boolean} prependMissing If set to true and the item is not in the map, it will be prepended instead of being appended.
   * @return {ImmutableLinkedOrderedMap} A new immutable linked ordered map or this map if nothing has changed.
   */
  set(items, prependMissing = false) {
    const itemsIsArray = Array.isArray(items);
    if (
      (itemsIsArray &&
        // items is an empty array.
        !items.length) ||
      // items is either a non-empty array or it's not an array.
      // If it's falsy, then return this same map.
      !items
    ) {
      // No valid item/items provided.
      return this;
    } else if (
      // If it's not falsy and is not an array, wrap it in an array.
      !itemsIsArray
    ) {
      items = [items];
    }

    // Initially, assume that all items exist in the map, therefore there isn't a new version yet.
    let map;
    let justForked = false;
    const inserted = [];
    const updated = [];
    const keysMap = {};

    let i = items.length - 1;
    const towards = 0;
    let nodes;
    let appendOperationOldTail;
    let lastPrepend;
    let loopEnd;
    const updateI = () => i--;
    const valid = () => i >= towards;
    const updateNodesBinding = ({ map, newNode, newNext }) => {
      ImmutableLinkedOrderedMapForMode[map.mode].bindNodes(
        map,
        newNode,
        newNext
      );
    };
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    loopEnd = () => {}; // No-op.
    if (!prependMissing) {
      // Append missing.
      let firstPrepend = true;
      nodes = (map, newNode) => {
        // Append.
        let ret;
        if (firstPrepend) {
          // Store old tail before first appending operation.
          firstPrepend = false;
          if (map.tail !== null) {
            appendOperationOldTail = map.tail;
          }
          map.tail = newNode;
          ret = false;
        } else {
          ret = {
            newNext: lastPrepend,
          };
        }
        lastPrepend = newNode;
        return ret;
      };
      loopEnd = () => {
        if (lastPrepend) {
          if (map.head === null) {
            map.head = lastPrepend;
          }
          if (appendOperationOldTail) {
            ImmutableLinkedOrderedMapForMode[map.mode].bindNodes(
              map,
              appendOperationOldTail,
              lastPrepend
            );
          }
        }
      };
    } else {
      // Prepend missing.
      nodes = (map, newNode) => {
        // Prepend.
        const oldHead = map.head;
        map.head = newNode;
        return {
          newNext: oldHead,
        };
      };
    }
    for (; valid(); updateI()) {
      const item = items[i];
      const { key, value } = keyValueForItem(this.keyPropName, item);
      if (keysMap[key]) {
        // Duplicate key, ignore.
        continue;
      }
      keysMap[key] = true;

      const node = ImmutableLinkedOrderedMapForMode[this.mode].lookup(
        this,
        key
      );

      if (!node) {
        // Key is missing, either a new tail or a new head is needed.
        map =
          (map && ((justForked = false) || map)) ||
          ((justForked = true) && forkMap(this));
        const newNode = ImmutableLinkedOrderedMapForMode[
          map.mode
        ].makeImmutableLinkedOrderedMapNode(map, null, null, key, value);
        ImmutableLinkedOrderedMapForMode[map.mode].updateHeapMap(map, newNode);

        if (map.tail === null && prependMissing) {
          // Initially (i.e. for the first element), the tail is the head when we are prepending.
          map.tail = newNode;
          map.head = newNode;
        } else {
          const nodesRet = nodes(map, newNode);
          if (nodesRet) {
            const { newNext } = nodesRet;
            updateNodesBinding({ map, newNode, newNext });
          }
        }

        map.length++;
        inserted.unshift({
          key,
          value,
        });
      } else if (node.element.value !== value) {
        // Existent key, but value is different.
        map =
          (map && (justForked = false)) ||
          map ||
          ((justForked = true) && forkMap(this));

        const previous =
          (!justForked &&
            ImmutableLinkedOrderedMapForMode[map.mode].findMapNodeByDirection(
              map,
              node,
              "previous"
            )) ||
          ImmutableLinkedOrderedMapForMode[map.mode].findMapNodeByDirection(
            this,
            node,
            "previous"
          );

        const next =
          (!justForked &&
            ImmutableLinkedOrderedMapForMode[map.mode].findMapNodeByDirection(
              map,
              node,
              "next"
            )) ||
          ImmutableLinkedOrderedMapForMode[map.mode].findMapNodeByDirection(
            this,
            node,
            "next"
          );

        const newNode = ImmutableLinkedOrderedMapForMode[
          map.mode
        ].makeImmutableLinkedOrderedMapNode(map, null, null, key, value);
        ImmutableLinkedOrderedMapForMode[this.mode].updateHeapMap(map, newNode);

        // Check for head.
        if (previous !== null) {
          // There's a previous node, "node" is not a head.
          ImmutableLinkedOrderedMapForMode[map.mode].bindNodes(
            map,
            previous,
            newNode
          );
        } else {
          // "node" was a head. Update head.
          map.head = newNode;
        }

        // Check for tail.
        if (next !== null) {
          // There's a next node, "node" is not a tail.
          ImmutableLinkedOrderedMapForMode[map.mode].bindNodes(
            map,
            newNode,
            next
          );
        } else if (appendOperationOldTail) {
          // Tail has been updated during the first append operation.
          appendOperationOldTail = newNode;
        } else {
          // "node" was a tail. Update tail.
          map.tail = newNode;
        }

        updated.unshift({
          key,
          value,
        });
      }
    }
    loopEnd();

    if (!map) {
      // Nothing has changed.
      return this;
    } else {
      // Store the change on the new map and return it.
      mapChange(map, "set", {
        inserted,
        updated,
        prependMissing,
      });
      return map;
    }
  }

  /**
   * Replaces an item in the map, optionally appending or prepending it if "oldKey" is missing.
   *
   * The same map instance will be returned if for the given item
   * the value at "oldKey" is the same (using the triple equality operator "===").
   * Beware that in this case, "oldKey" will remain in the map even if the given "item" is the same
   * but was mutated and now has a different key!
   * Also, the same map instance will be returned if "oldKey" is missing and "addMissing" is true
   * and there's already the same item at the key of "item".
   *
   * Note that if the key of "item" is different from "oldKey" and it already exists in the map,
   * then the value of item will replace the underlying value for that same key
   * if the values are different (using the triple equality operator "===")
   * or a new untouched forked map will be returned.
   * This is to prevent duplicate keys in the map.
   *
   * @param {string|number} oldKey The old key to replace.
   * @param {Object} item The item (same structure as for the the "initialItems" option
   *                      when creating a new map from scratch).
   * @param {boolean} addMissing If set to true and "oldKey" is missing, will append the item if missing.
   *                             If the key of the item already exists in the map, the value at that key will be replaced
   *                             if the values are different (using the triple equality operator "===")
   * @param {boolean} prependMissing If set to true with "addMissing" set to true and "oldKey" is missing,
   *                                 will prepend the item, instead of appending it.
   * @return {ImmutableLinkedOrderedMap} A new immutable linked ordered map or this map if nothing has changed.
   */
  replace(oldKey, item, addMissing = false, prependMissing = false) {
    const node = ImmutableLinkedOrderedMapForMode[this.mode].lookup(
      this,
      oldKey
    );
    let map;
    let wasInserted = false;
    let wasUpdated = false;
    let hadExistentNodeForKey = false;
    let key;
    let value;

    if (!node) {
      // The old key does not exist.
      if (addMissing) {
        // Add missing key with new item.
        map = map || forkMap(this);

        // This needs to happen before updating the heap map so that all modes work!
        const existentNodeForKey = ImmutableLinkedOrderedMapForMode[
          this.mode
        ].lookup(this, key);

        const keyValue = keyValueForItem(map.keyPropName, item);
        key = keyValue.key;
        value = keyValue.value;

        const newNode = ImmutableLinkedOrderedMapForMode[
          map.mode
        ].makeImmutableLinkedOrderedMapNode(map, null, null, key, value);
        ImmutableLinkedOrderedMapForMode[map.mode].updateHeapMap(map, newNode);

        if (existentNodeForKey) {
          hadExistentNodeForKey = true;
          if (existentNodeForKey.element.value !== value) {
            if (existentNodeForKey === map.head) {
              map.head = newNode;
            }
            if (existentNodeForKey === map.tail) {
              map.tail = newNode;
            }
            const existentNodeForKeyPrevious = ImmutableLinkedOrderedMapForMode[
              this.mode
            ].findMapNodeByDirection(this, existentNodeForKey, "previous");
            const existentNodeForKeyNext = ImmutableLinkedOrderedMapForMode[
              this.mode
            ].findMapNodeByDirection(this, existentNodeForKey, "next");
            if (existentNodeForKeyPrevious !== null) {
              ImmutableLinkedOrderedMapForMode[map.mode].bindNodes(
                map,
                existentNodeForKeyPrevious,
                newNode
              );
            }
            if (existentNodeForKeyNext !== null) {
              ImmutableLinkedOrderedMapForMode[map.mode].bindNodes(
                map,
                newNode,
                existentNodeForKeyNext
              );
            }
            wasUpdated = true;
          }
        }

        if (!hadExistentNodeForKey) {
          map.length++;
          wasInserted = true;
          if (!prependMissing) {
            // Append new item.
            const newPrevious = map.tail;
            map.tail = newNode;

            if (newPrevious === null) {
              map.head = map.tail;
            } else {
              ImmutableLinkedOrderedMapForMode[map.mode].bindNodes(
                map,
                newPrevious,
                newNode
              );
            }
          } else {
            // Prepend new item.
            const newNext = map.head;
            map.head = newNode;

            if (newNext === null) {
              map.tail = map.head;
            } else {
              ImmutableLinkedOrderedMapForMode[map.mode].bindNodes(
                map,
                newNode,
                newNext
              );
            }
          }
        }
      }
    } else {
      // The old key exists.
      const keyValue = keyValueForItem(this.keyPropName, item);
      key = keyValue.key;
      value = keyValue.value;

      if (node.element.value !== value) {
        // Node already exists, it must be overridden in the new map.
        map = map || forkMap(this);

        const newNode = ImmutableLinkedOrderedMapForMode[
          map.mode
        ].makeImmutableLinkedOrderedMapNode(map, null, null, key, value);

        const previous = ImmutableLinkedOrderedMapForMode[
          this.mode
        ].findMapNodeByDirection(this, node, "previous");
        const next = ImmutableLinkedOrderedMapForMode[
          this.mode
        ].findMapNodeByDirection(this, node, "next");

        if (oldKey + "" !== key + "") {
          // "oldKey" differs from "key".
          addImmutableLinkedOrderedMapOrphanNode(map, oldKey);

          // This needs to happen before updating the heap map so that all modes work!
          const existentNodeForKey = ImmutableLinkedOrderedMapForMode[
            this.mode
          ].lookup(this, key);
          if (existentNodeForKey) {
            hadExistentNodeForKey = true;
            if (existentNodeForKey.element.value !== value) {
              if (existentNodeForKey === map.head) {
                map.head = newNode;
              }
              if (existentNodeForKey === map.tail) {
                map.tail = newNode;
              }
              const existentNodeForKeyPrevious = ImmutableLinkedOrderedMapForMode[
                this.mode
              ].findMapNodeByDirection(this, existentNodeForKey, "previous");
              const existentNodeForKeyNext = ImmutableLinkedOrderedMapForMode[
                this.mode
              ].findMapNodeByDirection(this, existentNodeForKey, "next");
              if (existentNodeForKeyPrevious !== null) {
                if (node !== existentNodeForKeyPrevious) {
                  ImmutableLinkedOrderedMapForMode[map.mode].bindNodes(
                    map,
                    existentNodeForKeyPrevious,
                    newNode
                  );
                } else if (previous !== null) {
                  ImmutableLinkedOrderedMapForMode[map.mode].bindNodes(
                    map,
                    previous,
                    newNode
                  );
                } else {
                  map.head = newNode;
                }
              }
              if (existentNodeForKeyNext !== null) {
                if (node !== existentNodeForKeyNext) {
                  ImmutableLinkedOrderedMapForMode[map.mode].bindNodes(
                    map,
                    newNode,
                    existentNodeForKeyNext
                  );
                } else if (next !== null) {
                  ImmutableLinkedOrderedMapForMode[map.mode].bindNodes(
                    map,
                    newNode,
                    next
                  );
                } else {
                  map.tail = newNode;
                }
              }
            }
            map.length--;
          }
        }

        if (!hadExistentNodeForKey) {
          if (previous === null) {
            // It's a head.
            map.head = newNode;
            if (next === null) {
              // It's also a tail.
              map.tail = newNode;
            } else {
              ImmutableLinkedOrderedMapForMode[map.mode].bindNodes(
                map,
                newNode,
                next
              );
            }
          } else if (next === null) {
            // It's a tail and has a previous node.
            map.tail = newNode;
            ImmutableLinkedOrderedMapForMode[map.mode].bindNodes(
              map,
              previous,
              newNode
            );
          } else {
            // It's a node in between.
            ImmutableLinkedOrderedMapForMode[map.mode].bindNodes(
              map,
              previous,
              newNode
            );
            ImmutableLinkedOrderedMapForMode[map.mode].bindNodes(
              map,
              newNode,
              next
            );
          }
        }

        ImmutableLinkedOrderedMapForMode[map.mode].updateHeapMap(map, newNode);
        wasUpdated = true;
      }
    }

    if (!map) {
      // Nothing has changed.
      return this;
    } else {
      // Store the change on the new map and return it.
      mapChange(map, "replace", {
        oldKey,
        key,
        value,
        wasInserted,
        wasUpdated,
        hadExistentNodeForKey,
        prependMissing,
      });
      return map;
    }
  }

  /**
   * Unsets a value, multiple values or an item by its key and returns a new updated version of this map
   * without those value/values.
   *
   * The same map instance will be returned if the given key or all the keys of the given items or item do not exist.
   *
   * @param {Object|Array|string|number} itemsOrKey An object or an array of objects to unset, or a key to unset.
   * @return {ImmutableLinkedOrderedMap} A new immutable linked ordered map or this map if nothing has changed.
   */
  unset(itemsOrKey) {
    const typeOfItemsOrKey = typeof itemsOrKey;
    if (typeOfItemsOrKey === "number" || typeOfItemsOrKey === "string") {
      return this.unsetKey(itemsOrKey);
    }

    const keyPropName = this.keyPropName;
    if (Array.isArray(itemsOrKey)) {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      let map = this;
      for (const item of itemsOrKey) {
        map = map.unsetKey(item[keyPropName]);
      }
      return map;
    }
    return this.unsetKey(itemsOrKey[keyPropName]);
  }

  /**
   * Unsets an item by its key.
   *
   * The same map instance will be returned if the given key does not exist.
   *
   * @param {string|number} key The key to unset.
   * @return {ImmutableLinkedOrderedMap} A new immutable linked ordered map or this map if nothing has changed.
   */
  unsetKey(key) {
    const node = ImmutableLinkedOrderedMapForMode[this.mode].lookup(this, key);
    let map;
    let value;

    if (node) {
      // Node exists and therefore must be unset in the new map.
      map = map || forkMap(this);
      value = node.element.value;

      // This new node is an orphan one.
      // Lookups to it in the context of this new map will lead to "undefined".
      addImmutableLinkedOrderedMapOrphanNode(map, key);

      const previous = ImmutableLinkedOrderedMapForMode[
        map.mode
      ].findMapNodeByDirection(this, node, "previous");
      const next = ImmutableLinkedOrderedMapForMode[
        map.mode
      ].findMapNodeByDirection(this, node, "next");

      if (previous === null) {
        // It's a head that's being removed.
        if (next === null) {
          // It's also a tail.
          map.head = null;
          map.tail = null;
          map.length = 0;
        } else {
          // It has a next node.
          const newHeadNode = ImmutableLinkedOrderedMapForMode[
            map.mode
          ].makeImmutableLinkedOrderedMapNode(
            map,
            null,
            null,
            next.element.key,
            next.element.value
          );
          ImmutableLinkedOrderedMapForMode[map.mode].updateHeapMap(
            map,
            newHeadNode
          );
          map.head = newHeadNode;
          const nextNext = ImmutableLinkedOrderedMapForMode[
            map.mode
          ].findMapNodeByDirection(this, next, "next");
          if (nextNext === null) {
            // The next node is a tail.
            map.tail = newHeadNode;
          } else {
            ImmutableLinkedOrderedMapForMode[map.mode].bindNodes(
              map,
              newHeadNode,
              nextNext
            );
          }
          map.length--;
        }
      } else if (next === null) {
        // It's a tail that's being removed and it has a previous node.
        const newTailNode = ImmutableLinkedOrderedMapForMode[
          map.mode
        ].makeImmutableLinkedOrderedMapNode(
          map,
          null,
          null,
          previous.element.key,
          previous.element.value
        );
        ImmutableLinkedOrderedMapForMode[map.mode].updateHeapMap(
          map,
          newTailNode
        );
        map.tail = newTailNode;
        const previousPrevious = ImmutableLinkedOrderedMapForMode[
          map.mode
        ].findMapNodeByDirection(this, previous, "previous");
        if (previousPrevious === null) {
          // The previous node is a head.
          map.head = newTailNode;
        } else {
          ImmutableLinkedOrderedMapForMode[map.mode].bindNodes(
            map,
            previousPrevious,
            newTailNode
          );
        }
        map.length--;
      } else {
        // It's a node in between.
        ImmutableLinkedOrderedMapForMode[map.mode].bindNodes(
          map,
          previous,
          next
        );
        map.length--;
      }
    }

    if (!map) {
      // Nothing has changed.
      return this;
    } else {
      mapChange(map, "unset", {
        key,
        value,
      });
      return map;
    }
  }

  /**
   * Empties the map.
   *
   * The same map instance will be returned if the map is already empty.
   *
   * @return {ImmutableLinkedOrderedMap} A new emptied immutable linked ordered map.
   */
  empty() {
    if (this.length <= 0) {
      // The map is already empty. Nothing has changed.
      return this;
    }

    const map = new ImmutableLinkedOrderedMap({
      initialItems: [],
      keyPropName: this.keyPropName,
      mode: this.mode,
    });
    map.length = 0;
    map.depth = this.depth + 1;
    map.ancestorMap = this;
    mapChange(map, "empty");
    return map;
  }

  /**
   * Lookups a value in the map.
   *
   * @param {string|number} key The key to lookup.
   * @return {*} The associated value, or undefined, if the given key is missing.
   */
  get(key) {
    const node = ImmutableLinkedOrderedMapForMode[this.mode].lookup(this, key);
    if (node) {
      return node.element.value;
    }
    return void 0;
  }

  /**
   * Returns a key/value pair of the first item in the map.
   *
   * @return {Object|undefined} An object with the property "key" (the key of the item in the map) and "value"
   *                            (the value of the item in the map).
   *                            If the map is empty, "undefined" will be returned.
   */
  first() {
    if (this.head) {
      return {
        key: this.head.element.key,
        value: this.head.element.value,
      };
    } else {
      return void 0;
    }
  }

  /**
   * Returns a key/value pair of the last item in the map.
   *
   * @return {Object|undefined} An object with the property "key" (the key of the item in the map) and "value"
   *                            (the value of the item in the map).
   *                            If the map is empty, "undefined" will be returned.
   */
  last() {
    if (this.tail) {
      return {
        key: this.tail.element.key,
        value: this.tail.element.value,
      };
    } else {
      return void 0;
    }
  }

  /**
   * Returns a range of key/value pairs before the given key up to a max number of items
   * (counting the given key if included).
   *
   * @param {string|number} key The key to lookup and use for the creation of the range.
   * @param {number} maxNumberOfItems Max number of key/value pairs to return for the range including or not including the item at the given key
   *                                  (depending on the value of the "itemAtKeyIncluded" opton).
   *                                  By default, all items before the given key are included in the returned range of key/value pairs.
   * @param {boolean} itemAtKeyIncluded Whether or not to include the item at the given key in the range (by default the item is included).
   * @return {Array} An array which represents the range, each item being a key/value pair representing an item of the map.
   *                 An empty array if the given key does not exist in the map or the given key does exist in the map but is not included
   *                 in the range and its item is the first of the map.
   *                 An empty array is also returned if "maxNumberOfItems" is less than or equal to 0.
   */
  rangeBefore(key, maxNumberOfItems = Infinity, itemAtKeyIncluded = true) {
    const node = ImmutableLinkedOrderedMapForMode[this.mode].lookup(this, key);
    if (!node || maxNumberOfItems <= 0) {
      return [];
    }

    let current = itemAtKeyIncluded
      ? node
      : ImmutableLinkedOrderedMapForMode[this.mode].findMapNodeByDirection(
          this,
          node,
          "previous"
        );
    if (!current) {
      return [];
    }

    const range = [{ key: current.element.key, value: current.element.value }];
    while (current && range.length < maxNumberOfItems) {
      current = ImmutableLinkedOrderedMapForMode[
        this.mode
      ].findMapNodeByDirection(this, current, "previous");
      if (!current) {
        break;
      }
      range.push({ key: current.element.key, value: current.element.value });
    }
    return range.reverse();
  }

  /**
   * Returns a range of key/value pairs after the given key up to a max number of items
   * (counting the given key if included).
   *
   * @param {string|number} key The key to lookup and use for the creation of the range.
   * @param {number} maxNumberOfItems Max number of key/value pairs to return for the range including or not including the item at the given key
   *                                  (depending on the value of the "itemAtKeyIncluded" opton).
   *                                  By default, all items after the given key are included in the returned range of key/value pairs.
   * @param {boolean} itemAtKeyIncluded Whether or not to include the item at the given key in the range (by default the item is included).
   * @return {Array} An array which represents the range, each item being a key/value pair representing an item of the map.
   *                 An empty array if the given key does not exist in the map or the given key does exist in the map but is not included
   *                 in the range and its item is the last of the map.
   *                 An empty array is also returned if "maxNumberOfItems" is less than or equal to 0.
   */
  rangeAfter(key, maxNumberOfItems = Infinity, itemAtKeyIncluded = true) {
    const node = ImmutableLinkedOrderedMapForMode[this.mode].lookup(this, key);
    if (!node || maxNumberOfItems <= 0) {
      return [];
    }

    let current = itemAtKeyIncluded
      ? node
      : ImmutableLinkedOrderedMapForMode[this.mode].findMapNodeByDirection(
          this,
          node,
          "next"
        );
    if (!current) {
      return [];
    }

    const range = [{ key: current.element.key, value: current.element.value }];
    while (current && range.length < maxNumberOfItems) {
      current = ImmutableLinkedOrderedMapForMode[
        this.mode
      ].findMapNodeByDirection(this, current, "next");
      if (!current) {
        break;
      }
      range.push({ key: current.element.key, value: current.element.value });
    }
    return range;
  }

  /**
   * Tests if the map is empty.
   *
   * @return {boolean} True if the map is empty, false otherwise.
   */
  isEmpty() {
    return this.length <= 0;
  }

  /**
   * Loop through all the values of this immutable linked ordered map in the order they were added.
   *
   * @param {Function} fn A callback function to call for each value stored in the map.
   *                      The callback will receive the value as the first argument, the key as the second argument
   *                      and the index of the item in the map as the third argument.
   * @param {boolean} [reversed] An optional boolean indicating whether to loop in reverse order (starting
   *                             from the tail node). The default is to loop through all the elements starting
   *                             from the head node.
   * @return {undefined}
   */
  forEach(fn, reversed = false) {
    let key;
    let value;
    let current;
    let nextNodeDirection;
    let i;
    let updateI;

    this.shouldNextForEachBreak = false;
    this.forEachNextFn = void 0;

    if (reversed) {
      current = this.tail;
      nextNodeDirection = "previous";
      i = this.length - 1;
      updateI = () => i--;
    } else {
      current = this.head;
      nextNodeDirection = "next";
      i = 0;
      updateI = () => i++;
    }

    while (current) {
      if (!this.shouldNextForEachBreak) {
        const element = current.element;
        key = element.key;
        value = element.value;
        const result = (this.forEachNextFn || fn).call(this, value, key, i);
        if (result === false) {
          // Break instantly.
          break;
        }
        current = ImmutableLinkedOrderedMapForMode[
          this.mode
        ].findMapNodeByDirection(this, current, nextNodeDirection);
        updateI();
      } else {
        break;
      }
    }
  }

  /**
   * Break the next "forEach" loop iteration occurring on this immutable linked ordered map.
   *
   * @return {undefined}
   */
  break() {
    this.shouldNextForEachBreak = true;
  }

  /**
   * Returns an array of values of this map.
   *
   * @param {boolean} [reversed] An optional boolean indicating whether to loop in reverse order (starting
   *                             from the tail node). The default is to loop through all the elements starting
   *                             from the head node.
   *                             If "reversed" is set to "true", the returned values will be in reverse order.
   * @return {Array} An array of all the values of this map, in the order they were added to the map.
   */
  values(reversed = false) {
    const array = new Array(this.length);
    let i = 0;
    this.forEach(function (value) {
      array[i] = value;
      i++;
    }, reversed);
    return array;
  }

  /**
   * Returns an array of keys of this map.
   *
   * @param {boolean} [reversed] An optional boolean indicating whether to loop in reverse order (starting
   *                             from the tail node). The default is to loop through all the elements starting
   *                             from the head node.
   *                             If "reversed" is set to "true", the returned keys will be in reverse order.
   * @return {Array} An array of all the keys of this map, in the order they were added to the map.
   */
  keys(reversed = false) {
    const array = new Array(this.length);
    let i = 0;
    this.forEach(function (value, key) {
      array[i] = key;
      i++;
    }, reversed);
    return array;
  }

  /**
   * Returns an array of key/value pairs for each item in the map.
   *
   * @param {boolean} [reversed] An optional boolean indicating whether to loop in reverse order (starting
   *                             from the tail node). The default is to loop through all the elements starting
   *                             from the head node.
   *                             If "reversed" is set to "true", the returned key/value pairs will be in reverse order.
   * @return {Array} An array of objects where each object has the property "key" (the key of the item in the map)
   *                 and "value" (the value of the item in the map).
   */
  keysValues(reversed = false) {
    const array = new Array(this.length);
    let i = 0;
    this.forEach((value, key) => {
      array[i] = {
        key,
        value,
      };
      i++;
    }, reversed);
    return array;
  }

  /**
   * Map all the values of this immutable linked ordered map in the order they were added
   * to a new array.
   *
   * @param {Function} fn A callback function to call for each value stored in the map.
   *                      The callback will receive the value as the first argument,
   *                      the key as the second argument, and the index of the item in the map as the third argument.
   *                      It's return value will be used as an element of the returned array for that item.
   * @param {boolean} [reversed] An optional boolean indicating whether to loop in reverse order (starting
   *                             from the tail node). The default is to loop through all the elements starting
   *                             from the head node.
   *                             If "reversed" is set to "true", the returned mapped values will be in reverse order.
   * @return {Array} An array with the mapped values.
   */
  map(fn, reversed = false) {
    const array = new Array(this.length);
    let i = 0;
    this.forEach((value, key, index) => {
      array[i] = fn(value, key, index);
      i++;
    }, reversed);
    return array;
  }

  /**
   * Reduce all the values of this immutable linked ordered map to a single output value.
   *
   * @param {Function} fn A callback function to call for each value stored in the map.
   *                      The callback will receive the accumulator as the first argument,
   *                      the current value as the second argument, the current value's key as the third argument
   *                      and the index of the item in the map as the fourth argument.
   *
   *                      It's return value is assigned to the accumulator, whose value is remembered across each iteration
   *                      throughout the map and ultimately becomes the final, single resulting value.
   *
   *                      The first time the callback is called, accumulator and current value can be one of two values.
   *                      If "initialValue" is provided in the call to "reduce()", then accumulator will be equal to "initialValue",
   *                      and the current value will be equal to the first value in the map.
   *                      If no "initialValue" is provided, then the accumulator will be equal to the first or last value in the map
   *                      (if "reversed" is either "false" or "true", respectively), and the current value will be equal to the value of
   *                      the next or previous item (again, if "reversed" is either "false" or "true", respectively).
   * @param {*} initialValue A value to use as the first argument to the first call of the callback.
   *                         If no "initialValue" is supplied, the first element in the map will be used and skipped.
   *                         Calling "reduce()" on an empty map without an initial value will throw a "TypeError".
   * @param {boolean} [reversed] An optional boolean indicating whether to loop in reverse order (starting
   *                             from the tail node). The default is to loop through all the elements starting
   *                             from the head node.
   * @return {*} The single value that results from the reduction.
   */
  reduce(fn, initialValue, reversed = false) {
    const hasInitialValue = arguments.length > 1;
    let acc;
    let skipFirst = false;

    if (!hasInitialValue) {
      if (!this.length) {
        throw new TypeError(
          `ImmutableLinkedOrderedMap type error: Reduce of empty map with no initial value`
        );
      }
      skipFirst = true;
      acc = (reversed ? this.last() : this.first()).value;
    } else {
      acc = initialValue;
    }

    const accFn = (value, key, index) => {
      acc = fn(acc, value, key, index);
    };
    const overridableFn = function (value, key, index) {
      this.forEachNextFn = accFn;
      if (skipFirst) {
        return;
      }
      accFn(value, key, index);
    };
    this.forEach(overridableFn, reversed);

    return acc;
  }

  /**
   * Filters the values of this immutable linked ordered map returning an array with the filtered values.
   *
   * @param {Function} fn A callback function to call for each value stored in the map.
   *                      The callback will receive the value as the first argument,
   *                      the key as the second argument, and the index of the item in the map as the third argument.
   *                      The values for which the callback returned a falsy value will not be added to the returned
   *                      array of filtered items.
   * @param {boolean} [reversed] An optional boolean indicating whether to loop in reverse order (starting
   *                             from the tail node). The default is to loop through all the elements starting
   *                             from the head node.
   *                             If "reversed" is set to "true", the returned filtered values will be in reverse order.
   * @return {Array} An array with the filtered values.
   */
  filter(fn, reversed = false) {
    const array = [];
    let i = 0;
    this.forEach((value, key, index) => {
      const res = fn(value, key, index);
      if (res) {
        array[i] = value;
        i++;
      }
    }, reversed);
    return array;
  }

  /**
   * Tests whether all values in the map pass the test implemented by the provided function.
   *
   * @param {Function} fn A callback function to call for each value stored in the map.
   *                      The callback will receive the value as the first argument, the key as the second argument
   *                      and the index of the item in the map as the third argument.
   *                      If the returned value of the callback for a given value is falsy, this method will instantly return "false".
   * @param {boolean} [reversed] An optional boolean indicating whether to loop in reverse order (starting
   *                             from the tail node). The default is to loop through all the elements starting
   *                             from the head node.
   * @return {boolean} "true" all values in the map pass the test implemented by the provided callback function, "false" otherwise.
   */
  every(fn, reversed = false) {
    let allTrue = true;
    this.forEach((value, key, index) => {
      const res = fn(value, key, index);
      if (!res) {
        allTrue = false;
        return false;
      }
    }, reversed);
    return allTrue;
  }

  /**
   * Tests whether at least one element in the map passes the test implemented by the provided function.
   *
   * @param {Function} fn A callback function to call for each value stored in the map.
   *                      The callback will receive the value as the first argument, the key as the second argument
   *                      and the index of the item in the map as the third argument.
   *                      If the returned value of the callback for a given value is truthy, this method will instantly return "true".
   * @param {boolean} [reversed] An optional boolean indicating whether to loop in reverse order (starting
   *                             from the tail node). The default is to loop through all the elements starting
   *                             from the head node.
   * @return {boolean} "true" if at least one element passes the test implemented by the provided callback function, "false" otherwise.
   */
  some(fn, reversed = false) {
    let ret = false;
    this.forEach((value, key, index) => {
      const res = fn(value, key, index);
      if (res) {
        ret = true;
        return false;
      }
    }, reversed);
    return ret;
  }

  /**
   * Static method to serialize a map to JSON.
   *
   * @param {ImmutableLinkedOrderedMap} map A map.
   * @return {string} The JSON representing the given map.
   */
  static toJSON(map) {
    return JSON.stringify({
      keyPropName: map.keyPropName,
      keysValues: map.keysValues(),
    });
  }

  /**
   * Static method to unserialize a map from its JSON representation.
   *
   * @param {string} json A map JSON representation, previously returned by `ImmutableLinkedOrderedMap.toJSON`.
   * @return {ImmutableLinkedOrderedMap} The unserialized map.
   */
  static fromJSON(json) {
    const parsed = JSON.parse(json);
    const map = lazyMapFactory(parsed.keyPropName)(
      parsed.keysValues.map(({ key, value }) => ({ [key]: value }))
    );
    return map;
  }
}

/* ======================================================================================================== */

/**
 * Binds two nodes of a map in single mode.
 *
 * @param {MultiwayModeImmutableLinkedOrderedMap} map The map.
 * @param {Object} previousNode Previous node.
 * @param {Object} nextNode Next node.
 * @return {undefined}
 */
function bindSingleModeNodes(map, previousNode, nextNode) {
  const { depth } = map;
  previousNode.next.set(depth, nextNode, true);
  nextNode.previous.set(depth, previousNode, true);
}

/**
 * Makes a new node for an immutable linked ordered map in single mode (used internally).
 *
 * @param {ImmutableLinkedOrderedMap} map The map.
 * @param {Object|null} previous Previous node or null if there isn't one.
 * @param {Object|null} next Next node or null if there isn't one.
 * @param {string|number} key The key of the mapped value.
 * @param {*} value The mapped value.
 * @return {Object} The node.
 */
function makeSingleModeImmutableLinkedOrderedMapNode(
  map,
  previous,
  next,
  key,
  value
) {
  const { depth } = map;

  const previousDepthMap = new LinkedOrderedMap();
  previousDepthMap.set(depth, previous);

  const nextDepthMap = new LinkedOrderedMap();
  nextDepthMap.set(depth, next);

  const node = makeNode(previousDepthMap, nextDepthMap, {
    key,
    value,
  });
  return node;
}

/**
 * Finds a previous or next node of a node in the context of an immutable linked ordered map
 * in single mode.
 *
 * @param {SingleModeImmutableLinkedOrderedMap} map The map.
 * @param {Object} fromNode From node.
 * @param {string} nextNodeDirection The direction, either "previous" or "next".
 * @return {Object|null} The previous node if it exists, or null if it doesn't (e.g. when called on a head node).
 */
function findSingleModeMapNodeByDirection(map, fromNode, nextNodeDirection) {
  if (
    (fromNode === map.tail && nextNodeDirection === "next") ||
    (fromNode === map.head && nextNodeDirection === "previous")
  ) {
    return null;
  }

  const { depth } = map;
  const directionMap = fromNode[nextNodeDirection];
  let node = null;
  directionMap.forEach((depthKey, v) => {
    if (depth >= depthKey) {
      node = v;
      return false;
    }
  });
  return node;
}

/**
 * Updates a heap map shared structure (structural sharing) of a map in single mode.
 *
 * @param {SingleModeImmutableLinkedOrderedMap} map The map which shared heap map should be updated.
 * @param {Object} itemNode The linked node of the item.
 * @return {undefined}
 */
function updateSingleModeHeapMap(map, itemNode) {
  const { heapMap, depth } = map;
  const key = itemNode.element.key;

  if (!heapMap[key]) {
    // Depth map.
    heapMap[key] = new LinkedOrderedMap();
  }
  heapMap[key].set(depth, itemNode, true);
}

/**
 * Lookups a node in a single mode map.
 *
 * @param {SingleModeImmutableLinkedOrderedMap} map The map.
 * @param {string|number} key The key to lookup.
 * @return {Object|undefined} The node in the heap map or undefined, if the value for that key is missing.
 */
function lookupSingleMode(map, key) {
  const { heapMap, depth } = map;

  if (!heapMap[key]) {
    return void 0;
  }
  const depthMap = heapMap[key];
  let node;
  depthMap.forEach((depthKey, v) => {
    if (depth >= depthKey) {
      node = v;
      return false;
    }
  });
  return nodeOrUndefined(node);
}

/**
 * Throws an error for a second mutation operation on an immutable linkerd ordered map
 * in single mode.
 *
 * @param {string} operation A string identifying the mutation operation.
 * @return {undefined}
 * @throws {Error}
 */
function throwSingleModemutationOperationOccurredError(operation) {
  throw new Error(
    `ImmutableLinkedOrderedMap error: Mutation operation "${operation}" is not allowed on a map in single mode on which a mutation operation already occurred once.`
  );
}

/**
 * Single mode immutable linked ordered map.
 */
class SingleModeImmutableLinkedOrderedMap extends ImmutableLinkedOrderedMap {
  /**
   * Constructor.
   *
   * @constructor
   *
   * @param {Object} options Options.
   */
  constructor(options) {
    const instance = super(options);

    instance.mutationOperationOccurred = false;
    return instance;
  }

  /**
   * {@inheritdoc}
   */
  set(items, prependMissing = false) {
    this.mutationOperationOccurred &&
      throwSingleModemutationOperationOccurredError("set");
    const map = super.set(items, prependMissing);
    if (this !== map) {
      this.mutationOperationOccurred = true;
    }
    return map;
  }

  /**
   * {@inheritdoc}
   */
  replace(oldKey, item, addMissing = false, prependMissing = false) {
    this.mutationOperationOccurred &&
      throwSingleModemutationOperationOccurredError("replace");
    const map = super.replace(oldKey, item, addMissing, prependMissing);
    if (this !== map) {
      this.mutationOperationOccurred = true;
    }
    return map;
  }

  /**
   * {@inheritdoc}
   */
  unset(key) {
    this.mutationOperationOccurred &&
      throwSingleModemutationOperationOccurredError("unset");
    const map = super.unset(key);
    if (this !== map) {
      this.mutationOperationOccurred = true;
    }
    return map;
  }

  /**
   * {@inheritdoc}
   */
  empty() {
    this.mutationOperationOccurred &&
      throwSingleModemutationOperationOccurredError("empty");
    const map = super.empty();
    if (this !== map) {
      this.mutationOperationOccurred = true;
    }
    return map;
  }
}

/* ======================================================================================================== */

/**
 * Binds two nodes of a map in multiway mode.
 *
 * @param {MultiwayModeImmutableLinkedOrderedMap} map The map.
 * @param {Object} previousNode Previous node.
 * @param {Object} nextNode Next node.
 * @return {undefined}
 */
function bindMultiwayModeNodes(map, previousNode, nextNode) {
  const { depth, version } = map;

  if (!previousNode.next.map[depth]) {
    previousNode.next.set(depth, new LinkedOrderedMap(), true);
  }
  const previousNodeDepthMap = previousNode.next.get(depth);
  previousNodeDepthMap.set(version, nextNode, true);

  if (!nextNode.previous.map[depth]) {
    nextNode.previous.set(depth, new LinkedOrderedMap(), true);
  }
  const nextNodeDepthMap = nextNode.previous.get(depth);
  nextNodeDepthMap.set(version, previousNode, true);
}

/**
 * Makes a new node for an immutable linked ordered map in multiway mode (used internally).
 *
 * @param {ImmutableLinkedOrderedMap} map The map.
 * @param {Object|null} previous Previous node or null if there isn't one.
 * @param {Object|null} next Next node or null if there isn't one.
 * @param {string|number} key The key of the mapped value.
 * @param {*} value The mapped value.
 * @return {Object} The node.
 */
function makeMultiwayModeImmutableLinkedOrderedMapNode(
  map,
  previous,
  next,
  key,
  value
) {
  const { depth, version } = map;

  const previousDepthMap = new LinkedOrderedMap();
  const previousVersionMap = new LinkedOrderedMap();
  previousVersionMap.set(version, previous);
  previousDepthMap.set(depth, previousVersionMap);

  const nextDepthMap = new LinkedOrderedMap();
  const nextVersionMap = new LinkedOrderedMap();
  nextVersionMap.set(version, next);
  nextDepthMap.set(depth, nextVersionMap);

  const node = makeNode(previousDepthMap, nextDepthMap, {
    key,
    value,
  });
  return node;
}

/**
 * Hydrates a map in multiway mode.
 *
 * @param {string} version The version of the map in the context of the version tree,
 *                         used during lookups.
 */
function hydrateMultiwayMode({
  version = MULTIWAY_MODE_INITIAL_MAP_TREE_DEPTH_VERSION,
} = {}) {
  this.version = version;
}

/**
 * Finds a previous or next node of a node in the context of an immutable linked ordered map
 * in multiway mode.
 *
 * @param {MultiwayModeImmutableLinkedOrderedMap} map The map.
 * @param {Object} fromNode From node.
 * @param {string} nextNodeDirection The direction, either "previous" or "next".
 * @return {Object|null} The previous node if it exists, or null if it doesn't (e.g. when called on a head node).
 */
function findMultiwayModeMapNodeByDirection(map, fromNode, nextNodeDirection) {
  if (
    (fromNode === map.tail && nextNodeDirection === "next") ||
    (fromNode === map.head && nextNodeDirection === "previous")
  ) {
    return null;
  }

  const { depth, version } = map;
  const directionMap = fromNode[nextNodeDirection];
  let node = null;
  directionMap.forEach((depthKey, v) => {
    if (depth >= depthKey) {
      v.forEach((stackVersion, possibleNode) => {
        if (isAncestorVersionOfDescendantVersion(stackVersion, version)) {
          node = possibleNode;
          return false;
        }
      });
      if (node) {
        return false;
      }
    }
  });
  return node;
}

/**
 * Updates a heap map shared structure (structural sharing) of a map in multiway mode.
 *
 * @param {MultiwayModeImmutableLinkedOrderedMap} map The map which shared heap map should be updated.
 * @param {Object} itemNode The linked node of the item.
 * @return {undefined}
 */
function updateMultiWayModeHeapMap(map, itemNode) {
  const { heapMap, depth, version } = map;
  const key = itemNode.element.key;

  if (!heapMap[key]) {
    // Depth map.
    heapMap[key] = new LinkedOrderedMap();
  }
  if (!heapMap[key].map[depth]) {
    // This new linked ordered map functions as a stack.
    heapMap[key].set(depth, new LinkedOrderedMap(), true);
  }
  const stack = heapMap[key].get(depth);

  // Always prepend a new version. Indeed, "stack" here (which is a linked ordered map)
  // acts like a stack data structure.
  stack.set(version, itemNode, true);
}

/**
 * Lookups a node in a multiway mode map.
 *
 * @param {MultiwayModeImmutableLinkedOrderedMap} map The map.
 * @param {string|number} key The key to lookup.
 * @return {Object|undefined} The node in the heap map or undefined, if the value for that key is missing.
 */
function lookupMultiwayMode(map, key) {
  const { heapMap, depth, version } = map;

  if (!heapMap[key]) {
    return void 0;
  }
  const depthMap = heapMap[key];
  let node = void 0;
  depthMap.forEach((depthKey, v) => {
    if (depth >= depthKey) {
      v.forEach((stackVersion, possibleNode) => {
        if (isAncestorVersionOfDescendantVersion(stackVersion, version)) {
          node = possibleNode;
          return false;
        }
      });
      if (node) {
        return false;
      }
    }
  });
  return nodeOrUndefined(node);
}

/**
 * Called when a map in multiway mode is forked.
 *
 * @param {ImmutableLinkedOrderedMap} ancestorMap Ancestor map.
 * @param {ImmutableLinkedOrderedMap} forkedMap The forked map.
 * @return {ImmutableLinkedOrderedMap} forkedMap The forked map.
 */
function forkMultiwayModeMap(ancestorMap, forkedMap) {
  forkedMap.version = !ancestorMap.version.length
    ? `${++ancestorMap.childrenCount}${MULTIWAY_MODE_MAP_TREE_DEPTH_VERSION_SEPARATOR}`
    : `${
        ancestorMap.version
      }${++ancestorMap.childrenCount}${MULTIWAY_MODE_MAP_TREE_DEPTH_VERSION_SEPARATOR}`;
  return forkedMap;
}

/**
 * Tests if a version is an ancestor version of a descendant version (used internally for maps in multiway mode).
 *
 * @param {string} possibleAncestorVersion Possible ancestor version.
 * @param {string} descendantVersion Descendant version.
 * @return {boolean} True if the given possible ancestor version is in fact the ancestor version of the given descendant version,
 *                   false otherwise.
 */
function isAncestorVersionOfDescendantVersion(
  possibleAncestorVersion,
  descendantVersion
) {
  return (
    descendantVersion.substring(0, possibleAncestorVersion.length) ===
    possibleAncestorVersion
  );
}

/**
 * Multiway mode immutable linked ordered map.
 */
class MultiwayModeImmutableLinkedOrderedMap extends ImmutableLinkedOrderedMap {
  /**
   * Constructor.
   *
   * @constructor
   *
   * @param {Object} options Options.
   */
  constructor(options) {
    const instance = super(options);

    instance.childrenCount = 0;
    return instance;
  }
}

/* ======================================================================================================== */

/**
 * Binds two nodes of a map in lightweight mode.
 *
 * @param {LightweightModeImmutableLinkedOrderedMap} map The map.
 * @param {Object} previousNode Previous node.
 * @param {Object} nextNode Next node.
 * @return {undefined}
 */
function bindLightweightModeNodes(map, previousNode, nextNode) {
  previousNode.next = nextNode;
  nextNode.previous = previousNode;
}

/**
 * Lookups a node in a lightweight mode map.
 *
 * @param {LightweightModeImmutableLinkedOrderedMap} map The map.
 * @param {string|number} key The key to lookup.
 * @return {Object|undefined} The node in the heap map or undefined, if the value for that key is missing.
 */
function lookupLightweightMode(map, key) {
  const { heapMap } = map;
  const node = heapMap[key];
  return nodeOrUndefined(node);
}

/**
 * Updates a heap map shared structure (structural sharing) of a map in multiway mode.
 *
 * @param {LightweightModeImmutableLinkedOrderedMap} map The map which shared heap map should be updated.
 * @param {Object} itemNode The linked node of the item.
 * @return {undefined}
 */
function updateLightweightModeHeapMap(map, itemNode) {
  const { heapMap } = map;
  const key = itemNode.element.key;
  heapMap[key] = itemNode;
}

/**
 * Finds a previous or next node of a node in the context of an immutable linked ordered map
 * in lightweight mode.
 *
 * @param {LightweightModeImmutableLinkedOrderedMap} map The map.
 * @param {Object} fromNode From node.
 * @param {string} nextNodeDirection The direction, either "previous" or "next".
 * @return {Object|null} The previous node if it exists, or null if it doesn't (e.g. when called on a head node).
 */
function findLightweightModeMapNodeByDirection(
  map,
  fromNode,
  nextNodeDirection
) {
  return fromNode[nextNodeDirection];
}

/**
 * Makes a new node for an immutable linked ordered map in lightweight mode (used internally).
 *
 * @param {ImmutableLinkedOrderedMap} map The map.
 * @param {Object|null} previous Previous node or null if there isn't one.
 * @param {Object|null} next Next node or null if there isn't one.
 * @param {string|number} key The key of the mapped value.
 * @param {*} value The mapped value.
 * @return {Object} The node.
 */
function makeLightweightModeImmutableLinkedOrderedMapNode(
  map,
  previous,
  next,
  key,
  value
) {
  // "map" is not used in this function when we are in lightweight mode.
  const node = makeNode(previous, next, {
    key,
    value,
  });
  return node;
}

/**
 * Throws an error for a second mutation operation on an immutable linkerd ordered map
 * in lightweight mode.
 *
 * @param {string} operation A string identifying the mutation operation.
 * @return {undefined}
 * @throws {Error}
 */
function throwLightweightModeOperationAftermutationOperationOccurredError(
  operation
) {
  throw new Error(
    `ImmutableLinkedOrderedMap error: Operation "${operation}" is not allowed on a map in lightweight mode on which a mutation operation occurred once.`
  );
}

/**
 * Lightweight mode immutable linked ordered map.
 */
class LightweightModeImmutableLinkedOrderedMap extends ImmutableLinkedOrderedMap {
  /**
   * Constructor.
   *
   * @constructor
   *
   * @param {Object} options Options.
   */
  constructor(options) {
    const instance = super(options);

    instance.mutationOperationOccurred = false;
    return instance;
  }

  /**
   * {@inheritdoc}
   */
  set(items, prependMissing = false) {
    this.mutationOperationOccurred &&
      throwLightweightModeOperationAftermutationOperationOccurredError("set");
    const map = super.set(items, prependMissing);
    if (this !== map) {
      this.mutationOperationOccurred = true;
    }
    return map;
  }

  /**
   * {@inheritdoc}
   */
  replace(oldKey, item, addMissing = false, prependMissing = false) {
    this.mutationOperationOccurred &&
      throwLightweightModeOperationAftermutationOperationOccurredError(
        "replace"
      );
    const map = super.replace(oldKey, item, addMissing, prependMissing);
    if (this !== map) {
      this.mutationOperationOccurred = true;
    }
    return map;
  }

  /**
   * {@inheritdoc}
   */
  unset(key) {
    this.mutationOperationOccurred &&
      throwLightweightModeOperationAftermutationOperationOccurredError("unset");
    const map = super.unset(key);
    if (this !== map) {
      this.mutationOperationOccurred = true;
    }
    return map;
  }

  /**
   * {@inheritdoc}
   */
  empty() {
    this.mutationOperationOccurred &&
      throwLightweightModeOperationAftermutationOperationOccurredError("empty");
    const map = super.empty();
    if (this !== map) {
      this.mutationOperationOccurred = true;
    }
    return map;
  }

  /**
   * {@inheritdoc}
   */
  get(key) {
    this.mutationOperationOccurred &&
      throwLightweightModeOperationAftermutationOperationOccurredError("get");
    return super.get(key);
  }

  /**
   * {@inheritdoc}
   */
  first() {
    this.mutationOperationOccurred &&
      throwLightweightModeOperationAftermutationOperationOccurredError("first");
    return super.first();
  }

  /**
   * {@inheritdoc}
   */
  last() {
    this.mutationOperationOccurred &&
      throwLightweightModeOperationAftermutationOperationOccurredError("last");
    return super.last();
  }

  /**
   * {@inheritdoc}
   */
  isEmpty() {
    this.mutationOperationOccurred &&
      throwLightweightModeOperationAftermutationOperationOccurredError(
        "isEmpty"
      );
    return super.isEmpty();
  }

  /**
   * {@inheritdoc}
   */
  forEach(fn, reversed = false) {
    this.mutationOperationOccurred &&
      throwLightweightModeOperationAftermutationOperationOccurredError(
        "forEach"
      );
    return super.forEach(fn, reversed);
  }

  /**
   * {@inheritdoc}
   */
  break() {
    this.mutationOperationOccurred &&
      throwLightweightModeOperationAftermutationOperationOccurredError("break");
    return super.break();
  }

  /**
   * {@inheritdoc}
   */
  values(reversed = false) {
    this.mutationOperationOccurred &&
      throwLightweightModeOperationAftermutationOperationOccurredError(
        "values"
      );
    return super.values(reversed);
  }

  /**
   * {@inheritdoc}
   */
  keys(reversed = false) {
    this.mutationOperationOccurred &&
      throwLightweightModeOperationAftermutationOperationOccurredError("keys");
    return super.keys(reversed);
  }

  /**
   * {@inheritdoc}
   */
  keysValues(reversed = false) {
    this.mutationOperationOccurred &&
      throwLightweightModeOperationAftermutationOperationOccurredError(
        "keysValues"
      );
    return super.keysValues(reversed);
  }

  /**
   * {@inheritdoc}
   */
  map(fn, reversed = false) {
    this.mutationOperationOccurred &&
      throwLightweightModeOperationAftermutationOperationOccurredError("map");
    return super.map(fn, reversed);
  }

  /**
   * {@inheritdoc}
   */
  reduce(fn, initialValue, reversed = false) {
    this.mutationOperationOccurred &&
      throwLightweightModeOperationAftermutationOperationOccurredError(
        "reduce"
      );
    return super.reduce(fn, initialValue, reversed);
  }

  /**
   * {@inheritdoc}
   */
  filter(fn, reversed = false) {
    this.mutationOperationOccurred &&
      throwLightweightModeOperationAftermutationOperationOccurredError(
        "filter"
      );
    return super.filter(fn, reversed);
  }

  /**
   * {@inheritdoc}
   */
  every(fn, reversed = false) {
    this.mutationOperationOccurred &&
      throwLightweightModeOperationAftermutationOperationOccurredError("every");
    return super.every(fn, reversed);
  }

  /**
   * {@inheritdoc}
   */
  some(fn, reversed = false) {
    this.mutationOperationOccurred &&
      throwLightweightModeOperationAftermutationOperationOccurredError("some");
    return super.some(fn, reversed);
  }
}

/* ======================================================================================================== */

/**
 * A mutable linked ordered map (used internally).
 *
 * @constructor
 */
function LinkedOrderedMap() {
  /**
   * @property {Object} map An object used for fast key lookups.
   */
  this.map = {};

  /**
   * @property {LinkedList} keyValueList A list keeping the keys with the corresponding values in the order they were added while
   *                                     adding them to this linked ordered map.
   */
  this.keyValueList = new LinkedList();

  /**
   * @property {Boolean} A boolean indicating whether the next "forEach" loop iteration should break.
   */
  this.shouldNextForEachBreak = false;
}

/**
 * Sets a value correlated with a key. If another value with the same key already exists,
 * it will be overwritten by the new value.
 *
 * @param {string|number} key A key used to lookup the value subsequently.
 * @param {*} value Anything The value to set.
 * @param {boolean} prepend By default, this method appends a new element to the linked list.
 *                          If set to "true", new elements will be prepended.
 * @return {undefined}
 */
LinkedOrderedMap.prototype.set = function (key, value, prepend = false) {
  if (key in this.map) {
    // key already exists, replace value.
    this.map[key].element.value = value;
  } else {
    // Insert new key and value.
    const appendOrPrepend = prepend ? "prepend" : "append";
    const node = this.keyValueList[appendOrPrepend]({ key, value }); // Keys are needed here too if we want to loop through them within a "forEach" loop.
    this.map[key] = node; // The map will reference the node containing the key and the corresponding value.
  }
};

/**
 * Removes an element from the map.
 *
 * @param {string|number} key The key of the element to remove.
 * @return {undefined}
 * @throws {Error} If the given key does not exist.
 */
LinkedOrderedMap.prototype.remove = function (key) {
  if (key in this.map) {
    this.keyValueList.remove(this.map[key]); // Removing the node from the underlying linked list.
    delete this.map[key]; // Removing the key from the underlying map.
  } else {
    throw new Error("key does not exist");
  }
};

/**
 * Empties this map.
 *
 * @return {undefined}
 */
LinkedOrderedMap.prototype.empty = function () {
  this.map = {};
  this.keyValueList = new LinkedList();
  this.shouldNextForEachBreak = false;
};

/**
 * Tests whether this map is empty.
 *
 * @return {boolean} True if empty, false otherwise.
 */
LinkedOrderedMap.prototype.isEmpty = function () {
  return this.getLength() <= 0;
};

/**
 * Retrieves a map value.
 *
 * @param {string|number} key The key.
 * @param {boolean} [returnWholeNode] True to return the whole node of the internal linked list,
 *                                    otherwise, returns just the value.
 * @return {*} The value correlated with the specified key or undefined if no value exists for that key.
 *             If "returnWholeNode" is "true", returns the whole node of the internal linked list.
 */
LinkedOrderedMap.prototype.get = function (key, returnWholeNode = false) {
  return (
    this.map[key] &&
    (returnWholeNode ? this.map[key] : this.map[key].element.value)
  );
};

/**
 * Loop through the elements in the order they were added.
 *
 * @param {Function} f A callback to call for each value stored in the map. The callback will receive the key as the first argument
 *                     and the value as the second argument.
 * @param {boolean} [reversed] An optional boolean indicating whether to loop in reverse order (starting
 *                             from the tail node). The default is to loop through all the elements starting
 *                             from the head node.
 * @return {undefined}
 */
LinkedOrderedMap.prototype.forEach = function (f, reversed = false) {
  let key, value;
  this.shouldNextForEachBreak = false;
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  const thisMap = this;
  this.keyValueList.forEach(function (i, element) {
    if (!this.shouldNextForEachBreak) {
      key = element.key;
      value = element.value;
      const result = f.call(thisMap, key, value);
      if (result === false) {
        return false;
      }
    } else {
      return false;
    }
  }, reversed);
};

/**
 * Break the next "forEach" loop iteration occurring on this linked ordered map.
 *
 * @return {undefined}
 */
LinkedOrderedMap.prototype.break = function () {
  this.shouldNextForEachBreak = true;
};

/**
 * Gets the length of the map, i.e. the number of key value pairs in it.
 *
 * @return {Number} The number of key value pairs stored in this map.
 */
LinkedOrderedMap.prototype.getLength = function () {
  return this.keyValueList.length;
};

/**
 * Returns an array containing the values of this ordered map in the order they were added originally.
 *
 * @return {Array<Anything>} An array containing the values stored in the map.
 */
LinkedOrderedMap.prototype.toArray = function () {
  const array = new Array(this.getLength());
  let i = 0;
  this.forEach(function (key, value) {
    array[i] = value;
    i++;
  });
  return array;
};

/**
 * Returns the keys of this ordered map in the order their corresponding values were added to this map.
 *
 * @return {Array<Number|String>} An array containing the keys of this ordered map.
 */
LinkedOrderedMap.prototype.keys = function () {
  const array = new Array(this.getLength());
  let i = 0;
  this.forEach(function (key) {
    array[i] = key;
    i++;
  });
  return array;
};

/**
 * Static method that creates a new map from an existent array of items.
 * Each item must have a property identified by the "key" parameter.
 *
 * @param {Array} array
 * @param {string|number} key
 * @return {LinkedOrderedMap}
 */
LinkedOrderedMap.fromArray = function (array, key) {
  const map = new LinkedOrderedMap();
  for (let i = 0; i < array.length; i++) {
    const item = array[i];
    map.set(item[key], item);
  }
  return map;
};

/* ======================================================================================================== */

/**
 * A mutable linked list (used internally).
 *
 * @constructor
 */
function LinkedList() {
  /**
   * @property {Object} head The head node of this linked list.
   */
  this.head = null;

  /**
   * @property {Object} tail The tail node of this linked list.
   */
  this.tail = null;

  /**
   * @property {Number} length The length of this linked list
   */
  this.length = 0;

  /**
   * @property {Boolean} shouldNextForEachBreak A boolean indicating whether the next "forEach" loop iteration should break.
   */
  this.shouldNextForEachBreak = false;
}

/**
 * Adds an element to the tail of this linked list. After this method is called,
 * the tail node will reference an object containing the added element.
 *
 * @param {*} anything Anything to add to this linked list.
 * @return {Object} A reference to the new added node object of this linked list.
 */
LinkedList.prototype.append = function (anything) {
  this.length++;

  if (this.head) {
    const oldTail = this.tail;
    this.tail = makeNode(oldTail, null, anything);
    oldTail.next = this.tail;
  } else {
    this.tail = makeNode(null, null, anything);
    this.head = this.tail;
  }
  return this.tail;
};

/**
 * Adds an element to the head of this linked list. After this method is called,
 * the head of this linked list will reference an object containing the added element.
 *
 * @param {*} anything Anything to add to this linked list.
 * @return {Object} A reference to the new added node object of this linked list.
 */
LinkedList.prototype.prepend = function (anything) {
  this.length++;

  if (this.head) {
    const oldHead = this.head;
    this.head = makeNode(null, oldHead, anything);
    oldHead.previous = this.head;
  } else {
    this.tail = makeNode(null, null, anything);
    this.head = this.tail;
  }
  return this.head;
};

/**
 * Removes a node from this linked list.
 *
 * @param {Object} node The node to remove (not the element added, but the object
 *                      "{ next : nextNode, previous : previousNode, element : anything }"
 *                      previously created when adding the element to this linked list.
 * @return {LinkeList} A reference to this linked list.
 */
LinkedList.prototype.remove = function (node) {
  if (node !== null) {
    if (node.previous) {
      node.previous.next = node.next;
      if (node.next) {
        node.next.previous = node.previous;
      } else {
        this.tail = node.previous;
      }
      this.length--;
    } else if (node.next) {
      this.head = node.next;
      this.head.previous = null;
      this.length--;
    } else {
      this.head = null;
      this.tail = null;
      this.length = 0;
    }
    node = null;
  }
};

/**
 * Removes the last element from the list (the element of the tail node) and returns it.
 *
 * @return {*} The element of the tail node of this linked list.
 */
LinkedList.prototype.pop = function () {
  if (this.tail) {
    const element = this.tail.element;
    this.remove(this.tail);
    return element;
  }
};

/**
 * Removes the first element from the list (the element of the tail node) and returns it.
 *
 * @return {*} The element of the head node of this linked list.
 */
LinkedList.prototype.shift = function () {
  if (this.head) {
    const element = this.head.element;
    this.remove(this.head);
    return element;
  }
};

/**
 * Loops on this linked list.
 *
 * @param {Function} fn A function which will be called for each element in this linked list:
 *
 *                          fn(Number i, Anything element)
 *
 *                      The function will receive two parameters:
 *                      - the first parameter will be the index of the element (starting from 0 and incrementing by 1
 *                        if the parameter "reversed" is false, or from the length of this linked list minus 1
 *                        and decrementing by 1 if the parameter "reversed" is true)
 *                      - the second parameter will be the nth element of the list.
 *
 *                      Within the function body, this will point to the linked list instance and "this.break()" can be
 *                      called to stop the next iteration.
 *                      Otherwise, if the function returns false, the loop will stop immediately.
 * @param {boolean} [reversed] An optional boolean indicating whether to loop in reverse order (starting
 *                             from the tail node). The default is to loop through all the elements starting
 *                             from the head node.
 * @return {undefined}
 */
LinkedList.prototype.forEach = function (fn, reversed = false) {
  let current, nextNodeDirection, i, updateIndexFn;
  this.shouldNextForEachBreak = false;
  if (reversed) {
    i = this.length - 1;
    current = this.tail;
    nextNodeDirection = "previous";
    updateIndexFn = function () {
      i--;
    };
  } else {
    i = 0;
    current = this.head;
    nextNodeDirection = "next";
    updateIndexFn = function () {
      i++;
    };
  }

  while (current) {
    if (!this.shouldNextForEachBreak) {
      const element = current.element;
      const result = fn.call(this, i, element);
      if (result === false) {
        break;
      }
      current = current[nextNodeDirection];
      updateIndexFn();
    } else {
      break;
    }
  }
};

/**
 * Breaks the next "forEach" loop iteration occurring on this linked list.
 *
 * @return {undefined}
 */
LinkedList.prototype.break = function () {
  this.shouldNextForEachBreak = true;
};

/* ======================================================================================================== */

/**
 * @type {Object}
 */
const ImmutableLinkedOrderedMapForMode = {
  [ImmutableLinkedOrderedMapMode.SINGLE]: {
    ImmutableLinkedOrderedMapClass: SingleModeImmutableLinkedOrderedMap,
    lookup: lookupSingleMode,
    updateHeapMap: updateSingleModeHeapMap,
    findMapNodeByDirection: findSingleModeMapNodeByDirection,
    makeImmutableLinkedOrderedMapNode: makeSingleModeImmutableLinkedOrderedMapNode,
    bindNodes: bindSingleModeNodes,
  },
  [ImmutableLinkedOrderedMapMode.MULTIWAY]: {
    ImmutableLinkedOrderedMapClass: MultiwayModeImmutableLinkedOrderedMap,
    hydrate: hydrateMultiwayMode,
    lookup: lookupMultiwayMode,
    fork: forkMultiwayModeMap,
    updateHeapMap: updateMultiWayModeHeapMap,
    findMapNodeByDirection: findMultiwayModeMapNodeByDirection,
    makeImmutableLinkedOrderedMapNode: makeMultiwayModeImmutableLinkedOrderedMapNode,
    bindNodes: bindMultiwayModeNodes,
  },
  [ImmutableLinkedOrderedMapMode.LIGHTWEIGHT]: {
    ImmutableLinkedOrderedMapClass: LightweightModeImmutableLinkedOrderedMap,
    lookup: lookupLightweightMode,
    updateHeapMap: updateLightweightModeHeapMap,
    findMapNodeByDirection: findLightweightModeMapNodeByDirection,
    makeImmutableLinkedOrderedMapNode: makeLightweightModeImmutableLinkedOrderedMapNode,
    bindNodes: bindLightweightModeNodes,
  },
};

ImmutableLinkedOrderedMap.MODE = ImmutableLinkedOrderedMapMode;
ImmutableLinkedOrderedMap.isMap = value =>
  !!(value && value[MAP_TAG] === MAP_TAG_VALUE);
export { ImmutableLinkedOrderedMap, ImmutableLinkedOrderedMapMode };
/* ======================================================================================================== */
