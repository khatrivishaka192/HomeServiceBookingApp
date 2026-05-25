export const BREAKPOINTS = {
  tablet: 768,
  desktop: 1024,
};

export const MAX_CONTENT_WIDTH = 1100;
export const MAX_FORM_WIDTH = 440;

export function getResponsiveValues(width) {
  const isDesktop = width >= BREAKPOINTS.desktop;
  const isTablet = width >= BREAKPOINTS.tablet && !isDesktop;
  const isMobile = width < BREAKPOINTS.tablet;

  const contentWidth = Math.min(width, MAX_CONTENT_WIDTH);
  const paddingHorizontal = isDesktop ? 32 : isTablet ? 24 : 16;
  const paddingTop = isDesktop ? 28 : isTablet ? 40 : 54;

  let categoryColumns = 2;
  if (width >= 1200) categoryColumns = 4;
  else if (width >= BREAKPOINTS.desktop) categoryColumns = 3;
  else if (width >= BREAKPOINTS.tablet) categoryColumns = 3;

  const categoryGap = 12;
  const innerWidth = contentWidth - paddingHorizontal * 2;
  const categoryCardWidth =
    (innerWidth - categoryGap * (categoryColumns - 1)) / categoryColumns;

  const bannerWidth = innerWidth;
  const serviceCardWidth = isDesktop ? 300 : isTablet ? 270 : Math.min(240, width * 0.72);
  const heroHeight = isDesktop ? 280 : isTablet ? 220 : 190;

  return {
    width,
    isDesktop,
    isTablet,
    isMobile,
    contentWidth,
    paddingHorizontal,
    paddingTop,
    categoryColumns,
    categoryGap,
    categoryCardWidth,
    bannerWidth,
    serviceCardWidth,
    heroHeight,
    formMaxWidth: MAX_FORM_WIDTH,
  };
}
