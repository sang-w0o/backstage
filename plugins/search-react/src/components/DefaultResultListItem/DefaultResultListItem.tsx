/*
 * Copyright 2022 The Backstage Authors
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

import React, { ReactNode, useCallback } from 'react';
import { AnalyticsContext, useAnalytics } from '@backstage/core-plugin-api';
import {
  ResultHighlight,
  SearchDocument,
} from '@backstage/plugin-search-common';
import { HighlightedSearchResultText } from '../HighlightedSearchResultText';
import {
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  Divider,
} from '@material-ui/core';
import Typography from '@material-ui/core/Typography';
import { Link } from '@backstage/core-components';

/**
 * Props for {@link DefaultResultListItem}
 *
 * @public
 */
export type DefaultResultListItemProps = {
  icon?: ReactNode;
  secondaryAction?: ReactNode;
  result: SearchDocument;
  highlight?: ResultHighlight;
  rank?: number;
  lineClamp?: number;
  noTrack?: boolean;
};

/**
 * A default result list item.
 *
 * @public
 */
export const DefaultResultListItemComponent = ({
  result,
  highlight,
  rank,
  icon,
  secondaryAction,
  lineClamp = 5,
  noTrack,
}: DefaultResultListItemProps) => {
  const analytics = useAnalytics();

  const handleClick = useCallback(() => {
    if (noTrack) return;
    analytics.captureEvent('discover', result.title, {
      attributes: { to: result.location },
      value: rank,
    });
  }, [rank, result, analytics, noTrack]);

  return (
    <>
      <ListItem alignItems="center">
        {icon && <ListItemIcon>{icon}</ListItemIcon>}
        <ListItemText
          primaryTypographyProps={{ variant: 'h6' }}
          primary={
            <Link noTrack to={result.location} onClick={handleClick}>
              {highlight?.fields.title ? (
                <HighlightedSearchResultText
                  text={highlight?.fields.title || ''}
                  preTag={highlight?.preTag || ''}
                  postTag={highlight?.postTag || ''}
                />
              ) : (
                result.title
              )}
            </Link>
          }
          secondary={
            <Typography
              component="span"
              style={{
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: lineClamp,
                overflow: 'hidden',
              }}
            >
              {highlight?.fields.text ? (
                <HighlightedSearchResultText
                  text={highlight.fields.text}
                  preTag={highlight.preTag}
                  postTag={highlight.postTag}
                />
              ) : (
                result.text
              )}
            </Typography>
          }
        />
        {secondaryAction && <Box alignItems="flex-end">{secondaryAction}</Box>}
      </ListItem>
      <Divider />
    </>
  );
};

/**
 * @public
 */
const HigherOrderDefaultResultListItem = (
  props: DefaultResultListItemProps,
) => {
  return (
    <AnalyticsContext
      attributes={{
        pluginId: 'search',
        extension: 'DefaultResultListItem',
      }}
    >
      <DefaultResultListItemComponent {...props} />
    </AnalyticsContext>
  );
};

export { HigherOrderDefaultResultListItem as DefaultResultListItem };
