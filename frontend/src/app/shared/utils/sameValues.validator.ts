import {
  AbstractControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';

export function sameValues(otherCtrl: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const val = control.value;
    const otherCtrlVal = control.parent?.get(otherCtrl)?.value as string;
    if (!otherCtrlVal) return null;
    return val == otherCtrlVal ? null : { notMatch: true };
  };
}
