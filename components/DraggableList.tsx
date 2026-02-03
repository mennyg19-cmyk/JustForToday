import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import { GripVertical } from 'lucide-react-native';
import { useIconColors } from '@/lib/iconTheme';

export interface DraggableItem {
  id: string;
  label: string;
  data?: any;
}

interface DraggableListProps {
  items: DraggableItem[];
  onReorder: (newOrder: string[]) => void;
  renderItem: (item: DraggableItem, index: number, isDragging: boolean) => React.ReactNode;
  editMode: boolean;
}

export const DraggableList = React.memo(function DraggableList({
  items,
  onReorder,
  renderItem,
  editMode,
}: DraggableListProps) {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [draggedOverIndex, setDraggedOverIndex] = useState<number | null>(null);
  const iconColors = useIconColors();

  const handleMoveUp = useCallback(
    (index: number) => {
      if (index <= 0) return;
      const newItems = [...items];
      [newItems[index], newItems[index - 1]] = [newItems[index - 1], newItems[index]];
      const newOrder = newItems.map((item) => item.id);
      onReorder(newOrder);
    },
    [items, onReorder]
  );

  const handleMoveDown = useCallback(
    (index: number) => {
      if (index >= items.length - 1) return;
      const newItems = [...items];
      [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
      const newOrder = newItems.map((item) => item.id);
      onReorder(newOrder);
    },
    [items, onReorder]
  );

  const handleDragStart = useCallback((index: number) => {
    setDraggingIndex(index);
  }, []);

  const handleDragEnd = useCallback(() => {
    if (draggingIndex !== null && draggedOverIndex !== null && draggingIndex !== draggedOverIndex) {
      const newItems = [...items];
      const [draggedItem] = newItems.splice(draggingIndex, 1);
      newItems.splice(draggedOverIndex, 0, draggedItem);
      const newOrder = newItems.map((item) => item.id);
      onReorder(newOrder);
    }
    setDraggingIndex(null);
    setDraggedOverIndex(null);
  }, [draggingIndex, draggedOverIndex, items, onReorder]);

  const handleDragOver = useCallback((index: number) => {
    if (draggingIndex !== null) {
      setDraggedOverIndex(index);
    }
  }, [draggingIndex]);

  if (!editMode) {
    return (
      <View className="gap-2">
        {items.map((item, index) => (
          <View key={item.id}>{renderItem(item, index, false)}</View>
        ))}
      </View>
    );
  }

  return (
    <GestureHandlerRootView>
      <ScrollView scrollEnabled={false}>
        <View className="gap-2">
          {items.map((item, index) => (
            <View
              key={item.id}
              className={`flex-row items-center gap-2 bg-card rounded-lg p-3 border ${
                draggingIndex === index
                  ? 'opacity-50 border-primary'
                  : draggedOverIndex === index
                    ? 'border-primary border-2'
                    : 'border-border'
              }`}
            >
              <PanGestureHandler
                onGestureEvent={(event) => {
                  const { translationY } = event.nativeEvent;
                  const itemHeight = 70; // Approximate height
                  const targetIndex = Math.max(
                    0,
                    Math.min(items.length - 1, index + Math.round(translationY / itemHeight))
                  );
                  handleDragOver(targetIndex);
                }}
                onHandlerStateChange={(event) => {
                  if (event.nativeEvent.state === State.BEGAN) {
                    handleDragStart(index);
                  } else if (
                    event.nativeEvent.state === State.END ||
                    event.nativeEvent.state === State.CANCELLED
                  ) {
                    handleDragEnd();
                  }
                }}
              >
                <View className="flex-row items-center gap-2">
                  <GripVertical size={18} color={iconColors.muted} />
                  <View className="flex-row gap-1">
                    <TouchableOpacity
                      onPress={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="px-2 py-1 bg-primary/20 rounded"
                    >
                      <Text className="text-primary text-sm font-bold">↑</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleMoveDown(index)}
                      disabled={index === items.length - 1}
                      className="px-2 py-1 bg-primary/20 rounded"
                    >
                      <Text className="text-primary text-sm font-bold">↓</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </PanGestureHandler>

              <View className="flex-1">{renderItem(item, index, true)}</View>
            </View>
          ))}
        </View>
      </ScrollView>
    </GestureHandlerRootView>
  );
});
