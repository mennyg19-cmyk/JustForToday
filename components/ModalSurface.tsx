import React from 'react';
import { Modal, View, Pressable, StyleSheet } from 'react-native';
import { useThemeStyle } from '@/lib/ThemeContext';

const overlayOpacity = 0.6;

interface ModalSurfaceProps {
  visible: boolean;
  onRequestClose: () => void;
  children: React.ReactNode;
  /** 'center' | 'bottom' for sheet-style */
  position?: 'center' | 'bottom';
  animationType?: 'fade' | 'slide' | 'none';
  /** Optional extra className for the content container (e.g. max-w-md, rounded-t-3xl) */
  contentClassName?: string;
}

/**
 * Shared modal wrapper that applies theme to the content View so all modals
 * get correct colors (opaque background, visible text, visible borders).
 * Tapping outside the modal content (on the overlay) closes the modal like Cancel.
 */
export function ModalSurface({
  visible,
  onRequestClose,
  children,
  position = 'center',
  animationType = 'fade',
  contentClassName = '',
}: ModalSurfaceProps) {
  const { themeStyle } = useThemeStyle();

  const contentWrapperStyle =
    position === 'bottom'
      ? [styles.contentBase, styles.contentBottom, { maxHeight: '80%' }]
      : [styles.contentBase, styles.contentCenter];

  return (
    <Modal
      visible={visible}
      transparent
      animationType={animationType}
      onRequestClose={onRequestClose}
    >
      <View style={[styles.overlay, position === 'bottom' && styles.overlayBottom]}>
        {/* Backdrop: only this area closes on tap. Content is rendered on top so it gets touches first. */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onRequestClose}
        />
        <View
          style={[
            contentWrapperStyle,
            position === 'bottom' && styles.contentBottomRadius,
          ]}
          pointerEvents="box-none"
        >
          <View
            style={themeStyle as any}
            className={`flex-1 bg-modal-content border-2 border-modal-border rounded-2xl overflow-hidden ${contentClassName}`.trim()}
          >
            {children}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: `rgba(0,0,0,${overlayOpacity})`,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  overlayBottom: {
    justifyContent: 'flex-end',
    padding: 0,
  },
  contentBase: {
    width: '100%',
    maxWidth: 480,
  },
  contentCenter: {
    alignSelf: 'center',
  },
  contentBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    margin: 0,
    paddingHorizontal: 0,
    paddingBottom: 0,
    alignSelf: 'stretch',
    maxWidth: '100%',
  },
  contentBottomRadius: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
});
