export interface KnottsParkHours {
  date: string; // yyyy-mm-dd
  open: boolean;
  parkName: "Knott's Berry Farm";
  hoursText: string;
  openAt?: string; // ISO
  closeAt?: string; // ISO
}

