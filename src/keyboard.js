import { createContext, forwardRef, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Dimensions, Keyboard, Platform, ScrollView, TextInput, View } from 'react-native';

// The app draws edge-to-edge on Android, where the OS no longer shrinks the window for the
// keyboard. So we measure how much of each container the keyboard actually covers and pad by
// exactly that. If the OS *did* resize the window, the overlap comes out as 0, so nothing is doubled.

const SHOW = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
const HIDE = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

export function useKeyboard() {
  const [kb, setKb] = useState({ visible: false, top: 0 });
  useEffect(() => {
    const s = Keyboard.addListener(SHOW, (e) => {
      const h = e.endCoordinates.height;
      const top = e.endCoordinates.screenY || Dimensions.get('screen').height - h;
      setKb({ visible: h > 0, top });
    });
    const hd = Keyboard.addListener(HIDE, () => setKb({ visible: false, top: 0 }));
    return () => {
      s.remove();
      hd.remove();
    };
  }, []);
  return kb;
}

// A flex:1 container that adds bottom padding equal to the part hidden by the keyboard.
export function KeyboardSafeView({ style, children, ...rest }) {
  const ref = useRef(null);
  const kb = useKeyboard();
  const [pad, setPad] = useState(0);

  useEffect(() => {
    if (!kb.visible) {
      setPad(0);
      return;
    }
    const node = ref.current;
    if (!node || !node.measureInWindow) return;
    node.measureInWindow((x, y, w, h) => setPad(Math.max(0, Math.round(y + h - kb.top))));
  }, [kb]);

  return (
    <View ref={ref} style={[{ flex: 1 }, style, { paddingBottom: ((style && style.paddingBottom) || 0) + pad }]} {...rest}>
      {children}
    </View>
  );
}

const ScrollCtx = createContext(null);

// ScrollView that keeps the focused field above the keyboard, including when you move
// from one field to the next while the keyboard stays open.
export const KeyboardScrollView = forwardRef(function KeyboardScrollView({ onScroll, children, ...props }, outerRef) {
  const ref = useRef(null);
  const y = useRef(0);
  const kb = useKeyboard();

  const setRefs = (r) => {
    ref.current = r;
    if (typeof outerRef === 'function') outerRef(r);
    else if (outerRef) outerRef.current = r;
  };

  const ensureVisible = useCallback((input) => {
    const target = input || (TextInput.State.currentlyFocusedInput && TextInput.State.currentlyFocusedInput());
    const sv = ref.current;
    if (!target || !sv || !target.measureInWindow) return;
    const svNode = sv.getNativeScrollRef ? sv.getNativeScrollRef() : sv;
    if (!svNode || !svNode.measureInWindow) return;
    svNode.measureInWindow((sx, sy, sw, sh) => {
      target.measureInWindow((ix, iy, iw, ih) => {
        const margin = 24;
        const visibleBottom = sy + sh;
        if (iy + ih + margin > visibleBottom) {
          sv.scrollTo({ y: y.current + (iy + ih + margin - visibleBottom), animated: true });
        } else if (iy < sy + 8) {
          sv.scrollTo({ y: Math.max(0, y.current - (sy + 8 - iy)), animated: true });
        }
      });
    });
  }, []);

  // When the keyboard appears, wait a moment for padding/layout to settle, then scroll.
  useEffect(() => {
    if (!kb.visible) return;
    const t = setTimeout(() => ensureVisible(), 80);
    return () => clearTimeout(t);
  }, [kb, ensureVisible]);

  return (
    <ScrollCtx.Provider value={ensureVisible}>
      <ScrollView
        ref={setRefs}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        onScroll={(e) => {
          y.current = e.nativeEvent.contentOffset.y;
          if (onScroll) onScroll(e);
        }}
        {...props}
      >
        {children}
      </ScrollView>
    </ScrollCtx.Provider>
  );
});

// Drop-in TextInput that tells the surrounding KeyboardScrollView to reveal it on focus.
export const Input = forwardRef(function Input({ onFocus, ...props }, outerRef) {
  const ensureVisible = useContext(ScrollCtx);
  const ref = useRef(null);
  const setRefs = (r) => {
    ref.current = r;
    if (typeof outerRef === 'function') outerRef(r);
    else if (outerRef) outerRef.current = r;
  };
  return (
    <TextInput
      ref={setRefs}
      onFocus={(e) => {
        if (onFocus) onFocus(e);
        // Delay so the keyboard (and any padding) is in place before measuring.
        if (ensureVisible) setTimeout(() => ensureVisible(ref.current), 320);
      }}
      {...props}
    />
  );
});
