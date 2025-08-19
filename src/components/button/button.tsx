import Button from "@mui/material/Button";
import type { ButtonProps as MuiButtonProps } from "@mui/material/Button";
import CircularProgress from '@mui/material/CircularProgress';
export interface ThemedButtonProps extends MuiButtonProps {
  loading?: boolean;
}
export default function ButtonBase({
  children,
  color = 'primary',
  variant = 'contained',
  loading = false,
  ...rest
}: ThemedButtonProps) {
  return (
    <Button color={color} variant={variant} disabled={loading || rest.disabled} {...rest}>
      {loading ? <CircularProgress size={24} color="inherit" /> : children}
    </Button>
  );
}