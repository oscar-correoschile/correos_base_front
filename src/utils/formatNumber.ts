export const formatNumber = (number: string | undefined) => {
  return number === undefined ? number : Intl.NumberFormat('es-CL').format(isNaN(Number(number)) ? 0 : Number(number));
};
