interface ListParams {
  lat: number;
  long: number;
  distance: number;
  idCategory: number;
  page: number;
}
type ListParamsPartial = Partial<ListParams>;
export type ListRestaurantsParams = ListParamsPartial;
export type ListOrdersParams = Omit<ListParamsPartial, 'idCategory'>;
