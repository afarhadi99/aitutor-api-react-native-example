import { DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6d28d9', // Purple
    accent: '#ec4899',  // Pink
    background: '#f8fafc',
    surface: '#ffffff',
    text: '#1f2937',
    error: '#ef4444',
    disabled: '#9ca3af',
    placeholder: '#6b7280',
    backdrop: 'rgba(0, 0, 0, 0.5)',
  },
  roundness: 10,
};

export const styles = {
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8fafc',
  },
  card: {
    marginVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  button: {
    marginVertical: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  gradient: {
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
    colors: ['#e9d5ff', '#c4b5fd', '#818cf8'],
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
};
