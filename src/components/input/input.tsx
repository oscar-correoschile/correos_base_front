'use client';
import * as React from 'react';
import TextField from '@mui/material/TextField';
import type { TextFieldProps } from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import { styled } from '@mui/material/styles';
import { formatNumber } from '@/utils/formatNumber';

export interface CampoTextoProps extends Omit<TextFieldProps, 'error' | 'helperText'> {
  /* value must be a controlled string */
  value: string;
  /* fired on every change */
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;

  /* --- validation rules --- */
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;

  /* UX toggles */
  markSuccess?: boolean; // green border & helperText when valid
  hideErrors?: boolean; // skip red border / message
  variant?: 'standard' | 'filled' | 'outlined';
}

const StyledFormControl = styled(FormControl)(({ theme }) => ({
  width: '100%',
  // success state
  '&.success .MuiOutlinedInput-root': {
    '& fieldset': { borderColor: theme.palette.success.main },
    '&:hover fieldset': { borderColor: theme.palette.success.main },
    '&.Mui-focused fieldset': { borderColor: theme.palette.success.main },
  },
  // error state
  '&.error .MuiOutlinedInput-root fieldset': {
    borderColor: theme.palette.error.main,
  },
}));

export default function Input({
  value,
  onChange,
  min,
  max,
  minLength,
  maxLength,
  markSuccess = false,
  hideErrors = false,
  variant = 'standard',
  ...textFieldProps
}: CampoTextoProps) {
  /* -------- validation -------- */
  const numeric = Number(value.replace(/[.,]/g, ''));
  const isNumeric = !Number.isNaN(numeric);

  let errorMsg = '';
  if (!hideErrors) {
    if (minLength && value.length < minLength) {
      errorMsg = `Mínimo ${minLength} caracteres`;
    } else if (maxLength && value.length > maxLength) {
      errorMsg = `Máximo ${maxLength} caracteres`;
    } else if (min && isNumeric && numeric < min) {
      errorMsg = `El mínimo es ${formatNumber(min.toString())}`;
    } else if (max && isNumeric && numeric > max) {
      errorMsg = `El máximo es ${formatNumber(max.toString())}`;
    }
  }

  const showError = !hideErrors && !!errorMsg;
  const showSuccess = markSuccess && !showError && value !== '';

  return (
    <StyledFormControl className={`${showError ? 'error' : ''} ${showSuccess ? 'success' : ''}`} margin="normal">
      <TextField {...textFieldProps} variant={variant} value={value} onChange={onChange} error={showError} />
      {(showError || showSuccess) && (
        <FormHelperText
          sx={{
            color: showError ? 'error.main' : 'success.main',
            ml: 1,
          }}
        >
          {showError ? errorMsg : showSuccess ? 'Válido' : ''}
        </FormHelperText>
      )}
    </StyledFormControl>
  );
}
