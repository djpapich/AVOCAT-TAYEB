export interface ClientData {
  fullName: string;
  dob: string;
  cin: string;
  address: string;
  bankAccount: string;
}

export interface CaseData {
  type: string;
  references: string;
  fees: string;
  advance: string;
  costs: string;
}

export interface FormData {
    client: Partial<ClientData>;
    case: Partial<CaseData>;
}

export enum DocumentType {
  FeeAgreement = "اتفاقية أتعاب محاماة",
  AdminPowerOfAttorney = "وكالة خاصة (إدارية/عقارية)",
  JudicialPowerOfAttorney = "وكالة خاصة (قضائية)",
  GeneralPowerOfAttorney = "وكالة عامة",
  IncidentalRequest = "طلب عرضية / مذكرة طلب",
}

export interface GeneratedDocument {
  docType: DocumentType;
  htmlContent: string;
}
