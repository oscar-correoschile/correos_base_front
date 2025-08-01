import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import TextField from "@mui/material/TextField";
import Checkbox from "@mui/material/Checkbox";
import Select from "@mui/material/Select";
import SubmitButton from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";

const { fieldContext, formContext } = createFormHookContexts();

export const { useAppForm } = createFormHook({
  fieldComponents: {
    TextField,
    Checkbox,
    Select,
    MenuItem,
  },
  formComponents: {
    SubmitButton,
  },
  fieldContext,
  formContext,
});
