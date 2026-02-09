import React, { useState, useCallback } from 'react';
import { View, Text, useWindowDimensions, TouchableOpacity } from 'react-native';
import { useColorScheme } from 'nativewind';
import { getTodayKey } from '@/utils/date';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const GAP = 2;

function getLevel(score: number): 0 | 1 | 2 | 3 | 4 {
  if (score <= 0) return 0;
  if (score <= 25) return 1;
  if (score <= 50) return 2;
  if (score <= 75) return 3;
  return 4;
}

export interface DayScoreItem {
  dateKey: string;
  score: number;
  /** When true, cell is shown in grey (before any module's tracking start). */
  beforeTrackingStart?: boolean;
}

interface HeatmapGridProps {
  dayScores: DayScoreItem[];
  /** Number of weeks to show (default 12) */
  weeks?: number;
  /** Horizontal layout: 7 rows × weeks columns, uses full width (default false) */
  horizontal?: boolean;
  /** Single row of cells (e.g. 52 weeks or 12 months); dayScores length = number of cells */
  singleRow?: boolean;
  /** When singleRow: lay out in this many rows (e.g. 4 → 4×13 for 52 weeks) for bigger cells */
  gridRows?: number;
  /** When set, cells are tappable and this is called with (dateKey, score) */
  onCellPress?: (dateKey: string, score: number) => void;
}

/**
 * Activity heatmap. Color intensity by daily score (0–100). Uses theme (muted → primary).
 * horizontal: 7 rows (weekdays) × weeks columns. singleRow: one row of dayScores.length cells.
 */
