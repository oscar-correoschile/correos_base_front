import type { PackageInterface } from "@/interfaces/package.interface";
import { createFileRoute } from "@tanstack/react-router";
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from "material-react-table";
import { useMemo } from "react";

export const Route = createFileRoute("/cargas/")({
  component: RouteComponent,
});

function RouteComponent() {
  const columns = useMemo<MRT_ColumnDef<PackageInterface>[]>(
    () => [
      {
        accessorKey: "name.firstName", //access nested data with dot notation
        header: "First Name",
        size: 150,
      },
      {
        accessorKey: "name.lastName",
        header: "Last Name",
        size: 150,
      },
      {
        accessorKey: "address", //normal accessorKey
        header: "Address",
        size: 200,
      },
      {
        accessorKey: "city",
        header: "City",
        size: 150,
      },
      {
        accessorKey: "state",
        header: "State",
        size: 150,
      },
    ],
    [],
  );
  const table = useMaterialReactTable({
    columns,
    data: [], //data must be memoized or stable (useState, useMemo, defined outside of this component, etc.)
  });

  return (
    <>
      <div>Hello "/cargas/"!</div>
      <MaterialReactTable table={table} />
    </>
  );
}
