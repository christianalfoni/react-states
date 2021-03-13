export const colors = {
  purple: '#c5a5c5',
  yellow: '#fac863',
  green: '#5bd85d',
  blue: '#79b6f2',
  red: '#cc0000',
  foreground: 'hsl(206, 57%, 17%)',
  background: 'hsl(206, 57%, 13%)',
  border: 'hsl(206, 57%, 16%)',
  text: 'hsl(0, 0%, 90%)',
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
  color: colors.yellow,
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
