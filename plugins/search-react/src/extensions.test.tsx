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

import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  wrapInTestApp,
  renderWithEffects,
  TestApiProvider,
  MockAnalyticsApi,
} from '@backstage/test-utils';
import {
  createPlugin,
  BackstagePlugin,
  analyticsApiRef,
} from '@backstage/core-plugin-api';

import {
  SearchResultListItemExtensions,
  createSearchResultListItemExtension,
  SearchResultListItemExtensionOptions,
} from './extensions';
import { ListItem, ListItemText } from '@material-ui/core';

const analyticsApiMock = new MockAnalyticsApi();

const results = [
  {
    type: 'explore',
    document: {
      location: 'search/search-result1',
      title: 'Search Result 1',
      text: 'Some text from the search result 1',
    },
  },
  {
    type: 'techdocs',
    document: {
      location: 'search/search-result2',
      title: 'Search Result 2',
      text: 'Some text from the search result 2',
    },
  },
];

const createExtension = (
  plugin: BackstagePlugin,
  options: Partial<Omit<SearchResultListItemExtensionOptions, 'name'>> = {},
) => {
  const {
    predicate,
    component = props => (
      <ListItem>
        <ListItemText primary="Default" secondary={props.result.title} />
      </ListItem>
    ),
  } = options;
  return plugin.provide(
    createSearchResultListItemExtension({
      predicate,
      component,
      name: 'TestSearchResultItemExtension',
    }),
  );
};

describe('extensions', () => {
  it('renders without exploding', async () => {
    await renderWithEffects(
      wrapInTestApp(
        <TestApiProvider apis={[[analyticsApiRef, analyticsApiMock]]}>
          <SearchResultListItemExtensions results={results} />
        </TestApiProvider>,
      ),
    );

    expect(screen.getByText('Search Result 1')).toBeInTheDocument();
    expect(
      screen.getByText('Some text from the search result 1'),
    ).toBeInTheDocument();

    expect(screen.getByText('Search Result 2')).toBeInTheDocument();
    expect(
      screen.getByText('Some text from the search result 2'),
    ).toBeInTheDocument();
  });

  it('capture results discovery events', async () => {
    await renderWithEffects(
      wrapInTestApp(
        <TestApiProvider apis={[[analyticsApiRef, analyticsApiMock]]}>
          <SearchResultListItemExtensions results={results} />
        </TestApiProvider>,
      ),
    );

    await userEvent.click(
      screen.getByRole('button', { name: /Search Result 1/ }),
    );

    expect(analyticsApiMock.getEvents()[0]).toMatchObject({
      action: 'discover',
      subject: 'Search Result 1',
      context: { routeRef: 'unknown', pluginId: 'root', extension: 'App' },
      attributes: { to: 'search/search-result1' },
    });
  });

  it('use default options for rendering results', async () => {
    const plugin = createPlugin({ id: 'plugin' });
    const DefaultSearchResultListItemExtension = createExtension(plugin);

    await renderWithEffects(
      wrapInTestApp(
        <TestApiProvider apis={[[analyticsApiRef, analyticsApiMock]]}>
          <SearchResultListItemExtensions results={results}>
            <DefaultSearchResultListItemExtension />
          </SearchResultListItemExtensions>
        </TestApiProvider>,
      ),
    );

    expect(screen.getAllByText('Default')).toHaveLength(2);
    expect(screen.getByText('Search Result 1')).toBeInTheDocument();
    expect(screen.getByText('Search Result 2')).toBeInTheDocument();
  });

  it('use custom options for rendering results', async () => {
    const plugin = createPlugin({ id: 'plugin' });
    const DefaultSearchResultListItemExtension = createExtension(plugin);
    const ExploreSearchResultListItemExtension = createExtension(plugin, {
      predicate: result => result.type === 'explore',
      component: props => (
        <ListItem>
          <ListItemText primary="Explore" secondary={props.result.title} />
        </ListItem>
      ),
    });

    await renderWithEffects(
      wrapInTestApp(
        <TestApiProvider apis={[[analyticsApiRef, analyticsApiMock]]}>
          <SearchResultListItemExtensions results={results}>
            <ExploreSearchResultListItemExtension />
            <DefaultSearchResultListItemExtension />
          </SearchResultListItemExtensions>
        </TestApiProvider>,
      ),
    );

    expect(screen.getAllByText('Default')).toHaveLength(1);
    expect(screen.getAllByText('Explore')).toHaveLength(1);
    expect(screen.getByText('Search Result 1')).toBeInTheDocument();
    expect(screen.getByText('Search Result 2')).toBeInTheDocument();
  });
});
