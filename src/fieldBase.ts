export class FieldBase {
  member_: string;
  field_: string;
  constructor(member: string, field = "") {
    this.member_ = member;
    this.field_ = field;
  }
}
