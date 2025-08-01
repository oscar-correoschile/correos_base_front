import type {
  CreateParameterInterface,
  GenericInterface,
  ParameterInterface,
} from "@/interfaces/parameters.interface";
import {
  type PaginatedResponseInterface,
  type ResponseInterface,
} from "@/interfaces/response.interface";
import axios from "axios";

const baseUrl = "http://localhost:8000/parameters";
export const fetchParameters = async () =>
  axios
    .get<PaginatedResponseInterface<ParameterInterface[]>>(baseUrl)
    .then((res) => res.data);
export const fetchParameter = async (userId: number) =>
  axios
    .get<ResponseInterface<ParameterInterface>>(`${baseUrl}/${userId}`)
    .then((res) => res.data.data);

export const fetchParameterTypes = async () =>
  axios
    .get<ResponseInterface<GenericInterface[]>>(`${baseUrl}/types`)
    .then((res) => res.data.data);

export const fetchParameterEntities = async () =>
  axios
    .get<ResponseInterface<GenericInterface[]>>(`${baseUrl}/entities`)
    .then((res) => res.data.data);

export const createParameter = async (body: CreateParameterInterface) =>
  axios
    .post<ResponseInterface<ParameterInterface>>(`${baseUrl}/`, body)
    .then((res) => res.data.data);

// export const createUser = async (user: CreateUserInterface) =>
//   axios
//     .post<ResponseInterface<ParameterInterface>>(baseUrl, user)
//     .then((res) => res.data);

// export const updateUser = async (userId: number, user: UpdateUserInterface) =>
//   axios
//     .put<ResponseInterface<ParameterInterface>>(`${baseUrl}/${userId}`, user)
//     .then((res) => res.data);

export const deleteParameter = async (userId: number) => {
  return await axios.delete(`${baseUrl}/${userId}`);
};
