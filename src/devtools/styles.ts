export const colors = {
  purple: '#a855f7',
  yellow: '#eab308',
  green: '#5DCC67',
  blue: '#3b82f6',
  orange: '#F7A239',
  red: '#FF3B30',
  foreground: 'rgb(36, 36, 36)',
  background: 'rgb(21, 21, 21)',
  border: 'rgb(36, 36, 36)',
  text: 'rgb(153, 153, 153)',
  highlight: 'hsl(0, 0%, 85%)',
};

export const wrapper = {
  fontFamily: "'Source Code Pro', monospace",
  fontSize: 16,
  lineHeight: '24px',
  color: colors.highlight,
};

export const smallWrapper = {
  fontFamily: "'Source Code Pro', monospace",
  fontSize: 12,
  lineHeight: '16px',
};

export const key = {
  marginRight: 5,
  color: colors.text,
  cursor: 'pointer',
  /*
    ":hover": {
      opacity: 0.75
    }
    */
};

export const toolIcon = {
  margin: '0 0.75rem',
};

export const inlineNested = {
  display: 'flex',
  alignItems: 'center',
  cursor: 'pointer',
};

export const bracket = (pointer: boolean) => ({
  display: 'flex',
  alignItems: 'center',
  cursor: pointer ? 'pointer' : 'default',
});

export const stringValue = {
  display: 'flex',
  alignItems: 'center',
  color: colors.orange,
};

export const otherValue = {
  display: 'flex',
  alignItems: 'center',
  color: colors.purple,
};

export const inlineClass = {
  color: colors.purple,
  marginRight: '0.5rem',
};

export const genericValue = {
  display: 'flex',
  alignItems: 'center',
  color: colors.blue,
};

export const nestedChildren = {
  paddingLeft: '1rem',
};

export const keyCount = {
  fontsize: 14,
  color: colors.highlight,
};

export const editValueWrapper = {
  position: 'relative',
};

export const editValuePopup = {
  position: 'absolute',
  width: 400,
  height: 100,
  top: 0,
  left: 0,
  boxShadow: '0px 10px 13px 0px rgba(0,0,0,0.1)',
};

export const newState = {
  fontFamily: 'inherit',
  fontSize: 16,
  border: '2px solid transparent',
  backgroundColor: colors.text,
  color: colors.foreground,
  outline: 'none',
  borderRadius: 3,
  width: '100%',
  height: '100%',
  boxSizing: 'border-box',
};

export const ok = {
  position: 'absolute',
  cursor: 'pointer',
  top: 0,
  right: 0,
  fontSize: 10,
  border: 0,
  outline: 'none',
  padding: '0.25rem 0.5rem',
  opacity: 0.5,
  color: colors.background,
};
