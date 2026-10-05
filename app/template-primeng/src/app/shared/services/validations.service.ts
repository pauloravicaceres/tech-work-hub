import { Injectable } from '@angular/core';
import { VALIDATIONS } from '@data/constants';
import { ENUM_VALIDATION_OPTIONS } from '@data/enum';
import { IApiResponseValidation } from '@data/interfaces';

@Injectable({
  providedIn: 'root'
})
export class ValidationsService {

  /**
   * Method that validate each field
   * @param value any
   * @param type ENUM_VALIDATION_OPTIONS
   * @returns
   */
  validateField( value: any, type: ENUM_VALIDATION_OPTIONS ) {
    switch (type) {
      case ENUM_VALIDATION_OPTIONS.NAME:
        return this.validateNombre( value );

      case ENUM_VALIDATION_OPTIONS.USER:
        return this.validateUser( value );

      case ENUM_VALIDATION_OPTIONS.PASSWORD:
        return this.validatePassword( value );

      case ENUM_VALIDATION_OPTIONS.EMAIL:
        return this.validateEmail( value );

      default:
        const r: IApiResponseValidation = { msg: '', isValid: true };
        return r;
    }
  }

  /**
   * Validate user
   * @param v any
   * @returns IResponseValidation
   */
  private validateNombre( v: any ): IApiResponseValidation {
    const r: IApiResponseValidation = { msg: '', isValid: true };
    r.isValid = (v !== '');
    r.msg = r.isValid ? '' : VALIDATIONS.NAME_REQUIRED_FIELD;
    return r;
  }

  /**
   * Validate user
   * @param v any
   * @returns IResponseValidation
   */
  private validateUser( v: any ): IApiResponseValidation {
    const r: IApiResponseValidation = { msg: '', isValid: true };
    r.isValid = (v !== '');
    r.msg = r.isValid ? '' : VALIDATIONS.USER_REQUIRED_FIELD;
    return r;
  }

  /**
   * Validate password with pattern
   * @param v any
   * @returns IResponseValidation
   */
  private validatePassword( v: any ): IApiResponseValidation {
    const r: IApiResponseValidation = { msg: '', isValid: true };
    const pattern = /^(?=.*[A-Z])(?=.*[!@#$&*])(?=.*[0-9])(?=.*[a-z]).{8,20}$/;
    r.isValid = pattern.test(v);
    r.msg = (v === '') ? VALIDATIONS.PASSWORD_REQUIRED_FIELD : VALIDATIONS.PASSWORD_REQUIRED_PATTERN;
    return r;
  }

  /**
   * Validate email with pattern
   * @param v any
   * @returns IResponseValidation
   */
  private validateEmail( v: any ): IApiResponseValidation {
    const r: IApiResponseValidation = { msg: '', isValid: true };
    const pattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/;
    r.isValid = pattern.test(v);
    r.msg = (v === '') ? VALIDATIONS.EMAIL_REQUIRED_FIELD : VALIDATIONS.EMAIL_INVALID;
    return r;
  }
}
