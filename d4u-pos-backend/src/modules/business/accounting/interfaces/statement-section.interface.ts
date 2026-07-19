export interface CreateStatementSectionDto {
  statement_id: number;
  parent_section_id?: number;
  name: string;
  type: string;
  sort_order?: number;
}
