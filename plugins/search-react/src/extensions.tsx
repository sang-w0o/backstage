/*
 * Copyright 2023 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, {
  ReactNode,
  createElement,
  isValidElement,
  useCallback,
} from 'react';

import {
  getComponentData,
  useElementFilter,
  createReactExtension,
  useAnalytics,
} from '@backstage/core-plugin-api';
import { SearchResult } from '@backstage/plugin-search-common';

import { DefaultResultListItem } from './components';
import { List, ListProps } from '@material-ui/core';

/**
 * @internal
 * Key for result extensions.
 */
const SEARCH_RESULT_LIST_ITEM_EXTENSION =
  'search.results.list.items.extensions.v1';

/**
 * @internal
 * Returns the first extension element found for a given result, and null otherwise.
 * @param elements - All extension elements.
 * @param result - The search result.
 */
const findSearchResultListItemExtensionElement = (
  elements: ReactNode[],
  result: SearchResult,
) => {
  for (const element of elements) {
    if (!isValidElement(element)) continue;
    const data = getComponentData<
      Pick<SearchResultListItemExtensionOptions, 'predicate' | 'component'>
    >(element, SEARCH_RESULT_LIST_ITEM_EXTENSION);
    if (!data) continue;
    const { predicate, component } = data;
    if (!predicate?.(result)) continue;
    return createElement(component, {
      rank: result.rank,
      highlight: result.highlight,
      result: result.document,
      noTrack: true,
      // Use props over the context in situations where a consumer is manually rendering the extension
      ...element.props,
    });
  }
  return null;
};

/**
 * @public
 * Props for extension options component.
 */
export type SearchResultListItemExtensionOptionsComponentProps<
  Props extends {} = {},
> = Props & {
  rank?: SearchResult['rank'];
  highlight?: SearchResult['highlight'];
  result: SearchResult['document'];
};

/**
 * @public
 * Make default extension options component props optional.
 */
export type SearchResultListItemExtensionComponent<
  Props extends SearchResultListItemExtensionOptionsComponentProps,
> = (
  props: Omit<Props, keyof SearchResultListItemExtensionOptionsComponentProps> &
    Partial<SearchResultListItemExtensionOptionsComponentProps>,
) => JSX.Element | null;

/**
 * @public
 * Options for {@link createSearchResultListItemExtension}.
 */
export type SearchResultListItemExtensionOptions<
  Props extends SearchResultListItemExtensionOptionsComponentProps = SearchResultListItemExtensionOptionsComponentProps,
> = {
  /**
   * The extension name.
   */
  name: string;
  /**
   * The extension component.
   */
  component: (props: Props) => JSX.Element | null;
  /**
   * When an extension defines a predicate, it returns true if the result should be rendered by that extension.
   * Defaults to a predicate that returns true, which means it renders all sorts of results.
   */
  predicate?: (result: SearchResult) => boolean;
};

/**
 * @public
 * Creates a search result item extension.
 * @param options - The extension options, see {@link SearchResultListItemExtensionOptions} for more details.
 */
export const createSearchResultListItemExtension = <
  Props extends SearchResultListItemExtensionOptionsComponentProps,
>(
  options: SearchResultListItemExtensionOptions<Props>,
) => {
  const { name, component, predicate = () => true } = options;

  return createReactExtension<SearchResultListItemExtensionComponent<Props>>({
    name,
    component: {
      sync: () => null,
    },
    data: {
      [SEARCH_RESULT_LIST_ITEM_EXTENSION]: {
        component,
        predicate,
      },
    },
  });
};

/**
 * @public
 * Returns a function that renders a result using extensions.
 */
export const useSearchResultListItemExtensions = (children: ReactNode) => {
  const analytics = useAnalytics();

  const handleClickCapture = useCallback(
    (result: SearchResult) => {
      analytics.captureEvent('discover', result.document.title, {
        attributes: { to: result.document.location },
        value: result.rank,
      });
    },
    [analytics],
  );

  const elements = useElementFilter(
    children,
    collection => {
      return collection
        .selectByComponentData({
          key: SEARCH_RESULT_LIST_ITEM_EXTENSION,
        })
        .getElements();
    },
    [children],
  );

  return useCallback(
    (result: SearchResult, key?: number) => {
      const element = findSearchResultListItemExtensionElement(
        elements,
        result,
      );

      return (
        <div
          key={key}
          role="button"
          tabIndex={0}
          onClickCapture={handleClickCapture.bind(null, result)}
        >
          {element ?? (
            <DefaultResultListItem
              rank={result.rank}
              highlight={result.highlight}
              result={result.document}
              noTrack
            />
          )}
        </div>
      );
    },
    [elements, handleClickCapture],
  );
};

/**
 * @public
 * Props for {@link SearchResultListItemExtensions}
 */
export type SearchResultListItemExtensionsProps = Omit<ListProps, 'results'> & {
  /**
   * Search result list.
   */
  results: SearchResult[];
};

/**
 * @public
 * Render results using search extensions.
 * @param props - see {@link SearchResultListItemExtensionsProps}
 */
export const SearchResultListItemExtensions = (
  props: SearchResultListItemExtensionsProps,
) => {
  const { results, children, ...rest } = props;
  const render = useSearchResultListItemExtensions(children);
  return <List {...rest}>{results.map(render)}</List>;
};
