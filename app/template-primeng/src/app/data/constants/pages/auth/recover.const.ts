import { VALIDATIONS } from "@data/constants/errors/validations.const";
import { ENUM_VALIDATION_OPTIONS } from "@data/enum";
import { IRecover } from "@data/interfaces";
import { ValidationsService } from "@shared/services/validations.service";

export const RECOVER_PAGE: {
    FORM: IRecover,
} = {
    FORM: {
        email: {
            val:'',
            error: VALIDATIONS.EMAIL_REQUIRED_FIELD,
            isValid() {const validationsService = new ValidationsService();
                const validateEmail = validationsService.validateField( this.val, ENUM_VALIDATION_OPTIONS.EMAIL );
                this.error = validateEmail.msg;
                return validateEmail.isValid;}
        },
    }
}
