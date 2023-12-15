import { ClientData } from "./clientData.js";

export class FieldBase {
  member_: string;
  field_: string;
  constructor(member: string, field = "") {
    this.member_ = member;
    this.field_ = field;
  }
}
export class Field extends FieldBase {
  data: ClientData | null;
  constructor(data: ClientData | null, member: string, field = "") {
    super(member, field);
    this.data = data;
  }
  dataCheck() {
    if (this.data == null) {
      throw new Error("ClientData is null");
    }
    return this.data;
  }
  setCheck() {
    if (this.data == null || this.data.selfMemberName !== this.member_) {
      throw new Error("Cannot set data to member other than self");
    }
    return this.data;
  }
}
