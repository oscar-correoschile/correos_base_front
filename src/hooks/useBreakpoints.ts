import useMediaQuery from '@mui/material/useMediaQuery';

export default function useBreakpoints() {
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery((theme) => theme.breakpoints.down('md'));
  const isDesktop = useMediaQuery((theme) => theme.breakpoints.up('md'));
  const isLargeDesktop = useMediaQuery((theme) => theme.breakpoints.up('lg'));

  return { isTablet, isMobile, isDesktop, isLargeDesktop };
}
