export interface IRegMatcher {
  regExpName: string;
  regExp: string;
  isSelected: boolean;
  index?: number;
}

export interface IAddOrUpdateRegMatcher {
  regExpName: string;
  regExp: string;
  isSelected: boolean;
  index: number;
}
