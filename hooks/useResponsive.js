import { Platform, useWindowDimensions } from 'react-native';
import { getResponsiveValues } from '../utils/responsive';

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  return {
    ...getResponsiveValues(width),
    height,
    isWeb: Platform.OS === 'web',
  };
}
