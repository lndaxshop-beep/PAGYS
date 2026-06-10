import { useResponsive } from '../hooks/useResponsive';

export function useResponsiveValue() {
  const { isMobile, isTablet, isDesktop, breakpoint } = useResponsive();

  const padding = isMobile ? 16 : isTablet ? 24 : 32;
  const cardPadding = isMobile ? 20 : 32;
  const fontSizeHeading = isMobile ? 24 : isTablet ? 28 : 32;
  const fontSizeSubheading = isMobile ? 18 : 20;
  const fontSizeBody = isMobile ? 14 : 15;
  const fontSizeSmall = isMobile ? 12 : 13;
  const cardBorderRadius = isMobile ? 12 : 16;
  const avatarSize = isMobile ? 60 : 80;
  const gridMinWidth = isMobile ? '100%' : isTablet ? '300px' : '350px';

  return {
    isMobile, isTablet, isDesktop, breakpoint,
    padding, cardPadding, fontSizeHeading, fontSizeSubheading,
    fontSizeBody, fontSizeSmall, cardBorderRadius, avatarSize, gridMinWidth,
  };
}

export const rp = (isMobile, mobileVal, desktopVal) =>
  isMobile ? mobileVal : desktopVal;

export const rsp = (isMobile, isTablet, mobileVal, tabletVal, desktopVal) =>
  isMobile ? mobileVal : isTablet ? tabletVal : desktopVal;
