import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { createFileRoute } from "@tanstack/react-router";
import {
  MaterialReactTable,
  MRT_EditActionButtons,
  useMaterialReactTable,
  type MRT_ColumnDef,
  type MRT_PaginationState,
  type MRT_Row,
} from "material-react-table";
import Checkbox from "@mui/material/Checkbox";
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Tooltip,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import { type ParameterInterface } from "@/interfaces/parameters.interface";
import {
  queryParameterEntities,
  queryParameters,
  queryParameterTypes,
} from "@/queries/parameters";
import { useSuspenseQuery } from "@tanstack/react-query";
import CreateParameterDialog from "@/components/parameters/createParameter";
import EditParameterDialog from "@/components/parameters/editParameter";

export const Route = createFileRoute("/parametros/")({
  component: RouteComponent,
  loader: ({ context: { queryClient } }) => {
    queryClient.prefetchQuery(queryParameterTypes());
    queryClient.prefetchQuery(queryParameterEntities());
  },
});

function RouteComponent() {
  const {
    data: { data: paramsData, meta },
    isLoading,
    isError,
    isRefetching,
  } = useSuspenseQuery(queryParameters());

  const [pagination, setPagination] = useState<MRT_PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const [openCreateParam, setOpenCreateParam] = useState(false);
  const [openEditParam, setOpenEditParam] = useState(false);
  const [selectedRow, setSelectedRow] =
    useState<MRT_Row<ParameterInterface> | null>(null);

  // useEffect(() => {
  //   if (isSuccess) {
  //     setRowCount(meta.total);
  //   }
  // }, [isLoading]);

  const openDeleteConfirmModal = (row: MRT_Row<ParameterInterface>) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      // deleteUser(row.original.id);
    }
  };

  const columns = useMemo<MRT_ColumnDef<ParameterInterface>[]>(
    () => [
      {
        accessorKey: "id", //access nested data with dot notation
        header: "Id",
        size: 30,
      },
      {
        accessorKey: "parent.name",
        header: "Parent Name",
        size: 100,
      },
      {
        accessorKey: "type",
        header: "Tipo",
        size: 100,
      },
      {
        accessorKey: "isActive",
        header: "Activo",
        size: 30,
        Cell: ({ cell }) => {
          return <Checkbox disabled checked={cell.getValue<boolean>()} />;
        },
      },
      {
        accessorKey: "isVisible",
        header: "Visible",
        size: 30,
        Cell: ({ cell }) => {
          return <Checkbox disabled checked={cell.getValue<boolean>()} />;
        },
      },
      {
        accessorKey: "code",
        header: "Codigo",
        size: 50,
      },
      {
        accessorKey: "name",
        header: "Nombre",
        size: 50,
      },
      {
        accessorKey: "description",
        header: "Descripcion",
        size: 100,
      },
      {
        accessorKey: "entity",
        header: "Entidad",
        size: 50,
      },
      {
        accessorKey: "createdAt",
        header: "Creacion",
        size: 60,
        Cell: ({ cell }) => {
          const date = dayjs(cell.getValue<string>());
          return date.format("DD/MM/YYYY HH:mm:ss");
        },
      },
      {
        accessorKey: "updatedAt",
        header: "Actualizacion",
        size: 60,
        Cell: ({ cell }) => {
          const date = dayjs(cell.getValue<string>());
          return date.format("DD/MM/YYYY HH:mm:ss");
        },
      },
    ],
    [],
  );
  const table = useMaterialReactTable({
    columns,
    data: paramsData, //data must be memoized or stable (useState, useMemo, defined outside of this component, etc.)
    createDisplayMode: "modal", //default ('row', and 'custom' are also available)
    editDisplayMode: "modal", //default ('row', 'cell', 'table', and 'custom' are also available)
    manualPagination: true,
    rowCount: meta.total,
    onPaginationChange: setPagination,
    enableEditing: true,
    getRowId: (row) => row.id.toString(),
    renderRowActions: ({ row, table }) => (
      <Box sx={{ display: "flex", gap: "auto" }}>
        <Tooltip title="Edit">
          <IconButton
            onClick={() => {
              setSelectedRow(row);
              setOpenEditParam(true);
            }}
          >
            <EditIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton color="error" onClick={() => openDeleteConfirmModal(row)}>
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </Box>
    ),
    renderTopToolbarCustomActions: ({ table }) => (
      <Button
        variant="contained"
        onClick={() => {
          setOpenCreateParam(true);
          // table.setCreatingRow(true); //simplest way to open the create row modal with no default values
          //or you can pass in a row object to set default values with the `createRow` helper function
          // table.setCreatingRow(
          //   createRow(table, {
          //     //optionally pass in default values for the new row, useful for nested data or other complex scenarios
          //   }),
          // );
        }}
      >
        Crear Parámetro
      </Button>
    ),
    state: {
      pagination,
      isLoading,
      showAlertBanner: isError,
      showProgressBars: isRefetching,
    },
  });
  return (
    <>
      <div>Hello "/parametros/"!</div>
      <MaterialReactTable table={table} />
      <CreateParameterDialog
        open={openCreateParam}
        handleClose={() => setOpenCreateParam(false)}
      />
      <EditParameterDialog
        open={openEditParam}
        handleClose={() => setOpenEditParam(false)}
        row={selectedRow}
      />
    </>
  );
}
