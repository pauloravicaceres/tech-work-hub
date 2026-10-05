import { VALIDATIONS } from "@data/constants/errors/validations.const";
import { ENUM_VALIDATION_OPTIONS } from "@data/enum";
import { INewPassword } from "@data/interfaces";
import { ValidationsService } from "@shared/services/validations.service";

export const NEW_PASSWORD_PAGE: {
    FORM: INewPassword,
} = {
    FORM: {
        password: {
            val: '',
            error: VALIDATIONS.CONTRASENIA_REQUIRED_FIELD,
            isValid() {
                const validationsService = new ValidationsService();
                const validatePassword = validationsService.validateField( this.val, ENUM_VALIDATION_OPTIONS.PASSWORD );
                this.error = validatePassword.msg;
                return validatePassword.isValid;
            }
        },
        repeat_password: {
            val: '',
            error: VALIDATIONS.REPETIR_CONTRASENIA_REQUIRED_FIELD,
            isValid() {
                const validationsService = new ValidationsService();
                const validatePassword = validationsService.validateField( this.val, ENUM_VALIDATION_OPTIONS.PASSWORD );
                this.error = validatePassword.msg;
                return validatePassword.isValid;
            }
        },
    }
}
