import * as z from "zod";

import Button from "@mui/material/Button";
import { styled } from "@mui/material/styles";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
// import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import FormLabel from "@mui/material/FormLabel";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import { useAppForm } from "@/forms/login";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  queryParameterEntities,
  queryParameterTypes,
} from "@/queries/parameters";

interface createParamDialogInterface {
  open: boolean;
  handleClose: () => void;
}

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialogContent-root": {
    padding: theme.spacing(2),
  },
  "& .MuiDialogActions-root": {
    padding: theme.spacing(1),
  },
}));

const CreateParameterDialog = (props: createParamDialogInterface) => {
  const { open, handleClose } = props;
  const { data: types } = useSuspenseQuery(queryParameterTypes());
  const { data: entities } = useSuspenseQuery(queryParameterEntities());

  const form = useAppForm({
    defaultValues: {
      type: "",
      code: "",
      name: "",
      description: "",
      entity: "",
      isActive: true,
      isVisible: true,
    },
    validators: {
      onChange: z.object({
        type: z.string().min(1, "Tipo de parametro requerido"),
        code: z.string().min(3, "Código requerido"),
        name: z.string().min(1, "Nombre requerido"),
        description: z.string(),
        entity: z.string().min(1, "Entidad requerida"),
        isActive: z.boolean(),
        isVisible: z.boolean(),
      }),
    },
    onSubmit: async ({ value, formApi }) => {
      console.log({ value });
      // await mutation.mutateAsync(value);
      formApi.reset();
    },
  });

  return (
    <BootstrapDialog
      fullWidth={true}
      maxWidth="lg"
      onClose={handleClose}
      aria-labelledby="customized-dialog-title"
      open={open}
    >
      <DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title">
        Modal title
      </DialogTitle>
      <IconButton
        aria-label="close"
        onClick={handleClose}
        sx={(theme) => ({
          position: "absolute",
          right: 8,
          top: 8,
          color: theme.palette.grey[500],
        })}
      >
        <CloseIcon />
      </IconButton>
      <DialogContent dividers>
        <Box
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          noValidate
          sx={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            gap: 2,
          }}
        >
          <FormControl>
            <form.AppField
              name="type"
              children={(field) => (
                <>
                  <FormLabel htmlFor={field.name}>Tipo de Parametro</FormLabel>
                  <field.Select
                    id={field.name}
                    error={field.state.meta?.errors?.length > 0}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    autoComplete={field.name}
                    autoFocus
                    required
                    fullWidth
                    variant="outlined"
                    color={
                      field.state.meta?.errors?.length > 0 ? "error" : "primary"
                    }
                  >
                    {types.map((type) => (
                      <field.MenuItem value={type.value}>
                        {type.name}
                      </field.MenuItem>
                    ))}
                  </field.Select>
                  <FormHelperText>
                    {field.state.meta?.errors
                      ? field.state.meta.errors[0]?.message
                      : ""}
                  </FormHelperText>
                </>
              )}
            />
          </FormControl>
          <FormControl>
            <form.AppField
              name="code"
              children={(field) => (
                <>
                  <FormLabel htmlFor={field.name}>Codigo</FormLabel>
                  <field.TextField
                    id={field.name}
                    error={field.state.meta?.errors?.length > 0}
                    helperText={
                      field.state.meta?.errors
                        ? field.state.meta.errors[0]?.message
                        : ""
                    }
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder=""
                    autoComplete={field.name}
                    autoFocus
                    required
                    fullWidth
                    variant="outlined"
                    color={
                      field.state.meta?.errors?.length > 0 ? "error" : "primary"
                    }
                  />
                </>
              )}
            />
          </FormControl>
          <FormControl>
            <form.AppField
              name="name"
              children={(field) => (
                <>
                  <FormLabel htmlFor={field.name}>Nombre</FormLabel>
                  <field.TextField
                    id={field.name}
                    error={field.state.meta?.errors?.length > 0}
                    helperText={
                      field.state.meta?.errors
                        ? field.state.meta.errors[0]?.message
                        : ""
                    }
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder=""
                    autoComplete={field.name}
                    autoFocus
                    required
                    fullWidth
                    variant="outlined"
                    color={
                      field.state.meta?.errors?.length > 0 ? "error" : "primary"
                    }
                  />
                </>
              )}
            />
          </FormControl>
          <FormControl>
            <form.AppField
              name="description"
              children={(field) => (
                <>
                  <FormLabel htmlFor={field.name}>Descripcion</FormLabel>
                  <field.TextField
                    id={field.name}
                    error={field.state.meta?.errors?.length > 0}
                    helperText={
                      field.state.meta?.errors
                        ? field.state.meta.errors[0]?.message
                        : ""
                    }
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="your@email.com"
                    autoComplete={field.name}
                    autoFocus
                    required
                    fullWidth
                    variant="outlined"
                    color={
                      field.state.meta?.errors?.length > 0 ? "error" : "primary"
                    }
                  />
                </>
              )}
            />
          </FormControl>
          <FormControl>
            <form.AppField
              name="entity"
              children={(field) => (
                <>
                  <FormLabel htmlFor={field.name}>Entidad</FormLabel>
                  <field.Select
                    id={field.name}
                    error={field.state.meta?.errors?.length > 0}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    autoComplete={field.name}
                    autoFocus
                    required
                    fullWidth
                    variant="outlined"
                    color={
                      field.state.meta?.errors?.length > 0 ? "error" : "primary"
                    }
                  >
                    {entities.map((entity) => (
                      <field.MenuItem value={entity.value}>
                        {entity.name}
                      </field.MenuItem>
                    ))}
                  </field.Select>
                  <FormHelperText>
                    {field.state.meta?.errors
                      ? field.state.meta.errors[0]?.message
                      : ""}
                  </FormHelperText>
                </>
              )}
            />
          </FormControl>
          <FormControl>
            <form.AppField
              name="isActive"
              children={(field) => (
                <>
                  <FormLabel htmlFor={field.name}>Activo</FormLabel>
                  <field.Checkbox
                    id={field.name}
                    name={field.name}
                    checked={field.state.value}
                    onChange={(e) => field.handleChange(e.target.checked)}
                  />
                </>
              )}
            />
          </FormControl>
          <FormControl>
            <form.AppField
              name="isVisible"
              children={(field) => (
                <>
                  <FormLabel htmlFor={field.name}>Visible</FormLabel>
                  <field.Checkbox
                    id={field.name}
                    name={field.name}
                    checked={field.state.value}
                    onChange={(e) => field.handleChange(e.target.checked)}
                  />
                </>
              )}
            />
          </FormControl>
          {/* {!mutation.isPending && mutation.isError && (
            <Alert severity="error">Usuario o contraseña invalidos.</Alert>
          )} */}
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <form.SubmitButton
                type="submit"
                fullWidth
                variant="contained"
                disabled={!canSubmit || isSubmitting}
                loading={isSubmitting}
              >
                {isSubmitting ? "Signing in..." : "Sign in"}
              </form.SubmitButton>
            )}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button autoFocus onClick={handleClose}>
          Save changes
        </Button>
      </DialogActions>
    </BootstrapDialog>
  );
};
export default CreateParameterDialog;
