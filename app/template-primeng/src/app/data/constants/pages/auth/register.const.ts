import { VALIDATIONS } from "@data/constants/errors/validations.const";
import { ENUM_VALIDATION_OPTIONS } from "@data/enum";
import { IRegister } from "@data/interfaces";
import { ValidationsService } from "@shared/services/validations.service";

export const REGISTER_PAGE: {
    FORM: IRegister
} = {
    FORM: {
        name: {
            val: '',
            error: VALIDATIONS.NAME_REQUIRED_FIELD,
            isValid() {
                const r = { msg: '', isValid: true };
                r.isValid = (this.val !== '');
                r.msg = r.isValid ? '' : VALIDATIONS.NAME_REQUIRED_FIELD;
                this.error = r.msg;
                return r.isValid;
            }
        },
        last_name_father: {
            val: '',
            error: VALIDATIONS.LAST_NAME_FATHER_REQUIRED_FIELD,
            isValid() {
                const r = { msg: '', isValid: true };
                r.isValid = (this.val !== '');
                r.msg = r.isValid ? '' : VALIDATIONS.LAST_NAME_FATHER_REQUIRED_FIELD;
                this.error = r.msg;
                return r.isValid;
            }
        },
        last_name_mother: {
            val: '',
            error: VALIDATIONS.LAST_NAME_MOTHER_REQUIRED_FILED,
            isValid() {
                const r = { msg: '', isValid: true };
                r.isValid = (this.val !== '');
                r.msg = r.isValid ? '' : VALIDATIONS.LAST_NAME_MOTHER_REQUIRED_FILED;
                this.error = r.msg;
                return r.isValid;
            }
        },
        user: {
            val: '',
            error: VALIDATIONS.USER_REQUIRED_FIELD,
            isValid() {
                const validationsService = new ValidationsService();
                const validateUser = validationsService.validateField(this.val, ENUM_VALIDATION_OPTIONS.USER);
                this.error = validateUser.msg;
                return validateUser.isValid;
            }
        },
        email: {
            val:'',
            error: VALIDATIONS.EMAIL_REQUIRED_FIELD,
            isValid() {const validationsService = new ValidationsService();
                const validateEmail = validationsService.validateField( this.val, ENUM_VALIDATION_OPTIONS.EMAIL );
                this.error = validateEmail.msg;
                return validateEmail.isValid;}
        },
        password: {
            val: '',
            error: VALIDATIONS.PASSWORD_REQUIRED_FIELD,
            isValid() {
                const validationsService = new ValidationsService();
                const validatePassword = validationsService.validateField(this.val, ENUM_VALIDATION_OPTIONS.PASSWORD);
                this.error = validatePassword.msg;
                return validatePassword.isValid;
            }
        }
    }
}
