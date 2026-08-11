/**********************************************************************
 * Copyright (C) 2023-2026 Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ***********************************************************************/

import type { Component } from 'svelte';

import type { ListOrganizerItem } from '../layouts/ListOrganizer';

/**
 * Options to be used when creating a Column.
 */
export interface ColumnInformation<Type, RenderType = Type> {
  /**
   * Column alignment, one of 'left', 'center', or 'right'.
   *
   * Defaults to 'left' alignment.
   */
  readonly align?: 'left' | 'center' | 'right';

  /**
   * Column width, typically in pixels or fractional units (fr).
   *
   * Defaults to '1fr'.
   */
  readonly width?: string;

  /**
   * Map the source object to another type for rendering. Allows
   * easier reuse and sharing of renderers by converting to simple
   * types (e.g. rendering 'string' instead of 'type.name') or
   * converting to a different type.
   */
  readonly renderMapping?: (object: Type) => RenderType;

  /**
   * Svelte component, renderer for each cell in the column.
   * The component must have a property 'object' that has the
   * same type as the Column.
   */
  readonly renderer?: Component<{ object: RenderType }>;

  /**
   * Set a comparator used to sort the data by the values in this column.
   *
   * @param comparator
   */
  readonly comparator?: (object1: Type, object2: Type) => number;

  /**
   * The 'natural' or initial sort direction. Most columns are
   * naturally sorted in ascending order and do not need to
   * specify this value - e.g. names are sorted alphabetically.
   *
   * Columns that are naturally sorted in descending order -
   * e.g. file sizes or 'number of children' by biggest first -
   * can set this value to change the initial sort direction.
   *
   * Defaults to 'ascending'.
   */
  readonly initialOrder?: 'ascending' | 'descending';

  /**
   * By default, columns are limited to rendering within their
   * own cell to stop long or extraneous content (e.g. long
   * user-provided names) from interfering with other columns.
   * More advanced column renderers that need to render outside
   * of their cells (e.g. with popup menus or tooltips) can use
   * this property to allow this behaviour.
   *
   * Defaults to 'false'.
   */
  readonly overflow?: boolean;

  /**
   * When set, the column is hidden when the table width is below
   * this value (pixels). Takes precedence over automatic responsive hiding.
   */
  readonly hideBelow?: number;

  /**
   * When true, the column is never hidden by responsive width rules.
   * The Actions column is always treated as always-visible.
   */
  readonly alwaysVisible?: boolean;
}

/** Breakpoints (px) for auto-hiding columns from the right, excluding Actions. */
export const TABLE_RESPONSIVE_BREAKPOINTS = [1100, 960, 820, 700] as const;

/** Minimum number of leading columns kept before Actions when auto-hiding. */
export const TABLE_RESPONSIVE_MIN_KEEP = 2;

/**
 * Hide columns from the right as the table narrows; Actions (and leading
 * identity columns) stay visible. Columns with alwaysVisible / hideBelow
 * override the automatic breakpoints.
 */
export function filterColumnsByWidth<Type, RenderType = Type>(
  columns: Column<Type, RenderType>[],
  width: number,
): Column<Type, RenderType>[] {
  if (width <= 0 || columns.length === 0) {
    return columns;
  }

  const actionsIndex = columns.findIndex(column => column.title === 'Actions');
  const beforeActions = actionsIndex >= 0 ? columns.slice(0, actionsIndex) : columns;
  const trailing = actionsIndex >= 0 ? columns.slice(actionsIndex) : [];

  const minKeep = Math.min(TABLE_RESPONSIVE_MIN_KEEP, beforeActions.length);
  const leading = beforeActions.slice(0, minKeep);
  const hideable = beforeActions.slice(minKeep);

  const visibleHideable = hideable.filter((column, index) => {
    if (column.info.alwaysVisible || column.title === 'Actions') {
      return true;
    }
    if (column.info.hideBelow !== undefined) {
      return width >= column.info.hideBelow;
    }
    const fromRight = hideable.length - 1 - index;
    const breakpoint =
      TABLE_RESPONSIVE_BREAKPOINTS[fromRight] ?? TABLE_RESPONSIVE_BREAKPOINTS[TABLE_RESPONSIVE_BREAKPOINTS.length - 1];
    return width >= breakpoint;
  });

  return [...leading, ...visibleHideable, ...trailing];
}

/**
 * A table Column.
 */
export class Column<Type, RenderType = Type> {
  constructor(
    readonly title: string,
    readonly info: ColumnInformation<Type, RenderType>,
  ) {}
}

/**
 * Options to be used when creating a Row.
 */
export interface RowInformation<Type, ChildType> {
  /**
   * Returns true if a row can be selected, and false otherwise.
   */
  readonly selectable?: (object: Type) => boolean;

  /**
   * Tooltip text to show when row selection is disabled.
   */
  readonly disabledText?: string;

  /**
   * Returns an array of child objects of a given row.
   */
  readonly children?: (object: Type) => ChildType[];
}

/**
 * A table row.
 */
export class Row<Type, ChildType = Type> {
  constructor(readonly info: RowInformation<Type, ChildType>) {}
}

export interface TablePersistence {
  load: (kind: string, columnNames: string[]) => Promise<ListOrganizerItem[]>;
  save: (kind: string, items: ListOrganizerItem[]) => Promise<void>;
  reset: (kind: string, columnNames: string[]) => Promise<ListOrganizerItem[]>;
}