export function HeatmapGrid({
  dayScores,
  weeks = 12,
  horizontal = false,
  singleRow = false,
  gridRows,
  onCellPress,
}: HeatmapGridProps) {
  const { colorScheme } = useColorScheme();
  const { width: windowWidth } = useWindowDimensions();
  const [containerWidth, setContainerWidth] = useState(0);
  const isDark = colorScheme === 'dark';

  const onLayout = useCallback(
    (e: { nativeEvent: { layout: { width: number } } }) => {
      const w = e.nativeEvent.layout.width;
      if (w > 0) setContainerWidth(w);
    },
    []
  );

  const scoreByDate = new Map(dayScores.map((d) => [d.dateKey, d.score]));
  const beforeTrackingByDate = new Map(
    dayScores.map((d) => [d.dateKey, d.beforeTrackingStart === true])
  );
  const todayKey = getTodayKey();

  const greyClass = 'bg-muted';

  const levelColors = isDark
    ? [
        'bg-muted',        // 0
        'bg-primary/25',   // 1
        'bg-primary/50',   // 2
        'bg-primary/75',   // 3
        'bg-primary',     // 4
      ]
    : [
        'bg-muted',
        'bg-primary/20',
        'bg-primary/40',
        'bg-primary/60',
        'bg-primary',
      ];

  if (singleRow && dayScores.length > 0) {
    const count = dayScores.length;
    const rows = gridRows && gridRows > 0 ? gridRows : 1;
    const cols = Math.ceil(count / rows);
    const sidePadding = 18;
    const availableWidth =
      containerWidth > 0
        ? containerWidth - sidePadding * 2
        : windowWidth - 48 - sidePadding * 2;
    const minCellSize = 12;
    const cellSize =
      cols > 0
        ? Math.max(minCellSize, (availableWidth - (cols - 1) * GAP) / cols)
        : minCellSize;
    const rowGap = 2;
    return (
      <View className="w-full" onLayout={onLayout} style={{ paddingHorizontal: sidePadding }}>
        <View style={{ gap: rowGap }}>
          {Array.from({ length: rows }, (_, rowIndex) => {
            const start = rowIndex * cols;
            const slice = dayScores.slice(start, start + cols);
            return (
              <View
                key={rowIndex}
                className="flex-row items-start"
                style={{ gap: GAP }}
              >
                {slice.map(({ dateKey, score, beforeTrackingStart }) => {
                  const grey = beforeTrackingStart ?? beforeTrackingByDate.get(dateKey);
                  const level = grey ? 0 : getLevel(score);
                  const cellStyle = {
                    width: cellSize,
                    height: cellSize,
                    minWidth: cellSize,
                    minHeight: cellSize,
                  };
                  const cellClass = `rounded-sm ${grey ? greyClass : levelColors[level]}`;
                  return onCellPress ? (
                    <TouchableOpacity
                      key={dateKey}
                      onPress={() => onCellPress(dateKey, score)}
                      style={cellStyle}
                      activeOpacity={0.7}
                    >
                      <View style={cellStyle} className={cellClass} />
                    </TouchableOpacity>
                  ) : (
                    <View key={dateKey} style={cellStyle} className={cellClass} />
                  );
                })}
              </View>
            );
          })}
        </View>
        <View className="flex-row items-center gap-2 mt-3">
          <Text className="text-xs text-muted-foreground">Less</Text>
          {[0, 1, 2, 3, 4].map((level) => (
            <View
              key={level}
              style={{ width: Math.min(cellSize, 14), height: Math.min(cellSize, 14) }}
              className={`rounded-sm ${levelColors[level]}`}
            />
          ))}
          <Text className="text-xs text-muted-foreground">More</Text>
        </View>
      </View>
    );
  }

  if (horizontal) {
    // 7 rows (S–S), weeks columns. Leave space on right to match left (label column).
    const labelCol = 10;
    const paddingLeft = 5;
    const paddingRight = 10;
    const availableWidth =
      containerWidth > 0
        ? containerWidth - labelCol - paddingLeft - paddingRight
        : windowWidth - 96 - paddingLeft - paddingRight;
    const totalGaps = (weeks - 1) * GAP;
    const cellSize = Math.max(4, (availableWidth - totalGaps) / weeks);

    const grid: { dateKey: string; score: number }[][] = [];
    const today = new Date();
    const startSunday = new Date(today);
    startSunday.setDate(today.getDate() - today.getDay() - (weeks - 1) * 7);

    for (let row = 0; row < 7; row++) {
      const r: { dateKey: string; score: number }[] = [];
      for (let col = 0; col < weeks; col++) {
        const d = new Date(startSunday);
        d.setDate(startSunday.getDate() + col * 7 + row);
        const dateKey = d.toISOString().split('T')[0];
        const score = scoreByDate.get(dateKey) ?? 0;
        r.push({ dateKey, score });
      }
      grid.push(r);
    }

    return (
      <View className="w-full" onLayout={onLayout} style={{ paddingLeft, paddingRight }}>
        {grid.map((row, rowIndex) => (
          <View
            key={rowIndex}
            className="flex-row items-center mb-0.5"
            style={{ gap: GAP }}
          >
            <View
              style={{
                width: labelCol,
                height: cellSize,
                //alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text className="text-[8px] text-muted-foreground font-medium">
                {DAY_LABELS[rowIndex]}
              </Text>
            </View>
            {row.map(({ dateKey, score }) => {
              const grey = beforeTrackingByDate.get(dateKey);
              const level = grey ? 0 : getLevel(score);
              const isToday = dateKey === todayKey;
              const cellStyle = { width: cellSize, height: cellSize };
              const cellClass = `rounded-sm ${grey ? greyClass : levelColors[level]} ${isToday ? 'border border-primary border-[1.5px]' : ''}`;
              return onCellPress ? (
                <TouchableOpacity
                  key={dateKey}
                  onPress={() => onCellPress(dateKey, score)}
                  style={cellStyle}
                  activeOpacity={0.7}
                >
                  <View style={cellStyle} className={cellClass} />
                </TouchableOpacity>
              ) : (
                <View key={dateKey} style={cellStyle} className={cellClass} />
              );
            })}
          </View>
        ))}
        <View className="flex-row items-center gap-2 mt-3">
          <Text className="text-xs text-muted-foreground">Less</Text>
          {[0, 1, 2, 3, 4].map((level) => (
            <View
              key={level}
              style={{ width: Math.min(cellSize, 14), height: Math.min(cellSize, 14) }}
              className={`rounded-sm ${levelColors[level]}`}
            />
          ))}
          <Text className="text-xs text-muted-foreground">More</Text>
        </View>
      </View>
    );
  }

  // Vertical layout: 7 columns (Sun–Sat), weeks rows. Fixed cell size.
  const CELL_SIZE = 14;
  const totalDays = weeks * 7;
  const grid: { dateKey: string; score: number }[][] = [];
  for (let row = 0; row < weeks; row++) {
    const r: { dateKey: string; score: number }[] = [];
    for (let col = 0; col < 7; col++) {
      const dayIndex = row * 7 + col;
      const d = new Date();
      d.setDate(d.getDate() - (totalDays - 1 - dayIndex));
      const dateKey = d.toISOString().split('T')[0];
      const score = scoreByDate.get(dateKey) ?? 0;
      r.push({ dateKey, score });
    }
    grid.push(r);
  }

  return (
    <View>
      <View className="flex-row gap-1 mb-2">
        {DAY_LABELS.map((label, col) => (
          <View
            key={col}
            style={{ width: CELL_SIZE, alignItems: 'center' }}
          >
            <Text className="text-[10px] text-muted-foreground font-medium">
              {label}
            </Text>
          </View>
        ))}
      </View>
      {grid.map((row, rowIndex) => (
        <View key={rowIndex} className="flex-row gap-0.5 mb-0.5">
          {row.map(({ dateKey, score }, colIndex) => {
            const grey = beforeTrackingByDate.get(dateKey);
            const level = grey ? 0 : getLevel(score);
            const isToday = dateKey === todayKey;
            const cellStyle = { width: CELL_SIZE, height: CELL_SIZE, marginRight: colIndex < 6 ? GAP : 0 };
            const cellClass = `rounded-sm ${grey ? greyClass : levelColors[level]} ${isToday ? 'border border-primary border-[1.5px]' : ''}`;
            return onCellPress ? (
              <TouchableOpacity
                key={dateKey}
                onPress={() => onCellPress(dateKey, score)}
                style={cellStyle}
                activeOpacity={0.7}
              >
                <View style={cellStyle} className={cellClass} />
              </TouchableOpacity>
            ) : (
              <View key={dateKey} style={cellStyle} className={cellClass} />
            );
          })}
        </View>
      ))}
      <View className="flex-row items-center gap-2 mt-3">
        <Text className="text-xs text-muted-foreground">Less</Text>
        {[0, 1, 2, 3, 4].map((level) => (
          <View
            key={level}
            style={{ width: CELL_SIZE, height: CELL_SIZE }}
            className={`rounded-sm ${levelColors[level]}`}
          />
        ))}
        <Text className="text-xs text-muted-foreground">More</Text>
      </View>
    </View>
  );
}
