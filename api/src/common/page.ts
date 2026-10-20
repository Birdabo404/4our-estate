export class PageResult<T> {
  constructor(
    readonly items: readonly T[],
    readonly total: number,
    readonly page: number,
    readonly pageSize: number,
  ) {}
}
